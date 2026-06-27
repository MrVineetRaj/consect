export const HeaderKeys = {
  organizationId: "x-organization-id",
  conversationId: "x-conversation-id",
  apiKey: "x-api-key",
  apiSecret: "x-api-secret",
};

/** The AI assistant, stored as a real `user` row so messages can FK to it. */
export const CONSECTO_BOT = {
  id: "consecto",
  name: "consecto",
  email: "bot@consecto.local",
  emailVerified: true,
  image: null,
} as const;
