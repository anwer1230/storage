import { Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileIcon } from "@/components/FileIcon";
import { useFileManager } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";

export default function FileDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const { files, removeFile, formatSize } = useFileManager();

  const file = files.find((f) => f.id === fileId);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!file) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={{ color: theme.text, textAlign: "center", marginTop: 40, fontFamily: "Inter_500Medium" }}>
          الملف غير موجود
        </Text>
      </View>
    );
  }

  const handleShare = async () => {
    if (Platform.OS === "web") {
      // On web: trigger browser download
      try {
        const a = document.createElement("a");
        a.href = file.uri;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert("خطأ", "تعذر تنزيل الملف");
      }
      return;
    }
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("غير متاح", "المشاركة غير متاحة على هذا الجهاز");
        return;
      }
      await Sharing.shareAsync(file.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("خطأ", "تعذر مشاركة الملف");
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "حذف الملف",
      `هل تريد حذف "${file.name}"؟`,
      [
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await removeFile(file.id);
            router.back();
          },
        },
        { text: "إلغاء", style: "cancel" },
      ]
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeLabel: Record<string, string> = {
    image: "صورة",
    video: "فيديو",
    audio: "ملف صوتي",
    document: "مستند",
    archive: "أرشيف",
    file: "ملف",
    other: "ملف",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
          تفاصيل الملف
        </Text>
        <Pressable onPress={() => router.back()}>
          <View style={[styles.closeBg, { backgroundColor: theme.surface3 }]}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filePreview}>
          <FileIcon type={file.type} size={80} />
          <Text
            style={[styles.fileName, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}
            numberOfLines={2}
          >
            {file.name}
          </Text>
          <Text style={[styles.fileType, { color: theme.textTertiary, fontFamily: "Inter_400Regular" }]}>
            {typeLabel[file.type] || "ملف"}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface2 }]}>
          <InfoRow label="الحجم" value={formatSize(file.size)} theme={theme} />
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <InfoRow label="النوع" value={file.mimeType} theme={theme} />
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <InfoRow label="تاريخ الإضافة" value={formatDate(file.addedAt)} theme={theme} />
          {file.isDownload && file.downloadUrl && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              <InfoRow label="رابط التنزيل" value={file.downloadUrl} theme={theme} isUrl />
            </>
          )}
        </View>

        <View style={styles.actions}>
          <ActionButton
            icon={Platform.OS === "web" ? "download" : "share-2"}
            label={Platform.OS === "web" ? "تنزيل" : "مشاركة"}
            color={theme.primary}
            bg={`${theme.primary}15`}
            onPress={handleShare}
          />
          <ActionButton
            icon="trash-2"
            label="حذف"
            color={theme.danger}
            bg={`${theme.danger}15`}
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  theme,
  isUrl,
}: {
  label: string;
  value: string;
  theme: any;
  isUrl?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          { color: isUrl ? theme.primary : theme.text, fontFamily: "Inter_500Medium" },
        ]}
        numberOfLines={isUrl ? 1 : 2}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionBtn, { backgroundColor: bg }]}
    >
      <Feather name={icon as any} size={20} color={color} />
      <Text style={[styles.actionLabel, { color, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
  },
  closeBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: 16,
  },
  filePreview: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  fileName: {
    fontSize: 18,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  fileType: {
    fontSize: 13,
  },
  infoCard: {
    borderRadius: 16,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    gap: 16,
  },
  infoLabel: {
    fontSize: 15,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  divider: {
    height: 0.5,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionLabel: {
    fontSize: 15,
  },
});
