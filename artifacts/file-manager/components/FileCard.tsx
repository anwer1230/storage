import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FileItem, useFileManager } from "@/context/FileManagerContext";
import { useTheme } from "@/hooks/useTheme";
import { FileIcon } from "./FileIcon";
import { router } from "expo-router";

type Props = {
  file: FileItem;
};

export function FileCard({ file }: Props) {
  const { theme } = useTheme();
  const { removeFile, formatSize } = useFileManager();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/file-detail",
      params: { fileId: file.id },
    });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      file.name,
      `الحجم: ${formatSize(file.size)}`,
      [
        {
          text: "حذف",
          style: "destructive",
          onPress: () => removeFile(file.id),
        },
        { text: "إلغاء", style: "cancel" },
      ]
    );
  };

  const timeAgo = () => {
    const diff = Date.now() - file.addedAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} س`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} ي`;
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: theme.surface }]}
      >
        <FileIcon type={file.type} size={46} />
        <View style={styles.info}>
          <Text
            style={[styles.name, { color: theme.text, fontFamily: "Inter_500Medium" }]}
            numberOfLines={1}
          >
            {file.name}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {formatSize(file.size)} · {timeAgo()}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={theme.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
  },
});
