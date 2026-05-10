import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-rio-black px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <LoginForm next={params.next || "/admin"} />
      </div>
    </main>
  );
}
