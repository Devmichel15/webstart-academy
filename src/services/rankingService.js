import { supabase } from "../lib/supabase.js";

export async function getWeeklyRanking() {
  const { data, error } = await supabase.rpc("get_weekly_ranking", {
    p_limit: 10,
  });
  if (error) throw error;
  return data || [];
}
