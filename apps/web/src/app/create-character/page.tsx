"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthForm, Field } from "../../components/auth-form";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";

export default function CreateCharacterPage() {
  const router = useRouter();
  const { accessToken, ready, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (user?.hasCharacter) {
      router.replace("/game/creatures");
    }
  }, [accessToken, ready, router, user?.hasCharacter]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/characters", {
        method: "POST",
        accessToken,
        body: { name: String(form.get("name") ?? "") },
      });
      router.push("/game/appearance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o personagem.");
    } finally {
      setPending(false);
    }
  }

  if (!ready || !accessToken) {
    return null;
  }

  return (
    <AuthForm
      title="Personagem"
      subtitle="Um nome público, único. Classe e progresso vêm do servidor."
      submitLabel="Criar personagem"
      error={error}
      pending={pending}
      onSubmit={onSubmit}
    >
      <Field label="Nome" name="name" type="text" />
    </AuthForm>
  );
}
