import { useMemo } from "react";
import { View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { ThemedText } from "@/components/ThemedText";
import type { ReturnRequestStatus } from "@/lib/return-resolution";
import { useTheme } from "@/theme/ThemeContext";

export type ReturnStatusFilter = "all" | "requested" | "resolved";

type FilterDef = { key: ReturnStatusFilter; label: string };

const FILTERS: FilterDef[] = [
  { key: "all", label: "All" },
  { key: "requested", label: "Pending" },
  { key: "resolved", label: "Resolved" },
];

type Props = {
  value: ReturnStatusFilter;
  onChange: (value: ReturnStatusFilter) => void;
  /** Counts per filter key (typically from return request rows). */
  counts: Record<ReturnStatusFilter, number>;
};

function formatChipLabel(label: string, count: number): string {
  const capped = count > 99 ? "99+" : String(count);
  return `${label} ${capped}`;
}

export function countReturnStatusFilters(
  statuses: readonly ReturnRequestStatus[],
): Record<ReturnStatusFilter, number> {
  let requested = 0;
  let resolved = 0;
  for (const s of statuses) {
    if (s === "requested") requested += 1;
    else if (s === "resolved") resolved += 1;
  }
  return {
    all: statuses.length,
    requested,
    resolved,
  };
}

/** All / Pending / Resolved chips with numeric badges. */
export function ReturnStatusFilterChips({ value, onChange, counts }: Props) {
  const theme = useTheme();

  const labels = useMemo(
    () =>
      FILTERS.map((f) => ({
        ...f,
        chipLabel: formatChipLabel(f.label, counts[f.key]),
        a11y: `${f.label}, ${counts[f.key]} return request${counts[f.key] === 1 ? "" : "s"}`,
      })),
    [counts],
  );

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
      {labels.map((f) => {
        const active = value === f.key;
        return (
          <PressableScale
            key={f.key}
            accessibilityLabel={f.a11y}
            onPress={() => onChange(f.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: active ? theme.colors.primary : theme.colors.border,
              backgroundColor: active ? theme.colors.primary : theme.colors.surface,
            }}
          >
            <ThemedText variant="caption" color={active ? "onPrimary" : "primary"}>
              {f.chipLabel}
            </ThemedText>
          </PressableScale>
        );
      })}
    </View>
  );
}
