import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const { contextRef } = vi.hoisted(() => ({ contextRef: { current: null } }));

vi.mock("../contexts/NotificationContext.jsx", () => ({
  useNotificationContext: () => contextRef.current,
}));

function makeContext(overrides = {}) {
  const context = {
    supported: true,
    permission: "default",
    preferences: {
      push_enabled: false,
      learning_enabled: true,
      streak_enabled: true,
      community_enabled: true,
      comments_enabled: true,
      reminders_enabled: false,
      study_activity_enabled: true,
      reminder_hour: 19,
      reminder_days: [1, 2, 3, 4, 5],
    },
    devices: [],
    busy: false,
    error: "",
    notice: "",
    enable: vi.fn(async () => {}),
    disable: vi.fn(async () => {}),
    sendTest: vi.fn(async () => {}),
    updatePreferences: vi.fn(async () => {}),
    ...overrides,
  };
  contextRef.current = context;
  return context;
}

async function renderSettings() {
  const { NotificationSettings } = await import(
    "../components/notifications/NotificationSettings.jsx"
  );
  return render(
    <MemoryRouter>
      <NotificationSettings />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  contextRef.current = null;
});

describe("NotificationSettings", () => {
  it("num browser sem suporte explica o motivo", async () => {
    makeContext({ supported: false });
    await renderSettings();

    expect(
      screen.getByText(/Notificações push indisponíveis/i),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Ativar/i })).toBeNull();
  });

  it("pede a activação ao utilizador, sem pedir permissão sozinho", async () => {
    const context = makeContext();
    await renderSettings();

    expect(context.enable).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Ativar/i }));
    expect(context.enable).toHaveBeenCalledTimes(1);
  });

  it("com as notificações ativas mostra desativar e permite o teste", async () => {
    const context = makeContext({
      permission: "granted",
      preferences: {
        push_enabled: true,
        learning_enabled: true,
        streak_enabled: true,
        community_enabled: true,
        comments_enabled: true,
        reminders_enabled: false,
        study_activity_enabled: true,
        reminder_hour: 19,
        reminder_days: [1, 2, 3, 4, 5],
      },
    });
    await renderSettings();

    await userEvent.click(
      screen.getByRole("button", { name: /Desativar neste dispositivo/i }),
    );
    expect(context.disable).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole("button", { name: /notificação de teste/i }),
    );
    expect(context.sendTest).toHaveBeenCalledTimes(1);
  });

  it("o teste fica indisponível enquanto as notificações estão desligadas", async () => {
    makeContext();
    await renderSettings();

    const testButton = screen.getByRole("button", { name: /notificação de teste/i });
    expect(testButton.disabled).toBe(true);
  });

  it("muda uma categoria com a chave certa", async () => {
    const context = makeContext();
    await renderSettings();

    const reminders = screen.getByRole("checkbox", { name: /Lembretes/i });
    expect(reminders.checked).toBe(false);

    await userEvent.click(reminders);
    expect(context.updatePreferences).toHaveBeenCalledWith({
      reminders_enabled: true,
    });
  });

  it("mostra o erro devolvido pelo servidor", async () => {
    makeContext({
      error: "As notificações push estão desligadas nas tuas preferências.",
    });
    await renderSettings();

    expect(screen.getByRole("alert").textContent).toMatch(/desligadas/i);
  });

  it("mostra a confirmação depois de uma acção com sucesso", async () => {
    makeContext({ notice: "Notificações ativadas neste dispositivo." });
    await renderSettings();

    expect(screen.getByRole("status").textContent).toMatch(/ativadas/i);
  });

  it("lista os dispositivos registados", async () => {
    makeContext({
      devices: [
        {
          id: "sub-1",
          platform: "android",
          user_agent: "Android Chrome",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    await renderSettings();

    expect(screen.getByText("Android")).toBeTruthy();
    expect(screen.getByText("Android Chrome")).toBeTruthy();
  });
});
