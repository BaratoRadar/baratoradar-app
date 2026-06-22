export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SP = {
  cidade?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const cidade = (sp?.cidade ?? "").trim();

  const offers = await prisma.offer.findMany({
    where: cidade
      ? {
          city: {
            equals: cidade,
            mode: "insensitive",
          },
        }
      : {},
    include: {
      product: true,
      store: true,
    },
    orderBy: { price: "asc" },
    take: 8,
  });
  const uniqueOffers = Array.from(
  new Map(
    offers.map((offer) => [
      `${offer.product.name.toLowerCase()}-${offer.store.name.toLowerCase()}-${offer.price}-${offer.city?.toLowerCase()}-${offer.region?.toLowerCase()}`,
      offer,
    ])
  ).values()
);
const menorItemCesta = await prisma.offer.findFirst({
  where: {
    ...(cidade
      ? {
          city: {
            equals: cidade,
            mode: "insensitive",
          },
        }
      : {}),
    product: {
      category: {
        contains: "Cesta",
        mode: "insensitive",
      },
    },
  },
  include: {
    product: true,
    store: true,
  },
  orderBy: { price: "asc" },
});
  const cestaProducts = await prisma.product.findMany({
    where: {
      OR: [
        { category: "Cesta Básica" },
        { category: "Cesta básica" },
        { category: "cesta básica" },
      ],
    },
    include: {
      offers: {
        where: cidade
          ? {
              city: {
                equals: cidade,
                mode: "insensitive",
              },
            }
          : {},
        include: {
          store: true,
        },
      },
    },
  });
  const cestaProductNames = cestaProducts.map((p) => p.name).join(", ");
  const storeTotals: Record<string, number> = {};

  for (const product of cestaProducts) {
    const bestByStore: Record<string, number> = {};

    for (const offer of product.offers) {
      const store = offer.store.name;

      if (!bestByStore[store] || offer.price < bestByStore[store]) {
        bestByStore[store] = offer.price;
      }
    }

    for (const [store, price] of Object.entries(bestByStore)) {
      if (!storeTotals[store]) {
        storeTotals[store] = 0;
      }
      storeTotals[store] += price;
    }
  }

  const rankingCidade = Object.entries(storeTotals)
    .map(([store, total]) => ({ store, total }))
    .sort((a, b) => a.total - b.total);

  const maisBaratoCidade = rankingCidade[0] ?? null;

  const regionStoreTotals: Record<string, Record<string, number>> = {};
const bestRegionItem: Record<
  string,
  Record<string, { productName: string; price: number }>
> = {};
  for (const product of cestaProducts) {
    const bestByRegionStore: Record<string, Record<string, number>> = {};

    for (const offer of product.offers) {
      if (!offer.region) continue;

      const region = offer.region;
      const store = offer.store.name;
if (!bestRegionItem[region]) {
  bestRegionItem[region] = {};
}

const currentBest = bestRegionItem[region][store];

if (!currentBest || offer.price < currentBest.price) {
  bestRegionItem[region][store] = {
    productName: product.name,
    price: offer.price,
  };
}
      if (!bestByRegionStore[region]) {
        bestByRegionStore[region] = {};
      }

      if (
        !bestByRegionStore[region][store] ||
        offer.price < bestByRegionStore[region][store]
      ) {
        bestByRegionStore[region][store] = offer.price;
      }
    }

    for (const [region, stores] of Object.entries(bestByRegionStore)) {
      if (!regionStoreTotals[region]) {
        regionStoreTotals[region] = {};
      }

      for (const [store, price] of Object.entries(stores)) {
        if (!regionStoreTotals[region][store]) {
          regionStoreTotals[region][store] = 0;
        }
        regionStoreTotals[region][store] += price;
      }
    }
  }

  const rankingPorRegiao = Object.entries(regionStoreTotals)
    .map(([region, stores]) => {
      const ranking = Object.entries(stores)
        .map(([store, total]) => ({ store, total }))
        .sort((a, b) => a.total - b.total);

      const winner = ranking[0] ?? null;

return {
  region,
  winner,
  productName: winner
    ? bestRegionItem[region]?.[winner.store]?.productName
    : null,
};
})
.filter((item) => item.winner);

  const melhorOferta = offers[0] ?? null;
const proteinas = await prisma.offer.findMany({
  where: {
    product: {
      category: "Proteínas",
    },
  },
  include: {
    product: true,
    store: true,
  },
  orderBy: { price: "asc" },
});

const painelProteinas = [
  {
    label: "Ovos",
    icon: "🥚",
    offer: proteinas.find((o) =>
      o.product.name.toLowerCase().includes("ovo")
    ),
  },
  {
    label: "Frango",
    icon: "🐔",
    offer: proteinas.find(
      (o) =>
        o.product.name.toLowerCase().includes("frango") ||
        o.product.name.toLowerCase().includes("coxa")
    ),
  },
  {
    label: "Suínos",
    icon: "🐷",
    offer: proteinas.find(
      (o) =>
        o.product.name.toLowerCase().includes("suíno") ||
        o.product.name.toLowerCase().includes("suino") ||
        o.product.name.toLowerCase().includes("lombo")
    ),
  },
  {
    label: "Bovinos",
    icon: "🥩",
    offer: proteinas.find(
      (o) =>
        o.product.name.toLowerCase().includes("bovina") ||
        o.product.name.toLowerCase().includes("alcatra") ||
        o.product.name.toLowerCase().includes("coxão")
    ),
  },
  {
    label: "Pescados",
    icon: "🐟",
    offer: proteinas.find(
      (o) =>
        o.product.name.toLowerCase().includes("peixe") ||
        o.product.name.toLowerCase().includes("tilápia") ||
        o.product.name.toLowerCase().includes("filé")
    ),
  },
];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-emerald-900 text-white p-8 md:p-12 shadow-xl mb-8">
  <div className="max-w-3xl">
    <p className="uppercase tracking-widest text-emerald-300 text-xs font-bold mb-3">
      Plataforma em teste
    </p>

    <h1 className="text-4xl md:text-6xl font-black leading-tight">
      Compare ofertas e encontre os melhores preços.
    </h1>

    <p className="mt-5 text-slate-200 text-lg">
      Proteínas, cesta básica e supermercados monitorados em tempo real.
    </p>
  </div>
</section>
<form method="get" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="text-sm font-bold text-slate-900">
        Escolha sua cidade
      </div>
      <p className="text-sm text-slate-500">
        Veja ofertas, rankings e melhores preços por localidade.
      </p>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <select
        name="cidade"
        defaultValue={cidade}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
      >
        <option value="">Todas as cidades</option>
        <option value="Porto Alegre">Porto Alegre</option>
        <option value="São Paulo">São Paulo</option>
        <option value="Florianópolis">Florianópolis</option>
        <option value="Curitiba">Curitiba</option>
        <option value="Rio de Janeiro">Rio de Janeiro</option>
        <option value="Belo Horizonte">Belo Horizonte</option>
        <option value="Recife">Recife</option>
        <option value="Fortaleza">Fortaleza</option>
        <option value="Brasília">Brasília</option>
        <option value="Goiânia">Goiânia</option>
        <option value="Belém">Belém</option>
        <option value="Manaus">Manaus</option>
      </select>

      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
      >
        Aplicar
      </button>
    </div>
  </div>
</form>
<div className="mt-10 space-y-6">
      {menorItemCesta && (
        <section
  className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
  style={{ border: "4px solid #facc15" }}
>
          <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
            🥇 MAIS BARATO {cidade ? `EM ${cidade.toUpperCase()}` : "DA CIDADE"}
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900">
  {menorItemCesta.store.name}
</div>
<div className="mt-2 text-lg font-bold text-slate-700">
  {menorItemCesta.product.name}
</div>


          <div className="mt-3 text-5xl font-black text-emerald-600">
            {menorItemCesta.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
          
          <p className="mt-2 text-sm text-slate-500">
  Menor preço encontrado para item de cesta básica cadastrado no BaratoRadar.
</p>

        </section>
      )}

      {melhorOferta && (
       <section
  className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
  style={{ border: "4px solid #fb923c" }}
>
          <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
            🔥 MELHOR OFERTA DO DIA
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {melhorOferta.product.name}
          </div>

          <div className="mt-3 text-5xl font-black text-emerald-600">
  {melhorOferta.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}
</div>
      <div className="mt-3 text-sm font-semibold text-slate-600">
  {melhorOferta.store.name} • {melhorOferta.city} •{" "}
  {melhorOferta.region}
</div>    
        </section>
      )}
<section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl">
  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
    <div>
      <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        🇧🇷 PAINEL NACIONAL DE PROTEÍNAS
      </div>

      <h2 className="mt-3 text-2xl font-black text-slate-900">
        Menores preços nacionais por proteína
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Comparativo entre as capitais monitoradas pelo BaratoRadar.
      </p>
    </div>

    <Link
      href="/proteinas"
      className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200"
    >
      Ver proteínas
    </Link>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    {painelProteinas.map(
      (item) =>
        item.offer && (
          <div
            key={item.label}
            className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm"
          >
            <div className="text-3xl">{item.icon}</div>

            <div className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </div>

            <div className="mt-2 text-sm font-semibold text-slate-900">
              {item.offer.product.name}
            </div>

            <div className="mt-2 text-2xl font-extrabold text-emerald-700">
              {item.offer.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              {item.offer.store.name} • {item.offer.city}
            </div>
          </div>
        )
    )}
  </div>
</section>
</div>

<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            📍 Mais barato por região
          </h2>

          <Link
            href={`/cesta-basica-regiao${cidade ? `?cidade=${encodeURIComponent(cidade)}` : ""}`}
            className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-700 hover:bg-sky-200"
          >
            Ver completo
          </Link>
        </div>

<p className="mt-4 text-sm text-slate-500">
  Comparativo baseado nos itens de cesta básica cadastrados por região.
</p>

<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rankingPorRegiao.map((item) => (
  <div
    key={item.region}
    className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
  >
    <div className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
      {item.region}
    </div>

    <div className="mt-2 text-lg font-bold text-slate-900">
  {item.winner?.store}
</div>

<div className="mt-1 text-sm font-semibold text-slate-600">
  {item.productName}
</div>

    <div className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
  Total da cesta
</div>

<div className="mt-1 text-2xl font-extrabold text-green-700">
  {item.winner?.total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}
</div>
  </div>
))}

          {rankingPorRegiao.length === 0 && (
            <div className="rounded-2xl border bg-white p-5 text-slate-600 shadow-sm">
              Ainda não há dados suficientes por região.
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Melhores ofertas
          </h2>

          <Link
            href={`/ofertas${cidade ? `?cidade=${encodeURIComponent(cidade)}` : ""}`}
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Ver todas
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {uniqueOffers.map((o) => (
            <div
              key={o.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="text-xs font-semibold text-slate-500">
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
  {o.product.category ?? "Oferta"}
</span>
              </div>

              <div className="mt-2 text-lg leading-snug font-bold text-slate-900">
                {o.product.name}
              </div>

              <div className="mt-2 text-xs text-slate-500">
                {o.store.name} • {o.city ?? "Sem cidade"} •{" "}
                {o.region ?? "Sem região"}
              </div>

              <div className="mt-3 text-3xl font-black text-emerald-600">
                {o.price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Categorias</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/proteinas"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <div className="text-2xl">🥩</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Proteínas
            </div>
            <p className="mt-2 text-sm text-slate-500">
  Frango, ovos, carne bovina e mais.
</p>
          </Link>

          <Link
            href="/cesta-basica"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <div className="text-2xl">🧺</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Cesta básica
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Arroz, feijão, café, erva-mate e macarrão.
            </p>
          </Link>

          <Link
            href="/limpeza"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <div className="text-2xl">🧴</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Limpeza
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Sabão, detergente, água sanitária e desinfetante.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}