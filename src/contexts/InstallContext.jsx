import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const InstallContext = createContext(null);

const GRACE_MS = 6000;

function isIosDevice() {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function supportsBeforeInstallPrompt() {
  return (
    typeof window !== "undefined" && "onbeforeinstallprompt" in window
  );
}

export function InstallProvider({ children }) {
  const deferredPromptRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    const graceTimer = window.setTimeout(() => setGraceElapsed(true), GRACE_MS);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.clearTimeout(graceTimer);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return null;
    try {
      await prompt.prompt();
      return await prompt.userChoice;
    } finally {
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      deferredPrompt,
      installed,
      isIos: isIosDevice(),
      supports: supportsBeforeInstallPrompt(),
      canPrompt: deferredPrompt !== null,
      graceElapsed,
      install,
    }),
    [deferredPrompt, installed, graceElapsed, install],
  );

  return (
    <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
  );
}

export function useInstall() {
  const context = useContext(InstallContext);
  if (!context) {
    throw new Error("useInstall must be used inside <InstallProvider>");
  }
  return context;
}