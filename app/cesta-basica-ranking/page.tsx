export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";

type SP = {
  cidade?: string;
};

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoriaProduto(nome: string) {
  const n = normalizar(nome);

  if (n.includes("arroz")) return "arroz";
  if (n.includes("feij")) return "feijão";
  if (n.includes("oleo")) return "óleo";
  if (n.includes("leite")) return "leite";
  if (n.includes("acucar")) return "açúcar";
  if (n.includes("cafe")) return "café";

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

  const storeItems: Record<string, Record<string, number>> = {};

  for (const product of products) {
    const categoria = categoriaProduto(product.name);
    if (!categoria) continue;

    for (const offer of product.offers) {
      const store = offer.store.name;

      if (!storeItems[store]) {
        storeItems[store] = {};
      }

      const existente = storeItems[store][categoria];

      if (!existente || offer.price < existente) {
        storeItems[store][categoria] = offer.price;
      }
    }
  }

  const rankingBase = Object.entries(storeItems)
    .map(([store, categorias]) => {
      const items = Object.entries(categorias).map(([product, price]) => ({
        product,
        price,
      }));

      const total = items.reduce((sum, item) => sum + item.price, 0);

      return {
        store,
        total,
        items,
      };
    })
    .filter((item) => item.items.length >= 2)
    .sort((a, b) => a.total - b.total);

  const ranking = rankingBase.map((item, index) => ({
    ...item,
    diff: index === 0 ? 0 : item.total - rankingBase[0].total,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Ranking da Cesta Básica
          </h1>

          <p className="mt-2 text-slate-600">
            Menor preço por categoria em cada supermercado
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Cidade selecionada: {cidade || "Todas"} | supermercados:{" "}
            {ranking.length}
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
            <option value="São Paulo">São Paulo</option>
            <option value="Florianópolis">Florianópolis</option>
            <option value="Curitiba">Curitiba</option>
            <option value="Rio de Janeiro">Rio de Janeiro</option>
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
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏪";

          return (
            <div
              key={item.store}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a
                    href={`/supermercado/${encodeURIComponent(item.store)}`}
                    className="text-lg font-semibold text-slate-900 hover:underline"
                  >
                    {medal} {item.store}
                  </a>

                  <p className="mt-2 text-xs text-slate-500">
                    Itens considerados: {item.items.length}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">
                    {item.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>

                  {item.diff > 0 && (
                    <p className="mt-1 text-sm text-red-500">
                      +
                      {item.diff.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}{" "}
                      mais caro que o 1º
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Categoria</th>
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

        <div className="mt-10 text-xs text-slate-500 space-y-1">
          <p>
            * Os preços são coletados automaticamente de fontes públicas e podem sofrer alterações sem aviso prévio.
          </p>
          <p>
            * O BaratoRadar não garante disponibilidade de estoque nas lojas.
          </p>
          <p>
            * As ofertas podem variar por cidade, região, loja física ou canal online.
          </p>
        </div>
      </div>
    </main>
  );
}