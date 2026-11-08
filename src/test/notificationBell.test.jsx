import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { contextRef } = vi.hoisted(() => ({ contextRef: { current: null } }));

vi.mock("../contexts/NotificationContext.jsx", () => ({
  useNotificationContext: () => contextRef.current,
}));

function makeContext(overrides = {}) {
  contextRef.current = {
    inbox: [
      {
        id: "notification-1",
        title: "Novo projeto na comunidade",
        body: "A Joana publicou um projeto novo",
        url: "/trilhas",
        category: "community",
        is_read: false,
        created_at: "2026-11-08T17:00:00.000Z",
      },
      {
        id: "notification-2",
        title: "Aula concluída",
        body: "Terminaste uma aula.",
        url: "/trilhas",
        category: "study_activity",
        is_read: true,
        created_at: "2026-11-08T16:00:00.000Z",
      },
    ],
    unreadCount: 1,
    inboxLoading: false,
    inboxError: "",
    refreshInbox: vi.fn(async () => {}),
    markNotificationRead: vi.fn(async () => true),
    markAllNotificationsRead: vi.fn(async () => true),
    ...overrides,
  };
  return contextRef.current;
}

async function renderBell() {
  const { NotificationBell } = await import(
    "../components/notifications/NotificationBell.jsx"
  );
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <NotificationBell />
      <Routes>
        <Route path="/" element={<div>Feed</div>} />
        <Route path="/trilhas" element={<div>Trilhas</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  contextRef.current = null;
});

describe("sininho de notificações", () => {
  it("mostra as recentes e permite marcar todas como lidas", async () => {
    const context = makeContext();
    await renderBell();

    await userEvent.click(screen.getByRole("button", { name: /1 por ler/i }));

    expect(await screen.findByRole("dialog", { name: /Notificações recentes/i }))
      .not.toBeNull();
    expect(screen.getByText("Novo projeto na comunidade")).not.toBeNull();
    expect(screen.getByText("Aula concluída")).not.toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: /Marcar todas como lidas/i }),
    );
    expect(context.markAllNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it("marca uma notificação como lida e abre o destino interno", async () => {
    const context = makeContext();
    await renderBell();

    await userEvent.click(screen.getByRole("button", { name: /1 por ler/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Novo projeto na comunidade/i }),
    );

    expect(context.markNotificationRead).toHaveBeenCalledWith("notification-1");
    await waitFor(() => expect(screen.getByText("Trilhas")).not.toBeNull());
  });
});
