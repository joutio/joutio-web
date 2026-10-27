import type { Resources } from "../fr"

/** Player reports and public suspended-account badge. */
export const moderation: Resources["moderation"] = {
  suspendedBadge: "Suspended account",
  report: {
    action: "Report",
    actionAria: "Report this player",
    reported: "Reported",
    title: "Report this player",
    description:
      "Help us keep Joutio safe. The reported player never sees your identity.",
    previewLabel: "Reported player",
    gameContext: "Reported from a finished duel",
    reasonsLabel: "What happened?",
    reasonHarassment: "Harassment",
    reasonHarassmentHint: "Insults, threats, repeated behaviour",
    reasonHate: "Hate speech",
    reasonHateHint: "Content targeting a group or a person",
    reasonContent: "Inappropriate content",
    reasonContentHint: "Offensive pseudonym, avatar or banner",
    reasonCheating: "Cheating",
    reasonCheatingHint: "Unfair behaviour during a duel",
    reasonSpam: "Spam",
    reasonSpamHint: "Advertising, repetitive messages",
    reasonOther: "Other",
    reasonOtherHint: "A problem that does not fit the other reasons",
    commentLabel: "Details (optional)",
    commentPlaceholder: "Describe what happened…",
    commentCounter: "{{count}}/500",
    cancel: "Cancel",
    submit: "Send report",
    submitting: "Sending…",
    success: "Report sent",
    already: "Report already recorded",
    error: "Unable to send the report",
    reasonRequired: "Choose at least one reason.",
  },
}
