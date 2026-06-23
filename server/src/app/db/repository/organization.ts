import { eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { member, organization } from "../schema.js";

type OrganizationType = typeof organization.$inferSelect;

class Repository {
  /**
   * Returns every organization the user belongs to, each annotated with the
   * user's role (owner | admin | member) within that organization.
   */
  async getUserOrganizations(args: { userId: string }) {
    const memberships = await db.query.member.findMany({
      where: (fields, { eq }) => eq(fields.userId, args.userId),
      with: {
        organization: true,
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  /**
   * Creates a new organization and registers the creating user as its owner.
   */
  async createOrganization(args: {
    userId: string;
    name: string;
    slug: string;
    logo?: string | null;
  }) {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [newOrganization] = await tx
        .insert(organization)
        .values({
          id: generateBase64String(32),
          name: args.name,
          slug: args.slug,
          logo: args.logo ?? null,
          createdAt: now,
        })
        .returning();

      if (!newOrganization) return null;

      await tx.insert(member).values({
        id: generateBase64String(32),
        organizationId: newOrganization.id,
        userId: args.userId,
        role: "owner",
        createdAt: now,
      });

      return { ...newOrganization, role: "owner" as const };
    });
  }

  async getOrganizationBySlug(args: { slug: string }) {
    const result = await db.query.organization.findFirst({
      where: (fields, { eq }) => eq(fields.slug, args.slug),
    });

    return result;
  }
}

export const organizationRepository = new Repository();
