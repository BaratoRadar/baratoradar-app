import HomeHero from "@/components/home/HomeHero";

export default function Home2Page() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 md:px-6 md:py-12">
      <HomeHero />

      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Próximo bloco
        </p>

        <h2 className="mt-3 text-2xl font-black text-slate-900">
          Melhor Oferta do Dia
        </h2>
      </section>
    </main>
  );
}