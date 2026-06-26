import { create } from "zustand";

type OrganizationStore = {
  organizations: IOrganization[];
  orgMembers: IOrganizationMembers[];
  orgPresence: { [userId: string]: boolean };
  setOrgPresence: (val: { [userId: string]: boolean }) => void;
  setOrganizations: (organizations: IOrganization[]) => void;
  setOrganizationMembers: (organizations: IOrganizationMembers[]) => void;
  addOrganization: (organization: IOrganization) => void;
};

export const useOrganizationStore = create<OrganizationStore>()((set) => ({
  organizations: [],
  orgMembers: [],
  orgPresence: {},
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
  setOrgPresence: (val) => {
    set(() => ({
      orgPresence: val,
    }));
  },
}));
