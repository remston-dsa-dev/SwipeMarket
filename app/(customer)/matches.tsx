import { useRouter } from "expo-router";
import { FlatList, View } from "react-native";
import { PressableScale } from "@/components/PressableScale";
import { Screen } from "@/components/Screen";
import { ThemedText } from "@/components/ThemedText";
import { useMatches } from "@/hooks/useMatches";
import { useTheme } from "@/theme/ThemeContext";

export default function MatchesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: matches = [], isLoading } = useMatches();

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <ThemedText variant="headline">Matches</ThemedText>
        <PressableScale
          accessibilityLabel="Back to discover"
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            backgroundColor: theme.colors.overlay,
          }}
        >
          <ThemedText variant="caption">Back</ThemedText>
        </PressableScale>
      </View>

      {isLoading ? (
        <ThemedText variant="body" color="muted">
          Loading matches…
        </ThemedText>
      ) : null}

      {!isLoading && matches.length === 0 ? (
        <View style={{ gap: 8 }}>
          <ThemedText variant="body" color="muted">
            No matches yet — keep swiping to connect with suppliers.
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && matches.length > 0 ? (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 14,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.glassBorder,
                backgroundColor: theme.colors.overlay,
              }}
            >
              <ThemedText variant="body">{item.title}</ThemedText>
            </View>
          )}
        />
      ) : null}
    </Screen>
  );
}
