import { authClient } from "@/lib/auth";

export function useAuth() {
  async function getSession() {
    const session = await authClient.getSession();
    return session;
  }

  async function emailLogin({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const session = await authClient.signIn.email({
      email,
      password,
    });

    return session;
  }

  async function emailSignup({
    email,
    password,
    name,
  }: {
    email: string;
    name: string;
    password: string;
  }) {
    const session = await authClient.signUp.email({
      email,
      password,
      name,
    });

    return session;
  }

  async function logout() {
    const result = await authClient.signOut();
    return result;
  }

  return { getSession, emailLogin, emailSignup, logout };
}
