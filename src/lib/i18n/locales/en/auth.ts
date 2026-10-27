import type { auth as frAuth } from "../fr/auth"

export const auth: typeof frAuth = {
  shell: {
    hero: "Seven rounds, ten seconds per question. Challenge the world and climb the leaderboard.",
  },
  login: {
    sessionUnknownUser:
      "Your session is no longer valid (service reset). Sign in again.",
    sessionReset: "Sign in again",
    sessionExpired: "Your session has expired. Sign in again.",
    sessionSuspended:
      "Your account is suspended. Check the email you received for the reason and end date.",
    accountDeleted:
      "Your account and personal data have been deleted. You can create a new account with the same email.",
    title: "Sign in to your account",
    subtitle: "Enter your email: we'll send you a sign-in code.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    emailInvalid: "Invalid email address",
    requestError: "Could not send the code. Try again.",
    submitPending: "Sending…",
    submit: "Get a code",
    separator: "Or continue with",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
    facebookEmailMissing:
      "Facebook did not share an email address. Use email sign-in instead.",
    facebookUnavailable:
      "Facebook is temporarily unavailable. Try again or use email sign-in.",
    socialError: "Social sign-in failed. Try again or use email sign-in.",
  },
  code: {
    invalid: "Invalid or expired code. Try again.",
    resendError: "Could not resend the code. Try again.",
    invalidFormat: "The code must contain 6 digits",
    changeEmail: "Change email",
  },
  callback: {
    title: "Unable to sign in",
    fallbackError: "Sign-in failed",
    loading: "Signing in…",
  },
}
