import { supabase } from "../lib/supabase.js";

export async function getTop10Users() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, username, photo_url, xp, level")
    .eq("is_public", true)
    .order("xp", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function getWeeklyRanking() {
  const { data, error } = await supabase.rpc("get_weekly_ranking", {
    p_limit: 10,
  });
  if (error) throw error;
  return data || [];
}
