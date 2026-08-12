const indicators = [
  {
    value: "4",
    label: "supermercados monitorados",
  },
  {
    value: "Milhares",
    label: "de ofertas pesquisadas",
  },
  {
    value: "Diária",
    label: "atualização dos preços",
  },
  {
    value: "Porto Alegre",
    label: "cidade piloto",
  },
];

export default function Confidence() {
  return (
    <section
      id="confidence"
      className="border-y border-slate-200 bg-white px-6 py-20 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Informação para decidir melhor
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            O BaratoRadar acompanha os preços todos os dias.
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Pesquisamos diferentes redes para transformar milhares de preços em
            uma decisão simples para o consumidor.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((indicator) => (
            <article
              key={indicator.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-8 text-center transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
            >
              <p className="text-3xl font-black tracking-tight text-slate-950">
                {indicator.value}
              </p>

              <p className="mx-auto mt-3 max-w-[12rem] text-sm font-semibold leading-6 text-slate-500">
                {indicator.label}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Preços monitorados em Porto Alegre e atualizados conforme a
          disponibilidade das redes.
        </p>
      </div>
    </section>
  );
}