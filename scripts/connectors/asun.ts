import {
  findOrCreateProduct,
  findOrCreateStore,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";

const CONFIG = {
  name: "Asun",
  storeName: "Asun",
  city: "Porto Alegre",
  region: "Porto Alegre",
  source: "osuper:asun",
  accountId: 319,
  storeId: 1540,
  storeNameDetail: "Asun Cavalhada",
  pageSize: 12,
  baseUrl: "https://sense.osuper.com.br/319/1540/search",
} as const;

type OsuperPricing = {
  price: number;
  promotion: boolean;
  promotionalPrice: number;
  discount?: number;
  store: number;
};

type OsuperQuantity = {
  fraction?: number;
  inStock: number;
  max?: number;
  min?: number;
  sellByWeightAndUnit?: boolean;
};

type OsuperProduct = {
  id: string;
  name: string;
  brandName?: string;
  categories?: string[];
  image?: string;
  slug?: string;
  saleUnit?: string;
  pricing: OsuperPricing;
  quantity: OsuperQuantity;
};

type OsuperSearchResponse = {
  hits: OsuperProduct[];
  total: number;
  nextFrom: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
};

type NormalizedProduct = {
  externalId: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  listPrice?: number;
  unit?: string;
  available: boolean;
  availableQuantity?: number;
  validUntil?: Date;
  imageUrl?: string;
  url?: string;
};

async function fetchPage(
  from: number,
  maxRetries = 5
): Promise<OsuperSearchResponse> {
  const url = new URL(CONFIG.baseUrl);

  url.searchParams.set("search", "");
  url.searchParams.set("size", String(CONFIG.pageSize));
  url.searchParams.set("from", String(from));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Buscando a partir de ${from}...${
        attempt > 1
          ? ` tentativa ${attempt}/${maxRetries}`
          : ""
      }`
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "BaratoRadar/1.0",
        },
      });

      if (response.ok) {
        return (await response.json()) as OsuperSearchResponse;
      }

      const body = await response.text();

      console.warn(`HTTP ${response.status} | from=${from}`);

      if (response.status < 500 || attempt === maxRetries) {
        throw new Error(
          `HTTP ${response.status} - ${body}`
        );
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `Falha temporária. Nova tentativa em ${attempt * 3}s...`
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, attempt * 3000)
    );
  }

  throw new Error(
    `Não foi possível buscar produtos a partir de ${from}`
  );
}

function mapCategory(product: OsuperProduct): string {
  const path = (product.categories?.[0] ?? "").toLowerCase();
  const name = product.name.toLowerCase();

  if (
    path.includes("carne") ||
    path.includes("aves") ||
    path.includes("peixe") ||
    name.includes("frango") ||
    name.includes("carne") ||
    name.includes("linguiça") ||
    name.includes("linguica") ||
    name.includes("ovo")
  ) {
    return "Proteínas";
  }

  if (
    path.includes("arroz") ||
    path.includes("feijão") ||
    path.includes("feijao") ||
    name.includes("arroz") ||
    name.includes("feijão") ||
    name.includes("feijao") ||
    name.includes("macarrão") ||
    name.includes("macarrao") ||
    name.includes("café") ||
    name.includes("cafe") ||
    name.includes("erva-mate") ||
    name.includes("erva mate")
  ) {
    return "Cesta Básica";
  }

  if (
    path.includes("limpeza") ||
    name.includes("detergente") ||
    name.includes("desinfetante") ||
    name.includes("sabão") ||
    name.includes("sabao") ||
    name.includes("água sanitária") ||
    name.includes("agua sanitaria")
  ) {
    return "Limpeza";
  }

  return "Oferta";
}

function normalizeProduct(
  product: OsuperProduct
): NormalizedProduct | null {
  if (
    !product.pricing ||
    product.pricing.store !== CONFIG.storeId ||
    product.quantity?.inStock <= 0
  ) {
    return null;
  }

  const normalPrice = product.pricing.price;

  const activePrice =
    product.pricing.promotion &&
    product.pricing.promotionalPrice > 0 &&
    product.pricing.promotionalPrice < normalPrice
      ? product.pricing.promotionalPrice
      : normalPrice;

  if (!activePrice || activePrice <= 0) {
    return null;
  }

  return {
    externalId: product.id,
    name: product.name.trim(),
    brand: product.brandName?.trim(),
    category: mapCategory(product),
    price: activePrice,
    listPrice: normalPrice,
    unit: product.saleUnit,
    available: true,
    availableQuantity: product.quantity.inStock,
    imageUrl: product.image,
    url: product.slug
      ? `https://www.asunonline.com.br/produto/${product.slug}`
      : undefined,
  };
}

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" BARATORADAR — ASUN");
  console.log("=================================");
  console.log("CATÁLOGO REAL — ASUN CAVALHADA");
  console.log("");

  let from = 0;
  let page = 1;

  const allProducts: OsuperProduct[] = [];

  while (true) {
    const response = await fetchPage(from);

    console.log(
      `Página ${page}: ${response.hits.length} produtos | total ${response.total}`
    );

    allProducts.push(...response.hits);

    if (
      !response.hasNext ||
      response.nextFrom === null
    ) {
      break;
    }

    from = response.nextFrom;
    page += 1;
  }

  const uniqueProducts = Array.from(
    new Map(
      allProducts.map((product) => [
        product.id,
        product,
      ])
    ).values()
  );

  console.log("");
  console.log(
    `${allProducts.length} recebidos / ${uniqueProducts.length} únicos`
  );

  // TESTE CONTROLADO — somente 5 produtos
  

  const products = uniqueProducts
    .map(normalizeProduct)
    .filter(
      (product): product is NormalizedProduct =>
        product !== null
    );

  const ignored =
    uniqueProducts.length - products.length;

  console.log(
  `${uniqueProducts.length} únicos / ${products.length} normalizados / ${ignored} ignorados`
);
  console.log("");

  const store = await findOrCreateStore(
    CONFIG.storeName,
    CONFIG.city,
    CONFIG.name,
    CONFIG.region
  );

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of products) {
    try {
      const product = await findOrCreateProduct(
        item.name,
        item.category,
        {
          externalId: item.externalId,
          externalSource: CONFIG.source,
          brand: item.brand,
          imageUrl: item.imageUrl,
          url: item.url,
        }
      );

      const result = await saveOrUpdateOffer({
        productId: product.id,
        storeId: store.id,
        price: item.price,
        listPrice: item.listPrice,
        unit: item.unit,
        city: CONFIG.city,
        region: CONFIG.region,
        validUntil: item.validUntil,
        available: item.available,
        availableQuantity:
          item.availableQuantity,
        source: CONFIG.source,
      });

      if (result === "created") {
        created += 1;
      } else {
        updated += 1;
      }
      if ((created + updated) % 50 === 0) {
       console.log(
       `Gravação: ${created + updated}/${products.length}`
  );
}
      console.log(
        `${result === "created" ? "NOVO" : "ATUALIZADO"} | ${item.name} | R$ ${item.price.toFixed(2)}`
      );
    } catch (error) {
      errors += 1;

      console.error(
        `ERRO | ${item.name}`,
        error
      );
    }
  }

  console.log("");
  console.log("=================================");
  console.log(" ASUN — CARGA CONCLUÍDA");
  console.log("=================================");
  console.log(`Páginas: ${page}`);
  console.log(`Recebidos: ${allProducts.length}`);
  console.log(`Únicos: ${uniqueProducts.length}`);
  console.log(`Normalizados: ${products.length}`);
  console.log(`Ignorados: ${ignored}`);
  console.log(`Novas ofertas: ${created}`);
  console.log(`Atualizadas: ${updated}`);
  console.log(`Erros: ${errors}`);
  console.log("=================================");
}

main().catch((error) => {
  console.error("");
  console.error("ERRO NO CONNECTOR ASUN");
  console.error(error);
  process.exit(1);
});