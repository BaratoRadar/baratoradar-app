import Link from "next/link";

export default function Welcome() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100">

      {/* Glow de fundo */}
      <div className="absolute left-1/2 top-[-250px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10">

        <div className="rounded-[42px] border border-slate-200/80 bg-white/80 px-8 py-14 shadow-[0_35px_120px_rgba(15,23,42,.08)] backdrop-blur-xl md:px-16 md:py-20">

          {/* Marca */}

          <div className="text-center">

            <h1 className="text-6xl font-black tracking-[-0.08em] text-slate-950 sm:text-7xl md:text-8xl lg:text-9xl">

              BARATORADAR

            </h1>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.30em] text-slate-500 md:text-base">

              O radar das melhores ofertas

            </p>

            <div className="mx-auto mt-8 h-px w-28 bg-emerald-700/40" />

          </div>

          {/* Hero */}

          <div className="mx-auto mt-14 max-w-4xl text-center">

            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">

              Comprar bem começa comparando.

            </h2>

            <h3 className="mt-3 text-3xl font-black leading-tight text-emerald-700 md:text-5xl">

              Antes de sair de casa.

            </h3>

            <p className="mx-auto mt-10 max-w-3xl text-lg leading-9 text-slate-600 md:text-xl">

              Enquanto você vive o seu dia,

              <br />

              o BaratoRadar continua pesquisando os preços

              <br />

              dos principais supermercados para mostrar

              <br />

              onde vale mais a pena comprar.

            </p>

          </div>

          {/* Botão */}

          <div className="mt-14 flex justify-center">

            <Link
              href="/ofertas"
              className="
                inline-flex
                items-center
                gap-3
                rounded-2xl
                bg-emerald-700
                px-10
                py-5
                text-lg
                font-bold
                text-white
                shadow-xl
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-emerald-800
                hover:shadow-2xl
              "
            >

              Ver onde comprar melhor

              <span className="text-xl">

                →

              </span>

            </Link>

          </div>

          {/* Radar */}

          <div className="mx-auto mt-14 max-w-2xl rounded-3xl border border-emerald-100 bg-emerald-50/70 p-7 text-center">

            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-emerald-700">

              📡 O Radar está trabalhando para você

            </p>

            <p className="mt-4 text-lg leading-8 text-slate-700">

              Neste momento continuamos pesquisando milhares de ofertas para ajudar você a decidir melhor antes de sair de casa.

            </p>

          </div>

          {/* Continue */}

          <div className="mt-14 text-center">

            <p className="text-sm font-semibold tracking-wide text-slate-500">

              Descubra como o BaratoRadar trabalha para você

            </p>

            <div className="mt-3 text-2xl text-slate-400 animate-bounce">

              ↓

            </div>

          </div>

        </div>

      </div>

    </section>

  );
}