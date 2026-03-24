import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type Segment = {
  label: string;
  bytes: number;
  color: string;
};

type Props = {
  segments: Segment[];
  totalBytes: number;
  maxBytes: number;
};

export function StorageBar({ segments, totalBytes, maxBytes }: Props) {
  const { theme } = useTheme();

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const usedPercent = Math.min((totalBytes / maxBytes) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          مساحة التخزين
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
          {formatSize(totalBytes)} من {formatSize(maxBytes)}
        </Text>
      </View>

      <View style={[styles.barBg, { backgroundColor: theme.surface3 }]}>
        <View style={[styles.barFill, { width: `${usedPercent}%`, backgroundColor: theme.primary }]} />
      </View>

      <Text style={[styles.percent, { color: theme.textTertiary, fontFamily: "Inter_400Regular" }]}>
        {usedPercent.toFixed(1)}% مستخدم
      </Text>

      <View style={styles.legend}>
        {segments.map((seg) => (
          <View key={seg.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <View>
              <Text style={[styles.legendLabel, { color: theme.textSecondary, fontFamily: "Inter_500Medium" }]}>
                {seg.label}
              </Text>
              <Text style={[styles.legendSize, { color: theme.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {formatSize(seg.bytes)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  title: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 13,
  },
  barBg: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  percent: {
    fontSize: 12,
    textAlign: "right",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
  },
  legendSize: {
    fontSize: 11,
  },
});
