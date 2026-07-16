import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { member, organization, user } from "../schema.js";

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

  /** The subset of the given user ids that are members of the organization. */
  async filterOrganizationMemberUserIds(args: {
    organizationId: string;
    userIds: string[];
  }) {
    if (args.userIds.length === 0) return [];

    const result = await db
      .select({ userId: member.userId })
      .from(member)
      .where(
        and(
          eq(member.organizationId, args.organizationId),
          inArray(member.userId, args.userIds),
        ),
      );

    return result.map((r) => r.userId);
  }

  /** Every member of the workspace, with their user profile. */
  async getOrganizationMembersWithUsers(args: { organizationId: string }) {
    const result = await db.query.member.findMany({
      where: (fields, { eq }) => eq(fields.organizationId, args.organizationId),
      with: {
        user: true,
      },
    });

    return result;
  }

  async getOrganizationMemberById(args: { id: string }) {
    const result = await db.query.member.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async updateOrganizationMemberRole(args: {
    id: string;
    newRole: "admin" | "member";
  }) {
    const [updated] = await db
      .update(member)
      .set({ role: args.newRole })
      .where(eq(member.id, args.id))
      .returning();

    return updated;
  }

  async deleteOrganizationMember(args: { id: string }) {
    await db.delete(member).where(eq(member.id, args.id));
    return true;
  }

  /** Workspace roles for the given user ids. */
  async getOrganizationMemberRoles(args: {
    organizationId: string;
    userIds: string[];
  }) {
    if (args.userIds.length === 0) return [];

    const result = await db
      .select({ userId: member.userId, role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, args.organizationId),
          inArray(member.userId, args.userIds),
        ),
      );

    return result;
  }

  /** Workspace members whose name or email matches the query. */
  async searchOrganizationMembers(args: {
    organizationId: string;
    query: string;
    limit?: number;
  }) {
    const pattern = `%${args.query.trim()}%`;

    const result = await db
      .select({
        userId: member.userId,
        role: member.role,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(
          eq(member.organizationId, args.organizationId),
          or(ilike(user.name, pattern), ilike(user.email, pattern)),
        ),
      )
      .orderBy(asc(user.name))
      .limit(args.limit ?? 15);

    return result;
  }

  async getOrganizationBySlug(args: { slug: string }) {
    const result = await db.query.organization.findFirst({
      where: (fields, { eq }) => eq(fields.slug, args.slug),
    });

    return result;
  }
}

export const organizationRepository = new Repository();
