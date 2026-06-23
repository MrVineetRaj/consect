import { create } from "zustand";

type OrganizationStore = {
  organizations: IOrganization[];
  setOrganizations: (organizations: IOrganization[]) => void;
  addOrganization: (organization: IOrganization) => void;
};

export const useOrganizationStore = create<OrganizationStore>()((set) => ({
  organizations: [],
  setOrganizations: (organizations) => {
    set({ organizations });
  },
  addOrganization: (organization) => {
    set((state) => ({
      organizations: [organization, ...state.organizations],
    }));
  },
}));
