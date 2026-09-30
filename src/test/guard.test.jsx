/**
 * Tarefa 4 — Regressões do LearningProfileGuard.
 *
 * Cobre os estados que o guard tem de distinguir:
 *   - a carregar (não pode bloquear nem redirecionar);
 *   - onboarding concluído;
 *   - perfil migrado;
 *   - utilizador novo (onboarding genuinely por fazer);
 *   - FALHA DE REDE (não é o mesmo que "onboarding por fazer").
 *
 * O último ponto é o que está em teste: `isAssessmentCompleted()` faz catch e
 * devolve `false`, o guard via `completed = false` e, se o progresso também
 * não carregou, `isNewUser` fica true -> redirect para /avaliacao-perfil.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation, useOutletContext } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { mockSupabase, loadAppModules } from "./harness.js";
import { learningProfileRow, makeAuthUser, makeProfile, postgrestError } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const LEGACY_PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const EMAIL = "maria@webstart.test";
const PASSWORD = "senha123";

// O guard só decide depois de `isAssessmentCompleted` esgotar o withRetry
// (3 tentativas: 0 s + 1 s + 2 s), e o contexto após `readProfileWithRetry`
// (4 tentativas: 3 × 500 ms). O default de 5 s não chega.
vi.setConfig({ testTimeout: 20_000 });

const TIMEOUT = Object.assign(new Error("fetch failed: request timed out"), {
  name: "TypeError",
});
const SERVER_500 = Object.assign(new Error("Internal Server Error"), { status: 500 });

let fake;
let mod;
let LearningProfileGuard;
let ThemeProvider;
let ToastProvider;
let useProgress;

function Tree({ children, initialEntries = ["/"] }) {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ToastProvider>
          <mod.AuthProvider>
            <mod.ProgressProvider>
              <MemoryRouter initialEntries={initialEntries}>
                {children}
              </MemoryRouter>
            </mod.ProgressProvider>
          </mod.AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="path">{location.pathname}</p>;
}

/**
 * Expõe o estado do ProgressContext para os testes esperarem que o loading
 * assente. Sem isto, `waitFor` pode pasar enquanto `readProfileWithRetry`
 * ainda está a gastar o seu orçamento de tentativas (4 × 500 ms) e o guard
 * ainda nem decidiu nada — os testes passariam pelo motivo errado.
 */
function ProgressProbe() {
  const { loading, error, xp, completedLessons } = useProgress();
  return (
    <p data-testid="progress">
      {JSON.stringify({ loading, error, xp, lessons: (completedLessons || []).length })}
    </p>
  );
}

function progressState() {
  return JSON.parse(screen.getByTestId("progress").textContent);
}

/** Espera que o ProgressContext deixe de estar em loading. */
async function waitForLoadingToSettle() {
  await waitFor(() => expect(progressState().loading).toBe(false), { timeout: 5000 });
}

/**
 * Lê a decisão do guard através do `Outlet context` que ele publica
 * (`assessmentCompleted`). Sem isto há uma corrida: o ProgressContext assenta
 * aos ~1,5 s (4 × 500 ms) mas `isAssessmentCompleted` só decide aos ~3 s
 * (withRetry 3 × 1 s), e o teste pode afirmar antes de o guard decidir.
 */
function GuardState() {
  const ctx = useOutletContext();
  const completed = ctx?.assessmentCompleted ?? null;
  const failed = ctx?.assessmentFailed ?? false;
  return <p data-testid="guard">{JSON.stringify({ completed, failed })}</p>;
}

function guardState() {
  return JSON.parse(screen.getByTestId("guard").textContent);
}

/** Espera o guard decidir: resposta definitiva ou falha assumida. */
async function waitForGuardDecision() {
  await waitFor(
    () => {
      const state = guardState();
      expect(state.completed !== null || state.failed === true).toBe(true);
    },
    { timeout: 10000 },
  );
}

async function settleEverything() {
  await waitForLoadingToSettle();
  await waitForGuardDecision();
}

