import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const promptRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handler = (e: any) => {
      e.preventDefault();
      promptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check if already installed
    const mq = window.matchMedia("(display-mode: standalone)");
    if (mq.matches) {
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!promptRef.current) return;
    promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      promptRef.current = null;
    }
  };

  return { canInstall, install };
}
