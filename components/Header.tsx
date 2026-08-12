import Link from "next/link";

const nav = [
  { href: "/", label: "🏠 Início" },
  { href: "/ofertas", label: "🔥 Ofertas" },
  { href: "/proteinas", label: "🥚 Proteínas" },
  { href: "/cesta-basica-regiao", label: "🛒 Cesta básica" },
  { href: "/cesta-basica-ranking", label: "📊 Rankings" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 md:px-6">
  <div className="flex items-center justify-between gap-6">
    <Link href="/" className="min-w-0">
      <div className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
        BARATORADAR
      </div>

      <div className="mt-1 text-sm font-medium italic text-slate-500 md:text-base">
        O radar das melhores ofertas
      </div>
    </Link>

    <div className="hidden shrink-0 md:block">
  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-3xl shadow-sm md:h-20 md:w-20">
    📡
  </div>
</div>
  </div>

  <nav className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:flex md:flex-wrap md:items-center md:gap-3">
    {nav.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className="flex min-w-[135px] items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-3 text-center text-sm font-extrabold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-md"
      >
        {item.label}
      </Link>
    ))}
  </nav>
</div>
    </header>
  );
}