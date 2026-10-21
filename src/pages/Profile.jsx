import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  Boxes,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Link2,
  Lock,
  MessageCircle,
  Plus,
  Rocket,
  Twitter,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { ProfileSkeleton } from "../components/ui/Skeleton.jsx";
import { AssessmentBanner } from "../components/assessment/AssessmentBanner";
import { ProfileHeatmap } from "../components/profile/ProfileHeatmap.jsx";
import { ProjectFormModal } from "./community/ProjectFormModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useProgress } from "../hooks/useProgress.js";
import { useToast } from "../contexts/ToastContext.jsx";
import {
  createProject,
  deleteProject,
  getUserProjects,
  updateProject,
} from "../services/communityService.js";
import { getMyActivityByDay } from "../services/progressService.js";
import { copyToClipboard } from "../utils/clipboard.js";
import { formatDatePtShort } from "../utils/formatDate.js";
import { toUserMessage } from "../utils/errors.js";
import { trailTechConfig } from "../data/trailTechConfig";
import { allLessons, allVideoLessons } from "../data/lessons/index.js";

const SOCIAL_ICONS = {
  github: Github,
  portfolio: Globe,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  website: Globe,
};

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "trails", label: "Trilhas" },
  { id: "projects", label: "Projetos" },
];

function trailColor(trailId) {
  const config = trailTechConfig[trailId];
  return config?.brandColor || "#10b981";
}

function currentUserAvatar(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url || "";
}

function currentUserDisplayName(user) {
  const name = user?.user_metadata?.name || "";
  if (name.trim()) return name.trim();
  if (user?.email) return user.email.split("@")[0];
  return "Aluno";
}

