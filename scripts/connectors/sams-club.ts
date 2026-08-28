import {
  findOrCreateProduct,
  findOrCreateStore,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";

const CONFIG = {
  name: "Sam's Club",
  storeName: "Sam's Club",
  city: "Porto Alegre",
  region: "Porto Alegre",
  source: "vtex:samsclub",
  regionId: "U1cjc2Ftc2NsdWI0OTQ3",
  pageSize: 50,
  baseUrl:
    "https://www.samsclub.com.br/api/catalog_system/pub/products/search",

  departments: [
  { id: 3, name: "Açougue" },
  { id: 4, name: "Bebidas" },
  { id: 5, name: "Vinhos" },
  { id: 6, name: "Mercearia" },
  { id: 7, name: "Mercearia Doce" },
  { id: 8, name: "Hortifruti" },
  { id: 9, name: "Congelados" },
  { id: 10, name: "Frios e Laticinios" },
  { id: 11, name: "Padaria e Confeitaria" },
  { id: 12, name: "Limpeza" },
  { id: 13, name: "Beleza Higiene e Saúde" },
  { id: 14, name: "Moda" },
  { id: 15, name: "Bebês e Kids" },
  { id: 16, name: "Cama Mesa e Banho" },
  { id: 17, name: "Esporte e Lazer" },
  { id: 18, name: "Pet Shop" },
  { id: 19, name: "Móveis e Decoração" },
  { id: 20, name: "Utilidades Domésticas" },
  { id: 21, name: "Eletrodomésticos" },
  { id: 22, name: "Eletroportáteis" },
  { id: 23, name: "Eletrônicos e Informática" },
  { id: 24, name: "Saudáveis" },
  { id: 25, name: "Sazonal" },
  { id: 697, name: "Importados" },
],
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
  departmentId: number,
  from: number,
  to: number,
  maxRetries = 5
): Promise<VtexProduct[]> {
  const url = new URL(CONFIG.baseUrl);

  url.searchParams.set("fq", `C:/${departmentId}/`);
  url.searchParams.set("_from", String(from));
  url.searchParams.set("_to", String(to));
const segment = Buffer.from(
  JSON.stringify({
    regionId: CONFIG.regionId,
  })
).toString("base64");
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Buscando departamento ${departmentId} | ${from}-${to}${
        attempt > 1 ? ` | tentativa ${attempt}/${maxRetries}` : ""
      }`
    );

    try {
      const response = await fetch(url, {
        headers: {
  Accept: "application/json",
  "User-Agent": "BaratoRadar/1.0",
  Cookie: `vtex_segment=${segment}`,
},
      });

      if (response.ok) {
        return (await response.json()) as VtexProduct[];
      }

      const body = await response.text();

      console.warn(
        `HTTP ${response.status} | departamento ${departmentId} | ${from}-${to}`
      );

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
    `Não foi possível buscar departamento ${departmentId}, página ${from}-${to}`
  );
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
  console.log(" BARATORADAR — SAM'S CLUB");
  console.log("=================================");
  console.log("CATÁLOGO REAL — PREÇOS ATUAIS");
  console.log("");

  const uniqueProducts = new Map<string, VtexProduct>();

  let totalReceived = 0;
  let totalPages = 0;

  for (const department of CONFIG.departments) {
    console.log("");
    console.log("---------------------------------");
    console.log(
      `${department.id} — ${department.name}`
    );
    console.log("---------------------------------");

    let from = 0;
    let page = 1;

    while (true) {
if (from > 2500) {
  console.log(
    `Limite VTEX de 2500 atingido em ${department.name}. Continuando para o próximo departamento.`
  );
  break;
}

const to = from + CONFIG.pageSize - 1;

      const pageProducts = await fetchPage(
        department.id,
        from,
        to
      );

      console.log(
        `Página ${page}: ${pageProducts.length} produtos`
      );

      totalReceived += pageProducts.length;
      totalPages += 1;

      for (const product of pageProducts) {
        uniqueProducts.set(
          product.productId,
          product
        );
      }

      if (pageProducts.length < CONFIG.pageSize) {
        break;
      }

      from += CONFIG.pageSize;
      page += 1;
    }
  }

  const allProducts = Array.from(
    uniqueProducts.values()
  );

  console.log("");
  console.log("=================================");
  console.log(" COLETA CONCLUÍDA");
  console.log("=================================");
  console.log(`Recebidos: ${totalReceived}`);
  console.log(`Únicos: ${allProducts.length}`);
  console.log(`Páginas: ${totalPages}`);

  
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
  `${allProducts.length} únicos / ${products.length} normalizados / ${ignored} ignorados`
  );

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
  console.log(" SAM'S CLUB — CARGA CONCLUÍDA");
  console.log("=================================");
  console.log(`Recebidos brutos: ${totalReceived}`);
  console.log(`Produtos únicos: ${allProducts.length}`);
  console.log(`Normalizados: ${products.length}`);
  console.log(`Ignorados: ${ignored}`);
  console.log(`Novas ofertas: ${created}`);
  console.log(`Atualizadas: ${updated}`);
  console.log(`Erros: ${errors}`);
  console.log("=================================");
}
main().catch((error) => {
  console.error("");
  console.error("ERRO NO CONNECTOR SAM'S CLUB");
  console.error(error);
  process.exit(1);
});