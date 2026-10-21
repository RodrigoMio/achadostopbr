import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">404</p>
      <h1 className="text-2xl font-semibold text-slate-900">Página não encontrada</h1>
      <p className="max-w-md text-slate-600">O endereço que abriu não existe ou o afiliado não está ativo.</p>
      <Link
        href="/"
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
