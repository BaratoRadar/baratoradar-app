export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";

type SP = {
  cidade?: string;
};
function categoriaProduto(nome: string) {
  const n = nome.toLowerCase();

  if (n.includes("arroz")) return "arroz";
  if (n.includes("feij")) return "feijão";
  if (n.includes("oleo") || n.includes("óleo")) return "óleo";
  if (n.includes("leite")) return "leite";
  if (n.includes("acucar") || n.includes("açúcar")) return "açúcar";
  if (n.includes("cafe") || n.includes("café")) return "café";

  return null;
}
export default async function CestaRankingPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const cidade = (sp?.cidade ?? "").trim();

  const products = await prisma.product.findMany({
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

  const storeTotals: Record<string, number> = {};
const storeItems: Record<string, Record<string, number>> = {};

  for (const product of products) {
    const categoria = categoriaProduto(product.name);
if (!categoria) continue;
    const bestByStore: Record<string, number> = {};

    for (const offer of product.offers) {
      const store = offer.store.name;

      if (!bestByStore[store] || offer.price < bestByStore[store]) {
        bestByStore[store] = offer.price;
      }
    }

    for (const [store, price] of Object.entries(bestByStore)) {
  if (!storeItems[store]) {
    storeItems[store] = {};
  }

  const categoria = categoriaProduto(product.name);
  if (!categoria) continue;

  const existente = storeItems[store][categoria];

  if (!existente || price < existente) {
    storeItems[store][categoria] = price;
  }
}

    }
  }

  const ranking = Object.entries(storeTotals)
  .map(([store, total]) => ({
    store,
    total,
    items: storeItems[store] ?? [],
  }))
  .filter((item) => item.items.length >= 4) // 👈 A

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Ranking da Cesta Básica
          </h1>

          <p className="mt-2 text-slate-600">
            Soma dos menores preços por produto em cada supermercado
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Cidade selecionada: {cidade || "Todas"} | Produtos encontrados: {products.length} | supermercados: {ranking.length}
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
            <option value="Canoas">Canoas</option>
            <option value="Novo Hamburgo">Novo Hamburgo</option>
            <option value="São Leopoldo">São Leopoldo</option>
            <option value="Gravataí">Gravataí</option>
          </select>

          <button className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
            Filtrar
          </button>

          <a
            href="/cesta-basica-ranking"
            className="rounded-xl border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </a>
        </form>
      </div>

      <div className="mt-8 space-y-6">
        {ranking.map((item, index) => {
          const medal =
            index === 0 ? "🥇" :
            index === 1 ? "🥈" :
            index === 2 ? "🥉" : "🏪";

          return (
            <div
              key={item.store}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900">
                  {medal} {item.store}
                </div>

                <div className="text-2xl font-bold text-green-700">
                  {item.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Menor preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.items.map((p) => (
                      <tr key={`${item.store}-${p.product}`} className="border-t">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {p.product}
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700">
                          {p.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
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
            Nenhum dado disponível para cesta básica nessa cidade.
          </div>
        )}
      </div>
    </main>
  );
}