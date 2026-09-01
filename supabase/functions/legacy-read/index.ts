// ═══════════════════════════════════════════════════════════════
// legacy-read — leitor servidor do histórico legado (Firebase Firestore).
//
// Porquê: o runtime é 100% Supabase, mas `firebase/firestore.rules` exige
// `request.auth` (Firebase Auth) para ler `users/{userId}`. Sem sessão do
// Firebase já não há como ler esse bucket no browser. Esta Edge Function
// usa firebase-admin (bypassa as rules) e devolve APENAS o histórico de
// aulas/quizzes/cursos do próprio usuário autenticado (Supabase JWT).
//
// Identity: resolve pelo `profiles.legacy_firebase_uid` do auth.uid()
// (chave de join autoritativa; nunca por email).
//
// Deploy:
//   supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat firebase/serviceAccountKey.json)"
//   supabase functions deploy legacy-read --no-verify-jwt
// Client: setLegacyReader(fetchServerReader('VITE_LEGACY_READ_URL fn URL')).
// ═══════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initializeApp, getApps, cert } from "npm:firebase-admin@12/app";
import { getFirestore } from "npm:firebase-admin@12/firestore";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

function ensureFirebase() {
  if (getApps().length > 0) return getFirestore();
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (raw) {
    initializeApp({ credential: cert(JSON.parse(raw)), projectId: JSON.parse(raw).project_id });
  } else {
    initializeApp();
  }
  return getFirestore();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return json({ error: "method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return json({ error: "unauthorized" }, 401);
  const authUid = data.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("legacy_firebase_uid")
    .eq("id", authUid)
    .maybeSingle();

  const legacyUid = profile?.legacy_firebase_uid || null;
  if (!legacyUid) return json({ legacyUid: null, completions: null });

  const firestore = ensureFirebase();
  const snap = await firestore.collection("users").doc(legacyUid).get();
  if (!snap.exists) return json({ legacyUid, completions: null });

  const d = snap.data() || {};
  const pick = (k) => (Array.isArray(d[k]) ? d[k] : []);

  return json({
    legacyUid,
    completions: {
      completedLessons: pick("completedLessons"),
      completedCourses: pick("completedCourses"),
      completedQuizzes: pick("completedQuizzes"),
      xp: typeof d.xp === "number" ? d.xp : null,
      streak: typeof d.streak === "number" ? d.streak : null,
      totalStudyTime: typeof d.totalStudyTime === "number" ? d.totalStudyTime : null,
    },
  });
});