export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { activeOfferWhere } from "@/lib/active-offers";
function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}


function normalizarNome(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function produtoDaCategoria(
  nomeProduto: string,
  categoria: string
) {
  const n = normalizarNome(nomeProduto);
  const c = normalizarNome(categoria);

  if (c === "leite") {
    return (
      /^leite\b/.test(n) &&
      !/fermentado|condensado|creme|bebida lactea|doce de leite|coco/.test(n)
    );
  }

  if (c === "arroz") {
    return (
      /^arroz\b/.test(n) &&
      !/biscoito|bolacha|bebida|farinha|massa pronta/.test(n)
    );
  }

  if (c === "feijao") {
    return (
      /^feijao\b/.test(n) &&
      !/sopa|caldo|prato pronto|tempero/.test(n)
    );
  }

  if (c === "oleo") {
    return (
      /^oleo\b/.test(n) &&
      /soja|canola|milho|girassol/.test(n) &&
      !/motor|corporal|cabelo|essencial/.test(n)
    );
  }

  if (c === "ovos") {
    return (
      /^(ovo|ovos)\b/.test(n) &&
      !/chocolate|pascoa|massa|biscoito/.test(n)
    );
  }

  if (c === "frango") {
    return (
      /^(frango inteiro|coxa de frango|coxa frango|sobrecoxa|peito de frango|peito frango|file de peito|filezinho de sassami|sassami|asa de frango|asa frango|coxinha da asa)\b/.test(n) &&
      !/vegetal|alimento canino|alimento para caes|racao|sabor frango|cremoso|pizza|massa|macarrao|sopa|caldo|empanad|hamburguer|pate|prato pronto|menu/.test(n)
    );
  }

  if (c === "carne") {
    return (
      /^(carne bovina|carne moida|acem|alcatra|contrafile|contra file|coxao mole|coxao duro|patinho|picanha|maminha|file mignon|lagarto|paleta bovina|musculo bovino|costela bovina|peito bovino)\b/.test(n) &&
      !/hamburguer|linguica|empanad|pizza|massa|sopa|caldo|prato pronto|menu/.test(n)
    );
  }

  if (c === "cafe") {
    return (
      /^cafe\b/.test(n) &&
      !/cafeteira|maquina|licor|bebida pronta|sorvete|chocolate|bala|cafeina/.test(n)
    );
  }

  return false;
}

function filtroCategoriaPrisma(categoria: string) {
  const c = normalizarNome(categoria);

  const nomes: Record<string, string[]> = {
    leite: ["Leite"],
    arroz: ["Arroz"],
    feijao: ["Feijão", "Feijao"],
    oleo: ["Óleo", "Oleo"],
    ovos: ["Ovo ", "Ovos "],
    frango: [
      "Frango Inteiro",
      "Coxa de Frango",
      "Coxa Frango",
      "Sobrecoxa",
      "Peito de Frango",
      "Peito Frango",
      "Filé de Peito",
      "File de Peito",
      "Filezinho de Sassami",
      "Sassami",
      "Asa de Frango",
      "Asa Frango",
      "Coxinha da Asa",
    ],
    carne: [
      "Carne Bovina",
      "Carne Moída",
      "Carne Moida",
      "Acém",
      "Acem",
      "Alcatra",
      "Contrafilé",
      "Contrafile",
      "Contra Filé",
      "Contra File",
      "Coxão Mole",
      "Coxao Mole",
      "Coxão Duro",
      "Coxao Duro",
      "Patinho",
      "Picanha",
      "Maminha",
      "Filé Mignon",
      "File Mignon",
      "Lagarto",
      "Paleta Bovina",
      "Músculo Bovino",
      "Musculo Bovino",
      "Costela Bovina",
      "Peito Bovino",
    ],
    cafe: ["Café", "Cafe"],
  };

  const termos = nomes[c];

  if (!termos) return undefined;

  return {
    OR: termos.map((termo) => ({
      name: {
        startsWith: termo,
        mode: "insensitive" as const,
      },
    })),
  };
}

type SP = {
  busca?: string;
  categoria?: string;
  cidade?: string;
  regiao?: string;
  pagina?: string;
};

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;

  const busca = (sp?.busca ?? "").trim();
  const categoria = (sp?.categoria ?? "").trim();
  const cidade = (sp?.cidade ?? "").trim();
  const regiao = (sp?.regiao ?? "").trim();

  const pagina = Math.max(
    1,
    Number.parseInt(sp?.pagina ?? "1", 10) || 1
  );
  const categoriaFiltro = categoria
    ? filtroCategoriaPrisma(categoria)
    : undefined;

  const productWhere = {
    ...(categoriaFiltro ?? {}),
    ...(busca
      ? {
          AND: [
            ...(categoriaFiltro ? [categoriaFiltro] : []),
            {
              name: {
                contains: busca,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const whereBase = {
    ...activeOfferWhere(),
    ...(cidade
      ? {
          city: {
            equals: cidade,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(regiao
      ? {
          region: {
            equals: regiao,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(categoria || busca
      ? { product: productWhere }
      : {}),
  };

  const lojasAtivas = await prisma.offer.groupBy({
    by: ["storeId"],
    where: whereBase,
    _count: { _all: true },
  });

  const limitePorLoja =
    cidade === "São Paulo" ? 50 : 10;

  const limitePorPaginaLoja = limitePorLoja;
  const alvoPorLoja = pagina * limitePorPaginaLoja + 1;

  const ofertasPorLoja = await Promise.all(
    lojasAtivas.map(async (loja) => {
      const validas: Awaited<
        ReturnType<typeof prisma.offer.findMany<{
          include: { product: true; store: true };
        }>>
      > = [];

      let deslocamento = 0;
      const lote = 100;

      while (validas.length < alvoPorLoja) {
        const candidatas = await prisma.offer.findMany({
          where: {
            ...whereBase,
            storeId: loja.storeId,
          },
          include: {
            product: true,
            store: true,
          },
          orderBy: [
            { updatedAt: "desc" },
            { id: "asc" },
          ],
          skip: deslocamento,
          take: lote,
        });

        if (candidatas.length === 0) break;

        deslocamento += candidatas.length;

        for (const oferta of candidatas) {
          if (
            !categoria ||
            produtoDaCategoria(
              oferta.product.name,
              categoria
            )
          ) {
            validas.push(oferta);
          }
        }

        if (candidatas.length < lote) break;
      }

      const inicio = (pagina - 1) * limitePorPaginaLoja;

      return {
        ofertas: validas.slice(
          inicio,
          inicio + limitePorPaginaLoja
        ),
        temMais: validas.length > inicio + limitePorPaginaLoja,
      };
    })
  );

  const temProximaPagina = ofertasPorLoja.some(
    (loja) => loja.temMais
  );

  const offers = ofertasPorLoja
    .flatMap((loja) => loja.ofertas)
    .sort(
      (a, b) =>
        (b.updatedAt?.getTime() ?? 0) -
        (a.updatedAt?.getTime() ?? 0) ||
        a.id.localeCompare(b.id)
    )
    .slice(0, 100);

  const uniqueOffers = Array.from(
    new Map(
      offers.map((offer) => [
        `${offer.product.name.toLowerCase()}-${offer.store.name.toLowerCase()}-${offer.price}-${offer.city?.toLowerCase()}-${offer.region?.toLowerCase()}`,
        offer,
      ])
    ).values()
  );

  const urlPagina = (numero: number) => {
    const params = new URLSearchParams();

    if (categoria) params.set("categoria", categoria);
    if (busca) params.set("busca", busca);
    if (cidade) params.set("cidade", cidade);
    if (regiao) params.set("regiao", regiao);

    params.set("pagina", String(numero));

    return `/ofertas?${params.toString()}`;
  };

  const nomesCategorias: Record<string, string> = {
    leite: "Leite",
    arroz: "Arroz",
    feijao: "Feijão",
    oleo: "Óleo",
    ovos: "Ovos",
    frango: "Frango",
    carne: "Carne",
    cafe: "Café",
  };

  const categoriaNormalizada =
    normalizarNome(categoria);

  const categoriaLabel =
    nomesCategorias[categoriaNormalizada] ??
    categoria;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">
        {categoria
          ? `Ofertas de ${categoriaLabel}`
          : "Ofertas"}
      </h1>

      <p className="mt-2 text-slate-600">
        {categoria
          ? `Compare preços de ${categoriaLabel.toLowerCase()} encontrados pelo BaratoRadar.`
          : "Lista das ofertas mais recentes encontradas pelo BaratoRadar."}
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-2">
        {categoria && (
          <input
            type="hidden"
            name="categoria"
            value={categoria}
          />
        )}

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
        Categoria: {categoria ? categoriaLabel : "Todas"} | Cidade: {cidade || "Todas"} | Região: {regiao || "Todas"} | Ofertas encontradas: {uniqueOffers.length}
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
                 
              </tr>
            ))}

            {uniqueOffers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-slate-600">
                  Nenhuma oferta encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Paginação de ofertas"
        className="mt-6 flex items-center justify-between gap-4"
      >
        {pagina > 1 ? (
          <a
            href={urlPagina(pagina - 1)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Anterior
          </a>
        ) : (
          <span />
        )}

        <span className="text-sm font-semibold text-slate-600">
          Página {pagina}
        </span>

        {temProximaPagina ? (
          <a
            href={urlPagina(pagina + 1)}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Próxima →
          </a>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}