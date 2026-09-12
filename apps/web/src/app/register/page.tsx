"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm, Field } from "../../components/auth-form";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AuthForm
        title="Criar conta"
        subtitle="Email e senha. Gold e poder nascem no servidor."
        submitLabel="Registrar"
        error={error}
        pending={pending}
        onSubmit={onSubmit}
      >
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Senha" name="password" type="password" autoComplete="new-password" />
      </AuthForm>
      <p className="fixed bottom-8 left-0 right-0 z-10 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-crystal">
          Entrar
        </Link>
      </p>
    </>
  );
}
