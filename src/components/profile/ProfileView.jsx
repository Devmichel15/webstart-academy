import { Link } from "react-router-dom";
import {
  ExternalLink,
  Github,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  MessageCircle,
  Rocket,
  Twitter,
  Copy,
} from "lucide-react";
import { ActivityHeatmap } from "./ActivityHeatmap.jsx";
import { copyToClipboard } from "../../utils/clipboard.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { formatDatePt as formatPostDate } from "../../utils/formatDate.js";

const SOCIAL_ICONS = {
  github: Github,
  portfolio: Globe,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  website: Globe,
};

export function ProfileView({
  profile,
  activity = [],
  projects = [],
  projectsError = "",
  isOwner = false,
  onEdit,
  publicProfileUrl,
}) {
  const { showSuccess } = useToast();

  const name = profile?.name && profile.name.trim() && profile.name !== "Aluno WebStart" ? profile.name : profile?.username || "Aluno";
  const username = profile?.username;
  const photoURL = profile?.photoURL || profile?.photo_url;
  const bio = profile?.bio;
  const createdAt = profile?.createdAt || profile?.created_at;
  const level = profile?.level ?? 0;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const completedLessonsCount = profile?.completedLessonsCount ?? 0;

  const links = [
    { key: "github", url: profile?.githubUrl || profile?.github_url, label: "GitHub" },
    { key: "portfolio", url: profile?.portfolioUrl || profile?.portfolio_url, label: "Portfólio" },
    { key: "linkedin", url: profile?.linkedinUrl || profile?.linkedin_url, label: "LinkedIn" },
    { key: "twitter", url: profile?.twitterUrl || profile?.twitter_url, label: "Twitter" },
    { key: "instagram", url: profile?.instagramUrl || profile?.instagram_url, label: "Instagram" },
    { key: "website", url: profile?.websiteUrl || profile?.website_url, label: "Website" },
  ].filter((l) => l.url && /^https?:\/\//i.test(l.url));

  const handleCopy = async () => {
    if (!publicProfileUrl) return;
    await copyToClipboard(publicProfileUrl);
    showSuccess("Link do perfil copiado!");
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="space-y-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-800 bg-brand-500 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#064e3b] transition hover:bg-brand-600 dark:border-brand-400"
            >
              Editar perfil
            </button>
          )}
          {publicProfileUrl && (
            <div className="rounded-xl border-2 border-strong bg-surface p-4">
              <h3 className="mb-1 text-sm font-black">O teu perfil público</h3>
              <p className="mb-2 text-xs text-secondary">Partilha este link com outras pessoas.</p>
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border-2 border bg-surface-hover p-2 text-xs font-semibold">
                <span className="flex-1 truncate">{publicProfileUrl.replace(/^https?:\/\//, "")}</span>
                <button type="button" onClick={handleCopy} className="rounded-lg p-1.5 hover:bg-surface">
                  <Copy size={14} />
                </button>
                <Link to={`/u/${username}`} className="rounded-lg p-1.5 hover:bg-surface">
                  <ExternalLink size={14} />
                </Link>
              </div>
              {profile?.is_public === false && (
                <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                  O teu perfil está privado e só tu o vês.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border-2 border-strong bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {photoURL ? (
            <img src={photoURL} alt={name} className="h-24 w-24 rounded-full border-3 border-brand-800 object-cover dark:border-brand-400" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-3 border-brand-800 bg-brand-500 text-3xl font-black text-white dark:border-brand-400">
              {(name || username || "A").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black text-primary">{name}</h1>
            {username && <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">@{username}</p>}
            {bio && <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">{bio}</p>}
            {createdAt && (
              <p className="mt-2 text-xs text-secondary">
                Membro desde {new Date(createdAt).toLocaleDateString("pt-PT")}
              </p>
            )}
            {links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {links.map((l) => {
                  const Icon = SOCIAL_ICONS[l.key] || Globe;
                  return (
                    <a
                      key={l.key}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-strong bg-surface-hover px-2 py-1 text-xs font-bold text-primary hover:bg-surface"
                    >
                      <Icon size={14} /> {l.label}
                    </a>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold text-primary dark:bg-surface">
                Nível {level}
              </span>
              <span className="rounded-full border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold text-primary dark:bg-surface">
                {xp} XP
              </span>
              <span className="rounded-full border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold text-primary dark:bg-surface">
                {streak} dias seguidos
              </span>
              <span className="rounded-full border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold text-primary dark:bg-surface">
                {completedLessonsCount} aulas concluídas
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-strong bg-surface p-4 sm:p-6">
        <ActivityHeatmap data={activity} createdAt={createdAt} />
      </div>

      <div className="rounded-xl border-2 border-strong bg-surface p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Rocket size={20} className="text-brand-500" /> Projetos
          </h2>
          {isOwner && (
            <Link
              to="/feed"
              className="text-sm font-bold text-brand-600 hover:text-brand-500 dark:text-brand-300"
            >
              Gerir no feed →
            </Link>
          )}
        </div>

        {projectsError ? (
          <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
            {projectsError}
          </p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-secondary">
            {isOwner ? "Ainda não publicaste nenhum projeto." : "Ainda não há projetos publicados."}
          </p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-lg border-2 border-strong bg-surface-hover p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-primary">{project.title}</p>
                    <p className="text-xs text-secondary">{formatPostDate(project.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Heart size={14} /> {project.likeCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={14} /> {project.commentCount ?? 0}
                    </span>
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir projeto ${project.title}`}
                        className="rounded-lg p-1 hover:bg-surface hover:text-primary"
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
                        className="rounded-lg p-1 hover:bg-surface hover:text-primary"
                      >
                        <Github size={16} />
                      </a>
                    )}
                  </div>
                </div>
                {(project.tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border-2 border-strong bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-surface"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
