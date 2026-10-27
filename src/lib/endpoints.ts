import {config} from "./config"

/**
 * Tous les endpoints data passent par le **BFF** (`/api/**`) ; seuls les endpoints
 * d'authentification et l'échange OIDC sont adressés directement à `joutio-identity`.
 *
 * <p>La surface applicative d'auth est préfixée par client (`/api/auth/web/**`). Les
 * endpoints du protocole OIDC (`/oauth2/authorize`, `/oauth2/token`, …) restent standard
 * et ne sont pas préfixés.</p>
 */
export const ENDPOINTS = {
    auth: {
        requestLoginCode: `${config.oidcAuthority}/api/auth/web/request-login-code`,
        loginWithCode: `${config.oidcAuthority}/api/auth/web/login-with-code`,
        startGoogleLogin: `${config.oidcAuthority}/api/auth/web/start-google-login`,
        startFacebookLogin: `${config.oidcAuthority}/api/auth/web/start-facebook-login`,
        logout: `${config.oidcAuthority}/api/auth/web/logout`,
    },
    me: "/api/me",
    meRewards: "/api/me/rewards",
    accountDeletion: {
        code: "/api/me/deletion-code",
    },
    onboardingComplete: "/api/me/onboarding/complete",
    onboardingRecommendations: "/api/me/onboarding/recommendations",
    meInterests: "/api/me/interests",
    suggestions: "/api/suggestions",
    clock: "/api/clock",
    telemetry: {
        events: "/api/telemetry/events",
        clientErrors: "/api/telemetry/client-errors",
    },
    home: "/api/home",
    media: {
        upload: "/api/media",
    },
    topics: {
        list: "/api/topics",
        facets: "/api/topics/facets",
        categories: "/api/topic-categories",
        overview: (topicId: string) => `/api/topics/${topicId}/overview`,
        follow: (topicId: string) => `/api/topics/${topicId}/follow`,
        leaderboard: (topicId: string) => `/api/topics/${topicId}/leaderboard`,
        create: "/api/topics",
        name: (topicId: string) => `/api/topics/${topicId}/name`,
        description: (topicId: string) => `/api/topics/${topicId}/description`,
        category: (topicId: string) => `/api/topics/${topicId}/category`,
        emoji: (topicId: string) => `/api/topics/${topicId}/emoji`,
        color: (topicId: string) => `/api/topics/${topicId}/color`,
        imageUrl: (topicId: string) => `/api/topics/${topicId}/image-url`,
        bannerUrl: (topicId: string) => `/api/topics/${topicId}/banner-url`,
        publish: (topicId: string) => `/api/topics/${topicId}/publish`,
        questions: (topicId: string) => `/api/topics/${topicId}/questions`,
    },
    questions: {
        translations: (questionId: string) =>
            `/api/questions/${questionId}/translations`,
        text: (questionId: string) => `/api/questions/${questionId}/text`,
        answers: (questionId: string) => `/api/questions/${questionId}/answers`,
        correctAnswer: (questionId: string) =>
            `/api/questions/${questionId}/correct-answer`,
        imageUrl: (questionId: string) => `/api/questions/${questionId}/image-url`,
        approve: (questionId: string) => `/api/questions/${questionId}/approve`,
        reject: (questionId: string) => `/api/questions/${questionId}/reject`,
        reports: (questionId: string) => `/api/questions/${questionId}/reports`,
        reportResolve: (questionId: string, reportId: string) =>
            `/api/questions/${questionId}/reports/${reportId}/resolve`,
        reportResolveAll: (questionId: string) =>
            `/api/questions/${questionId}/reports/resolve`,
    },
    profiles: {
        ratings: "/api/profiles/ratings",
        detail: (userId: string) => `/api/profiles/${userId}`,
        reports: (userId: string) => `/api/profiles/${userId}/reports`,
        pseudonym: (userId: string) => `/api/profiles/${userId}/pseudonym`,
        bio: (userId: string) => `/api/profiles/${userId}/bio`,
        country: (userId: string) => `/api/profiles/${userId}/country`,
        avatarOptions: (userId: string) => `/api/profiles/${userId}/avatar-options`,
        banner: (userId: string) => `/api/profiles/${userId}/banner`,
        language: (userId: string) => `/api/profiles/${userId}/language`,
        following: (userId: string) => `/api/profiles/${userId}/following`,
        followers: (userId: string) => `/api/profiles/${userId}/followers`,
        follow: (userId: string) => `/api/profiles/${userId}/follow`,
        games: (userId: string) => `/api/profiles/${userId}/games`,
        headToHead: (userId: string) => `/api/profiles/${userId}/head-to-head`,
        topics: (userId: string) => `/api/profiles/${userId}/topics`,
        badges: (userId: string) => `/api/profiles/${userId}/badges`,
        activity: (userId: string) => `/api/profiles/${userId}/activity`,
        titles: (userId: string) => `/api/profiles/${userId}/titles`,
        title: (userId: string) => `/api/profiles/${userId}/title`,
    },
    presence: {
        detail: (userId: string) => `/api/presence/${userId}`,
    },
    challenges: {
        create: "/api/challenges",
        mine: "/api/challenges/mine",
        detail: (challengeId: string) => `/api/challenges/${challengeId}`,
        accept: (challengeId: string) => `/api/challenges/${challengeId}/accept`,
        decline: (challengeId: string) => `/api/challenges/${challengeId}/decline`,
        cancel: (challengeId: string) => `/api/challenges/${challengeId}/cancel`,
    },
    rooms: {
        create: "/api/rooms",
        bot: "/api/rooms/bot",
        mine: "/api/rooms/mine",
        detail: (roomId: string) => `/api/rooms/${roomId}`,
        join: (roomId: string) => `/api/rooms/${roomId}/join`,
        leave: (roomId: string) => `/api/rooms/${roomId}/leave`,
        cancel: (roomId: string) => `/api/rooms/${roomId}/cancel`,
        wizz: (roomId: string) => `/api/rooms/${roomId}/wizz`,
        notifications: (roomId: string) => `/api/rooms/${roomId}/notifications`,
    },
    notifications: {
        list: "/api/notifications",
        unreadCount: "/api/notifications/unread-count",
        read: (notificationId: string) =>
            `/api/notifications/${notificationId}/read`,
        unread: (notificationId: string) =>
            `/api/notifications/${notificationId}/unread`,
        remove: (notificationId: string) => `/api/notifications/${notificationId}`,
        removeAll: "/api/notifications",
        readAll: "/api/notifications/read-all",
        preferences: "/api/notification-preferences",
        preference: (category: string) =>
            `/api/notification-preferences/${category}`,
    },
    push: {
        vapidPublicKey: "/api/push/vapid-public-key",
        subscriptions: "/api/push/subscriptions",
    },
    matchmaking: {
        tickets: "/api/matchmaking/tickets",
        cancel: (ticketId: string) => `/api/matchmaking/tickets/${ticketId}/cancel`,
        notifications: (ticketId: string) =>
            `/api/matchmaking/tickets/${ticketId}/notifications`,
    },
    games: {
        active: "/api/games?active=true",
        notifications: (gameId: string) => `/api/games/${gameId}/notifications`,
        result: (gameId: string) => `/api/games/${gameId}/result`,
        answer: (gameId: string) => `/api/games/${gameId}/answer`,
        cancel: (gameId: string) => `/api/games/${gameId}/cancel`,
    },
} as const
