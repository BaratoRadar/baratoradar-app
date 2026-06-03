export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";

type SP = {
  q?: string;
  regiao?: string;
};

export default async function ProteinasPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;

  const q = (sp?.q ?? "").trim();
  const regiao = (sp?.regiao ?? "").trim();

  const offers = await prisma.offer.findMany({
    where: {
      product: {
        category: "Proteínas",
        ...(q
          ? {
              name: { contains: q, mode: "insensitive" },
            }
          : {}),
      },
      ...(regiao
        ? {
            region: { contains: regiao, mode: "insensitive" },
          }
        : {}),
    },
    include: { product: true, store: true },
    orderBy: { price: "asc" }, // menor preço primeiro
    take: 100,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Proteínas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Frango, bovinos, suínos, ovos e peixes — ordenados pelo menor preço.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Debug: q={q || "-"} | regiao={regiao || "-"} | resultados={offers.length}
          </p>
        </div>

        <form method="get" className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar (frango, ovos, peixe...)"
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-700/30"
          />

          <select
            name="regiao"
            defaultValue={regiao}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            <option value="">Todas as cidades</option>
            <option value="Porto Alegre">Porto Alegre</option>
            <option value="São Paulo">São Paulo</option>
            <option value="Centro">Centro</option>
            <option value="Zona Norte">Zona Norte</option>
            <option value="Zona Sul">Zona Sul</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Buscar
          </button>

          <a
            href="/proteinas"
            className="rounded-xl border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </a>
        </form>
      </div>

      {/* Destaque da melhor oferta */}
      {offers.length > 0 && (
        <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-orange-600">🔥 MELHOR PREÇO</div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {offers[0].product.name} {offers[0].unit ? `(${offers[0].unit})` : ""}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {offers[0].store.name} • {offers[0].region ?? "Porto Alegre"}
          </div>
          <div className="mt-2 text-2xl font-extrabold text-green-700">
            {offers[0].price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Região</th>
              <th className="px-4 py-3">Válido até</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {o.product.name} {o.unit ? `(${o.unit})` : ""}
                </td>
                <td className="px-4 py-3 text-slate-700">{o.store.name}</td>
                <td className="px-4 py-3 font-extrabold text-green-700">
                  {o.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-3 text-slate-700">{o.region ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {o.validUntil ? new Date(o.validUntil).toLocaleDateString("pt-BR") : "-"}
                </td>
              </tr>
            ))}

            {offers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={5}>
                  Nenhuma oferta de proteínas encontrada. Rode o seed novamente ou adicione mais itens.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Transparência: o BaratoRadar organiza ofertas públicas divulgadas pelos supermercados. Preços e disponibilidade podem variar.
      </p>
    </main>
  );
}