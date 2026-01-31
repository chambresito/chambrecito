import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { AuthButton } from "./AuthButton";

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/markets"
          className="text-lg font-semibold text-neutral-900 hover:text-neutral-700"
        >
          chambresito
        </Link>
        <AuthButton userEmail={user?.email ?? null} />
      </div>
    </header>
  );
}
