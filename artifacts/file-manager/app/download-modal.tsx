import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFileManager } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

type UrlEntry = {
  id: string;
  url: string;
};

export default function DownloadModal() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { addDownloadUrls } = useFileManager();
  const [entries, setEntries] = useState<UrlEntry[]>([{ id: generateId(), url: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const addEntry = () => {
    const newEntry = { id: generateId(), url: "" };
    setEntries((prev) => [...prev, newEntry]);
    setTimeout(() => {
      inputRefs.current[newEntry.id]?.focus();
    }, 100);
  };

  const removeEntry = (id: string) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateUrl = (id: string, url: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, url } : e)));
  };

  const handleDownload = async () => {
    const validUrls = entries
      .map((e) => e.url.trim())
      .filter((u) => u.length > 0);

    if (validUrls.length === 0) {
      Alert.alert("خطأ", "أدخل رابطاً واحداً على الأقل");
      return;
    }

    const invalidUrls = validUrls.filter((u) => {
      try {
        new URL(u);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      Alert.alert("روابط غير صحيحة", `الروابط التالية غير صحيحة:\n${invalidUrls.join("\n")}`);
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    await addDownloadUrls(validUrls);
    setIsLoading(false);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.topBar}>
          <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
            إضافة روابط تنزيل
          </Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <View style={[styles.closeBg, { backgroundColor: theme.surface3 }]}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </View>
          </Pressable>
        </View>

        <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
          أدخل روابط الملفات التي تريد تنزيلها. يمكنك إضافة روابط متعددة.
        </Text>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry, index) => (
            <View key={entry.id} style={styles.urlRow}>
              <View style={[styles.urlInputContainer, { backgroundColor: theme.surface2, borderColor: theme.separator }]}>
                <Feather name="link" size={16} color={theme.textTertiary} style={styles.urlIcon} />
                <TextInput
                  ref={(ref) => { inputRefs.current[entry.id] = ref; }}
                  style={[styles.urlInput, { color: theme.text, fontFamily: "Inter_400Regular" }]}
                  placeholder={`رابط ${index + 1}`}
                  placeholderTextColor={theme.textTertiary}
                  value={entry.url}
                  onChangeText={(text) => updateUrl(entry.id, text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    const nextEntry = entries[index + 1];
                    if (nextEntry) {
                      inputRefs.current[nextEntry.id]?.focus();
                    } else {
                      addEntry();
                    }
                  }}
                />
                {entry.url.length > 0 && (
                  <Pressable onPress={() => updateUrl(entry.id, "")}>
                    <Feather name="x-circle" size={16} color={theme.textTertiary} />
                  </Pressable>
                )}
              </View>
              {entries.length > 1 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeEntry(entry.id);
                  }}
                  style={[styles.removeBtn, { backgroundColor: `${theme.danger}22` }]}
                >
                  <Feather name="trash-2" size={16} color={theme.danger} />
                </Pressable>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addEntry();
            }}
            style={[styles.addUrlBtn, { backgroundColor: theme.surface2 }]}
          >
            <Feather name="plus" size={18} color={theme.primary} />
            <Text style={[styles.addUrlText, { color: theme.primary, fontFamily: "Inter_500Medium" }]}>
              أضف رابطاً آخر
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad + 8 }]}>
          <Text style={[styles.footerNote, { color: theme.textTertiary, fontFamily: "Inter_400Regular" }]}>
            {entries.filter((e) => e.url.trim()).length} رابط سيتم تنزيله
          </Text>
          <Pressable
            onPress={handleDownload}
            disabled={isLoading}
            style={[
              styles.downloadBtn,
              {
                backgroundColor: isLoading ? theme.textTertiary : theme.primary,
              },
            ]}
          >
            <Feather name="download" size={18} color="#fff" />
            <Text style={[styles.downloadBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              {isLoading ? "جارٍ التنزيل..." : "بدء التنزيل"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 2,
  },
  closeBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 12,
  },
  urlRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  urlInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  urlIcon: {
    marginRight: 2,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  removeBtn: {
    width: 40,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addUrlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  addUrlText: {
    fontSize: 15,
  },
  footer: {
    paddingTop: 16,
    gap: 10,
  },
  footerNote: {
    fontSize: 13,
    textAlign: "center",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  downloadBtnText: {
    fontSize: 16,
    color: "#fff",
  },
});
