import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-xl font-semibold text-neutral-900">
        Error de autenticación
      </h1>
      <p className="mt-4 text-sm text-neutral-600">
        El enlace de acceso es inválido o ha expirado. Por favor, solicita uno
        nuevo.
      </p>
      <Link
        href="/markets"
        className="mt-6 inline-block text-sm text-neutral-700 underline hover:text-neutral-900"
      >
        Volver a mercados
      </Link>
    </main>
  );
}
