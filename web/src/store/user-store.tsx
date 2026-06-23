import { create } from "zustand";

type UserStore = {
  user: IUser | null;
  token: string;
  setUser: ({ user, token }: { user: IUser | null; token: string }) => void;
};

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  token: "",
  setUser: ({ user, token }) => {
    set({
      user,
      token,
    });
  },
}));
