import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SEO } from "../components/seo/SEO";
import { Header } from "../components/layout/Header";
import { ProfileSkeleton } from "../components/ui/Skeleton.jsx";
import { ProfileView } from "../components/profile/ProfileView.jsx";
import {
  getPublicProfileByUsername,
  getActivityHeatmap,
  getPublicProjectsByUsername,
} from "../services/publicProfileService.js";
import { useAuth } from "../hooks/useAuth.js";

export default function PublicProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [p, a, pr] = await Promise.all([
          getPublicProfileByUsername(username),
          getActivityHeatmap(username),
          getPublicProjectsByUsername(username),
        ]);
        if (!active) return;
        if (!p) {
          setNotFound(true);
          setProfile(null);
          setActivity([]);
          setProjects([]);
        } else {
          setProfile(p);
          setActivity(a || []);
          setProjects(pr || []);
        }
      } catch {
        if (!active) return;
        setNotFound(true);
        setProfile(null);
        setActivity([]);
        setProjects([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (username) load();
    return () => {
      active = false;
    };
  }, [username]);

  const isOwner = Boolean(user && username && user.username?.toLowerCase() === username.toLowerCase());
  const displayName = profile?.name && profile.name.trim() && profile.name !== "Aluno WebStart" ? profile.name : profile?.username || username;
  const publicProfileUrl = username ? `${window.location.origin}/u/${username}` : null;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Header title="Perfil" subtitle="Carregando perfil..." />
        <ProfileSkeleton />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Header title="Perfil não encontrado" subtitle="Este perfil não está disponível." />
        <div className="rounded-xl border-2 border-strong bg-surface p-8 text-center">
          <p className="text-sm text-secondary">Perfil não encontrado</p>
          <Link to="/" className="mt-4 inline-block rounded-xl border-2 border-brand-800 bg-brand-500 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#064e3b]">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${displayName} (@${profile.username}) · WebStart Academy`}
        description={profile.bio || `Perfil público de ${displayName} na WebStart Academy.`}
        url={`/u/${profile.username}`}
      />
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Header title="Perfil" subtitle="Perfil público" />
        <ProfileView
          profile={profile}
          activity={activity}
          projects={projects}
          isOwner={isOwner}
          onEdit={isOwner ? () => (window.location.href = "/perfil/editar") : undefined}
          publicProfileUrl={publicProfileUrl}
        />
      </div>
    </>
  );
}