export default function Profile() {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { user: authUser, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const {
    name,
    username,
    photoURL,
    bio,
    githubUrl,
    portfolioUrl,
    linkedinUrl,
    twitterUrl,
    instagramUrl,
    websiteUrl,
    xp,
    level,
    streak,
    createdAt,
    progressPercent,
    completedCount,
    totalLessons,
    studyHours,
    journeyProgress,
    getCourseProgress,
    getTrailStatus,
    trails: allTrails,
    isLessonCompleted,
    loading,
    firstStepsDone,
  } = useProgress();

  const [activeTab, setActiveTab] = useState("overview");
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [projectsError, setProjectsError] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;
    async function loadProjects() {
      setProjectsLoading(true);
      setProjectsError("");
      try {
        if (!authUser?.id) {
          throw new Error("Não foi possível identificar o teu perfil.");
        }
        const list = await getUserProjects(authUser.id);
        if (active) setProjects(list || []);
      } catch {
        if (active) {
          setProjects([]);
          setProjectsError(
            authUser?.id
              ? "Não foi possível carregar os teus projetos."
              : "Não foi possível identificar o teu perfil.",
          );
        }
      } finally {
        if (active) setProjectsLoading(false);
      }
    }
    loadProjects();
    return () => {
      active = false;
    };
  }, [authUser?.id, authLoading]);

  useEffect(() => {
    let active = true;
    async function loadActivity() {
      setActivityLoading(true);
      try {
        const act = await getMyActivityByDay({ days: 365 });
        if (active) setActivity(act || []);
      } catch {
        if (active) setActivity([]);
      } finally {
        if (active) setActivityLoading(false);
      }
    }
    loadActivity();
    return () => {
      active = false;
    };
  }, []);

  const orderedTrails = useMemo(
    () => (allTrails || []).sort((a, b) => a.order - b.order),
    [allTrails],
  );

  const displayTrails = orderedTrails.filter((t) => t.status !== "soon");

  const trailStats = useMemo(() => {
    const map = {};
    for (const trail of displayTrails) {
      const lessons = [...allLessons, ...allVideoLessons].filter(
        (l) => l.courseId === trail.id,
      );
      const completed = lessons.filter((l) => isLessonCompleted(l.id)).length;
      map[trail.id] = {
        completed,
        total: lessons.length,
        progress: getCourseProgress(trail.id),
        status: getTrailStatus(trail.id),
      };
    }
    return map;
  }, [displayTrails, isLessonCompleted, getCourseProgress, getTrailStatus]);

  const inProgressTrails = displayTrails.filter((trail) =>
    ["in_progress", "available"].includes(trailStats[trail.id]?.status),
  );

  const firstIncompleteLesson = useMemo(() => {
    const combined = [...allLessons, ...allVideoLessons].sort((a, b) => {
      const trailOrderA = orderedTrails.findIndex((t) => t.id === a.courseId);
      const trailOrderB = orderedTrails.findIndex((t) => t.id === b.courseId);
      if (trailOrderA !== trailOrderB) return trailOrderA - trailOrderB;
      return a.order - b.order;
    });
    return combined.find((l) => !isLessonCompleted(l.id));
  }, [orderedTrails, isLessonCompleted]);

  const recentActivity = useMemo(() => {
    const sorted = [...(activity || [])].sort((a, b) =>
      a.day < b.day ? 1 : a.day > b.day ? -1 : 0,
    );
    return sorted.slice(0, 5);
  }, [activity]);

  const handleCopy = async () => {
    if (!publicProfileUrl) return;
    await copyToClipboard(publicProfileUrl);
    showSuccess("Link do perfil copiado!");
  };

  const openCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (!formSubmitting) {
      setFormOpen(false);
      setEditingProject(null);
    }
  };

  const handleSaveForm = async (payload, original) => {
    setFormSubmitting(true);
    try {
      if (original) {
        const updated = await updateProject(original.id, original, payload);
        setProjects((current) =>
          current.map((p) => (p.id === updated.id ? updated : p)),
        );
        showSuccess("Projeto atualizado!");
      } else {
        const created = await createProject(authUser.id, payload);
        setProjects((current) => [created, ...current]);
        showSuccess("Projeto publicado no feed!");
      }
      setFormOpen(false);
      setEditingProject(null);
    } catch (err) {
      showError(toUserMessage(err, "Não foi possível guardar o projeto."));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.id, pendingDelete.imagePaths || []);
      setProjects((current) => current.filter((p) => p.id !== pendingDelete.id));
      showSuccess("Projeto excluído.");
      setPendingDelete(null);
    } catch (err) {
      showError(toUserMessage(err, "Não foi possível excluir o projeto."));
    } finally {
      setDeleting(false);
    }
  };

  const links = [
    { key: "github", url: githubUrl, label: "GitHub" },
    { key: "portfolio", url: portfolioUrl, label: "Portfólio" },
    { key: "linkedin", url: linkedinUrl, label: "LinkedIn" },
    { key: "twitter", url: twitterUrl, label: "Twitter" },
    { key: "instagram", url: instagramUrl, label: "Instagram" },
    { key: "website", url: websiteUrl, label: "Website" },
  ].filter((l) => l.url && /^https?:\/\//i.test(l.url));

  const publicProfileUrl = username ? `${window.location.origin}/u/${username}` : null;
  const displayName =
    name && name.trim() && name !== "Aluno WebStart" ? name : username || "Aluno";
  const totalTrails = journeyProgress?.totalCount || 0;
  const completedTrails = journeyProgress?.completedCount || 0;

  const modalAuthor = {
    name: currentUserDisplayName(authUser),
    photoURL: currentUserAvatar(authUser),
    photo_url: currentUserAvatar(authUser),
  };

  if (loading || projectsLoading || activityLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Header title="Perfil" subtitle="Carregando perfil..." />
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Meu Perfil · WebStart Academy"
        description="O teu perfil, progresso e projetos na WebStart Academy."
        url="/perfil"
      />

      <div className="mx-auto w-full max-w-[1120px]">
        <div className="flex flex-wrap items-center gap-1 border-b border-border pt-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === "trails"
                ? totalTrails
                : tab.id === "projects"
                  ? projects.length
                  : null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-sm font-bold transition-colors ${
                  isActive ? "text-primary" : "text-secondary hover:text-primary"
                }`}
              >
                {tab.label}
                {count !== null && (
                  <span className="rounded-full bg-surface-hover px-2 text-xs font-bold text-secondary">
                    {count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-accent" />
                )}
              </button>
            );
          })}
          {username && (
            <Link
              to={`/u/${username}`}
              className="ml-auto flex shrink-0 items-center gap-2 self-center rounded-full border-2 border-strong px-3 py-1 text-xs font-bold text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <Globe size={14} /> Ver como visitante
            </Link>
          )}
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[272px_1fr]">
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="h-32 w-32 rounded-full border-3 border-brand-800 object-cover shadow-brutal lg:h-auto lg:w-full lg:max-w-[272px] lg:aspect-square"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-3 border-brand-800 bg-accent-soft text-5xl font-black text-accent shadow-brutal lg:h-auto lg:w-full lg:max-w-[272px] lg:aspect-square lg:text-8xl">
                {(displayName || "A").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-black leading-tight text-primary">
                {displayName}
              </h1>
              {username && (
                <p className="break-words font-bold text-accent">@{username}</p>
              )}
            </div>

            {bio && (
              <p className="whitespace-pre-wrap break-words text-sm text-secondary">{bio}</p>
            )}

            <button
              type="button"
              onClick={() => navigate("/editar-perfil")}
              className="w-full rounded-xl border-2 border-strong bg-surface px-3 py-2 text-sm font-black text-primary shadow-brutal transition-colors hover:border-accent"
            >
              Editar perfil
            </button>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
              <span>
                <b className="font-black text-primary">Nível {level}</b>
              </span>
              <span>
                <b className="font-black text-accent">{xp}</b> XP
              </span>
              <span>
                <b className="font-black text-yellow-600 dark:text-yellow-400">
                  {streak}
                </b>{" "}
                dia{streak === 1 ? "" : "s"} seguido{streak === 1 ? "" : "s"}
              </span>
            </div>

            {links.length > 0 && (
              <div className="grid gap-2 text-sm text-secondary">
                {links.map((l) => {
                  const Icon = SOCIAL_ICONS[l.key] || Globe;
                  return (
                    <a
                      key={l.key}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-accent"
                    >
                      <Icon size={16} /> {l.label}
                    </a>
                  );
                })}
              </div>
            )}

            {createdAt && (
              <p className="text-xs text-secondary">
                Membro desde{" "}
                {new Date(createdAt).toLocaleDateString("pt-PT")}
              </p>
            )}

            {publicProfileUrl && (
              <div className="border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                  Perfil público
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary">
                    <Lock size={12} /> só tu vês isto
                  </span>
                </h3>
                <div className="mt-2 flex items-center gap-2 rounded-lg border-2 border-strong px-2.5 py-1.5 text-xs text-secondary">
                  <span className="min-w-0 flex-1 truncate">
                    {publicProfileUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded p-1 hover:bg-surface-hover"
                    aria-label="Copiar link"
                  >
                    <Link2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </aside>

          <main className="min-w-0">
            {!outletContext.assessmentLoading &&
              outletContext.assessmentCompleted === false && (
                <div className="mb-6">
                  <AssessmentBanner />
                </div>
              )}

            {firstStepsDone === false && (
              <div className="mb-6 rounded-xl border-2 border-brand-400 bg-brand-50 p-4 dark:bg-brand-900/30">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                    <Rocket size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-primary">
                      Continua o teu registo!
                    </p>
                    <p className="text-sm text-secondary">
                      Começa a tua primeira aula para desbloquear todo o conteúdo.
                    </p>
                  </div>
                  <Link to="/primeiros-passos">
                    <Button>Começar agora</Button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "overview" && (
              <>
                <section className="mb-7">
                  <div className="overflow-hidden rounded-2xl border-2 border-strong bg-surface shadow-brutal">
                    <div className="grid grid-cols-2 lg:grid-cols-4">
                      <div className="border-b border-r border-border p-4 lg:border-b-0">
                        <small className="block text-xs font-semibold text-secondary">
                          Progresso geral
                        </small>
                        <b className="text-2xl font-black text-primary">
                          {progressPercent}%
                        </b>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
                        <small className="block text-xs font-semibold text-secondary">
                          Aulas concluídas
                        </small>
                        <b className="text-2xl font-black text-primary">
                          {completedCount}
                          <span className="text-sm font-semibold text-secondary">
                            /{totalLessons}
                          </span>
                        </b>
                      </div>
                      <div className="border-r border-border p-4">
                        <small className="block text-xs font-semibold text-secondary">
                          Horas estudadas
                        </small>
                        <b className="text-2xl font-black text-primary">
                          {studyHours}h
                        </b>
                      </div>
                      <div className="p-4">
                        <small className="block text-xs font-semibold text-secondary">
                          Trilhas concluídas
                        </small>
                        <b className="text-2xl font-black text-primary">
                          {completedTrails}
                          <span className="text-sm font-semibold text-secondary">
                            /{totalTrails}
                          </span>
                        </b>
                      </div>
                    </div>
                  </div>

                  {firstIncompleteLesson && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-strong bg-surface p-4 shadow-brutal">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 font-black text-white">
                        <Code2 size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <small className="block text-xs font-semibold text-secondary">
                          Continuar a aprender · só tu vês isto
                        </small>
                        <b className="break-words font-bold text-primary">
                          {firstIncompleteLesson.title}
                        </b>
                      </div>
                      <Link
                        to={
                          firstIncompleteLesson.type === "videoLesson"
                            ? `/video-aula/${firstIncompleteLesson.id}`
                            : `/aula/${firstIncompleteLesson.id}`
                        }
                        className="rounded-full bg-accent px-5 py-2 text-sm font-black text-white shadow-brutal transition-colors hover:brightness-110"
                      >
                        Continuar
                      </Link>
                    </div>
                  )}
                </section>

                <section className="mb-7">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <h2 className="text-base font-bold text-primary">
                      Trilhas em andamento
                    </h2>
                    <Link
                      to="/trilhas"
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Ver todas as {totalTrails}
                    </Link>
                  </div>
                  {inProgressTrails.length === 0 ? (
                    <p className="rounded-xl border-2 border bg-surface p-4 text-sm text-secondary">
                      Ainda não iniciaste nenhuma trilha.{" "}
                      <Link to="/trilhas" className="font-bold text-accent">
                        Explorar trilhas
                      </Link>
                    </p>
                  ) : (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {inProgressTrails.map((trail) => {
                        const stats = trailStats[trail.id];
                        return (
                          <Link
                            key={trail.id}
                            to={`/trilhas/${trail.id}`}
                            className="block min-w-0 rounded-xl border-2 border-strong bg-surface p-4 transition-colors hover:border-accent"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="h-3 w-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: trailColor(trail.id) }}
                              />
                              <span className="truncate font-bold text-accent">
                                {trail.title}
                              </span>
                              <span className="ml-auto shrink-0 rounded-full border-2 border-strong px-2 text-[11px] font-bold text-secondary">
                                {stats.status === "in_progress"
                                  ? "Em andamento"
                                  : "Disponível"}
                              </span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-hover">
                              <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{ width: `${stats.progress}%` }}
                              />
                            </div>
                            <div className="mt-2 text-sm text-secondary">
                              {stats.progress}% · {stats.completed} de{" "}
                              {stats.total} aulas
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="mb-7">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <h2 className="text-base font-bold text-primary">Projetos</h2>
                    <button
                      type="button"
                      onClick={openCreate}
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Publicar projeto
                    </button>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="min-w-0 rounded-xl border-2 border-strong bg-surface p-4"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="truncate font-bold text-accent">
                            {project.title}
                          </span>
                          <span className="ml-auto shrink-0 rounded-full border-2 border-strong px-2 text-[11px] font-bold text-secondary">
                            {formatDatePtShort(project.createdAt)}
                          </span>
                        </div>
                        <p className="my-2 line-clamp-2 break-words text-sm text-secondary">
                          {project.description}
                        </p>
                        {(project.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {project.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-sm font-semibold text-accent"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center gap-3.5 text-sm text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Heart size={14} /> {project.likeCount ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle size={14} />{" "}
                            {project.commentCount ?? 0}
                          </span>
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir projeto ${project.title}`}
                              className="ml-auto rounded p-1 hover:text-accent"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir GitHub de ${project.title}`}
                              className="rounded p-1 hover:text-accent"
                            >
                              <Github size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={openCreate}
                      className="grid min-h-[140px] place-items-center rounded-xl border-2 border-dashed border-strong bg-surface p-4 text-center text-secondary transition-colors hover:border-accent hover:text-accent"
                    >
                      <span>
                        <Plus size={20} className="mx-auto mb-1" />
                        Publicar um projeto
                        <br />
                        <small className="text-[11px]">
                          Aparece no feed e no teu perfil
                        </small>
                      </span>
                    </button>
                  </div>
                  {projectsError && (
                    <p
                      role="alert"
                      className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400"
                    >
                      {projectsError}
                    </p>
                  )}
                </section>

                <section className="mb-7">
                  <div className="rounded-2xl border-2 border-strong bg-surface p-4 shadow-brutal">
                    <ProfileHeatmap data={activity} />
                  </div>
                </section>

                <section className="mb-4">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <h2 className="text-base font-bold text-primary">
                      Atividade recente
                    </h2>
                  </div>
                  <div className="rounded-2xl border-2 border-strong bg-surface px-4 py-1.5 shadow-brutal">
                    {recentActivity.length === 0 ? (
                      <p className="py-4 text-center text-sm text-secondary">
                        Sem atividade registada ainda. Conclui uma aula para
                        começar a tua jornada!
                      </p>
                    ) : (
                      recentActivity.map((entry, index) => (
                        <div
                          key={entry.day}
                          className={`flex items-center gap-3.5 py-3.5 ${
                            index < recentActivity.length - 1
                              ? "border-b border-border"
                              : ""
                          }`}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                            <CheckCircle2 size={16} />
                          </div>
                          <p className="flex-1 text-sm text-primary">
                            Concluiu {entry.count}{" "}
                            {entry.count === 1 ? "aula" : "aulas"}
                            <small className="block text-xs text-secondary">
                              {new Date(entry.day).toLocaleDateString("pt-PT", {
                                day: "numeric",
                                month: "short",
                              })}
                            </small>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}

            {activeTab === "trails" && (
              <section>
                <h2 className="mb-3 text-base font-bold text-primary">
                  Todas as trilhas · {totalTrails}
                </h2>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {displayTrails.map((trail) => {
                    const stats = trailStats[trail.id];
                    return (
                      <Link
                        key={trail.id}
                        to={`/trilhas/${trail.id}`}
                        className="block min-w-0 rounded-xl border-2 border-strong bg-surface p-4 transition-colors hover:border-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{ backgroundColor: trailColor(trail.id) }}
                          />
                          <span className="truncate font-bold text-accent">
                            {trail.title}
                          </span>
                          <span className="ml-auto shrink-0 rounded-full border-2 border-strong px-2 text-[11px] font-bold text-secondary">
                            {stats.status === "completed"
                              ? "Concluída"
                              : stats.status === "in_progress"
                                ? "Em andamento"
                                : "Disponível"}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>
                        <div className="mt-2 text-sm text-secondary">
                          {stats.progress}% · {stats.completed} de {stats.total}{" "}
                          aulas
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "projects" && (
              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-base font-bold text-primary">
                    Os teus projetos · {projects.length}
                  </h2>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    Publicar projeto
                  </button>
                </div>

                {projectsError ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600 dark:text-red-400"
                  >
                    {projectsError}
                  </p>
                ) : projects.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-strong bg-surface p-8 text-center">
                    <Boxes size={40} className="mx-auto mb-3 text-secondary" />
                    <p className="mb-4 text-sm text-secondary">
                      Ainda não publicaste nenhum projeto.
                    </p>
                    <Button onClick={openCreate}>
                      <Plus size={18} /> Publicar o primeiro projeto
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="min-w-0 rounded-xl border-2 border-strong bg-surface p-4"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="truncate font-bold text-accent">
                            {project.title}
                          </span>
                          <span className="ml-auto shrink-0 rounded-full border-2 border-strong px-2 text-[11px] font-bold text-secondary">
                            {formatDatePtShort(project.createdAt)}
                          </span>
                        </div>
                        <p className="my-2 break-words text-sm text-secondary">
                          {project.description}
                        </p>
                        {(project.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-sm font-semibold text-accent"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center gap-3.5 text-sm text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Heart size={14} /> {project.likeCount ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle size={14} />{" "}
                            {project.commentCount ?? 0}
                          </span>
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto rounded p-1 hover:text-accent"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 hover:text-accent"
                            >
                              <Github size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(project)}
                            className="text-xs font-bold text-secondary hover:text-accent"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(project)}
                            className="text-xs font-bold text-secondary hover:text-red-500"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      <ProjectFormModal
        open={formOpen}
        project={editingProject}
        author={modalAuthor}
        submitting={formSubmitting}
        onClose={closeForm}
        onSave={handleSaveForm}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir projeto"
        message={
          pendingDelete
            ? `Tens a certeza que queres excluir "${pendingDelete.title}"? Os comentários, likes e imagens associados também serão removidos. Esta ação não pode ser revertida.`
            : ""
        }
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </>
  );
}
