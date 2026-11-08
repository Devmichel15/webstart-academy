import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { authRef, notificationRef, showSuccess } = vi.hoisted(() => ({
  authRef: { current: false },
  notificationRef: { current: null },
  showSuccess: vi.fn(),
}));

vi.mock("../contexts/AuthContext.jsx", () => ({
  useAuthContext: () => ({ isAuthenticated: authRef.current }),
}));

vi.mock("../contexts/NotificationContext.jsx", () => ({
  useNotificationContext: () => notificationRef.current,
}));

vi.mock("../contexts/ToastContext.jsx", () => ({
  useToast: () => ({ showSuccess }),
}));

function makeNotificationContext(overrides = {}) {
  notificationRef.current = {
    supported: true,
    permission: "default",
    devices: [],
    busy: false,
    enable: vi.fn(async () => ({})),
    enableBeforeSignIn: vi.fn(async () => ({})),
    error: "",
    ...overrides,
  };
  return notificationRef.current;
}

beforeEach(() => {
  localStorage.clear();
  authRef.current = false;
  showSuccess.mockReset();
});

describe("convite de notificações", () => {
  it("não aparece no onboarding até o aluno terminar a introdução", async () => {
    makeNotificationContext();
    const { default: Onboarding } = await import("../pages/Onboarding.jsx");
    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<div>Entrar na WebStart</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    await userEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    await userEvent.click(screen.getByRole("button", { name: /Começar Agora/i }));

    expect(await screen.findByRole("dialog")).not.toBeNull();
    expect(
      screen.getByText(/associamos as notificações à tua conta quando terminares o registo/i),
    ).not.toBeNull();
  });

  it("só pede permissão após o clique e continua para o registo", async () => {
    const context = makeNotificationContext();
    const { default: Onboarding } = await import("../pages/Onboarding.jsx");
    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<div>Entrar na WebStart</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Pular introdução/i }));
    await screen.findByRole("dialog");
    expect(context.enableBeforeSignIn).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: /Ativar notificações/i }),
    );

    expect(context.enableBeforeSignIn).toHaveBeenCalledTimes(1);
    expect(showSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/Permissão guardada/),
    );
    expect(await screen.findByText("Entrar na WebStart")).not.toBeNull();
    expect(localStorage.getItem("webstart_onboarding_done")).toBe("true");
  });

  it("convida uma conta existente e confirma quando a ativação termina", async () => {
    authRef.current = true;
    const context = makeNotificationContext();
    const { PushOnboarding } = await import(
      "../components/notifications/PushOnboarding.jsx"
    );
    render(
      <MemoryRouter initialEntries={["/"]}>
        <PushOnboarding />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).not.toBeNull();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /Ativar notificações/i }),
    );

    expect(context.enable).toHaveBeenCalledTimes(1);
    expect(showSuccess).toHaveBeenCalledWith(
      "Notificações ativadas com sucesso neste dispositivo.",
    );
  });
});
