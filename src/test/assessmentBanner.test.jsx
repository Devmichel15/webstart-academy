/**
 * FASE 2 — bug #23: utilizador com onboarding concluído continua a ver o aviso
 * "responder 7 perguntas de novo" no dashboard.
 *
 * A condição do dashboard (`Dashboard.jsx`) NÃO é o bug: só mostra o banner com
 * `assessmentCompleted === false`, e o guard expõe um tri-estado em que o erro
 * deixa o valor a `null`. O problema é o estado do guard ficar *stale*: o
 * `useEffect` que lê o assessment só corre quando `user` ou `location.pathname`
 * mudam. O assessment pode ser concluído **sem mudança de rota** (o
 * `AssessmentModal` abre sobre a página atual), e aí o guard continua com
 * `completed === false` para sempre — o banner volta a aparecer.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useOutletContext } from "react-router-dom";
import { mockSupabase, loadAppModules } from "./harness.js";
import { makeProfile, makeAuthUser, learningProfileRow } from "./fakeSupabase.js";

vi.setConfig({ testTimeout: 20_000 });

const AUTH_UID = "11111111-1111-4111-8111-111111111111";

let fake;
let mod;
let LearningProfileGuard;
let AuthProvider;
let ProgressProvider;
let ThemeProvider;
let ToastProvider;
let learningProfileService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase({
    authUsers: [makeAuthUser({ id: AUTH_UID, email: "maria@webstart.ao", name: "Maria Silva" })],
  });
  fake.db.profiles.push(
    makeProfile({
      id: AUTH_UID,
      auth_user_id: AUTH_UID,
      name: "Maria Silva",
      email: "maria@webstart.ao",
      xp: 40,
      completed_lessons: ["html-1"],
    }),
  );
  mod = await loadAppModules();
  ({ AuthProvider, ProgressProvider, learningProfileService } = mod);
  ThemeProvider = (await import("../context/ThemeContext.jsx")).ThemeProvider;
  ToastProvider = (await import("../contexts/ToastContext.jsx")).ToastProvider;
  LearningProfileGuard = (await import("../components/auth/LearningProfileGuard.jsx"))
    .LearningProfileGuard;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals?.();
});

function BannerProbe() {
  const ctx = useOutletContext() || {};
  return (
    <div>
      <span data-testid="banner">{ctx.assessmentCompleted === false ? "RESPONDER_7_PERGUNTAS" : "SEM_BANNER"}</span>
      <span data-testid="failed">{String(ctx.assessmentFailed)}</span>
    </div>
  );
}

function Providers({ children }) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProgressProvider>{children}</ProgressProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

/** assessment concluído na coluna canónica `completed` */
function seedCompletedCanonical() {
  fake.db.learning_profiles.push(
    learningProfileRow(AUTH_UID, {
      completed: true,
      metadataCompleted: false,
      assessment: {},
    }),
  );
}

/** assessment concluído só em `metadata.completed` (registo antigo, bug #15) */
function seedCompletedMetadataOnly() {
  fake.db.learning_profiles.push(
    learningProfileRow(AUTH_UID, {
      completed: null,
      metadataCompleted: true,
      assessment: {},
    }),
  );
}

/**
 * Concluir o assessment SEM mudar de rota — exatamente o que acontece quando o
 * `AssessmentModal` é fechado dentro da página atual.
 */
async function completeAssessmentInPlace() {
  await learningProfileService.saveFullLearningProfile(AUTH_UID, {
    assessment: {
      answers: [{ questionId: "q1", answer: "a" }],
      answeredAt: new Date().toISOString(),
      score: 8,
    },
    roadmap: {},
    source: "assessment",
  });
}

async function renderApp() {
  const result = render(
    <Providers>
      <Routes>
        <Route element={<LearningProfileGuard />}>
          <Route path="/" element={<BannerProbe />} />
        </Route>
      </Routes>
    </Providers>,
  );
  await act(async () => {
    await fake.auth.signInWithPassword({
      email: "maria@webstart.ao",
      password: "senha123",
    });
  });
  return result;
}

describe("BUG #23: o guard fica com estado stale se o assessment for concluído sem mudar de rota", () => {
  it("assessment já concluído (coluna canónica) não mostra o aviso", async () => {
    seedCompletedCanonical();
    await renderApp();
    await waitFor(() => expect(screen.getByTestId("banner").textContent).toBe("SEM_BANNER"));
  });

  it("assessment concluído só em metadata (registo antigo) não mostra o aviso", async () => {
    seedCompletedMetadataOnly();
    await renderApp();
    await waitFor(() => expect(screen.getByTestId("banner").textContent).toBe("SEM_BANNER"));
  });

  it("assessment NÃO concluído mostra o aviso", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { completed: false, metadataCompleted: false, assessment: {} }),
    );
    await renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("banner").textContent).toBe("RESPONDER_7_PERGUNTAS"),
    );
  });

  it("depois de concluir o assessment na MESMA rota, o aviso desaparece", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { completed: false, metadataCompleted: false, assessment: {} }),
    );
    await renderApp();

    // Primeiro o aviso aparece...
    await waitFor(() =>
      expect(screen.getByTestId("banner").textContent).toBe("RESPONDER_7_PERGUNTAS"),
    );

    // ...o utilizador submete o assessment sem navegar...
    await completeAssessmentInPlace();

    // ...e o aviso tem de desaparecer depois da confirmação da gravação.
    await waitFor(() => expect(screen.getByTestId("banner").textContent).toBe("SEM_BANNER"));
  });
});

describe("BUG #23: erro de leitura não pode ser lido como 'não concluído'", () => {
  it("falha ao ler o assessment: sem aviso e com assessmentFailed a true", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { completed: false, metadataCompleted: false, assessment: {} }),
    );
    fake.setError({ message: "network error", code: "PGRST000" });

    await renderApp();

    await waitFor(
      () => expect(screen.getByTestId("failed").textContent).toBe("true"),
      { timeout: 7_000 },
    );
    expect(screen.getByTestId("banner").textContent).toBe("SEM_BANNER");
  });
});