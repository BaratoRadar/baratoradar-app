import Link from "next/link";



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


</div>
    </header>
  );
}