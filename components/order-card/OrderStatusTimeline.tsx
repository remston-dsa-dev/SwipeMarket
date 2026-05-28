import { Fragment } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import {
  ORDER_TIMELINE_STEPS,
  orderStatusColor,
  orderStatusLabel,
  orderTimelineIndex,
  orderTimelineStepState,
  type OrderStatus,
} from "@/lib/order-status";
import { useTheme } from "@/theme/ThemeContext";

const NODE = 20;
const NODE_CURRENT = 24;
const TRACK = 3;

type Props = {
  status: OrderStatus;
};

export function OrderStatusTimeline({ status }: Props) {
  const theme = useTheme();

  if (status === "cancelled") {
    return null;
  }

  return (
    <TimelineTrack
      status={status}
      scheme={theme.scheme}
      trackMuted={theme.colors.border}
      surface={theme.colors.surface}
    />
  );
}

function TimelineTrack({
  status,
  scheme,
  frozen,
  trackMuted,
  surface,
}: {
  status: OrderStatus;
  scheme: "light" | "dark";
  frozen?: boolean;
  trackMuted: string;
  surface: string;
}) {
  const theme = useTheme();
  const currentIndex = orderTimelineIndex(status);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Order progress: ${orderStatusLabel(status)}`}
      style={{ paddingVertical: 6 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {ORDER_TIMELINE_STEPS.map((step, index) => {
          const stepState = frozen ? "upcoming" : orderTimelineStepState(step, status);
          const color = orderStatusColor(step, scheme);
          const isCurrent = stepState === "current";
          const isComplete = stepState === "complete";
          const size = isCurrent ? NODE_CURRENT : NODE;
          const segmentFilled = !frozen && currentIndex >= 0 && index > 0 && index <= currentIndex;
          const segmentColor =
            index > 0 ? orderStatusColor(ORDER_TIMELINE_STEPS[index - 1]!, scheme) : trackMuted;

          return (
            <Fragment key={step}>
              {index > 0 ? (
                <View
                  style={{
                    flex: 1,
                    height: TRACK,
                    borderRadius: TRACK,
                    backgroundColor: segmentFilled ? segmentColor : trackMuted,
                    opacity: frozen ? 0.4 : segmentFilled ? 1 : 0.85,
                    marginHorizontal: 4,
                  }}
                />
              ) : null}
              <TimelineNode
                color={color}
                frozen={frozen}
                isComplete={isComplete}
                isCurrent={isCurrent}
                size={size}
                surface={surface}
                trackMuted={trackMuted}
              />
            </Fragment>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {ORDER_TIMELINE_STEPS.map((step, index) => {
          const stepState = frozen ? "upcoming" : orderTimelineStepState(step, status);
          const color = orderStatusColor(step, scheme);
          const isCurrent = stepState === "current";
          const isComplete = stepState === "complete";
          const isFirst = index === 0;
          const isLast = index === ORDER_TIMELINE_STEPS.length - 1;

          return (
            <View
              key={`${step}-label`}
              style={{
                flex: 1,
                alignItems: isFirst ? "flex-start" : isLast ? "flex-end" : "center",
                paddingHorizontal: isFirst || isLast ? 0 : 2,
              }}
            >
              <ThemedText
                variant="caption"
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  lineHeight: 14,
                  textAlign: isFirst ? "left" : isLast ? "right" : "center",
                  color:
                    frozen
                      ? theme.colors.textSecondary
                      : isCurrent || isComplete
                        ? color
                        : theme.colors.textSecondary,
                  fontWeight: isCurrent && !frozen ? "600" : isComplete && !frozen ? "500" : "400",
                  opacity: frozen ? 0.45 : stepState === "upcoming" ? 0.6 : 1,
                }}
              >
                {orderStatusLabel(step)}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TimelineNode({
  color,
  frozen,
  isComplete,
  isCurrent,
  size,
  surface,
  trackMuted,
}: {
  color: string;
  frozen?: boolean;
  isComplete: boolean;
  isCurrent: boolean;
  size: number;
  surface: string;
  trackMuted: string;
}) {
  const upcoming = !isComplete && !isCurrent;

  return (
    <View
      style={{
        width: NODE_CURRENT,
        height: NODE_CURRENT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: upcoming ? surface : isComplete ? color : surface,
          borderWidth: isCurrent ? 2.5 : 2,
          borderColor: upcoming ? trackMuted : color,
          opacity: frozen ? 0.4 : 1,
          ...(isCurrent && !frozen
            ? {
                shadowColor: color,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.22,
                shadowRadius: 3,
                elevation: 2,
              }
            : {}),
        }}
      >
        {isComplete && !frozen ? (
          <Ionicons name="checkmark" size={Math.round(size * 0.52)} color="#FFFFFF" />
        ) : isCurrent && !frozen ? (
          <View
            style={{
              width: size * 0.34,
              height: size * 0.34,
              borderRadius: size * 0.17,
              backgroundColor: color,
            }}
          />
        ) : null}
      </View>
    </View>
  );
}
