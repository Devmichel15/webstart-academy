/**
 * Tarefa 2 — modal lateral de cadastro incompleto.
 *
 * Cobre as três decisões que fazem este modal ser útil em vez de irritante:
 *   - abre sozinho quando o `name` é null/vazio/"Aluno WebStart";
 *   - NÃO abre quando o nome é válido, e também não volta a abrir a cada
 *     navegação depois de já ter mostrado uma vez na sessão;
 *   - "Mais tarde" dá um cooldown, não um cancelamento permanente.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { mockSupabase, loadAppModules } from "./harness.js";
import { makeProfile, makeAuthUser } from "./fakeSupabase.js";

vi.setConfig({ testTimeout: 20_000 });

const AUTH_UID = "66666666-6666-4666-8666-666666666666";
const EMAIL = "maria@webstart.ao";
const DISMISS_KEY = "webstart:incomplete-profile-dismissed";

let fake;
let IncompleteProfileDrawer;
let AuthProvider;
let ProgressProvider;
let ThemeProvider;
let ToastProvider;

beforeEach(async () => {
  vi.resetModules();
  window.localStorage.clear();
  fake = mockSupabase({
    authUsers: [makeAuthUser({ id: AUTH_UID, email: EMAIL, name: "Maria" })],
  });
  fake.setSession({ id: AUTH_UID, email: EMAIL });

  const mod = await loadAppModules();
  ({ AuthProvider, ProgressProvider } = mod);
  ThemeProvider = (await import("../context/ThemeContext.jsx")).ThemeProvider;
  ToastProvider = (await import("../contexts/ToastContext.jsx")).ToastProvider;
  IncompleteProfileDrawer = (await import("../components/profile/IncompleteProfileDrawer.jsx"))
    .IncompleteProfileDrawer;
});

afterEach(() => {
  cleanup();
  document.body.classList.remove("drawer-open");
  vi.unstubAllGlobals?.();
});

function seedProfile(name) {
  fake.db.profiles.push(
    makeProfile({
      id: AUTH_UID,
      auth_user_id: AUTH_UID,
      name,
      email: EMAIL,
      xp: 40,
    }),
  );
}

function renderDrawer() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProgressProvider>
              <IncompleteProfileDrawer />
            </ProgressProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

function row() {
  return fake.db.profiles.find((p) => p.id === AUTH_UID);
}

async function signIn() {
  await fake.auth.signInWithPassword({ email: EMAIL, password: "senha123" });
}

describe("quando o nome está completo", () => {
  it("não abre", async () => {
    seedProfile("Maria Silva");
    await signIn();
    renderDrawer();
    await waitFor(() => expect(fake.queriesRun()).toBeGreaterThan(0));
    expect(screen.queryByText("Falta-te um nome")).toBeNull();
  });
});

describe("quando o cadastro está incompleto", () => {
  it.each([
    ["null", null],
    ["vazio", ""],
    ["só espaços", "   "],
    ['o default "Aluno WebStart"', "Aluno WebStart"],
  ])("abre com name %s", async (_label, name) => {
    seedProfile(name);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());
  });

  it("explica que o nome aparece na classificação semanal", async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());
    expect(screen.getByText(/classificação semanal/i)).toBeTruthy();
    expect(screen.getByText(/Aluno anónimo/i)).toBeTruthy();
  });

  it("guarda o nome pelo mesmo endpoint, fecha e atualiza o estado", async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());

    await userEvent.type(screen.getByPlaceholderText("O teu nome"), "Maria Silva");
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(row().name).toBe("Maria Silva"));
    await waitFor(() => expect(screen.queryByText("Falta-te um nome")).toBeNull());
  });

  it("não grava o default e mostra o erro", async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());

    await userEvent.type(screen.getByPlaceholderText("O teu nome"), "Aluno WebStart");
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(screen.getByText(/Aluno WebStart/)).toBeTruthy());
    expect(row().name).toBeNull();
    // continua aberto, com o erro à vista
    expect(screen.getByText("Falta-te um nome")).toBeTruthy();
  });

  it("rejeita um nome de 1 carácter antes de tocar na rede", async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());

    await userEvent.type(screen.getByPlaceholderText("O teu nome"), "A");
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(screen.getByText(/pelo menos 2 caracteres/i)).toBeTruthy());
    expect(row().name).toBeNull();
  });
});

describe("anti-intrusão", () => {
  it('"Mais tarde" fecha e fica em cooldown', async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());

    await userEvent.click(screen.getByRole("button", { name: "Mais tarde" }));

    await waitFor(() => expect(screen.queryByText("Falta-te um nome")).toBeNull());
    expect(window.localStorage.getItem(DISMISS_KEY)).toBeTruthy();
    expect(row().name).toBeNull();
  });

  it("não volta a abrir depois de adiado", async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());
    await userEvent.click(screen.getByRole("button", { name: "Mais tarde" }));
    await waitFor(() => expect(screen.queryByText("Falta-te um nome")).toBeNull());

    cleanup();
    renderDrawer();
    await waitFor(() => expect(fake.queriesRun()).toBeGreaterThan(0));
    expect(screen.queryByText("Falta-te um nome")).toBeNull();
  });

  it("Escape também adia", async () => {
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByText("Falta-te um nome")).toBeNull());
    expect(window.localStorage.getItem(DISMISS_KEY)).toBeTruthy();
  });

  it("um cooldown expirado volta a mostrar", async () => {
    // Adiado há 25 horas — o cooldown é de 24.
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() - 25 * 60 * 60 * 1000));
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());
  });

  it("guardar o nome limpa o estado de adiado", async () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() - 25 * 60 * 60 * 1000));
    seedProfile(null);
    await signIn();
    renderDrawer();
    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());

    await userEvent.type(screen.getByPlaceholderText("O teu nome"), "Maria Silva");
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(row().name).toBe("Maria Silva"));
    expect(window.localStorage.getItem(DISMISS_KEY)).toBeNull();
  });

  it("avisa de novo se o nome voltar a ficar incompleto", async () => {
    // O latch é por sessão, mas não pode ser vitalício: quem apaga o nome
    // outra vez tem de ser avisado outra vez.
    seedProfile("Maria Silva");
    await signIn();
    renderDrawer();
    await waitFor(() => expect(fake.queriesRun()).toBeGreaterThan(0));
    expect(screen.queryByText("Falta-te um nome")).toBeNull();

    await fake.from("profiles").update({ name: null }).eq("id", AUTH_UID);

    await waitFor(() => expect(screen.getByText("Falta-te um nome")).toBeTruthy());
  });
});
