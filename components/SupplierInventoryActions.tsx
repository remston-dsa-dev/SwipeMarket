import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SupplierInventoryImportCta } from "@/components/SupplierInventoryImportCta";
import { SupplierInventoryTemplateGroup } from "./SupplierInventoryTemplateGroup";

type Props = {
  defaultTemplateExpanded?: boolean;
  onImportInventoryFile: () => void;
  onDownloadTemplateCsv: () => void;
  onDownloadTemplateXlsx: () => void;
  onReviewTemplate: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Import CTA + product template accordion — identical layout for empty and stocked inventory.
 */
export function SupplierInventoryActions({
  defaultTemplateExpanded = false,
  onImportInventoryFile,
  onDownloadTemplateCsv,
  onDownloadTemplateXlsx,
  onReviewTemplate,
  style,
}: Props) {
  return (
    <View style={[styles.actions, style]}>
      <SupplierInventoryImportCta onPress={onImportInventoryFile} />
      <SupplierInventoryTemplateGroup
        defaultExpanded={defaultTemplateExpanded}
        onDownloadTemplateCsv={onDownloadTemplateCsv}
        onDownloadTemplateXlsx={onDownloadTemplateXlsx}
        onReviewTemplate={onReviewTemplate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    width: "100%",
    maxWidth: 400,
    gap: 12,
    alignSelf: "center",
  },
});
