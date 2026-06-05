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

        <nav className="mt-2 grid w-full grid-cols-2 gap-3 md:mt-0 md:flex md:w-auto md:items-center md:gap-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-6 py-4 text-center text-sm font-extrabold text-emerald-800 shadow-md transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-lg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}