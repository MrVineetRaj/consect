import { create } from "zustand";

type UserPreferenceStore = {
  userPreference: IUserPreference | null;
  setUserPreference: ({
    userPreference,
  }: {
    userPreference: IUserPreference | null;
  }) => void;
};

export const useUserPreferenceStore = create<UserPreferenceStore>()((set) => ({
  userPreference: null,
  token: "",
  setUserPreference: ({ userPreference }) => {
    set({
      userPreference,
    });
  },
}));
