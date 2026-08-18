export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { activeOfferWhere } from "@/lib/active-offers";
const CESTA_BASICA = [
  "Arroz 5kg",
  "Feijão preto 1kg",
  "Macarrão espaguete 500g",
  "Erva-mate 1kg",
  "Café 500g",
  "Peito de frango",
];

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

type SP = {
  regiao?: string;
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const regiao = (sp?.regiao ?? "").trim();

  const offers = await prisma.offer.findMany({
    where: {
          ...activeOfferWhere(),
      product: {
        name: {
          in: CESTA_BASICA,
        },
      },
      ...(regiao
        ? {
            region: {
              contains: regiao,
              mode: "insensitive",
            },
          }
        : {}),
    },
    include: {
      product: true,
      store: true,
    },
    orderBy: [{ storeId: "asc" }, { productId: "asc" }, { price: "asc" }],
  });

  const byStore: Record<
    string,
    {
      storeId: string;
      storeName: string;
      total: number;
      items: {
        product: string;
        price: number;
        region: string | null;
      }[];
    }
  > = {};

  for (const offer of offers) {
    const storeId = offer.store.id;

    if (!byStore[storeId]) {
      byStore[storeId] = {
        storeId,
        storeName: offer.store.name,
        total: 0,
        items: [],
      };
    }

    const alreadyHasProduct = byStore[storeId].items.some(
      (item) => item.product === offer.product.name
    );

    if (!alreadyHasProduct) {
      byStore[storeId].items.push({
        product: offer.product.name,
        price: offer.price,
        region: offer.region,
      });

      byStore[storeId].total += offer.price;
    }
  }

  const ranking = Object.values(byStore)
    .filter((store) => store.items.length > 0)
    .sort((a, b) => a.total - b.total);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            🏆 Ranking da Cesta Básica
          </h1>

          <p className="mt-2 text-slate-600">
            Comparativo do menor preço por supermercado com base nos itens da cesta básica cadastrados no BaratoRadar.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Região selecionada: {regiao || "Todas"} | supermercados: {ranking.length}
          </p>
        </div>

        <form method="get" className="flex gap-2">
          <select
            name="regiao"
            defaultValue={regiao}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            <option value="">Todas as regiões</option>
            <option value="Centro">Centro</option>
            <option value="Zona Norte">Zona Norte</option>
            <option value="Zona Sul">Zona Sul</option>
            <option value="Zona Leste">Zona Leste</option>
          </select>

          <button className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
            Filtrar
          </button>

          <a
            href="/ranking"
            className="rounded-xl border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </a>
        </form>
      </div>

      <div className="mt-8 space-y-6">
        {ranking.map((store, index) => {
          const medal =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏪";

          return (
            <div
              key={store.storeId}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {medal}{" "}
                    <a
                      href={`/supermercado/${slugify(store.storeName)}`}
                      className="text-green-700 hover:underline"
                    >
                      {store.storeName}
                    </a>
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {store.items.length} item(ns) considerados no cálculo
                  </p>
                </div>

                <div className="text-2xl font-extrabold text-green-700">
                  {store.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Preço</th>
                      <th className="px-4 py-3">Região</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.items.map((item) => (
                      <tr key={`${store.storeId}-${item.product}`} className="border-t">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.product}
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700">
                          {item.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.region ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {ranking.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 text-slate-600 shadow-sm">
            Ainda não há ofertas suficientes para calcular o ranking da cesta básica nessa região.
          </div>
        )}
      </div>
    </main>
  );
}