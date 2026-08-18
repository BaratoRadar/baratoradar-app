import {
  findOrCreateProduct,
  findOrCreateStore,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";

const CONFIG = {
  name: "Grupo Zaffari",
  storeName: "Zaffari / Bourbon",
  city: "Porto Alegre",
  region: "Porto Alegre",
  source: "vtex:zaffari",
  clusterId: 863,
  pageSize: 50,
  baseUrl:
    "https://www.zaffari.com.br/api/catalog_system/pub/products/search",
} as const;

type VtexCommercialOffer = {
  Price: number;
  ListPrice: number;
  AvailableQuantity: number;
  IsAvailable: boolean;
  PriceValidUntil?: string;
};

type VtexSeller = {
  sellerId: string;
  sellerName: string;
  commertialOffer: VtexCommercialOffer;
};

type VtexImage = {
  imageUrl: string;
};

type VtexItem = {
  itemId: string;
  measurementUnit?: string;
  unitMultiplier?: number;
  images?: VtexImage[];
  sellers?: VtexSeller[];
};

type VtexProduct = {
  productId: string;
  productName: string;
  brand?: string;
  categories?: string[];
  link?: string;
  items?: VtexItem[];
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
  to: number
): Promise<VtexProduct[]> {
  const url = new URL(CONFIG.baseUrl);

  url.searchParams.set("fq", `H:${CONFIG.clusterId}`);
  url.searchParams.set("_from", String(from));
  url.searchParams.set("_to", String(to));

  console.log(`Buscando ${from}-${to}...`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BaratoRadar/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} - ${await response.text()}`
    );
  }

  return (await response.json()) as VtexProduct[];
}

function mapCategory(product: VtexProduct): string {
  const path = (product.categories?.[0] ?? "").toLowerCase();
  const name = product.productName.toLowerCase();

  if (
    path.includes("carnes") ||
    path.includes("aves") ||
    path.includes("peixe") ||
    path.includes("pescado") ||
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
    path.includes("massas") ||
    path.includes("café") ||
    path.includes("cafe") ||
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
  product: VtexProduct
): NormalizedProduct | null {
  for (const item of product.items ?? []) {
    const seller = item.sellers?.find(
      (candidate) =>
        candidate.commertialOffer?.IsAvailable &&
        candidate.commertialOffer.Price > 0
    );

    if (!seller) continue;

    const offer = seller.commertialOffer;

    return {
      externalId: product.productId,
      name: product.productName.trim(),
      brand: product.brand?.trim(),
      category: mapCategory(product),
      price: offer.Price,
      listPrice: offer.ListPrice,
      unit: item.measurementUnit,
      available: offer.IsAvailable,
      availableQuantity: offer.AvailableQuantity,
      validUntil: offer.PriceValidUntil
        ? new Date(offer.PriceValidUntil)
        : undefined,
      imageUrl: item.images?.[0]?.imageUrl,
      url: product.link,
    };
  }

  return null;
}

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" BARATORADAR — GRUPO ZAFFARI");
  console.log("=================================");
  console.log("CATÁLOGO REAL — OFERTAS DA SEMANA");
  console.log("");

  let from = 0;
  let page = 1;

  const allProducts: VtexProduct[] = [];

  while (true) {
    const to = from + CONFIG.pageSize - 1;

    const products = await fetchPage(from, to);

    console.log(
      `Página ${page}: ${products.length} produtos recebidos`
    );

    allProducts.push(...products);

    if (products.length < CONFIG.pageSize) {
      break;
    }

    from += CONFIG.pageSize;
    page += 1;
  }

  const products = allProducts
    .map(normalizeProduct)
    .filter(
      (product): product is NormalizedProduct =>
        product !== null
    );

  const ignored =
    allProducts.length - products.length;

  console.log("");
  console.log(
    `${allProducts.length} recebidos / ${products.length} normalizados / ${ignored} ignorados`
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
  console.log(" GRUPO ZAFFARI — CARGA CONCLUÍDA");
  console.log("=================================");
  console.log(`Páginas: ${page}`);
  console.log(`Recebidos: ${allProducts.length}`);
  console.log(`Normalizados: ${products.length}`);
  console.log(`Ignorados: ${ignored}`);
  console.log(`Novas ofertas: ${created}`);
  console.log(`Atualizadas: ${updated}`);
  console.log(`Erros: ${errors}`);
  console.log("=================================");
}

main().catch((error) => {
  console.error("");
  console.error("ERRO NO CONNECTOR GRUPO ZAFFARI");
  console.error(error);
  process.exit(1);
});