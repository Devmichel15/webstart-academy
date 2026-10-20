/**
 * Trilha React — 23503 lesson_progress_lesson_id_fkey.
 *
 * Cenário real: a aula existe no catálogo estático do front (react-vid-*)
 * mas falta na tabela `lessons` da BD (seed 020 nunca executada). O upsert
 * em `lesson_progress` falha com a FK e o utilizador não deve ficar bloqueado
 * — a navegação para a próxima aula tem de continuar.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { mockSupabase, loadAppModules } from "./harness.js";
import { makeProfile, makeAuthUser } from "./fakeSupabase.js";

vi.setConfig({ testTimeout: 20_000 });

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const REACT_LESSON_ID = "react-vid-1";

let fake;
let mod;
let AuthProvider;
let ProgressProvider;
let ThemeProvider;
let ToastProvider;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase({
    authUsers: [makeAuthUser({ id: AUTH_UID, email: "maria@webstart.ao", name: "Maria Silva" })],
  });
  fake.db.profiles.push(
    makeProfile({ id: AUTH_UID, auth_user_id: AUTH_UID, name: "Maria Silva", email: "maria@webstart.ao" }),
  );
  mod = await loadAppModules();
  ({ AuthProvider, ProgressProvider } = mod);
  ThemeProvider = (await import("../context/ThemeContext.jsx")).ThemeProvider;
  ToastProvider = (await import("../contexts/ToastContext.jsx")).ToastProvider;
});

afterEach(() => {
  cleanup();
});

function Probe({ onResult }) {
  const { completeLesson } = mod.useProgress();
  return (
    <button
      type="button"
      onClick={async () => {
        const result = await completeLesson(REACT_LESSON_ID);
        onResult(result);
      }}
    >
      concluir react
    </button>
  );
}

function renderProbe(onResult) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProgressProvider>
              <Probe onResult={onResult} />
            </ProgressProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

async function signIn() {
  await act(async () => {
    await fake.auth.signInWithPassword({ email: "maria@webstart.ao", password: "senha123" });
  });
}

describe("React — aula ausente na tabela lessons (FK 23503)", () => {
  it("o serviço propaga 23503 com a constraint lesson_progress_lesson_id_fkey", async () => {
    fake.setSession({ id: AUTH_UID });
    // NÃO se faz seed de fake.db.lessons — simula a migration 020 por executar.

    await expect(mod.progressService.completeLesson(AUTH_UID, REACT_LESSON_ID)).rejects.toMatchObject({
      code: "23503",
    });

    const error = await mod.progressService
      .completeLesson(AUTH_UID, REACT_LESSON_ID)
      .catch((err) => err);
    expect(error.message).toMatch(/lesson_progress_lesson_id_fkey/);
    expect(fake.db.lesson_progress).toEqual([]);
  });

  it("o contexto devolve resultado truthy (progressSaved: false) e não bloqueia a navegação", async () => {
    const onResult = vi.fn();
    renderProbe(onResult);
    await signIn();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /concluir react/i }));

    await waitFor(() => expect(onResult).toHaveBeenCalled());
    const result = onResult.mock.calls[0][0];
    expect(result).not.toBeNull();
    expect(result.progressSaved).toBe(false);
    // Nada de XP/perfil gravado sem o registo em lesson_progress.
    expect(fake.db.lesson_progress).toEqual([]);
    expect(fake.profileById(AUTH_UID).xp).toBe(0);
  });

  it("quando a seed existir, o mesmo fluxo grava o progresso e dá XP", async () => {
    fake.db.lessons.push({ id: REACT_LESSON_ID, course_id: "react", module_id: "react-mod-fundamentos" });
    fake.setSession({ id: AUTH_UID });

    const result = await mod.progressService.completeLesson(AUTH_UID, REACT_LESSON_ID);

    expect(result.alreadyCompleted).toBe(false);
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(
      fake.db.lesson_progress.find((row) => row.lesson_id === REACT_LESSON_ID),
    ).toMatchObject({ completed: true });
  });
});
