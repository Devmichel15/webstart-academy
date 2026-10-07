import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  getUserProjects: vi.fn(),
  getMyActivityByDay: vi.fn(),
}));

vi.mock("../hooks/useAuth.js", () => ({
  useAuth: () => ({ user: { id: "auth-user-1" }, loading: false }),
}));

vi.mock("../hooks/useProgress.js", () => ({
  useProgress: () => ({
    name: "Pessoa",
    username: "pessoa",
    createdAt: "2026-01-01T00:00:00.000Z",
    loading: false,
  }),
}));

vi.mock("../services/communityService.js", () => ({
  getUserProjects: mocks.getUserProjects,
}));

vi.mock("../services/progressService.js", () => ({
  getMyActivityByDay: mocks.getMyActivityByDay,
}));

vi.mock("../components/seo/SEO.jsx", () => ({ SEO: () => null }));
vi.mock("../components/layout/Header.jsx", () => ({
  Header: ({ title }) => <h1>{title}</h1>,
}));
vi.mock("../components/ui/Skeleton.jsx", () => ({
  ProfileSkeleton: () => <div>Loading profile</div>,
}));
vi.mock("../components/profile/ProfileView.jsx", () => ({
  ProfileView: ({ projects, projectsError }) => (
    <section>
      {projectsError && <p role="alert">{projectsError}</p>}
      {projects.map((project) => <p key={project.id}>{project.title}</p>)}
    </section>
  ),
}));

import Profile from "../pages/Profile.jsx";

describe("own profile projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserProjects.mockResolvedValue([{ id: "project-1", title: "Meu portfólio pessoal" }]);
    mocks.getMyActivityByDay.mockResolvedValue([]);
  });

  it("loads projects with the auth UID required to resolve profiles.id", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Meu portfólio pessoal")).toBeTruthy();
    await waitFor(() => expect(mocks.getUserProjects).toHaveBeenCalledWith("auth-user-1"));
  });

  it("does not show an empty-project state when the request fails", async () => {
    mocks.getUserProjects.mockRejectedValue(new Error("database unavailable"));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Não foi possível carregar os teus projetos.",
    );
    expect(screen.queryByText("Ainda não há projetos publicados.")).toBeNull();
  });
});
