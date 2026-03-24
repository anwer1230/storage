import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DownloadTaskCard } from "@/components/DownloadTaskCard";
import { useFileManager } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";

export default function DownloadsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { downloadTasks } = useFileManager();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const active = downloadTasks.filter((t) => t.status !== "done" && t.status !== "error");
  const completed = downloadTasks.filter((t) => t.status === "done");
  const failed = downloadTasks.filter((t) => t.status === "error");

  const handleAddDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/download-modal");
  };

  const sections = [
    ...(active.length > 0
      ? [{ key: "active-header", isHeader: true, label: `جارٍ التنزيل (${active.length})` }]
      : []),
    ...active.map((t) => ({ key: t.id, isHeader: false, task: t })),
    ...(failed.length > 0
      ? [{ key: "failed-header", isHeader: true, label: `فشل (${failed.length})` }]
      : []),
    ...failed.map((t) => ({ key: t.id, isHeader: false, task: t })),
    ...(completed.length > 0
      ? [{ key: "done-header", isHeader: true, label: `مكتمل (${completed.length})` }]
      : []),
    ...completed.map((t) => ({ key: t.id, isHeader: false, task: t })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
          التنزيلات
        </Text>
        <Pressable
          onPress={handleAddDownload}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        scrollEnabled={!!sections.length}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad + 80 },
        ]}
        renderItem={({ item }) => {
          if (item.isHeader) {
            return (
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.textTertiary, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {item.label}
              </Text>
            );
          }
          if (item.task) {
            return <DownloadTaskCard task={item.task} />;
          }
          return null;
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
              <Feather name="download-cloud" size={48} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              لا توجد تنزيلات
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              أضف روابط لتنزيل الملفات مباشرة إلى جهازك
            </Text>
            <Pressable
              onPress={handleAddDownload}
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
            >
              <Feather name="link" size={18} color="#fff" />
              <Text style={[styles.emptyBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                أضف رابط تنزيل
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    color: "#fff",
  },
});
