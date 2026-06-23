interface IUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
}

interface IUserPreference {
  userId: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string | null;
}

type OrganizationRole = "owner" | "admin" | "member";

interface IOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: string | null;
  createdAt: Date;
  role: OrganizationRole;
}
