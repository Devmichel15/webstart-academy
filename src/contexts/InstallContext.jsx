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

export const INSTALL_DISMISSED_KEY = "webstart-pwa-install-dismissed";

let capturedPrompt = null;
const promptSubscribers = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    capturedPrompt = event;
    for (const subscriber of promptSubscribers) subscriber(event);
  });
}

function detectDevice() {
  const userAgent = window.navigator.userAgent || "";
  const uaData = window.navigator.userAgentData;
  const platform = uaData?.platform || window.navigator.platform || "";

  const ios =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (/macintel|iphone|ipad/i.test(platform) &&
      window.navigator.maxTouchPoints > 1);

  const android =
    uaData?.mobile && /android/i.test(platform)
      ? true
      : /android/i.test(userAgent) || /android/i.test(platform);

  return {
    android,
    ios,
    desktop: !android && !ios,
  };
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
  const [device] = useState(() => detectDevice());
  const deferredPromptRef = useRef(capturedPrompt);
  const [deferredPrompt, setDeferredPrompt] = useState(() => capturedPrompt);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const handlePromptCaptured = (event) => {
      deferredPromptRef.current = event;
      setDeferredPrompt(event);
    };
    promptSubscribers.add(handlePromptCaptured);

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      capturedPrompt = null;
      setDeferredPrompt(null);
      setInstalled(true);
      try {
        localStorage.removeItem(INSTALL_DISMISSED_KEY);
      } catch {
        // ignore
      }
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    const graceTimer = window.setTimeout(() => setGraceElapsed(true), GRACE_MS);

    return () => {
      promptSubscribers.delete(handlePromptCaptured);
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
      capturedPrompt = null;
      setDeferredPrompt(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      deferredPrompt,
      installed,
      device,
      isIos: device.ios,
      supports: supportsBeforeInstallPrompt(),
      canPrompt: deferredPrompt !== null,
      graceElapsed,
      install,
    }),
    [deferredPrompt, installed, device, graceElapsed, install],
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