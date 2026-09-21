import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2 md:px-6">
        <Link href="/" className="inline-flex flex-col items-start">
          <img
            src="/baratoradar-logo.png"
            alt="BaratoRadar"
            style={{
              width: "180px",
              height: "auto",
              display: "block",
            }}
          />

          <div className="mt-0.5 text-[10px] font-medium italic text-slate-500 md:text-xs">
            O radar das melhores ofertas
          </div>
        </Link>
      </div>
    </header>
  );
}
