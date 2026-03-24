import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";

export type FileItem = {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string;
  type: "file" | "video" | "audio" | "image" | "document" | "archive" | "other";
  addedAt: number;
  isDownload?: boolean;
  downloadUrl?: string;
};

export type DownloadTask = {
  id: string;
  name: string;
  url: string;
  progress: number;
  status: "pending" | "downloading" | "done" | "error";
  errorMessage?: string;
  downloadResumable?: FileSystem.DownloadResumable;
};

type FileManagerContextType = {
  files: FileItem[];
  downloadTasks: DownloadTask[];
  storageUsed: number;
  addFiles: () => Promise<void>;
  addDownloadUrls: (urls: string[]) => Promise<void>;
  removeFile: (id: string) => void;
  getFilesByType: (type: FileItem["type"] | "all") => FileItem[];
  formatSize: (bytes: number) => string;
  refreshFiles: () => void;
};

const FileManagerContext = createContext<FileManagerContextType | null>(null);

const STORAGE_KEY = "file_manager_files";
const PRIVATE_DIR_NAME = "PrivateDownloads";

function getPrivateDir(): string {
  if (Platform.OS === "web") return "";
  return `${FileSystem.documentDirectory}${PRIVATE_DIR_NAME}/`;
}

function inferType(mimeType: string, name: string): FileItem["type"] {
  const lower = (mimeType + name).toLowerCase();
  if (lower.includes("video") || /\.(mp4|mkv|avi|mov|wmv|flv|webm)/.test(lower)) return "video";
  if (lower.includes("audio") || /\.(mp3|aac|wav|flac|ogg|m4a)/.test(lower)) return "audio";
  if (lower.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic)/.test(lower)) return "image";
  if (lower.includes("pdf") || lower.includes("doc") || lower.includes("xls") || lower.includes("ppt") || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)/.test(lower)) return "document";
  if (/\.(zip|rar|7z|tar|gz|bz2|xz)/.test(lower)) return "archive";
  return "other";
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getFileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const last = parts[parts.length - 1];
    if (last && last.includes(".")) return decodeURIComponent(last);
  } catch {
  }
  return `download_${Date.now()}`;
}

export function FileManagerProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const activeDownloads = useRef<Map<string, FileSystem.DownloadResumable>>(new Map());

  const saveFiles = useCallback(async (f: FileItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  }, []);

  const loadFiles = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: FileItem[] = JSON.parse(raw);
      const verified: FileItem[] = [];
      for (const f of parsed) {
        if (Platform.OS === "web") {
          verified.push(f);
          continue;
        }
        try {
          const info = await FileSystem.getInfoAsync(f.uri);
          if (info.exists) verified.push(f);
        } catch {
        }
      }
      setFiles(verified);
      if (verified.length !== parsed.length) {
        await saveFiles(verified);
      }
    }
  }, [saveFiles]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      FileSystem.makeDirectoryAsync(getPrivateDir(), { intermediates: true }).catch(() => {});
    }
    loadFiles();
  }, [loadFiles]);

  const refreshFiles = useCallback(() => {
    loadFiles();
  }, [loadFiles]);

  const addFiles = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("غير مدعوم", "اختيار الملفات غير مدعوم على الويب");
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const newFiles: FileItem[] = [];
    const privateDir = getPrivateDir();

    for (const asset of result.assets) {
      const destUri = `${privateDir}${asset.name}`;
      try {
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });
        const info = await FileSystem.getInfoAsync(destUri);
        const size = info.exists && "size" in info ? info.size ?? asset.size ?? 0 : asset.size ?? 0;
        newFiles.push({
          id: generateId(),
          name: asset.name,
          uri: destUri,
          size,
          mimeType: asset.mimeType ?? "application/octet-stream",
          type: inferType(asset.mimeType ?? "", asset.name),
          addedAt: Date.now(),
        });
      } catch {
      }
    }

    setFiles((prev) => {
      const updated = [...newFiles, ...prev];
      saveFiles(updated);
      return updated;
    });
  }, [saveFiles]);

  const addDownloadUrls = useCallback(async (urls: string[]) => {
    if (Platform.OS === "web") {
      Alert.alert("غير مدعوم", "التنزيل غير مدعوم على الويب");
      return;
    }
    const tasks: DownloadTask[] = urls.map((url) => ({
      id: generateId(),
      name: getFileNameFromUrl(url),
      url,
      progress: 0,
      status: "pending" as const,
    }));

    setDownloadTasks((prev) => [...prev, ...tasks]);
    const privateDir = getPrivateDir();
    await FileSystem.makeDirectoryAsync(privateDir, { intermediates: true }).catch(() => {});

    for (const task of tasks) {
      const destUri = `${privateDir}${task.name}`;
      try {
        const downloadResumable = FileSystem.createDownloadResumable(
          task.url,
          destUri,
          {},
          (progress) => {
            const ratio =
              progress.totalBytesExpectedToWrite > 0
                ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
                : 0;
            setDownloadTasks((prev) =>
              prev.map((t) =>
                t.id === task.id ? { ...t, progress: ratio, status: "downloading" } : t
              )
            );
          }
        );
        activeDownloads.current.set(task.id, downloadResumable);
        setDownloadTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "downloading" } : t))
        );

        const res = await downloadResumable.downloadAsync();
        activeDownloads.current.delete(task.id);

        if (res) {
          const info = await FileSystem.getInfoAsync(res.uri);
          const size = info.exists && "size" in info ? info.size ?? 0 : 0;
          const mimeType = res.headers?.["content-type"] ?? "application/octet-stream";
          const newFile: FileItem = {
            id: generateId(),
            name: task.name,
            uri: res.uri,
            size,
            mimeType,
            type: inferType(mimeType, task.name),
            addedAt: Date.now(),
            isDownload: true,
            downloadUrl: task.url,
          };
          setFiles((prev) => {
            const updated = [newFile, ...prev];
            saveFiles(updated);
            return updated;
          });
          setDownloadTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: "done", progress: 1 } : t))
          );
        }
      } catch (e: any) {
        setDownloadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "error", errorMessage: e?.message ?? "فشل التنزيل" }
              : t
          )
        );
      }
    }
  }, [saveFiles]);

  const removeFile = useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      if (Platform.OS !== "web") {
        try {
          await FileSystem.deleteAsync(file.uri, { idempotent: true });
        } catch {
        }
      }
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        saveFiles(updated);
        return updated;
      });
    },
    [files, saveFiles]
  );

  const getFilesByType = useCallback(
    (type: FileItem["type"] | "all") => {
      if (type === "all") return files;
      return files.filter((f) => f.type === type);
    },
    [files]
  );

  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const storageUsed = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <FileManagerContext.Provider
      value={{
        files,
        downloadTasks,
        storageUsed,
        addFiles,
        addDownloadUrls,
        removeFile,
        getFilesByType,
        formatSize,
        refreshFiles,
      }}
    >
      {children}
    </FileManagerContext.Provider>
  );
}

export function useFileManager() {
  const ctx = useContext(FileManagerContext);
  if (!ctx) throw new Error("useFileManager must be used within FileManagerProvider");
  return ctx;
}
