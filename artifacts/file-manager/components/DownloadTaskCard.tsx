import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DownloadTask } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  task: DownloadTask;
};

export function DownloadTaskCard({ task }: Props) {
  const { theme } = useTheme();

  const statusColor = () => {
    switch (task.status) {
      case "done": return theme.success;
      case "error": return theme.danger;
      case "downloading": return theme.primary;
      default: return theme.textTertiary;
    }
  };

  const statusLabel = () => {
    switch (task.status) {
      case "done": return "اكتمل";
      case "error": return task.errorMessage || "خطأ";
      case "downloading": return `${Math.round(task.progress * 100)}%`;
      default: return "في الانتظار";
    }
  };

  const statusIcon = () => {
    switch (task.status) {
      case "done": return "check-circle";
      case "error": return "alert-circle";
      case "downloading": return "download";
      default: return "clock";
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={[styles.iconBg, { backgroundColor: `${statusColor()}22` }]}>
        <Feather name={statusIcon() as any} size={20} color={statusColor()} />
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: theme.text, fontFamily: "Inter_500Medium" }]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <Text style={[styles.url, { color: theme.textTertiary, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
          {task.url}
        </Text>
        {task.status === "downloading" && (
          <View style={[styles.progressBg, { backgroundColor: theme.surface3 }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.primary, width: `${task.progress * 100}%` },
              ]}
            />
          </View>
        )}
      </View>
      <Text style={[styles.status, { color: statusColor(), fontFamily: "Inter_600SemiBold" }]}>
        {statusLabel()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  url: {
    fontSize: 11,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  status: {
    fontSize: 12,
  },
});
