import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_MESSAGES as emailMessages,
  selectNotificationMessage as selectEmailMessage,
} from "../../functions/services/notificationMessages.js";
import {
  NOTIFICATION_MESSAGES as pushMessages,
  selectNotificationMessage as selectPushMessage,
} from "../../supabase/functions/_shared/notificationMessages.ts";
import { buildWelcomeEmail } from "../../functions/templates/welcome.js";
import { buildReactivationEmail } from "../../functions/templates/reactivation.js";
import { buildNewLessonEmail } from "../../functions/templates/newLesson.js";
import { buildAnnounceEmail } from "../../functions/templates/announce.js";

const learnerCategories = [
  "welcome",
  "motivation",
  "inactivity",
  "progress",
  "learning",
  "completion",
  "reminders",
  "announcements",
];

describe("notification message library", () => {
  it("provides a non-empty message bank for each requested category", () => {
    for (const category of learnerCategories) {
      expect(emailMessages[category].length).toBeGreaterThan(0);
      expect(pushMessages[category].length).toBeGreaterThan(0);
      expect(pushMessages[category]).toEqual(emailMessages[category]);
    }
  });

  it("can select a valid message from every requested category", () => {
    for (const category of learnerCategories) {
      for (const selectMessage of [selectEmailMessage, selectPushMessage]) {
        const message = selectMessage(category, { random: () => 0 });
        expect(message.title).toBeTruthy();
        expect(message.body).toBeTruthy();
      }
    }
  });

  it("selects different messages when the last sent title is known", () => {
    for (const selectMessage of [selectEmailMessage, selectPushMessage]) {
      const previous = selectMessage("motivation", { random: () => 0 });
      const next = selectMessage("motivation", {
        previousMessage: previous,
        random: () => 0,
      });

      expect(next.title).not.toBe(previous.title);
      expect(next.body).toBeTruthy();
    }
  });

  it("uses available personalization values and removes missing placeholders", () => {
    expect(
      selectEmailMessage("welcome", {
        variables: { name: "Lina" },
        random: () => 0.99,
      }).title,
    ).toBe("Olá, Lina! Bora começar?");
    expect(
      selectPushMessage("welcome", { random: () => 0.99 }).title,
    ).toBe("Olá! Bora começar?");
  });

  it("keeps push messages within the requested event context", () => {
    const lessonMessage = selectPushMessage("motivation", {
      context: "lesson_completed",
      variables: { actorName: "Lina", name: "Mateus" },
      random: () => 0,
    });
    expect(lessonMessage.title).toBe("Lina concluiu mais uma aula!");
    expect(lessonMessage.body).toBe("Mateus, bora continuar também?");

    expect(
      selectPushMessage("community", {
        context: "new_post",
        variables: { actorName: "Lina" },
        random: () => 0,
      }).body,
    ).toBe("Lina publicou um projeto novo. Espreita!");
    expect(() =>
      selectPushMessage("community", { context: "project_commented" }),
    ).toThrow('Não há mensagens para o contexto "project_commented" em "community".');
  });

  it("rejects unknown categories instead of silently choosing unrelated copy", () => {
    expect(() => selectEmailMessage("unknown")).toThrow(
      "Categoria de notificação desconhecida: unknown",
    );
    expect(() => selectPushMessage("unknown")).toThrow(
      "Categoria de notificação desconhecida: unknown",
    );
  });

  it("integrates selected copy and available learner/course data in email templates", () => {
    const user = { uid: "u-1", name: "Lina Manuel", xp: 24, streak: 3 };
    const welcome = selectEmailMessage("welcome", {
      variables: { name: "Lina" },
      random: () => 0.99,
    });
    expect(buildWelcomeEmail(user, welcome)).toContain("Olá, Lina! Bora começar?");

    const inactivity = selectEmailMessage("inactivity", { random: () => 0 });
    const reactivationHtml = buildReactivationEmail(
      { ...user, completedLessons: 4 },
      "Desenvolvimento Web",
      null,
      inactivity,
    );
    expect(reactivationHtml).toContain(inactivity.title);
    expect(reactivationHtml).toContain("Desenvolvimento Web");
    expect(reactivationHtml).toContain("Lina");

    const learning = selectEmailMessage("learning", { random: () => 0 });
    const lessonHtml = buildNewLessonEmail(
      user,
      "JavaScript",
      "Promises",
      "lesson-promises",
      learning,
    );
    expect(lessonHtml).toContain("JavaScript");
    expect(lessonHtml).toContain("Promises");
    expect(lessonHtml).toContain("Olá, Lina!");

    const completion = selectEmailMessage("completion", { random: () => 0 });
    const announcement = selectEmailMessage("announcements", { random: () => 0 });
    const announcementHtml = buildAnnounceEmail(
      user,
      completion,
      announcement,
    );
    expect(announcementHtml).toContain("Missão cumprida! 🔥");
    expect(announcementHtml).toContain(announcement.title);
    expect(announcementHtml).toContain("CSS3");
  });
});
