import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { FileItem } from "@/context/FileManagerContext";

type Props = {
  type: FileItem["type"];
  size?: number;
};

const TYPE_CONFIG: Record<
  FileItem["type"],
  { icon: string; bg: string; color: string; lib: "feather" | "ionicons" | "material" }
> = {
  image: { icon: "image", bg: "#FF6B6B22", color: "#FF6B6B", lib: "feather" },
  video: { icon: "video", bg: "#845EF722", color: "#845EF7", lib: "feather" },
  audio: { icon: "music", bg: "#22B8CF22", color: "#22B8CF", lib: "feather" },
  document: { icon: "file-text", bg: "#339AF022", color: "#339AF0", lib: "feather" },
  archive: { icon: "archive", bg: "#F59F0022", color: "#F59F00", lib: "feather" },
  file: { icon: "file", bg: "#51CF6622", color: "#51CF66", lib: "feather" },
  other: { icon: "file", bg: "#ADB5BD22", color: "#ADB5BD", lib: "feather" },
};

export function FileIcon({ type, size = 44 }: Props) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  const iconSize = size * 0.45;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: config.bg,
        },
      ]}
    >
      <Feather name={config.icon as any} size={iconSize} color={config.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
