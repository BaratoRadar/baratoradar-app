import Link from "next/link";

import QuickCategories from "@/components/QuickCategories";
import HomeHero from "@/components/home/HomeHero";
import { prisma } from "@/lib/prisma";
import { activeOfferWhere } from "@/lib/active-offers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    where: {
  ...activeOfferWhere(),
  ...(cidade
    ? {
        city: {
          equals: cidade,
          mode: "insensitive",
        },
      }
    : {}),
},
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
    ...activeOfferWhere(),
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

  const destaqueRadar = await prisma.offer.findFirst({
  where: {
    ...activeOfferWhere(),
    ...(cidade
      ? {
          city: {
            equals: cidade,
            mode: "insensitive",
          },
        }
      : {}),
    price: {
      gte: 2,
    },
    product: {
      OR: [
        {
          category: {
            contains: "Prote",
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: "Cesta",
            mode: "insensitive",
          },
        },
      ],
    },
  },
  include: {
    product: true,
    store: true,
  },
  orderBy: {
    price: "asc",
  },
});
const proteinas = await prisma.offer.findMany({
  where: {
    ...activeOfferWhere(),
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

const nomeProduto = (nome: string) =>
  nome.toLowerCase();

const contemAlgum = (
  nome: string,
  termos: string[]
) => termos.some((termo) => nome.includes(termo));

const painelProteinas = [
  {
    label: "Ovos",
    icon: "🥚",
    offer: proteinas.find((o) => {
      const n = nomeProduto(o.product.name);

      return contemAlgum(n, [
        "ovo branco",
        "ovos brancos",
        "ovo vermelho",
        "ovos vermelhos",
        "ovo caipira",
        "ovos caipiras",
        "dúzia de ovos",
        "duzia de ovos",
        "bandeja de ovos",
        "ovos bandeja",
      ]);
    }),
  },
  {
    label: "Frango",
    icon: "🐔",
    offer: proteinas.find((o) => {
      const n = nomeProduto(o.product.name);

      return (
        contemAlgum(n, [
          "frango inteiro",
          "coxa de frango",
          "coxa frango",
          "sobrecoxa",
          "peito de frango",
          "peito frango",
          "filé de peito",
          "file de peito",
          "asa de frango",
          "asa frango",
          "coxinha da asa",
        ]) &&
        !contemAlgum(n, [
          "hambúrguer",
          "hamburguer",
          "empanad",
          "steak",
          "patê",
          "pate",
          "sopa",
          "instantâne",
          "instantane",
          "ração",
          "racao",
        ])
      );
    }),
  },
  {
    label: "Suínos",
    icon: "🐷",
    offer: proteinas.find((o) => {
      const n = nomeProduto(o.product.name);

      return (
        contemAlgum(n, [
          "costela suína",
          "costela suina",
          "lombo suíno",
          "lombo suino",
          "pernil suíno",
          "pernil suino",
          "bisteca suína",
          "bisteca suina",
          "copa lombo",
        ]) &&
        !contemAlgum(n, [
          "ração",
          "racao",
          "sabor",
        ])
      );
    }),
  },
  {
    label: "Bovinos",
    icon: "🥩",
    offer: proteinas.find((o) => {
      const n = nomeProduto(o.product.name);

      return (
        contemAlgum(n, [
          "alcatra",
          "coxão mole",
          "coxao mole",
          "coxão duro",
          "coxao duro",
          "patinho",
          "maminha",
          "picanha",
          "contrafilé",
          "contrafile",
          "acém",
          "acem",
          "paleta bovina",
          "costela bovina",
        ]) &&
        !contemAlgum(n, [
          "hambúrguer",
          "hamburguer",
          "caldo",
          "macarrão",
          "macarrao",
          "ração",
          "racao",
        ])
      );
    }),
  },
  {
    label: "Pescados",
    icon: "🐟",
    offer: proteinas.find((o) => {
      const n = nomeProduto(o.product.name);

      return (
        contemAlgum(n, [
          "filé de tilápia",
          "file de tilapia",
          "tilápia",
          "tilapia",
          "filé de merluza",
          "file de merluza",
          "merluza",
          "salmão",
          "salmao",
          "pescada",
          "sardinha inteira",
        ]) &&
        !contemAlgum(n, [
          "ração",
          "racao",
          "gato",
          "gatos",
          "cão",
          "cães",
          "cao",
          "caes",
          "alimento",
          "pet",
          "empanad",
          "nugget",
          "bolinho",
          "hambúrguer",
          "hamburguer",
        ])
      );
    }),
  },
];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <HomeHero />
      <section className="mt-12">
  <QuickCategories />
</section>

<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <Link
    href="/ofertas"
    className="group rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="text-3xl">🔥</div>
    <div className="mt-3 text-lg font-black text-slate-900">
      Ofertas do dia
    </div>
    <p className="mt-1 text-sm text-slate-500">
      Veja os menores preços encontrados pelo radar.
    </p>
  </Link>

  <Link
    href="/proteinas"
    className="group rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="text-3xl">🥩</div>
    <div className="mt-3 text-lg font-black text-slate-900">
      Proteínas
    </div>
    <p className="mt-1 text-sm text-slate-500">
      Compare carnes, frango, ovos e pescados.
    </p>
  </Link>

  <Link
    href="/cesta-basica-regiao"
    className="group rounded-3xl border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="text-3xl">🧺</div>
    <div className="mt-3 text-lg font-black text-slate-900">
      Cesta básica
    </div>
    <p className="mt-1 text-sm text-slate-500">
      Descubra onde sua cesta custa menos.
    </p>
  </Link>

  <Link
    href="/cesta-basica-ranking"
    className="group rounded-3xl border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="text-3xl">📊</div>
    <div className="mt-3 text-lg font-black text-slate-900">
      Rankings
    </div>
    <p className="mt-1 text-sm text-slate-500">
      Compare supermercados e regiões.
    </p>
  </Link>
</section>

      {destaqueRadar && (
       <section
  className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
  style={{ border: "4px solid #fb923c" }}
>
          <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
            🔎 DESTAQUE DO RADAR
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {destaqueRadar.product.name}
          </div>

          <div className="mt-3 text-5xl font-black text-emerald-600">
           {destaqueRadar.price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
           })}
</div>
      <div className="mt-3 text-sm font-semibold text-slate-600">
  {destaqueRadar.store.name} • {destaqueRadar.city}
{destaqueRadar.region &&
destaqueRadar.region.toLowerCase() !==
  destaqueRadar.city?.toLowerCase()
  ? ` • ${destaqueRadar.region}`
  : ""}
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

      
</main>
  );
}