// ARCHIVE: userService.js
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { withRetry } from "../utils/retry.js";
import { getLevelFromXp } from "../utils/xp.js";
import { computeStreakUpdate, getTodayKey } from "../utils/streak.js";
import { generateUniqueUsername } from "../utils/username.js";

function buildDefaultUser(user, extra = {}) {
  const cleanExtra = Object.fromEntries(
    Object.entries(extra).filter(([, value]) => value !== undefined && value !== null),
  );

  const name = cleanExtra.name || user.displayName || "Aluno WebStart";

  return {
    uid: user.uid,
    name,
    username: cleanExtra.username || generateUniqueUsername(name, user.uid),
    email: user.email || "",
    provider: cleanExtra.provider || "email",
    role: "student",
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: null,
    completedLessons: [],
    completedCourses: [],
    completedExercises: 0,
    completedProjects: 0,
    currentCourse: null,
    currentLesson: null,
    totalStudyTime: 0,
    certificates: [],
    isPremium: false,
    purchasedCourses: [],
    isPublic: true,
    ...cleanExtra,
  };
}

export async function createUserProfile(user, extra = {}) {
  return withRetry(async () => {
    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      await updateLastLogin(user.uid);
      return existing.data();
    }
    const profile = buildDefaultUser(user, extra);
    await setDoc(userRef, profile);
    return profile;
  });
}

export async function getUserProfile(uid) {
  return withRetry(async () => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
}

export function subscribeToUser(uid, callback, onError) {
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    onError,
  );
}

export async function updateLastLogin(uid) {
  await updateDoc(doc(db, "users", uid), {
    lastLogin: serverTimestamp(),
  });
}

export async function updateUserProfile(uid, data) {
  return withRetry(async () => {
    await updateDoc(doc(db, "users", uid), data);
  });
}

export async function addXpToUser(uid, amount) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const xp = (user.xp || 0) + amount;
  const level = getLevelFromXp(xp);
  await updateUserProfile(uid, { xp, level });
  return { xp, level };
}

export async function updateUserStreak(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const today = getTodayKey();
  const { streak, broke, bonusXp, penaltyXp } = computeStreakUpdate(
    user.lastStudyDate,
    user.streak,
  );

  let xp = user.xp || 0;
  if (broke && penaltyXp) {
    xp = Math.max(0, xp - penaltyXp);
  }
  if (bonusXp) {
    xp += bonusXp;
  }

  const level = getLevelFromXp(xp);
  await updateUserProfile(uid, {
    streak,
    lastStudyDate: today,
    xp,
    level,
  });

  return { streak, broke, bonusXp, penaltyXp, xp, level };
}

export async function incrementCompletedExercises(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const count = (user.completedExercises || 0) + 1;
  await updateUserProfile(uid, { completedExercises: count });
  return count;
}

export async function incrementCompletedProjects(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const count = (user.completedProjects || 0) + 1;
  await updateUserProfile(uid, { completedProjects: count });
  return count;
}

export async function updateCurrentLesson(uid, { courseId, lessonId }) {
  await updateUserProfile(uid, {
    currentCourse: courseId,
    currentLesson: lessonId,
  });
}

export async function addCompletedLesson(uid, lessonId) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const completedLessons = user.completedLessons || [];
  if (completedLessons.includes(lessonId)) return user;
  await updateUserProfile(uid, {
    completedLessons: [...completedLessons, lessonId],
  });
  return [...completedLessons, lessonId];
}

export async function addCompletedCourse(uid, courseId, courseName) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const completedCourses = user.completedCourses || [];
  if (completedCourses.includes(courseId)) return user;

  const certificates = user.certificates || [];
  const certificate = {
    courseId,
    courseName,
    issuedAt: serverTimestamp(), // ← Alterado conforme solicitado
    certificateUrl: "",
  };

  await updateUserProfile(uid, {
    completedCourses: [...completedCourses, courseId],
    certificates: [...certificates, certificate],
  });
}

export async function addStudyTime(uid, minutes) {
  const user = await getUserProfile(uid);
  if (!user) return;
  await updateUserProfile(uid, {
    totalStudyTime: (user.totalStudyTime || 0) + minutes,
  });
}

export async function ensureUsername(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  if (user.username) return user.username;
  const username = generateUniqueUsername(user.name, uid);
  await updateUserProfile(uid, {
    username,
    isPublic: user.isPublic !== false,
    completedExercises: user.completedExercises || 0,
    completedProjects: user.completedProjects || 0,
  });
  return username;
}
