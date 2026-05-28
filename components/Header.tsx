import Link from "next/link";

const nav = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/proteinas", label: "Proteínas" },
  { href: "/cesta-basica", label: "Cesta básica" },
  { href: "/limpeza", label: "Limpeza" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
  href={item.href}
  className="px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
>
          <div className="flex items-center gap-3">
  <img
    src="/logo.png"
    alt="BaratoRadar"
    style={{ height: "50px", width: "auto" }}
  />

  <div className="hidden md:block">
    <p className="text-xs text-slate-500 -mt-1">
      O radar das melhores ofertas
    </p>
  </div>
</div>
<div>
            <div className="text-lg font-extrabold text-slate-900">BaratoRadar</div>
            <div className="text-xs text-slate-500">O radar das melhores ofertas</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 hover:text-green-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}