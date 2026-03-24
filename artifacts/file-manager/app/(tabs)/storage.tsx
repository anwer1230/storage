import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StorageBar } from "@/components/StorageBar";
import { useFileManager } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";

const MAX_STORAGE = 1 * 1024 * 1024 * 1024 * 1024; // 1 TB

const TYPE_COLORS: Record<string, string> = {
  image: "#FF6B6B",
  video: "#845EF7",
  audio: "#22B8CF",
  document: "#339AF0",
  archive: "#F59F00",
  file: "#51CF66",
  other: "#ADB5BD",
};

const TYPE_LABELS: Record<string, string> = {
  image: "صور",
  video: "فيديو",
  audio: "صوت",
  document: "مستندات",
  archive: "أرشيف",
  file: "ملفات",
  other: "أخرى",
};

export default function StorageScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { files, storageUsed, formatSize } = useFileManager();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const byType = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + f.size;
    return acc;
  }, {});

  const segments = Object.entries(byType).map(([type, bytes]) => ({
    label: TYPE_LABELS[type] || type,
    bytes,
    color: TYPE_COLORS[type] || "#ADB5BD",
  }));

  const typeStats = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
          التخزين
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <StorageBar
          segments={segments}
          totalBytes={storageUsed}
          maxBytes={MAX_STORAGE}
        />

        <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
            ملخص التخزين
          </Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              إجمالي الملفات
            </Text>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              {files.length} ملف
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              المساحة المستخدمة
            </Text>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              {formatSize(storageUsed)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              المساحة المتاحة
            </Text>
            <Text style={[styles.statValue, { color: theme.success, fontFamily: "Inter_600SemiBold" }]}>
              {formatSize(MAX_STORAGE - storageUsed)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              الحد الأقصى
            </Text>
            <Text style={[styles.statValue, { color: theme.primary, fontFamily: "Inter_600SemiBold" }]}>
              1 تيرابايت
            </Text>
          </View>
        </View>

        {typeStats.length > 0 && (
          <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              التوزيع حسب النوع
            </Text>
            {typeStats.map(([type, bytes], i) => {
              const pct = storageUsed > 0 ? (bytes / storageUsed) * 100 : 0;
              return (
                <View key={type}>
                  <View style={styles.typeRow}>
                    <View style={styles.typeLeft}>
                      <View
                        style={[
                          styles.typeDot,
                          { backgroundColor: TYPE_COLORS[type] || "#ADB5BD" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: theme.text, fontFamily: "Inter_500Medium" },
                        ]}
                      >
                        {TYPE_LABELS[type] || type}
                      </Text>
                    </View>
                    <View style={styles.typeRight}>
                      <Text
                        style={[
                          styles.typeSize,
                          { color: theme.textSecondary, fontFamily: "Inter_400Regular" },
                        ]}
                      >
                        {formatSize(bytes)}
                      </Text>
                      <Text
                        style={[
                          styles.typePct,
                          { color: TYPE_COLORS[type] || "#ADB5BD", fontFamily: "Inter_600SemiBold" },
                        ]}
                      >
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.typeBar, { backgroundColor: theme.surface3 }]}>
                    <View
                      style={[
                        styles.typeBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: TYPE_COLORS[type] || "#ADB5BD",
                        },
                      ]}
                    />
                  </View>
                  {i < typeStats.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.separator, marginTop: 12 }]} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {files.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name="pie-chart-outline" size={48} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              أضف ملفات لعرض إحصاءات التخزين
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  content: {
    paddingTop: 8,
    gap: 12,
  },
  statsCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 15,
  },
  statValue: {
    fontSize: 15,
  },
  divider: {
    height: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeLabel: {
    fontSize: 15,
  },
  typeRight: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  typeSize: {
    fontSize: 13,
  },
  typePct: {
    fontSize: 13,
    minWidth: 40,
    textAlign: "right",
  },
  typeBar: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 2,
  },
  typeBarFill: {
    height: 5,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
