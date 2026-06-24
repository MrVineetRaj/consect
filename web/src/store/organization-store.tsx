import { create } from "zustand";

type OrganizationStore = {
  organizations: IOrganization[];
  orgMembers: IOrganizationMembers[];
  setOrganizations: (organizations: IOrganization[]) => void;
  setOrganizationMembers: (organizations: IOrganizationMembers[]) => void;
  addOrganization: (organization: IOrganization) => void;
};

export const useOrganizationStore = create<OrganizationStore>()((set) => ({
  organizations: [],
  orgMembers: [],
  setOrganizations: (organizations) => {
    set({ organizations });
  },
  setOrganizationMembers: (orgMembers) => {
    set({ orgMembers });
  },
  addOrganization: (organization) => {
    set((state) => ({
      organizations: [organization, ...state.organizations],
    }));
  },
}));
