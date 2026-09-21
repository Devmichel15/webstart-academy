import { supabase } from "../lib/supabase.js";
import { allLessons, allVideoLessons } from "../data/lessons/index.js";
import { trails as staticCourses } from "../data/trails.js";
import { getModuleData } from "../data/trails.js";
import { withRetry } from "../utils/retry.js";
import { durationToMinutes } from "../utils/duration.js";
import {
  XP_COURSE,
  XP_EXERCISE,
  XP_LESSON,
  XP_MODULE,
  XP_PROJECT,
} from "../utils/xp.js";
import {
  addCompletedCourse,
  addCompletedLesson,
  addCompletedQuiz,
  addStudyTime,
  addXpToUser,
  getUserProfile,
  incrementCompletedExercises,
  incrementCompletedProjects,
  resolveProfileId,
  updateCurrentLesson,
  updateUserStreak,
} from "./userService.js";

function mapProgressRow(row) {
  if (!row) return null;
  return {
    id: `${row.user_id}_${row.lesson_id}`,
    userId: row.user_id,
    courseId: row.course_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    completed: row.completed,
    completedAt: row.completed_at,
    progressPercentage: row.progress_percentage,
    timeSpent: row.time_spent,
  };
}

export async function getLessonProgress(userId, lessonId) {
  const profileId = await resolveProfileId(userId);
  const { data } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", profileId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  return data ? mapProgressRow(data) : null;
}

export async function getUserProgress(userId) {
  return withRetry(async () => {
    const profileId = await resolveProfileId(userId);
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", profileId);

    if (error) throw error;
    return (data || []).map(mapProgressRow);
  });
}

const activeProgressChannels = new Map();

