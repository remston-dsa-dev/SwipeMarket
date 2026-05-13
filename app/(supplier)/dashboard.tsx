import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Image } from "expo-image";
import { SupplierHeaderActions } from "@/components/SupplierHeaderActions";
import { PressableScale } from "@/components/PressableScale";
import { ProductRow } from "@/components/ProductRow";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { productToInsertRow } from "@/lib/product-insert";
import { buildSupplierTemplateCsv, parseSupplierCsvWithReport } from "@/lib/supplier-bulk";
import { supabase } from "@/lib/supabase";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";
import type { Product } from "@/types/product";
import { useState } from "react";

export default function SupplierDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const supplierId = useSessionStore((s) => s.userId);
  const { data: products = [], isPending: productsLoading } = useSupplierProducts(supplierId);
  const [pendingImport, setPendingImport] = useState<Omit<Product, "id">[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.stock * p.unitPriceCents,
    0,
  );

  async function handleDownloadTemplate() {
    try {
      const csv = buildSupplierTemplateCsv();
      const fileUri = `${FileSystem.cacheDirectory}swipemarket-supplier-template.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Download supplier bulk template",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Template ready", `CSV saved at:\n${fileUri}`);
      }
    } catch (error) {
      Alert.alert("Template failed", (error as Error).message);
    }
  }

  async function handleImportCsv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.ms-excel", "text/comma-separated-values"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert("Import failed", "Could not read the selected file.");
        return;
      }
      const csv = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const report = parseSupplierCsvWithReport(csv);
      if (report.successRows.length === 0) {
        Alert.alert("No rows found", "The selected file has no importable products.");
        return;
      }
      setPendingImport(report.successRows);

      if (report.failedRows.length > 0) {
        const failurePreview = report.failedRows
          .slice(0, 5)
          .map((row) => `Row ${row.rowNumber}: ${row.reason}`)
          .join("\n");
        const extraCount = report.failedRows.length > 5 ? `\n+${report.failedRows.length - 5} more` : "";
        Alert.alert(
          "Some rows skipped",
          `${report.successRows.length} valid row(s) ready to publish.\n${report.failedRows.length} row(s) skipped.\n\n${failurePreview}${extraCount}`,
        );
      }
    } catch (error) {
      Alert.alert("Import failed", (error as Error).message);
    }
  }

  async function confirmPublishImport() {
    const invalidRow = pendingImport.findIndex(
      (product) =>
        !product.title.trim() ||
        !product.parentCategory?.trim() ||
        !product.subCategory?.trim() ||
        product.unitPriceCents <= 0 ||
        product.stock < 0,
    );
    if (invalidRow >= 0) {
      Alert.alert(
        "Fix row before publish",
        `Row ${invalidRow + 1} has invalid values. Please edit it before publishing.`,
      );
      return;
    }
    if (!supplierId) {
      Alert.alert("Session error", "Sign in again.");
      return;
    }
    const count = pendingImport.length;
    const rows = pendingImport.map((p) => productToInsertRow(supplierId, p));
    const { error } = await supabase.from("products").insert(rows);
    if (error) {
      Alert.alert("Publish failed", error.message);
      return;
    }
    setPendingImport([]);
    setEditingIndex(null);
    void queryClient.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
    void queryClient.invalidateQueries({ queryKey: ["listings"] });
    Alert.alert("Published", `${count} products are now live.`);
  }

  function updatePendingProduct(index: number, updates: Partial<Omit<Product, "id">>) {
    setPendingImport((current) =>
      current.map((product, i) => (i === index ? { ...product, ...updates } : product)),
    );
  }

  function updatePendingPrice(index: number, input: string) {
    const cleaned = input.replace(/[^\d.]/g, "");
    const value = Number.parseFloat(cleaned);
    if (!Number.isFinite(value)) {
      updatePendingProduct(index, { unitPriceCents: 0, priceLabel: "$0.00" });
      return;
    }
    updatePendingProduct(index, {
      unitPriceCents: Math.round(value * 100),
      priceLabel: `$${value.toFixed(2)}`,
    });
  }

  function updatePendingStock(index: number, input: string) {
    const value = Number.parseInt(input.replace(/[^\d]/g, ""), 10);
    updatePendingProduct(index, { stock: Number.isFinite(value) ? value : 0 });
  }

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ gap: 4 }}>
          <ThemedText variant="headline">Inventory</ThemedText>
          <ThemedText variant="caption" color="muted">
            {products.length} product{products.length !== 1 ? "s" : ""} ·{" "}
            {totalStock} units · ${(totalValue / 100).toFixed(0)} value
          </ThemedText>
        </View>

        <SupplierHeaderActions />
      </View>

      <View style={{ gap: 10, marginBottom: 16 }}>
        <PressableScale
          accessibilityLabel="Add new product"
          onPress={() => router.push("/(supplier)/add-product")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.primary,
          }}
        >
          <ThemedText variant="label" color="onPrimary">
            + New Product
          </ThemedText>
        </PressableScale>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <PressableScale
            accessibilityLabel="Download bulk upload template"
            onPress={handleDownloadTemplate}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            <ThemedText variant="caption">Download Template</ThemedText>
          </PressableScale>
          <PressableScale
            accessibilityLabel="Import bulk CSV"
            onPress={handleImportCsv}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.overlay,
            }}
          >
            <ThemedText variant="caption" color="secondary">Import Bulk File</ThemedText>
          </PressableScale>
        </View>
      </View>

      {productsLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
          <ThemedText variant="headline">No products yet</ThemedText>
          <ThemedText variant="body" color="muted">
            Tap "New Product" to add your first listing. Customers will see it
            in their swipe deck immediately.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProductRow product={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <Modal
        visible={pendingImport.length > 0}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingImport([])}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <View
            style={{
              maxHeight: "78%",
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              padding: 18,
              gap: 12,
            }}
          >
            <ThemedText variant="headline">Review Before Publishing</ThemedText>
            <ThemedText variant="caption" color="muted">
              {pendingImport.length} products parsed from your file. Confirm to publish them live.
            </ThemedText>
            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              {pendingImport.map((product, idx) => (
                <View
                  key={`${product.title}-${idx}`}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: 10,
                    gap: 3,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={{ width: 52, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.colors.border }}
                      contentFit="cover"
                      accessibilityLabel={product.title}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <ThemedText variant="label">{product.title}</ThemedText>
                      <ThemedText variant="caption" color="secondary">
                        {product.parentCategory} / {product.subCategory} · {product.priceLabel} · {product.stock} qty
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <PressableScale
                      accessibilityLabel="Edit imported row"
                      onPress={() => setEditingIndex((current) => (current === idx ? null : idx))}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: theme.radius.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <ThemedText variant="caption">
                        {editingIndex === idx ? "Done" : "Edit"}
                      </ThemedText>
                    </PressableScale>
                  </View>
                  {editingIndex === idx ? (
                    <View style={{ gap: 8, marginTop: 8 }}>
                      <TextInput
                        value={product.title}
                        onChangeText={(value) => updatePendingProduct(idx, { title: value })}
                        placeholder="Title"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.sm,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: theme.colors.textPrimary,
                        }}
                      />
                      <TextInput
                        value={product.imageUrl}
                        onChangeText={(value) => updatePendingProduct(idx, { imageUrl: value })}
                        placeholder="Image URL"
                        autoCapitalize="none"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.sm,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: theme.colors.textPrimary,
                        }}
                      />
                      <TextInput
                        value={product.parentCategory ?? ""}
                        onChangeText={(value) => updatePendingProduct(idx, { parentCategory: value, category: value })}
                        placeholder="Parent Category"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.sm,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: theme.colors.textPrimary,
                        }}
                      />
                      <TextInput
                        value={product.subCategory ?? ""}
                        onChangeText={(value) => updatePendingProduct(idx, { subCategory: value })}
                        placeholder="Sub Category"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.sm,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: theme.colors.textPrimary,
                        }}
                      />
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TextInput
                          value={(product.unitPriceCents / 100).toFixed(2)}
                          onChangeText={(value) => updatePendingPrice(idx, value)}
                          placeholder="Price"
                          keyboardType="decimal-pad"
                          placeholderTextColor={theme.colors.textSecondary}
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.sm,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            color: theme.colors.textPrimary,
                          }}
                        />
                        <TextInput
                          value={String(product.stock)}
                          onChangeText={(value) => updatePendingStock(idx, value)}
                          placeholder="Stock"
                          keyboardType="number-pad"
                          placeholderTextColor={theme.colors.textSecondary}
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.sm,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            color: theme.colors.textPrimary,
                          }}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <PressableScale
                accessibilityLabel="Cancel publish"
                onPress={() => setPendingImport([])}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <ThemedText variant="caption">Cancel</ThemedText>
              </PressableScale>
              <PressableScale
                accessibilityLabel="Publish imported products"
                onPress={confirmPublishImport}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.primary,
                }}
              >
                <ThemedText variant="label" color="onPrimary">Publish Live</ThemedText>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