beforeEach(async () => {
  vi.resetModules();
  sessionStorage.clear();
  fake = mockSupabase({
    authUsers: [makeAuthUser({ id: AUTH_UID, email: EMAIL, password: PASSWORD, name: "Maria" })],
  });
  mod = await loadAppModules();
  LearningProfileGuard = (await import("../components/auth/LearningProfileGuard.jsx"))
    .LearningProfileGuard;
  // Importado DEPOIS do resetModules para partilhar a mesma instância do
  // ProgressContext que o provider usa (import estático criaria outro).
  useProgress = (await import("../hooks/useProgress.js")).useProgress;
  ThemeProvider = (await import("../context/ThemeContext.jsx")).ThemeProvider;
  ToastProvider = (await import("../contexts/ToastContext.jsx")).ToastProvider;
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

async function signIn() {
  await act(async () => {
    await fake.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  });
}

function routes() {
  return (
    <>
      <LocationProbe />
      <ProgressProbe />
      <Routes>
        <Route element={<LearningProfileGuard />}>
          <Route path="/" element={<><p>dashboard</p><GuardState /></>} />
          <Route path="/avaliacao-perfil" element={<><p>avaliacao</p><GuardState /></>} />
        </Route>
      </Routes>
    </>
  );
}

function seedReturningProfile({ xp = 800, completedLessons = [] } = {}) {
  fake.db.profiles.push(
    makeProfile({
      id: AUTH_UID,
      name: "Maria Silva",
      email: EMAIL,
      xp,
      completed_lessons: completedLessons,
      first_steps_done: true,
    }),
  );
}

function seedCompletedOnboarding(profileId = AUTH_UID) {
  fake.db.learning_profiles.push(
    learningProfileRow(profileId, {
      assessment: { experience: "know_basics", objective: "first_job" },
    }),
  );
}

describe("LearningProfileGuard — carregamento", () => {
  it("não redireciona enquanto o perfil ainda está a carregar", async () => {
    seedReturningProfile();
    seedCompletedOnboarding();

    render(<Tree>{routes()}</Tree>);
    await signIn();

    // Enquanto `loading`/`progressLoading` estão true o guard deixa passar o
    // Outlet, portanto o dashboard aparece e NADA é redirecionado.
    await waitFor(() => expect(screen.getByText("dashboard")).toBeTruthy());
    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("liberta o loading mesmo quando todas as queries falham", async () => {
    seedReturningProfile();
    fake.setError(SERVER_500);

    render(<Tree>{routes()}</Tree>);
    await signIn();

    // Sem ecrã branco infinito: o loading tem de assentar.
    await settleEverything();
    expect(screen.queryByText(/a carregar/i)).toBeNull();
  });
});

describe("LearningProfileGuard — onboarding concluído", () => {
  it("deixa passar quem já concluiu o onboarding", async () => {
    seedReturningProfile();
    seedCompletedOnboarding();

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(screen.getByText("dashboard")).toBeTruthy();
    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("não abre o modal de assessment a quem já concluiu", async () => {
    seedReturningProfile();
    seedCompletedOnboarding();

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(screen.getByText("dashboard")).toBeTruthy();
    expect(document.body.textContent).not.toContain("Assessment");
  });
});

describe("LearningProfileGuard — perfil migrado", () => {
  it("não redireciona um migrador que já tem histórico e onboarding", async () => {
    // Perfil legado linkado + work profile, como depois do primeiro login.
    fake.db.profiles.push(
      makeProfile({
        id: LEGACY_PROFILE_ID,
        name: "Maria Silva",
        email: EMAIL,
        auth_user_id: AUTH_UID,
        legacy_firebase_uid: "firebase-legacy-1",
        xp: 1500,
        completed_lessons: ["html-1"],
      }),
    );
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        name: "Maria Silva",
        email: EMAIL,
        xp: 1500,
        completed_lessons: ["html-1"],
        first_steps_done: true,
      }),
    );
    seedCompletedOnboarding(AUTH_UID);

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(screen.getByText("dashboard")).toBeTruthy();
    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("não redireciona um migrador com histórico mas SEM onboarding guardado", async () => {
    // Perfil com progresso mas learning_profiles ausente: é um utilizador
    // existente, não um novo. O guard não deve forçar o assessment.
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        name: "Maria Silva",
        email: EMAIL,
        xp: 1500,
        completed_lessons: ["html-1"],
        first_steps_done: true,
      }),
    );

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(progressState()).toMatchObject({ xp: 1500, lessons: 1 });
    expect(screen.getByTestId("path").textContent).toBe("/");
  });
});

describe("LearningProfileGuard — utilizador novo", () => {
  it("redireciona mesmo sem o assessment (perfil vazio)", async () => {
    seedReturningProfile({ xp: 0, completedLessons: [] });

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(screen.getByTestId("path").textContent).toBe("/avaliacao-perfil");
    expect(screen.getByText("avaliacao")).toBeTruthy();
  });

  it("não faz loop quando já está em /avaliacao-perfil", async () => {
    seedReturningProfile({ xp: 0, completedLessons: [] });

    render(<Tree initialEntries={["/avaliacao-perfil"]}>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(screen.getByText("avaliacao")).toBeTruthy();
    expect(screen.getByTestId("path").textContent).toBe("/avaliacao-perfil");
  });
});

describe("BUG #14 — falha de rede não pode virar \"onboarding por fazer\"", () => {
  it("NÃO redireciona para /avaliacao-perfil quando a verificação falha por rede", async () => {
    seedReturningProfile();
    seedCompletedOnboarding();
    // O utilizador TEM o onboarding concluído, mas não conseguimos prová-lo.
    fake.setError(TIMEOUT);

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    // Uma falha de rede não pode custar ao utilizador o seu assessment.
    expect(guardState()).toMatchObject({ failed: true, completed: null });
    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("NÃO redireciona quando o erro é permanente de RLS (42501)", async () => {
    seedReturningProfile();
    seedCompletedOnboarding();
    fake.setError(postgrestError("row-level security violation", "42501"));

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(guardState()).toMatchObject({ failed: true, completed: null });
    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("NÃO redireciona quando o perfil e o progresso não carregam (xp 0 por omissão)", async () => {
    // Pior caso: rede em baixo total. `xp` fica 0 e `completedLessons` fica [],
    // o que faz isNewUser = true. Mesmo assim não se manda o utilizador
    // refazer o assessment.
    seedReturningProfile();
    fake.setError(SERVER_500);

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    // Precondição do bug: o contexto já não está a carregar e mostra o perfil vazio.
    expect(progressState()).toMatchObject({ loading: false, xp: 0, lessons: 0 });

    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("mostra um erro ao utilizador em vez de um dashboard vazio e silencioso", async () => {
    seedReturningProfile();
    fake.setError(SERVER_500);

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(progressState().error).toBeTruthy();
  });

  it("NÃO mostra o modal de assessment quando a verificação falha", async () => {
    seedReturningProfile({ xp: 0, completedLessons: [] });
    fake.setError(TIMEOUT);

    render(<Tree>{routes()}</Tree>);
    await signIn();
    await settleEverything();

    expect(document.body.textContent).not.toContain("Assessment");
  });
});