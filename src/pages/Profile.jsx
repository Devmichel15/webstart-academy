import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/seo/SEO";
import { Header } from "../components/layout/Header";
import { ProfileSkeleton } from "../components/ui/Skeleton.jsx";
import { ProfileView } from "../components/profile/ProfileView.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useProgress } from "../hooks/useProgress.js";
import { getUserProjects } from "../services/communityService.js";
import { getMyActivityByDay } from "../services/progressService.js";

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
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
    completedCount,
    createdAt,
    loading,
  } = useProgress();

  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState("");
  const [activity, setActivity] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

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

  const profile = {
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
    completedLessonsCount: completedCount,
    createdAt,
    is_public: true, // don't know here; show link anyway
  };

  const publicProfileUrl = username ? `${window.location.origin}/u/${username}` : null;
  const isOwner = true;

  if (loading || projectsLoading || activityLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Header title="Perfil" subtitle="Carregando perfil..." />
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Meu Perfil · WebStart Academy`}
        description="O teu perfil na WebStart Academy."
        url="/perfil"
      />
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Header title="Perfil" subtitle="O teu perfil" />
        <ProfileView
          profile={profile}
          activity={activity}
          projects={projects}
          projectsError={projectsError}
          isOwner={isOwner}
          onEdit={() => navigate("/editar-perfil")}
          publicProfileUrl={publicProfileUrl}
        />
      </div>
    </>
  );
}
