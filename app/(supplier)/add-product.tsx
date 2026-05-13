import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { HeaderProfileAvatar } from "@/components/HeaderProfileAvatar";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { productToInsertRow } from "@/lib/product-insert";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";
import { useTheme } from "@/theme/ThemeContext";

const schema = z.object({
  title: z.string().min(2, "At least 2 characters"),
  description: z.string().min(10, "At least 10 characters"),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price, e.g. 12.99"),
  imageUrl: z.string().url("Enter a valid image URL"),
  stock: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int("Whole numbers only")
    .min(1, "At least 1"),
  parentCategory: z.string().min(2, "Parent category is required"),
  subCategory: z.string().min(2, "Sub category is required"),
  attributes: z.string().min(2, "Add at least one attribute"),
  variants: z.string().min(2, "Add at least one variant"),
  unit: z.string().min(1, "Unit is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AddProductScreen() {
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const supplierId = useSessionStore((s) => s.userId);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      imageUrl: "",
      stock: undefined,
      parentCategory: "",
      subCategory: "",
      attributes: "",
      variants: "",
      unit: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!supplierId) {
      Alert.alert("Session error", "Sign in again.");
      return;
    }
    const unitPriceCents = Math.round(parseFloat(values.price) * 100);
    const attributes = values.attributes
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const variants = values.variants
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const payload = productToInsertRow(supplierId, {
      title: values.title,
      description: values.description,
      priceLabel: `$${parseFloat(values.price).toFixed(2)}`,
      unitPriceCents,
      imageUrl: values.imageUrl,
      stock: values.stock,
      parentCategory: values.parentCategory.trim(),
      subCategory: values.subCategory.trim(),
      category: values.parentCategory.trim(),
      attributes,
      variants,
      unit: values.unit.trim(),
    });
    const { error } = await supabase.from("products").insert(payload);
    if (error) {
      Alert.alert("Could not save", error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
    void queryClient.invalidateQueries({ queryKey: ["listings"] });
    Alert.alert("Product added!", `"${values.title}" is now live in the swipe deck.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <ThemedText variant="headline">New Product</ThemedText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <PressableScale
              accessibilityLabel="Cancel"
              onPress={() => router.back()}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <ThemedText variant="caption">Cancel</ThemedText>
            </PressableScale>
            <HeaderProfileAvatar />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <FormField
            label="Title"
            error={errors.title?.message}
            control={control}
            name="title"
            placeholder="e.g. Vintage Camera Kit"
            returnKeyType="next"
          />

          <FormField
            label="Description"
            error={errors.description?.message}
            control={control}
            name="description"
            placeholder="Tell customers what makes it special…"
            multiline
            numberOfLines={3}
            returnKeyType="next"
          />

          <FormField
            label="Price (USD)"
            error={errors.price?.message}
            control={control}
            name="price"
            placeholder="e.g. 49.99"
            keyboardType="decimal-pad"
            returnKeyType="next"
          />

          <FormField
            label="Image URL"
            error={errors.imageUrl?.message}
            control={control}
            name="imageUrl"
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <FormField
            label="Initial Stock"
            error={errors.stock?.message}
            control={control}
            name="stock"
            placeholder="e.g. 10"
            keyboardType="number-pad"
            returnKeyType="done"
          />

          <FormField
            label="Parent Category"
            error={errors.parentCategory?.message}
            control={control}
            name="parentCategory"
            placeholder="e.g. Electronics"
            returnKeyType="next"
          />

          <FormField
            label="Sub Category"
            error={errors.subCategory?.message}
            control={control}
            name="subCategory"
            placeholder="e.g. Audio"
            returnKeyType="next"
          />

          <FormField
            label="Attributes (comma-separated)"
            error={errors.attributes?.message}
            control={control}
            name="attributes"
            placeholder="e.g. Wireless, Noise Cancelling"
            returnKeyType="next"
          />

          <FormField
            label="Variants (comma-separated)"
            error={errors.variants?.message}
            control={control}
            name="variants"
            placeholder="e.g. ANC, 30h Battery"
            returnKeyType="next"
          />

          <FormField
            label="Unit"
            error={errors.unit?.message}
            control={control}
            name="unit"
            placeholder="e.g. piece, pack, pair"
            returnKeyType="done"
          />

          <PressableScale
            accessibilityLabel="Save product"
            onPress={handleSubmit(onSubmit)}
            style={{
              paddingVertical: 16,
              borderRadius: theme.radius.md,
              backgroundColor: isSubmitting
                ? theme.colors.border
                : theme.colors.primary,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <ThemedText variant="label" color="onPrimary">
              {isSubmitting ? "Saving…" : "Save Product"}
            </ThemedText>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// Inline form field — used only here
type FieldProps = {
  label: string;
  error?: string;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  name: keyof FormValues;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "decimal-pad" | "url" | "number-pad";
  returnKeyType?: "next" | "done";
  autoCapitalize?: "none" | "sentences";
};

function FormField({
  label,
  error,
  control,
  name,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType = "default",
  returnKeyType,
  autoCapitalize,
}: FieldProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <ThemedText variant="label">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={(v) => onChange(name === "stock" ? v : v)}
            value={value !== undefined ? String(value) : ""}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            style={{
              borderWidth: 1,
              borderColor: error ? "#EF4444" : theme.colors.border,
              borderRadius: theme.radius.md,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.surface,
              minHeight: multiline ? 80 : undefined,
              textAlignVertical: multiline ? "top" : undefined,
            }}
          />
        )}
      />
      {error ? (
        <ThemedText variant="caption" style={{ color: "#EF4444" }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
