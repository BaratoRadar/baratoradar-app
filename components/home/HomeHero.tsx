export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,.07)] md:px-12 md:py-6">
      {/* Glow */}
      <div className="absolute left-1/2 top-[-220px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 md:text-5xl">
          Comprar bem começa comparando antes de sair de casa.
        </h1>

        <h2 className="mt-1.5 text-lg font-bold leading-tight text-emerald-700 md:text-2xl">
          Descubra onde seu dinheiro vale mais.
        </h2>
      </div>
    </section>
  );
}