export function subscribeToUserProgress(userId, callback, onError) {
  if (!userId) return () => {};

  let disposed = false;
  let unsubscribe = () => {
    disposed = true;
  };

  resolveProfileId(userId)
    .then((profileId) => {
      if (disposed) return;

      if (activeProgressChannels.has(userId)) {
        const entry = activeProgressChannels.get(userId);
        entry.refCount++;
        entry.callbacks.add(callback);
        unsubscribe = () => {
          entry.callbacks.delete(callback);
          entry.refCount--;
          if (entry.refCount <= 0) {
            supabase.removeChannel(entry.channel);
            activeProgressChannels.delete(userId);
          }
        };
        getUserProgress(userId).then(callback).catch(onError);
        return;
      }

      const callbacks = new Set([callback]);
      const channel = supabase
        .channel(`progress-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "lesson_progress",
            filter: `user_id=eq.${profileId}`,
          },
          async () => {
            try {
              const rows = await getUserProgress(userId);
              for (const cb of callbacks) cb(rows);
            } catch (err) {
              onError?.(err);
            }
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            getUserProgress(userId)
              .then((rows) => {
                for (const cb of callbacks) cb(rows);
              })
              .catch(onError);
          }
        });

      activeProgressChannels.set(userId, { channel, callbacks, refCount: 1 });
      unsubscribe = () => {
        const entry = activeProgressChannels.get(userId);
        if (!entry) return;
        entry.callbacks.delete(callback);
        entry.refCount--;
        if (entry.refCount <= 0) {
          supabase.removeChannel(entry.channel);
          activeProgressChannels.delete(userId);
        }
      };
    })
    .catch(onError);

  return () => unsubscribe();
}

export function isModuleComplete(completedLessons, completedQuizzes, moduleId) {
  const mod = getModuleData(moduleId);
  if (!mod) return false;

  if (!mod.lessons || mod.lessons.length === 0) {
    return !mod.quiz;
  }

  const allLessonsDone = mod.lessons.every((lessonId) =>
    completedLessons.includes(lessonId),
  );
  if (!allLessonsDone) return false;
  if (mod.quiz && !completedQuizzes.includes(moduleId)) return false;
  return true;
}

function isCourseComplete(completedLessons, completedQuizzes, courseId) {
  const course = staticCourses.find((item) => item.id === courseId);
  if (!course) return false;
  const modules = course.modules || [];
  if (modules.length === 0) {
    const allCourseLessons = allLessons.filter((l) => l.courseId === courseId);
    return allCourseLessons.every((lesson) =>
      completedLessons.includes(lesson.id),
    );
  }
  return modules.every((moduleId) =>
    isModuleComplete(completedLessons, completedQuizzes, moduleId),
  );
}

export async function visitLesson(userId, lesson) {
  await updateCurrentLesson(userId, {
    courseId: lesson.courseId,
    lessonId: lesson.id,
  });
}

export async function completeLesson(userId, lessonId) {
  return withRetry(async () => {
    const profileId = await resolveProfileId(userId);
    const allAvailable = [...allLessons, ...allVideoLessons];
    const lesson = allAvailable.find((item) => item.id === lessonId);
    if (!lesson) throw new Error("Aula não encontrada.");

    const existing = await getLessonProgress(profileId, lessonId);
    if (existing?.completed) {
      await visitLesson(userId, lesson);
      return { alreadyCompleted: true, xpEarned: 0 };
    }

    const minutes = durationToMinutes(lesson.duration, 15);

    const { error: progressError } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: profileId,
          course_id: lesson.courseId,
          module_id: lesson.moduleId || `${lesson.courseId}-main`,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
          time_spent: minutes,
        },
        { onConflict: "user_id,lesson_id" },
      );

    if (progressError) throw progressError;

    let xpEarned = XP_LESSON;
    await addXpToUser(profileId, XP_LESSON);
    await addStudyTime(profileId, minutes);
    const streakResult = await updateUserStreak(profileId);
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp;

    const completedLessons = await addCompletedLesson(profileId, lessonId);
    await visitLesson(profileId, lesson);

    const userAfterLesson = await getUserProfile(profileId);
    const completedQuizzes = userAfterLesson?.completedQuizzes || [];

    let moduleComplete = false;
    if (lesson.moduleId) {
      moduleComplete = isModuleComplete(
        completedLessons,
        completedQuizzes,
        lesson.moduleId,
      );
      if (moduleComplete) {
        xpEarned += XP_MODULE;
        await addXpToUser(profileId, XP_MODULE);
      }
    }

    const courseComplete = isCourseComplete(
      completedLessons,
      completedQuizzes,
      lesson.courseId,
    );
    if (courseComplete) {
      xpEarned += XP_COURSE;
      await addXpToUser(profileId, XP_COURSE);
      const course = staticCourses.find((item) => item.id === lesson.courseId);
      await addCompletedCourse(
        profileId,
        lesson.courseId,
        course?.title || lesson.courseId,
      );
    }

    return {
      alreadyCompleted: false,
      xpEarned,
      moduleComplete,
      courseComplete,
      streakResult,
    };
  });
}

export async function completeExercise(userId) {
  return withRetry(async () => {
    let xpEarned = XP_EXERCISE;
    await addXpToUser(userId, XP_EXERCISE);
    const streakResult = await updateUserStreak(userId);
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp;
    await incrementCompletedExercises(userId);

    return {
      xpEarned,
    };
  });
}

export async function completeProject(userId) {
  return withRetry(async () => {
    let xpEarned = XP_PROJECT;
    await addXpToUser(userId, XP_PROJECT);
    const streakResult = await updateUserStreak(userId);
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp;
    await incrementCompletedProjects(userId);

    return {
      xpEarned,
    };
  });
}

export async function completeQuiz(userId, moduleId, score, totalQuestions) {
  return withRetry(async () => {
    const user = await getUserProfile(userId);
    const completedQuizzes = await addCompletedQuiz(userId, moduleId);

    const completedLessons = user?.completedLessons || [];
    const moduleComplete = isModuleComplete(
      completedLessons,
      completedQuizzes,
      moduleId,
    );

    let xpEarned = 0;
    if (moduleComplete) {
      xpEarned += XP_MODULE;
      await addXpToUser(userId, XP_MODULE);
    }

    const course = staticCourses.find((c) => c.modules?.includes(moduleId));
    let courseComplete = false;
    if (course) {
      courseComplete = isCourseComplete(
        completedLessons,
        completedQuizzes,
        course.id,
      );
      if (courseComplete) {
        xpEarned += XP_COURSE;
        await addXpToUser(userId, XP_COURSE);
        await addCompletedCourse(userId, course.id, course.title);
      }
    }

    return {
      xpEarned,
      moduleComplete,
      courseComplete,
      percentage:
        totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
    };
  });
}

export function getModuleProgressPercent(
  completedLessons,
  completedQuizzes,
  moduleId,
) {
  const mod = getModuleData(moduleId);
  if (!mod) return 0;

  if (!mod.lessons || mod.lessons.length === 0) {
    return mod.quiz && !completedQuizzes.includes(moduleId) ? 0 : 100;
  }

  const lessonsDone = mod.lessons.filter((l) =>
    completedLessons.includes(l),
  ).length;
  const lessonsPercent = (lessonsDone / mod.lessons.length) * 100;
  if (mod.quiz) {
    const quizDone = completedQuizzes.includes(moduleId) ? 1 : 0;
    return Math.round(lessonsPercent * 0.7 + quizDone * 30);
  }
  return Math.round(lessonsPercent);
}

export function getCourseProgressPercent(
  completedLessons,
  completedQuizzes,
  courseId,
) {
  const course = staticCourses.find((item) => item.id === courseId);
  if (!course) return 0;
  const modules = course.modules || [];
  if (modules.length === 0) {
    const courseLessons = allLessons.filter((l) => l.courseId === courseId);
    if (!courseLessons.length) return 0;
    const done = courseLessons.filter((lesson) =>
      completedLessons.includes(lesson.id),
    ).length;
    return Math.round((done / courseLessons.length) * 100);
  }
  const total = modules.length;
  const done = modules.filter((m) =>
    isModuleComplete(completedLessons, completedQuizzes, m),
  ).length;
  return Math.round((done / total) * 100);
}

export function isLessonCompleted(completedLessons, lessonId) {
  return completedLessons.includes(lessonId);
}
