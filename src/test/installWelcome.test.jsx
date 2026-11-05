/**
 * ETAPA 1 (PWA) — experiência de instalação depois do registo.
 *
 * Cobre os estados pedidos: app já instalada, convite disponível, convite
 * indisponível (sem `beforeinstallprompt`), instalação recusada e iOS, além
 * da garantia de que o convite não se repete.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { mockSupabase } from "./harness.js";
import { makeAuthUser } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const EMAIL = "maria@webstart.test";

let fake;
let mod;

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

async function loadModules() {
  const [
    installContext,
    welcomeModal,
    banner,
    authContext,
    toastContext,
    invite,
  ] = await Promise.all([
    import("../contexts/InstallContext.jsx"),
    import("../components/pwa/InstallWelcomeModal.jsx"),
    import("../components/pwa/InstallPrompt.jsx"),
    import("../contexts/AuthContext.jsx"),
    import("../contexts/ToastContext.jsx"),
    import("../utils/installInvite.js"),
  ]);

  return {
    installContext,
    welcomeModal,
    banner,
    authContext,
    toastContext,
    invite,
  };
}

function setUserAgent(userAgent) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

function setStandalone(standalone) {
  window.matchMedia = vi.fn((query) => ({
    matches: standalone && query.includes("display-mode: standalone"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

/** Simula um browser que suporta `beforeinstallprompt` (Chrome/Edge/Android). */
function enableBeforeInstallPrompt() {
  window.onbeforeinstallprompt = null;
}

/** Dispara o evento que o Chrome emite quando a app pode ser instalada. */
function emitBeforeInstallPrompt({ outcome = "accepted", platform = "web" } = {}) {
  const event = new Event("beforeinstallprompt");
  event.prompt = vi.fn(async () => {});
  event.userChoice = Promise.resolve({ outcome, platform });
  window.dispatchEvent(event);
  return event;
}

function renderApp() {
  const { installContext, welcomeModal, banner, authContext, toastContext } =
    mod;

  return render(
    <toastContext.ToastProvider>
      <authContext.AuthProvider>
        <installContext.InstallProvider>
          <MemoryRouter>
            <welcomeModal.InstallWelcomeModal />
            <banner.InstallPrompt />
          </MemoryRouter>
        </installContext.InstallProvider>
      </authContext.AuthProvider>
    </toastContext.ToastProvider>,
  );
}

async function signIn() {
  await act(async () => {
    await fake.auth.signInWithPassword({ email: EMAIL, password: "senha123" });
  });
}

function getDialog() {
  return screen.queryByRole("dialog");
}

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  fake = mockSupabase({
    authUsers: [
      makeAuthUser({
        id: AUTH_UID,
        email: EMAIL,
        password: "senha123",
        name: "Maria Silva",
      }),
    ],
  });
  mod = await loadModules();

  setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  setStandalone(false);
  delete window.onbeforeinstallprompt;
});

afterEach(() => {
  delete window.onbeforeinstallprompt;
});

