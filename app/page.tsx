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

  const offersPromise = prisma.offer.findMany({
    where: {
  ...activeOfferWhere(),
  price: {
    gte: 1,
  },
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
  // Cesta de referência baseada nos 10 grupos oficiais.
  // Cada grupo usa um produto comparável e apenas ofertas ativas.
  const normalizarNome = (nome: string) =>
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const gruposCesta = [
    {
      label: "Feijão",
      match: (n: string) =>
        /^feijao\b/.test(n) && /\b1\s*kg\b/.test(n),
    },
    {
      label: "Arroz",
      match: (n: string) =>
        /^arroz\b/.test(n) && /\b1\s*kg\b/.test(n),
    },
    {
      label: "Batata",
      match: (n: string) =>
        /^batata\b/.test(n) &&
        /\bkg\b/.test(n) &&
        !/palito|chips|congelad|frita|pure/.test(n),
    },
    {
      label: "Tomate",
      match: (n: string) =>
        /^tomate\b/.test(n) &&
        /\bkg\b/.test(n) &&
        !/molho|extrato|pelado|seco/.test(n),
    },
    {
      label: "Banana",
      match: (n: string) =>
        /^banana\b/.test(n) &&
        /\bkg\b/.test(n) &&
        !/chips|doce|passa/.test(n),
    },
    {
      label: "Amendoim",
      match: (n: string) =>
        /^amendoim\b/.test(n) &&
        /\b500\s*g\b/.test(n),
    },
    {
      label: "Frango",
      match: (n: string) =>
        /^(frango inteiro|coxa de frango|sobrecoxa|peito de frango|file de peito de frango)\b/.test(n) &&
        /\bkg\b/.test(n) &&
        !/vegetal|cremoso|empanad|hamburguer|pronto|menu/.test(n),
    },
    {
      label: "Leite",
      match: (n: string) =>
        /^leite\b/.test(n) &&
        /\b(uht|longa vida)\b/.test(n) &&
        /\b1\s*l\b/.test(n) &&
        !/fermentado|condensado|po\b|coco/.test(n),
    },
    {
      label: "Óleo de soja",
      match: (n: string) =>
        /^oleo de soja\b/.test(n) &&
        /\b900\s*ml\b/.test(n),
    },
    {
      label: "Café",
      match: (n: string) =>
        /^cafe\b/.test(n) &&
        /\b500\s*g\b/.test(n) &&
        /torrado|moido|tradicional|extraforte|extra forte/.test(n) &&
        !/soluvel|capsula|bebida|licor/.test(n),
    },
  ];

  const cestaOffersPromise = prisma.offer.findMany({
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
        OR: [
          {
            AND: [
              {
                OR: [
                  { name: { startsWith: "Feijão", mode: "insensitive" } },
                  { name: { startsWith: "Feijao", mode: "insensitive" } },
                ],
              },
              {
                OR: [
                  { name: { contains: "1kg", mode: "insensitive" } },
                  { name: { contains: "1 kg", mode: "insensitive" } },
                ],
              },
            ],
          },
          {
            AND: [
              { name: { startsWith: "Arroz", mode: "insensitive" } },
              { name: { contains: "1kg", mode: "insensitive" } },
            ],
          },
          {
            AND: [
              { name: { startsWith: "Batata", mode: "insensitive" } },
              { name: { contains: "Kg", mode: "insensitive" } },
            ],
          },
          { name: { startsWith: "Tomate", mode: "insensitive" } },
          { name: { startsWith: "Banana", mode: "insensitive" } },
          {
            AND: [
              { name: { startsWith: "Amendoim", mode: "insensitive" } },
              {
                OR: [
                  { name: { contains: "500g", mode: "insensitive" } },
                  { name: { contains: "500 g", mode: "insensitive" } },
                ],
              },
            ],
          },
          { name: { startsWith: "Frango", mode: "insensitive" } },
          { name: { startsWith: "Coxa de Frango", mode: "insensitive" } },
          { name: { startsWith: "Sobrecoxa", mode: "insensitive" } },
          { name: { startsWith: "Peito de Frango", mode: "insensitive" } },
          { name: { startsWith: "Filé de Peito", mode: "insensitive" } },
          { name: { startsWith: "File de Peito", mode: "insensitive" } },
          {
            AND: [
              { name: { startsWith: "Leite", mode: "insensitive" } },
              {
                OR: [
                  { name: { contains: "1L", mode: "insensitive" } },
                  { name: { contains: "1 L", mode: "insensitive" } },
                ],
              },
            ],
          },
          {
            AND: [
              {
                OR: [
                  { name: { startsWith: "Óleo de Soja", mode: "insensitive" } },
                  { name: { startsWith: "Oleo de Soja", mode: "insensitive" } },
                ],
              },
              {
                OR: [
                  { name: { contains: "900ml", mode: "insensitive" } },
                  { name: { contains: "900 ml", mode: "insensitive" } },
                ],
              },
            ],
          },
          {
            AND: [
              {
                OR: [
                  { name: { startsWith: "Café", mode: "insensitive" } },
                  { name: { startsWith: "Cafe", mode: "insensitive" } },
                ],
              },
              {
                OR: [
                  { name: { contains: "500g", mode: "insensitive" } },
                  { name: { contains: "500 g", mode: "insensitive" } },
                ],
              },
            ],
          },
        ],
      },
    },

    include: {
      product: true,
      store: true,
    },

    orderBy: { price: "asc" },
  });

  const [offers, cestaOffers] = await Promise.all([
    offersPromise,
    cestaOffersPromise,
  ]);

  const uniqueOffers = Array.from(
  new Map(
    offers.map((offer) => [
      `${offer.product.name.toLowerCase()}-${offer.store.name.toLowerCase()}-${offer.price}-${offer.city?.toLowerCase()}-${offer.region?.toLowerCase()}`,
      offer,
    ])
  ).values()
);
  type CestaStore = {
    store: string;
    total: number;
    found: number;
    required: number;
    complete: boolean;
    productName: string | null;
  };

  type CestaStoreInternal = CestaStore & {
    melhores: Record<
      string,
      {
        price: number;
        productName: string;
      }
    >;
  };

  const cestaPorRegiao: Record<
    string,
    Record<string, CestaStoreInternal>
  > = {};

  // Uma única passagem por todas as ofertas.
  // Para cada região + loja + grupo, guarda apenas
  // a oferta válida mais barata.
  for (const offer of cestaOffers) {
    if (!offer.region) continue;

    const nome = normalizarNome(
      offer.product.name
    );

    const grupo = gruposCesta.find((g) =>
      g.match(nome)
    );

    if (!grupo) continue;

    const region = offer.region;
    const store = offer.store.name;

    if (!cestaPorRegiao[region]) {
      cestaPorRegiao[region] = {};
    }

    if (!cestaPorRegiao[region][store]) {
      cestaPorRegiao[region][store] = {
        store,
        total: 0,
        found: 0,
        required: gruposCesta.length,
        complete: false,
        productName: null,
        melhores: {},
      };
    }

    const result =
      cestaPorRegiao[region][store];

    const atual = result.melhores[
      grupo.label
    ];

    if (
      !atual ||
      offer.price < atual.price
    ) {
      result.melhores[grupo.label] = {
        price: offer.price,
        productName: offer.product.name,
      };
    }
  }

  // Calcula os totais somente a partir dos
  // 10 melhores itens já selecionados.
  for (const stores of Object.values(
    cestaPorRegiao
  )) {
    for (const result of Object.values(
      stores
    )) {
      const melhores = Object.values(
        result.melhores
      );

      result.found = melhores.length;

      result.total = melhores.reduce(
        (sum, item) => sum + item.price,
        0
      );

      result.complete =
        result.found === result.required;

      result.productName =
        melhores[0]?.productName ?? null;
    }
  }

  const rankingPorRegiao = Object.entries(
    cestaPorRegiao
  )
    .map(([region, stores]) => {
      const ranking = Object.values(stores).sort(
        (a, b) => {
          // Cestas completas aparecem primeiro.
          if (a.complete !== b.complete) {
            return a.complete ? -1 : 1;
          }

          // Entre parciais, maior cobertura primeiro.
          if (a.found !== b.found) {
            return b.found - a.found;
          }

          return a.total - b.total;
        }
      );

      const winner = ranking[0] ?? null;

      return {
        region,
        winner,
        productName:
          winner?.productName ?? null,
      };
    })
    .filter((item) => item.winner);

  const destaqueRadarPromise = prisma.offer.findFirst({
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
          { name: { startsWith: "Arroz", mode: "insensitive" } },
          { name: { startsWith: "Feijão", mode: "insensitive" } },
          { name: { startsWith: "Feijao", mode: "insensitive" } },
          {
            AND: [
              { name: { startsWith: "Leite", mode: "insensitive" } },
              {
                OR: [
                  { name: { contains: "1L", mode: "insensitive" } },
                  { name: { contains: "1 L", mode: "insensitive" } },
                ],
              },
              {
                NOT: {
                  name: {
                    contains: "Fermentado",
                    mode: "insensitive",
                  },
                },
              },
            ],
          },
          { name: { startsWith: "Café", mode: "insensitive" } },
          { name: { startsWith: "Cafe", mode: "insensitive" } },
          { name: { startsWith: "Óleo de Soja", mode: "insensitive" } },
          { name: { startsWith: "Oleo de Soja", mode: "insensitive" } },
          { name: { startsWith: "Ovo ", mode: "insensitive" } },
          { name: { startsWith: "Ovos ", mode: "insensitive" } },
          { name: { startsWith: "Frango Inteiro", mode: "insensitive" } },
          { name: { startsWith: "Coxa de Frango", mode: "insensitive" } },
          { name: { startsWith: "Sobrecoxa", mode: "insensitive" } },
          { name: { startsWith: "Peito de Frango", mode: "insensitive" } },
          { name: { startsWith: "Filé de Peito", mode: "insensitive" } },
          { name: { startsWith: "File de Peito", mode: "insensitive" } },
          { name: { startsWith: "Bisteca Suína", mode: "insensitive" } },
          { name: { startsWith: "Bisteca Suina", mode: "insensitive" } },
          { name: { startsWith: "Costela Suína", mode: "insensitive" } },
          { name: { startsWith: "Costela Suina", mode: "insensitive" } },
          { name: { startsWith: "Alcatra", mode: "insensitive" } },
          { name: { startsWith: "Patinho", mode: "insensitive" } },
          { name: { startsWith: "Acém", mode: "insensitive" } },
          { name: { startsWith: "Acem", mode: "insensitive" } },
          { name: { startsWith: "Filé de Tilápia", mode: "insensitive" } },
          { name: { startsWith: "File de Tilapia", mode: "insensitive" } },
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

const proteinasPromise = prisma.offer.findMany({
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
      category: "Proteínas",

      OR: [
        // Ovos
        { name: { startsWith: "Ovo ", mode: "insensitive" } },
        { name: { startsWith: "Ovos ", mode: "insensitive" } },

        // Frango
        { name: { startsWith: "Frango Inteiro", mode: "insensitive" } },
        { name: { startsWith: "Coxa de Frango", mode: "insensitive" } },
        { name: { startsWith: "Sobrecoxa", mode: "insensitive" } },
        { name: { startsWith: "Peito de Frango", mode: "insensitive" } },
        { name: { startsWith: "Filé de Peito", mode: "insensitive" } },
        { name: { startsWith: "File de Peito", mode: "insensitive" } },
        { name: { startsWith: "Sassami", mode: "insensitive" } },
        { name: { startsWith: "Filezinho de Sassami", mode: "insensitive" } },
        { name: { startsWith: "Asa de Frango", mode: "insensitive" } },
        { name: { startsWith: "Coxinha da Asa", mode: "insensitive" } },

        // Suínos
        { name: { startsWith: "Costela Suína", mode: "insensitive" } },
        { name: { startsWith: "Costela Suina", mode: "insensitive" } },
        { name: { startsWith: "Lombo Suíno", mode: "insensitive" } },
        { name: { startsWith: "Lombo Suino", mode: "insensitive" } },
        { name: { startsWith: "Pernil Suíno", mode: "insensitive" } },
        { name: { startsWith: "Pernil Suino", mode: "insensitive" } },
        { name: { startsWith: "Bisteca Suína", mode: "insensitive" } },
        { name: { startsWith: "Bisteca Suina", mode: "insensitive" } },
        { name: { startsWith: "Copa Lombo", mode: "insensitive" } },

        // Bovinos
        { name: { startsWith: "Alcatra", mode: "insensitive" } },
        { name: { startsWith: "Coxão Mole", mode: "insensitive" } },
        { name: { startsWith: "Coxao Mole", mode: "insensitive" } },
        { name: { startsWith: "Coxão Duro", mode: "insensitive" } },
        { name: { startsWith: "Coxao Duro", mode: "insensitive" } },
        { name: { startsWith: "Patinho", mode: "insensitive" } },
        { name: { startsWith: "Maminha", mode: "insensitive" } },
        { name: { startsWith: "Picanha", mode: "insensitive" } },
        { name: { startsWith: "Contrafilé", mode: "insensitive" } },
        { name: { startsWith: "Contrafile", mode: "insensitive" } },
        { name: { startsWith: "Acém", mode: "insensitive" } },
        { name: { startsWith: "Acem", mode: "insensitive" } },
        { name: { startsWith: "Paleta Bovina", mode: "insensitive" } },
        { name: { startsWith: "Costela Bovina", mode: "insensitive" } },

        // Pescados
        { name: { startsWith: "Filé de Tilápia", mode: "insensitive" } },
        { name: { startsWith: "File de Tilapia", mode: "insensitive" } },
        { name: { startsWith: "Tilápia", mode: "insensitive" } },
        { name: { startsWith: "Tilapia", mode: "insensitive" } },
        { name: { startsWith: "Filé de Merluza", mode: "insensitive" } },
        { name: { startsWith: "File de Merluza", mode: "insensitive" } },
        { name: { startsWith: "Merluza", mode: "insensitive" } },
        { name: { startsWith: "Salmão", mode: "insensitive" } },
        { name: { startsWith: "Salmao", mode: "insensitive" } },
        { name: { startsWith: "Pescada", mode: "insensitive" } },
        { name: { startsWith: "Sardinha Inteira", mode: "insensitive" } },
      ],
    },
  },

  include: {
    product: true,
    store: true,
  },

  orderBy: { price: "asc" },
});

const [destaqueRadar, proteinas] = await Promise.all([
  destaqueRadarPromise,
  proteinasPromise,
]);

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
          "linguiça",
          "linguica",
          "defumad",
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
          "linguiça",
          "linguica",
          "defumad",
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
          "defumad",
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
  Comparativo baseado nos 10 grupos de alimentos da cesta básica de referência.
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

      <div className="mt-2 text-sm font-semibold text-slate-600">
        {item.winner?.found} de {item.winner?.required} grupos encontrados
      </div>

      <div
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
          item.winner?.complete
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {item.winner?.complete ? "Cesta completa" : "Cesta parcial"}
      </div>

      <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        {item.winner?.complete ? "Total da cesta" : "Total parcial"}
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