import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileCard } from "@/components/FileCard";
import { FileIcon } from "@/components/FileIcon";
import { FileItem, useFileManager } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";
import { usePWAInstall } from "@/hooks/usePWAInstall";

type FilterType = "all" | FileItem["type"];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "image", label: "صور" },
  { key: "video", label: "فيديو" },
  { key: "audio", label: "صوت" },
  { key: "document", label: "مستندات" },
  { key: "archive", label: "أرشيف" },
];

export default function FilesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { files, addFiles, getFilesByType, formatSize } = useFileManager();
  const [filter, setFilter] = useState<FilterType>("all");
  const { canInstall, install } = usePWAInstall();

  const filtered = getFilesByType(filter);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleAddFiles = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addFiles();
  };

  const handleAddDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/download-modal");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: theme.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
            ملفاتي
          </Text>
          <View style={styles.headerActions}>
            {canInstall && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  install();
                }}
                style={[styles.actionBtn, { backgroundColor: "#0A84FF22" }]}
              >
                <Feather name="download-cloud" size={18} color={theme.primary} />
              </Pressable>
            )}
            <Pressable
              onPress={handleAddDownload}
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
            >
              <Feather name="link" size={18} color={theme.primary} />
            </Pressable>
            <Pressable
              onPress={handleAddFiles}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          style={styles.filtersContainer}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.key);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? "#fff" : theme.textSecondary,
                      fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {f.label}
                </Text>
                {isActive && filtered.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{filtered.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FileCard file={item} />}
        scrollEnabled={!!filtered.length}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name="folder-open-outline" size={48} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              لا توجد ملفات
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              أضف ملفات من جهازك أو أضف روابط تنزيل
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={handleAddFiles}
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              >
                <Feather name="folder-plus" size={18} color="#fff" />
                <Text style={[styles.emptyBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  اختر ملفات
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddDownload}
                style={[styles.emptyBtn, { backgroundColor: theme.surface }]}
              >
                <Feather name="download" size={18} color={theme.primary} />
                <Text style={[styles.emptyBtnText, { color: theme.primary, fontFamily: "Inter_600SemiBold" }]}>
                  أضف رابط
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersContainer: {
    marginHorizontal: -16,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
  },
  filterBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  listContent: {
    paddingTop: 8,
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
  emptyActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 15,
    color: "#fff",
  },
});
