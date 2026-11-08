import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, CheckCheck, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from "../../contexts/NotificationContext.jsx";
import { CATEGORY_LABELS, normalizeInternalPath } from "../../utils/pushPayload.js";

function notificationTime(value) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, "day");

  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
  }).format(timestamp);
}

export function NotificationBell() {
  const {
    inbox,
    unreadCount,
    inboxLoading,
    inboxError,
    refreshInbox,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotificationContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const bounds = buttonRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const panelWidth = Math.min(360, window.innerWidth - 32);
      const left = Math.min(
        Math.max(16, bounds.right - panelWidth),
        window.innerWidth - panelWidth - 16,
      );
      const maxHeight = Math.min(512, window.innerHeight - 32);
      const top = Math.min(
        bounds.bottom + 8,
        Math.max(16, window.innerHeight - maxHeight - 16),
      );
      setPosition({ left, top, maxHeight: `calc(100dvh - ${top + 16}px)` });
    };

    const handlePointerDown = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const toggleInbox = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) void refreshInbox();
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      const marked = await markNotificationRead(notification.id);
      if (!marked) return;
    }
    setOpen(false);
    navigate(normalizeInternalPath(notification.url));
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleInbox}
        aria-label={
          unreadCount > 0
            ? `Notificações, ${unreadCount} por ler`
            : "Notificações"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-transparent text-primary transition hover:border-strong hover:bg-surface-hover"
      >
        <Bell size={21} />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-red-600 px-1 text-[10px] font-black leading-none text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open && position
        ? createPortal(
            <section
              ref={panelRef}
              role="dialog"
              aria-label="Notificações recentes"
              className="fixed z-[100] flex w-[min(22.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border-2 border-strong bg-surface text-primary shadow-2xl"
              style={{
                left: position.left,
                top: position.top,
                maxHeight: position.maxHeight,
              }}
            >
              <header className="flex items-center justify-between gap-3 border-b border-strong px-4 py-3">
                <div>
                  <h2 className="font-black">Notificações</h2>
                  <p className="text-xs text-secondary">
                    {unreadCount > 0
                      ? `${unreadCount} por ler`
                      : "Estás em dia"}
                  </p>
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllNotificationsRead()}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-accent hover:bg-surface-hover"
                  >
                    <CheckCheck size={15} />
                    Marcar todas como lidas
                  </button>
                ) : null}
              </header>

              {inboxError ? (
                <div role="alert" className="p-4 text-sm text-red-600">
                  <p>{inboxError}</p>
                  <button
                    type="button"
                    onClick={() => void refreshInbox()}
                    className="mt-2 font-bold underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : inboxLoading && inbox.length === 0 ? (
                <div
                  role="status"
                  className="flex items-center justify-center gap-2 p-8 text-sm text-secondary"
                >
                  <LoaderCircle size={18} className="animate-spin" />
                  A carregar notificações…
                </div>
              ) : inbox.length === 0 ? (
                <p className="p-8 text-center text-sm text-secondary">
                  Ainda não tens notificações.
                </p>
              ) : (
                <ul className="overflow-y-auto">
                  {inbox.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => void openNotification(notification)}
                        className={`flex w-full items-start gap-3 border-b border-strong px-4 py-3 text-left transition hover:bg-surface-hover ${
                          notification.is_read ? "" : "bg-accent-soft/50"
                        }`}
                      >
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            notification.is_read ? "bg-transparent" : "bg-accent"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold">
                              {notification.title}
                            </span>
                            {!notification.is_read ? (
                              <span className="sr-only">Não lida</span>
                            ) : (
                              <Check
                                size={14}
                                aria-label="Lida"
                                className="shrink-0 text-accent"
                              />
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-secondary">
                            {notification.body}
                          </span>
                          <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
                            <span>
                              {CATEGORY_LABELS[notification.category] ||
                                "WebStart"}
                            </span>
                            <time dateTime={notification.created_at}>
                              {notificationTime(notification.created_at)}
                            </time>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>,
            document.body,
          )
        : null}
    </>
  );
}
