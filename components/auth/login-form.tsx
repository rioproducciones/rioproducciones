"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ next = "/admin" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let signInError: { message?: string } | null = null;

    try {
      const supabase = createBrowserSupabaseClient();
      const result = await supabase.auth.signInWithPassword({
        email,
        password
      });
      signInError = result.error;
    } catch (clientError) {
      setLoading(false);
      setError(
        clientError instanceof Error && clientError.message.includes("NEXT_PUBLIC_SUPABASE")
          ? "Faltan variables públicas de Supabase. Revisá .env.local y reiniciá el servidor."
          : "No pudimos conectar con Supabase."
      );
      return;
    }

    if (signInError) {
      setLoading(false);
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="glass-panel grid gap-3 rounded-xl p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Staff</p>
        <h1 className="mt-2 text-3xl font-black">Ingresar a Rio Access</h1>
      </div>
      <Input
        required
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        required
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-400/[0.12] p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      <Button type="submit" disabled={loading}>
        <LogIn className="size-4" />
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
