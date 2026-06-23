import { AuthForm } from "@/components/auth/auth-form";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

const AuthPage = async () => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();

  if (session?.session.token) {
    redirect("/ws");
  }

  return (
    <main className="bg-accent/50 min-h-svh overflow-hidden flex">
      <div className="flex-0 md:flex-2/5 lg:flex-3/5"></div>
      <div className="flex-3/5 md:flex-2/5 flex flex-col items-center justify-center p-8 bg-background/60 rounded-l-[60px] ">
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
};

export default AuthPage;
