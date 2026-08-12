import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 px-8 py-14 shadow-[0_30px_80px_rgba(15,23,42,.08)] md:px-14 md:py-20">

      {/* Glow */}
      <div className="absolute left-1/2 top-[-220px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">

        <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold tracking-wide text-amber-800">
          🟡 Em teste • Porto Alegre é nossa cidade piloto
        </p>

        <h1 className="mt-10 text-5xl font-black tracking-[-0.05em] text-slate-950 md:text-7xl">
          Comprar bem começa comparando.
        </h1>

        <h2 className="mt-3 text-3xl font-black text-emerald-700 md:text-5xl">
          Antes de sair de casa.
        </h2>

        <p className="mx-auto mt-10 max-w-3xl text-xl leading-9 text-slate-600">
          Enquanto você vive o seu dia, o BaratoRadar pesquisa os preços dos
          principais supermercados para mostrar onde vale mais a pena comprar.
        </p>

        <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">

          <Link
            href="/ofertas?cidade=Porto%20Alegre"
            className="rounded-2xl bg-emerald-700 px-10 py-5 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-800"
          >
            Ver onde comprar melhor →
          </Link>

          <Link
            href="/ofertas"
            className="rounded-2xl border border-slate-300 bg-white px-10 py-5 text-lg font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Explorar ofertas
          </Link>

        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6">

          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">
            📡 O Radar está trabalhando para você
          </p>

          <p className="mt-3 text-lg leading-8 text-slate-700">
            Neste momento continuamos pesquisando milhares de ofertas para ajudar
            você a decidir melhor antes de sair de casa.
          </p>

        </div>

      </div>

    </section>
  );
}