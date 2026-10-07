import { supabase } from "../lib/supabase.js";

function normalizeUsername(username) {
  return String(username || "").trim();
}

function mapPublicProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    photoURL: row.photo_url,
    bio: row.bio,
    githubUrl: row.github_url,
    portfolioUrl: row.portfolio_url,
    linkedinUrl: row.linkedin_url,
    twitterUrl: row.twitter_url,
    instagramUrl: row.instagram_url,
    websiteUrl: row.website_url,
    xp: row.xp,
    level: row.level,
    streak: row.streak,
    createdAt: row.created_at,
    completedLessonsCount: row.completed_lessons_count ?? 0,
  };
}

function mapActivityDay(row) {
  if (!row) return null;
  return {
    day: row.day,
    count: row.count ?? 0,
  };
}

function mapProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags || [],
    projectUrl: row.project_url,
    githubUrl: row.github_url,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    createdAt: row.created_at,
  };
}

export async function getPublicProfileByUsername(username) {
  const uname = normalizeUsername(username);
  if (!uname) return null;

  const { data, error } = await supabase.rpc("get_public_profile_by_username", {
    p_username: uname,
  });

  if (error) throw error;

  if (!data || data.length === 0) return null;
  return mapPublicProfile(data[0]);
}

export async function getActivityHeatmap(username) {
  const uname = normalizeUsername(username);
  if (!uname) return [];

  const { data, error } = await supabase.rpc("get_profile_activity_heatmap", {
    p_username: uname,
  });

  if (error) throw error;

  if (!data || data.length === 0) return [];
  return data.map(mapActivityDay).filter(Boolean);
}

export async function getPublicProjectsByUsername(username) {
  const uname = normalizeUsername(username);
  if (!uname) return [];

  const { data, error } = await supabase.rpc("get_public_projects_by_username", {
    p_username: uname,
  });

  if (error) throw error;

  if (!data || data.length === 0) return [];
  return data.map(mapProject).filter(Boolean);
}