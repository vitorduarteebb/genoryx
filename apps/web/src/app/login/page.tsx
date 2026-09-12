"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm, Field } from "../../components/auth-form";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await api<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; role: string };
      }>("/auth/login", {
        method: "POST",
        body: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      setSession(result.accessToken, result.refreshToken, result.user);
      const me = await api<{ hasCharacter: boolean }>("/auth/me", {
        accessToken: result.accessToken,
      });
      router.push(me.hasCharacter ? "/game/creatures" : "/create-character");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AuthForm
        title="Entrar em Aethera"
        subtitle="A sessão nasce no servidor. Gold e poder também."
        submitLabel="Entrar"
        error={error}
        pending={pending}
        onSubmit={onSubmit}
      >
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" />
      </AuthForm>
      <p className="fixed bottom-8 left-0 right-0 z-10 text-center text-sm text-muted">
        Novo em Aethera?{" "}
        <Link href="/register" className="text-crystal">
          Criar conta
        </Link>
      </p>
    </>
  );
}
