import Link from "next/link";

const nav = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/proteinas", label: "Proteínas" },
  { href: "/cesta-basica", label: "Cesta básica" },
  { href: "/limpeza", label: "Limpeza" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="BaratoRadar"
            style={{ height: "50px", width: "auto" }}
          />

          <div>
            <div className="text-lg font-extrabold text-slate-900">
              BaratoRadar
            </div>
            <div className="text-xs text-slate-500">
              O radar das melhores ofertas
            </div>
          </div>
        </Link>

        <nav className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}