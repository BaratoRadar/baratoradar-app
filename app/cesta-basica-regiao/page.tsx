export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";

type SP = {
  cidade?: string;
};

export default async function CestaPorRegiaoPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const cidade = (sp?.cidade ?? "").trim();

  const products = await prisma.product.findMany({
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

  const regionStoreTotals: Record<string, Record<string, number>> = {};

  for (const product of products) {
    const bestByRegionStore: Record<string, Record<string, number>> = {};

    for (const offer of product.offers) {
      const region = offer.region || "Sem região";
      const store = offer.store.name;

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

  const regions = Object.entries(regionStoreTotals).map(([region, stores]) => {
    const ranking = Object.entries(stores)
      .map(([store, total]) => ({ store, total }))
      .sort((a, b) => a.total - b.total);

    return { region, ranking };
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Cesta Básica por Região
          </h1>

          <p className="mt-2 text-slate-600">
            Ranking dos supermercados por região da cidade
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Cidade selecionada: {cidade || "Todas"} | regiões: {regions.length}
          </p>
        </div>

        <form method="get" className="flex gap-2">
          <select
            name="cidade"
            defaultValue={cidade}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            <option value="">Todas as cidades</option>
            <option value="Porto Alegre">Porto Alegre</option>
            <option value="São Paulo">São Paulo</option>
            <option value="Canoas">Canoas</option>
            <option value="Novo Hamburgo">Novo Hamburgo</option>
            <option value="São Leopoldo">São Leopoldo</option>
            <option value="Gravataí">Gravataí</option>
          </select>

          <button className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
            Filtrar
          </button>

          <a
            href="/cesta-basica-regiao"
            className="rounded-xl border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </a>
        </form>
      </div>

      <div className="mt-8 space-y-8">
        {regions.map((r) => (
          <div key={r.region}>
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              📍 {r.region}
            </h2>

            <div className="space-y-4">
              {r.ranking.map((item, index) => {
                const medal =
                  index === 0 ? "🥇" :
                  index === 1 ? "🥈" :
                  index === 2 ? "🥉" : "🏪";

                return (
                  <div
                    key={item.store}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">
                        {medal} {item.store}
                      </div>

                      <div className="text-xl font-bold text-green-700">
                        {item.total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {regions.length === 0 && (
          <div className="text-slate-600">
            Nenhum dado disponível por região nessa cidade.
          </div>
        )}
      </div>
    </main>
  );
}