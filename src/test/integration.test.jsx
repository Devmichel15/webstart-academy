/**
 * ETAPA 10 — Testes de INTEGRAÇÃO.
 *
 * Estes testes NÃO mockam o Supabase com respostas prontas: usam o duplo em
 * memória (src/test/fakeSupabase.js), que implementa as políticas RLS, as FK e
 * a semântica de maybeSingle() do PostgREST. Ou seja, exercitam a integração
 * real entre AuthContext → userService → ProgressContext → guards → páginas,
 * com a "base de dados" a ser um repositório em memória — a persistência é
 * verificada relendo o repositório, não o estado do React.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { mockSupabase, loadAppModules } from "./harness.js";
import { learningProfileRow, makeAuthUser, makeProfile } from "./fakeSupabase.js";
import { QUESTIONS } from "../components/assessment/AssessmentQuestionsData.js";
import { allLessons, allVideoLessons } from "../data/lessons/index.js";
import { getTrailById } from "../data/trails.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const LEGACY_PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const PASSWORD = "senha123";
const EMAIL = "maria@webstart.test";

let fake;
let mod;
let Dashboard;
let AssessmentPage;
let LearningProfileGuard;
let FirstStepsGuard;
let ThemeProvider;
let ToastProvider;

const COMBINED_LESSONS = [...allLessons, ...allVideoLessons];

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="path">{location.pathname}</p>;
}

function Tree({ children, initialEntries = ["/"] }) {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ToastProvider>
          <mod.AuthProvider>
            <mod.ProgressProvider>
              <MemoryRouter initialEntries={initialEntries}>
                <LocationProbe />
                {children}
              </MemoryRouter>
            </mod.ProgressProvider>
          </mod.AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase({
    authUsers: [
      makeAuthUser({
        id: AUTH_UID,
        email: EMAIL,
        password: PASSWORD,
        name: "Maria Silva",
      }),
    ],
  });
  mod = await loadAppModules();
  Dashboard = (await import("../pages/Dashboard.jsx")).default;
  AssessmentPage = (await import("../pages/AssessmentPage.jsx")).default;
  LearningProfileGuard = (await import("../components/auth/LearningProfileGuard.jsx"))
    .LearningProfileGuard;
  FirstStepsGuard = (await import("../components/auth/FirstStepsGuard.jsx")).FirstStepsGuard;
  ThemeProvider = (await import("../context/ThemeContext.jsx")).ThemeProvider;
  ToastProvider = (await import("../contexts/ToastContext.jsx")).ToastProvider;
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

function seedCompletedOnboarding(profileId = AUTH_UID) {
  fake.db.learning_profiles.push(
    learningProfileRow(profileId, {
      assessment: { experience: "know_basics", objective: "first_job" },
      roadmap: { recommendedCourses: ["html", "css"], firstStep: { courseId: "html" } },
    }),
  );
}

function seedLessonsInDb() {
  for (const lesson of COMBINED_LESSONS) {
    fake.db.lessons.push({
      id: lesson.id,
      course_id: lesson.courseId,
      module_id: lesson.moduleId || null,
    });
  }
}

async function signIn() {
  await act(async () => {
    await fake.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  });
}

function dashboardRoutes() {
  return (
    <Routes>
      <Route element={<LearningProfileGuard />}>
        <Route element={<FirstStepsGuard />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
        <Route path="/avaliacao-perfil" element={<p>avaliacao</p>} />
      </Route>
    </Routes>
  );
}

describe("FLUXO A — login → user → profile → onboarding → trilha → dashboard", () => {
  it("BUG: o dashboard mostra o nome, o nível e o progresso lidos do Supabase", async () => {
    const trail = getTrailById("html");
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        name: "Maria Silva",
        email: EMAIL,
        username: "mariasilva",
        xp: 480,
        level: 4,
        current_course: trail.id,
        first_steps_done: true,
        completed_lessons: ["html-vid-intro-1"],
      }),
    );
    seedCompletedOnboarding(AUTH_UID);

    render(<Tree>{dashboardRoutes()}</Tree>);
    await signIn();

    // Nome correcto (não "Aluno", não vazio)
    await waitFor(() => expect(screen.getByText("Olá, Maria Silva!")).toBeTruthy());

    // Não foi redireccionado para o onboarding (já estava concluído)
    expect(screen.getByTestId("path").textContent).toBe("/");

    // Progresso lido do Supabase
    expect(screen.getByText("480 XP")).toBeTruthy();
    expect(
      screen.getByText("Nível 4 · 480 XP · 0 trilha(s) concluída(s)"),
    ).toBeTruthy();
  });

  it("BUG: utilizador migrado vê o dashboard com o nome e o XP do perfil ligado", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, xp: 0, first_steps_done: true }),
      makeProfile({
        id: LEGACY_PROFILE_ID,
        auth_user_id: AUTH_UID,
        name: "Maria Silva",
        email: EMAIL,
        username: "mariasilva",
        xp: 1500,
        level: 6,
        current_course: "css",
        first_steps_done: true,
        completed_lessons: ["html-vid-intro-1", "html-vid-intro-2"],
      }),
    );
    seedCompletedOnboarding(LEGACY_PROFILE_ID);

    render(<Tree>{dashboardRoutes()}</Tree>);
    await signIn();

    await waitFor(() => expect(screen.getByText("Olá, Maria Silva!")).toBeTruthy());
    expect(screen.getByText("1500 XP")).toBeTruthy();
    expect(screen.getByTestId("path").textContent).toBe("/");
  });

  it("utilizador novo é redireccionado para a avaliação de perfil", async () => {
    // Regressão: LearningProfileGuard desestruturava `profile` do useProgress(),
    // mas o ProgressContext expõe os campos achatados (xp, completedLessons, ...)
    // e não uma chave `profile`. `isNewUser` ficava sempre false e este
    // redireccionamento nunca acontecia.
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        name: "Maria Silva",
        email: EMAIL,
        first_steps_done: true,
      }),
    );

    render(<Tree>{dashboardRoutes()}</Tree>);
    await signIn();

    // xp 0 e zero aulas concluídas = utilizador novo.
    await waitFor(() =>
      expect(screen.getByTestId("path").textContent).toBe("/avaliacao-perfil"),
    );
  });
});

describe("FLUXO B — onboarding persiste e não reaparece após logout/login", () => {
  it("BUG: após concluir o onboarding, logout + login não volta a pedi-lo", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, name: "Maria Silva", email: EMAIL }),
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const { unmount } = render(
      <Tree initialEntries={["/avaliacao-perfil"]}>
        <Routes>
          <Route element={<LearningProfileGuard />}>
            <Route path="/avaliacao-perfil" element={<AssessmentPage />} />
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Routes>
      </Tree>,
    );

    await act(async () => {
      await fake.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    });

    // ── Preenchimento do onboarding pela UI real ──
    await user.click(await screen.findByRole("button", { name: /começar avaliação/i }));

    for (const question of QUESTIONS) {
      const firstOption = question.options[0];
      const button = await screen.findByRole("button", { name: firstOption.label });
      await user.click(button);
      // AssessmentQuestionCard só avança 850ms depois (microcopy).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    // AssessmentAnalyzingScreen só avança ao fim de ~4.2s.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    // ── Persistência verificada no repositório, não no estado do React ──
    await waitFor(() =>
      expect(fake.db.learning_profiles.some((r) => r.user_id === AUTH_UID)).toBe(true),
    );
    const row = fake.db.learning_profiles.find((r) => r.user_id === AUTH_UID);
    expect(row.metadata.completed).toBe(true);
    expect(row.assessment).toMatchObject({ experience: QUESTIONS[0].options[0].value });

    vi.useRealTimers();
    unmount();
    cleanup();

    // ── logout ──
    await act(async () => {
      await fake.auth.signOut();
    });

    // ── login outra vez, com o dashboard como destino ──
    render(
      <Tree initialEntries={["/"]}>
        <Routes>
          <Route element={<LearningProfileGuard />}>
            <Route path="/avaliacao-perfil" element={<p>avaliacao</p>} />
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Routes>
      </Tree>,
    );

    await signIn();

    await waitFor(() => expect(screen.getByTestId("path").textContent).toBe("/"));
    expect(screen.getByTestId("path").textContent).not.toBe("/avaliacao-perfil");
  }, 40000);
});

describe("FLUXO C — current track → progresso → atualização → refresh", () => {
  it("BUG: o progresso gravado no Supabase é reflectido após refresh", async () => {
    const firstLesson = COMBINED_LESSONS[0];
    seedLessonsInDb();

    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        name: "Maria Silva",
        email: EMAIL,
        first_steps_done: true,
      }),
    );
    seedCompletedOnboarding(AUTH_UID);

    function ProgressProbe() {
      const { completeLesson, lastLesson, xp, isLessonCompleted } = mod.useProgress();
      return (
        <div>
          <p data-testid="xp">{xp}</p>
          <p data-testid="last-lesson">{lastLesson ? lastLesson.id : "none"}</p>
          <p data-testid="completed">{String(isLessonCompleted(firstLesson.id))}</p>
          <button type="button" onClick={() => completeLesson(firstLesson.id)}>
            concluir
          </button>
        </div>
      );
    }

    function probeRoute() {
      return (
        <Routes>
          <Route element={<LearningProfileGuard />}>
            <Route element={<FirstStepsGuard />}>
              <Route path="/t" element={<ProgressProbe />} />
            </Route>
          </Route>
        </Routes>
      );
    }

    const { unmount } = render(
      <Tree initialEntries={["/t"]}>{probeRoute()}</Tree>,
    );
    await signIn();

    await waitFor(() => expect(screen.getByTestId("xp").textContent).toBe("0"));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "concluir" }));

    await waitFor(() =>
      expect(Number(screen.getByTestId("xp").textContent)).toBeGreaterThan(0),
    );
    expect(screen.getByTestId("last-lesson").textContent).toBe(firstLesson.id);
    expect(screen.getByTestId("completed").textContent).toBe("true");

    // ── refresh: desmonta e volta a montar, tudo relido do Supabase ──
    unmount();
    cleanup();

    render(<Tree initialEntries={["/t"]}>{probeRoute()}</Tree>);

    await waitFor(() =>
      expect(Number(screen.getByTestId("xp").textContent)).toBeGreaterThan(0),
    );
    expect(screen.getByTestId("last-lesson").textContent).toBe(firstLesson.id);
    expect(screen.getByTestId("completed").textContent).toBe("true");
  }, 40000);
});
