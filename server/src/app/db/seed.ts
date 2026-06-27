import "dotenv/config";
import { inArray } from "drizzle-orm";
import { auth } from "../lib/auth.js";
import { generateBase64String } from "../lib/utils.js";
import { db } from "./connection.js";
import {
  accessConfig,
  conversation,
  conversationMember,
  member,
  message,
  organization,
  user,
} from "./schema.js";
import { vectorDB } from "../vector_db/client.js";

const USER_COUNT = 10;
const WORKSPACE_COUNT = 3;
const DEFAULT_PASSWORD = "12345678";

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length]!;
}

async function seed() {
  console.log("🌱 Seeding database...");

  const now = new Date();

  // --- Users (via better-auth email/password sign-up) ---
  // signUpEmail creates both the user and the credential account, so these
  // users can sign in with DEFAULT_PASSWORD.
  const users = await Promise.all(
    Array.from({ length: USER_COUNT }, async (_, i) => {
      const n = i + 1;
      const { user } = await auth.api.signUpEmail({
        body: {
          name: `User ${n}`,
          email: `user${n}@example.com`,
          password: DEFAULT_PASSWORD,
        },
      });
      return user;
    }),
  );

  // Mark all seeded users as verified so requireEmailVerification doesn't
  // block sign-in.
  await db
    .update(user)
    .set({ emailVerified: true })
    .where(
      inArray(
        user.id,
        users.map((u) => u.id),
      ),
    );
  console.log(`✅ Inserted ${users.length} users`);

  // --- Workspaces (organizations) ---
  const organizations = Array.from({ length: WORKSPACE_COUNT }, (_, i) => {
    const n = i + 1;
    return {
      id: generateBase64String(32),
      name: `Workspace ${n}`,
      slug: `workspace-${n}`,
      logo: null,
      createdAt: now,
      metadata: null,
    };
  });

  await db.insert(organization).values(organizations);
  console.log(`✅ Inserted ${organizations.length} workspaces`);

  await Promise.all(
    organizations.map((org) =>
      vectorDB.initCollection({ size: 1536, collection: org.id }),
    ),
  );

  // --- Members: distribute every user across every workspace ---
  const members = organizations.flatMap((org, orgIdx) =>
    users.map((u, userIdx) => ({
      id: generateBase64String(32),
      organizationId: org.id,
      userId: u.id,
      // first user of each org is the owner, the next is admin, rest members
      role:
        userIdx === orgIdx
          ? ("owner" as const)
          : userIdx === orgIdx + 1
            ? ("admin" as const)
            : ("member" as const),
      createdAt: now,
    })),
  );

  await db.insert(member).values(members);
  console.log(`✅ Inserted ${members.length} workspace memberships`);

  // --- Access config: one organization-level config per user per workspace ---
  const accessConfigs = organizations.flatMap((org) =>
    users.map((u) => ({
      id: generateBase64String(32),
      userId: u.id,
      organizationId: org.id,
      spaceId: org.id,
      spaceType: "organization" as const,
      config: {},
    })),
  );

  await db.insert(accessConfig).values(accessConfigs);
  console.log(`✅ Inserted ${accessConfigs.length} access configs`);

  // --- Conversations: a few channels + a DM per workspace ---
  const conversations = organizations.flatMap((org) => [
    {
      id: generateBase64String(32),
      name: "general",
      organizationId: org.id,
      type: "channel" as const,
      description: "Company-wide announcements and chatter",
    },
    {
      id: generateBase64String(32),
      name: "random",
      organizationId: org.id,
      type: "channel" as const,
      description: "Non-work banter",
    },
    {
      id: generateBase64String(32),
      name: null,
      organizationId: org.id,
      type: "dm" as const,
      description: null,
    },
  ]);

  await db.insert(conversation).values(conversations);
  console.log(`✅ Inserted ${conversations.length} conversations`);

  // --- Conversation members ---
  // Channels: all users of that workspace. DMs: two users.
  const conversationMembers = conversations.flatMap((conv) => {
    if (conv.type === "dm") {
      return [pick(users, 0), pick(users, 1)].map((u) => ({
        id: generateBase64String(32),
        userId: u.id,
        conversationId: conv.id,
        role: "member" as const,
      }));
    }
    return users.map((u, idx) => ({
      id: generateBase64String(32),
      userId: u.id,
      conversationId: conv.id,
      role: idx === 0 ? ("owner" as const) : ("member" as const),
    }));
  });

  await db.insert(conversationMember).values(conversationMembers);
  console.log(`✅ Inserted ${conversationMembers.length} conversation members`);

  // --- Messages: a few per conversation ---
  const messages = conversations.flatMap((conv) =>
    Array.from({ length: 5 }, (_, i) => {
      const sender = pick(users, i);
      return {
        id: generateBase64String(32),
        senderId: sender.id,
        conversationId: conv.id,
        organizationId: conv.organizationId,
        parentMessageId: null,
        mentions: [],
        content: `Sample message ${i + 1} in ${conv.name ?? "DM"}`,
      };
    }),
  );

  await db.insert(message).values(messages);
  console.log(`✅ Inserted ${messages.length} messages`);

  console.log("🎉 Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