describe("convite de instalação depois do registo", () => {
  it("mostra o convite de boas-vindas depois de a conta ser criada", async () => {
    enableBeforeInstallPrompt();
    mod.invite.markRegistrationPending(AUTH_UID);

    renderApp();
    await act(async () => {
      emitBeforeInstallPrompt({ outcome: "accepted" });
    });
    await signIn();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Leva a WebStart contigo")).not.toBeNull();
    expect(
      within(dialog).getByRole("button", { name: /Instalar WebStart/i }),
    ).not.toBeNull();
    expect(
      within(dialog).getByRole("button", { name: /Continuar no navegador/i }),
    ).not.toBeNull();

    // O convite não bloqueia a plataforma: o banner continua visível.
    expect(screen.getByText("Instalar a WebStart")).not.toBeNull();
  });

  it("não mostra o convite quando a conta não foi acabada de criar", async () => {
    renderApp();
    await signIn();

    await waitFor(() => expect(getDialog()).toBeNull());
    expect(mod.invite.readRegistrationPending()).toBeNull();
  });

  it("não mostra o convite quando a app já está instalada", async () => {
    setStandalone(true);
    mod.invite.markRegistrationPending(AUTH_UID);

    renderApp();
    await signIn();

    await waitFor(() => expect(getDialog()).toBeNull());
  });

  it("no iPhone mostra as instruções do Safari em vez do botão nativo", async () => {
    setUserAgent(IPHONE_UA);
    mod.invite.markRegistrationPending(AUTH_UID);

    renderApp();
    await signIn();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("No iPhone e no iPad")).not.toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: /Instalar WebStart/i }),
    ).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: /Ver passo a passo/i }),
    ).not.toBeNull();
  });

  it("usa o diálogo nativo e trata a aceitação", async () => {
    enableBeforeInstallPrompt();
    mod.invite.markRegistrationPending(AUTH_UID);
    const user = userEvent.setup();

    renderApp();
    let event;
    await act(async () => {
      event = emitBeforeInstallPrompt({ outcome: "accepted" });
    });
    await signIn();

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", { name: /Instalar WebStart/i }),
    );

    expect(event.prompt).toHaveBeenCalled();
    await waitFor(() => expect(getDialog()).toBeNull());
    // Depois de instalada, nem o modal nem o banner aparecem.
    expect(screen.queryByText("Instalar a WebStart")).toBeNull();
  });

  it("quando o utilizador recusa o diálogo nativo, o convite não volta", async () => {
    enableBeforeInstallPrompt();
    mod.invite.markRegistrationPending(AUTH_UID);
    const user = userEvent.setup();

    const first = renderApp();
    await act(async () => {
      emitBeforeInstallPrompt({ outcome: "dismissed" });
    });
    await signIn();

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", { name: /Instalar WebStart/i }),
    );

    await waitFor(() => expect(getDialog()).toBeNull());
    expect(mod.invite.isInstallDismissed()).toBe(true);
    // O banner inferior também some: já foi convidado.
    expect(screen.queryByText("Instalar a WebStart")).toBeNull();

    first.unmount();

    // Visita seguinte: o convite não volta a abrir.
    renderApp();
    await signIn();
    await waitFor(() => expect(getDialog()).toBeNull());
  });

  it("'Continuar no navegador' fecha o convite e regista a recusa", async () => {
    mod.invite.markRegistrationPending(AUTH_UID);
    const user = userEvent.setup();

    renderApp();
    await signIn();

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /Continuar no navegador/i }),
    );

    await waitFor(() => expect(getDialog()).toBeNull());
    expect(mod.invite.isInstallDismissed()).toBe(true);
  });

  it("não repete o convite em visitas seguintes", async () => {
    mod.invite.markRegistrationPending(AUTH_UID);
    const user = userEvent.setup();

    const first = renderApp();
    await signIn();

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /Continuar no navegador/i }),
    );
    await waitFor(() => expect(getDialog()).toBeNull());

    first.unmount();

    // Nova sessão, mesma conta: já foi convidado, logo não há convite.
    renderApp();
    await signIn();
    await waitFor(() => expect(getDialog()).toBeNull());
  });

  it("não mostra o convite a uma conta diferente da que acabou de criar", async () => {
    mod.invite.markRegistrationPending("outro-utilizador-999");

    renderApp();
    await signIn();

    await waitFor(() => expect(getDialog()).toBeNull());
  });

  it("sem `beforeinstallprompt` oferece o guia manual em vez de um botão morto", async () => {
    mod.invite.markRegistrationPending(AUTH_UID);

    renderApp();
    await signIn();

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: /Instalar WebStart/i }),
    ).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: /Ver passo a passo/i }),
    ).not.toBeNull();
  });
});

describe("banner de instalação", () => {
  it("aparece quando o browser pode instalar a app", async () => {
    enableBeforeInstallPrompt();

    renderApp();
    await act(async () => {
      emitBeforeInstallPrompt({ outcome: "accepted" });
    });

    expect(await screen.findByText("Instalar a WebStart")).not.toBeNull();
  });

  it("não aparece quando a app já está instalada", async () => {
    enableBeforeInstallPrompt();
    setStandalone(true);

    renderApp();
    await act(async () => {
      emitBeforeInstallPrompt({ outcome: "accepted" });
    });

    await waitFor(() =>
      expect(screen.queryByText("Instalar a WebStart")).toBeNull(),
    );
  });

  it("desaparece depois de o utilizador recusar", async () => {
    enableBeforeInstallPrompt();
    const user = userEvent.setup();

    renderApp();
    await act(async () => {
      emitBeforeInstallPrompt({ outcome: "dismissed" });
    });

    const banner = await screen.findByText("Instalar a WebStart");
    expect(banner).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Instalar App" }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Instalar a WebStart")).toBeNull(),
    );
    expect(mod.invite.isInstallDismissed()).toBe(true);
  });
});
