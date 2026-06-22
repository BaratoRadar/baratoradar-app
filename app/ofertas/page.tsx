export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

type SP = {
  busca?: string;
  cidade?: string;
  regiao?: string;
};

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;

  const busca = (sp?.busca ?? "").trim();
  const cidade = (sp?.cidade ?? "").trim();
  const regiao = (sp?.regiao ?? "").trim();
const offers = await prisma.offer.findMany({
  where: {
    ...(busca
      ? {
          product: {
            name: {
              contains: busca,
              mode: "insensitive",
            },
          },
        }
      : {}),
    ...(cidade
      ? {
          city: {
            equals: cidade,
            mode: "insensitive",
          },
        }
      : {}),
    ...(regiao
      ? {
          region: {
            equals: regiao,
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
});
  const uniqueOffers = Array.from(
  new Map(
    offers.map((offer) => [
      `${offer.product.name.toLowerCase()}-${offer.store.name.toLowerCase()}-${offer.price}-${offer.city?.toLowerCase()}-${offer.region?.toLowerCase()}`,
      offer,
    ])
  ).values()
);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Ofertas</h1>

      <p className="mt-2 text-slate-600">
        Lista de ofertas cadastradas no BaratoRadar.
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <input
          name="busca"
          defaultValue={busca}
          placeholder="Buscar produto..."
          className="rounded-xl border px-4 py-2 text-sm"
        />

        <select
          name="cidade"
          defaultValue={cidade}
          className="rounded-xl border px-4 py-2 text-sm"
        >
          <option value="">Todas as cidades</option>
          <option value="Porto Alegre">Porto Alegre</option>
          <option value="São Paulo">São Paulo</option>
          <option value="Florianópolis">Florianópolis</option>
          <option value="Curitiba">Curitiba</option>
          <option value="Rio de Janeiro">Rio de Janeiro</option>
          <option value="Canoas">Canoas</option>
          <option value="Novo Hamburgo">Novo Hamburgo</option>
          <option value="São Leopoldo">São Leopoldo</option>
          <option value="Gravataí">Gravataí</option>
          <option value="Belo Horizonte">Belo Horizonte</option>
          <option value="Recife">Recife</option>
          <option value="Fortaleza">Fortaleza</option>
          <option value="Brasília">Brasília</option>
          <option value="Goiânia">Goiânia</option>
          <option value="Belém">Belém</option>
          <option value="Manaus">Manaus</option>
        </select>

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
          href="/ofertas"
          className="rounded-xl border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Limpar
        </a>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Cidade: {cidade || "Todas"} | Região: {regiao || "Todas"} | Ofertas encontradas: {uniqueOffers.length}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Supermercado</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Região</th>
              <th className="px-4 py-3">Atualização</th>
            </tr>
          </thead>

          <tbody>
            {uniqueOffers.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {o.product.name}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  <a
                    href={`/supermercado/${slugify(o.store.name)}`}
                    className="font-semibold text-green-700 hover:underline"
                  >
                    {o.store.name}
                  </a>
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
                <td className="px-4 py-3 text-xs font-semibold">
                {o.source === "scraper" ? (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                🟢 Automática
                </span>
                ) : (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                🟡 Referência
                </span>
                )}
                </td> 
              </tr>
            ))}

            {offers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-600">
                  Nenhuma oferta encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}