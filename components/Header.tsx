import Link from "next/link";

const nav = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/proteinas", label: "Proteínas" },
  { href: "/cesta-basica", label: "Cesta básica" },
  { href: "/limpeza", label: "Limpeza" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-700 text-white font-bold">
          <div className="flex items-center">
  <img
    src="/logo.png"
    alt="BaratoRadar"
    style={{ height: "50px", width: "auto" }}
  />
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