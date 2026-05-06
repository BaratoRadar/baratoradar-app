import { prisma } from "@/lib/prisma";
import ClickButtons from "@/app/components/ClickButtons";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const p = params instanceof Promise ? await params : params;
  const storeName = decodeURIComponent(p.slug);

  const offers = await prisma.offer.findMany({
    where: {
      store: {
        name: storeName,
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

  const validOffers = offers.filter((o) => o.product?.name);
  const cheapest = validOffers[0];
  const mostExpensive = validOffers[validOffers.length - 1];

  const savings =
    cheapest && mostExpensive
      ? mostExpensive.price - cheapest.price
      : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <a
        href="/cesta-basica-ranking"
        className="text-sm text-green-700 hover:underline"
      >
        ← Voltar ao ranking
      </a>

      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
        Ofertas — {storeName}
      </h1>
<p className="mt-2 text-xs text-slate-500">
  Última atualização: {new Date().toLocaleDateString("pt-BR")}
</p>
      {/* BOTÕES */}
      <ClickButtons storeName={storeName} />

      {/* PATROCINADO */}
      <div className="mt-6 rounded-2xl border border-yellow-300 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-yellow-800">
          🔥 Oferta em destaque
        </p>
        <p className="mt-1 text-sm text-yellow-700">
          Este espaço pode ser patrocinado pelo supermercado.
        </p>
      </div>

      {/* MAIS BARATO */}
      {cheapest && (
        <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            💰 Mais barato desta loja
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slate-800">
              {cheapest.product.name}
            </span>

            <span className="font-bold text-green-700">
              {cheapest.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      )}

      {/* MAIS CARO */}
      {mostExpensive && (
        <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            🔴 Mais caro desta loja
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slate-800">
              {mostExpensive.product.name}
            </span>

            <span className="font-bold text-red-700">
              {mostExpensive.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      )}

      {/* ECONOMIA */}
      {savings > 0 && (
        <div className="mt-4 rounded-2xl border border-blue-300 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">
            💡 Economia possível nesta loja
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slate-800">
              Diferença entre o produto mais barato e o mais caro
            </span>

            <span className="font-bold text-blue-700">
              {savings.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      )}

      <p className="mt-6 text-slate-600">
        Lista de ofertas cadastradas para este supermercado.
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Ofertas encontradas: {offers.length}
      </p>

      {/* TABELA */}
      <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Região</th>
            </tr>
          </thead>

          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {o.product.name}
                </td>

                <td className="px-4 py-3 font-bold text-green-700">
                  {o.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {o.city ?? "-"}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {o.region ?? "-"}
                </td>
              </tr>
            ))}

            {offers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-600">
                  Nenhuma oferta encontrada para este supermercado.
                </td>
              </tr>
            )}
 </tbody>
</table>
</div>

{/* DISCLAIMER */}
<div className="mt-10 text-xs text-slate-500 space-y-1">
  <p>
    * Os preços são coletados automaticamente de fontes públicas e podem sofrer alterações sem aviso prévio.
  </p>
  <p>
    * O BaratoRadar não garante disponibilidade de estoque nas lojas.
  </p>
  <p>
    * As ofertas podem variar por região, loja física ou canal online.
  </p>
</div>

</main>
);
}