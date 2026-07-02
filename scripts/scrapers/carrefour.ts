
import { PrismaClient } from "@prisma/client";
import {
  findOrCreateStore as sharedFindOrCreateStore,
  findOrCreateProduct as sharedFindOrCreateProduct,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";
// workflow rebuild trigger
const prisma = new PrismaClient();





function categoriaRelevante(nome: string) {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    n.includes("arroz") ||
    n.includes("feij") ||
    n.includes("oleo") ||
    n.includes("leite") ||
    n.includes("acucar") ||
    n.includes("cafe")
  );
}

async function findOrCreateStore(name: string, city: string) {
  const existing = await prisma.store.findFirst({
    where: {
      name,
      city,
    },
  });

  if (existing) return existing;

  return prisma.store.create({
    data: {
      name,
      city,
    },
  });
}

async function findOrCreateProduct(name: string) {
  const existing = await prisma.product.findFirst({
    where: {
      name,
    },
  });

  if (existing) return existing;

  return prisma.product.create({
    data: {
      name,
      category: "Oferta",
    },
  });
}

async function offerAlreadyExists(params: {
  productId: string;
  storeId: string;
  price: number;
  city: string;
  region: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.offer.findFirst({
    where: {
      productId: params.productId,
      storeId: params.storeId,
      price: params.price,
      city: params.city,
      region: params.region,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return !!existing;
}

async function main() {
  console.log("Buscando ofertas do Carrefour...");

  const url =
    "https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?fq=H:134";

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      accept: "application/json",
    },
  });

  if (!response.ok) {
  console.warn(`Carrefour indisponível no momento: ${response.status}`);
  return;
}

  const data: any[] = await response.json();

  console.log("Produtos encontrados:", data.length);

  const storeName = "Carrefour";
  const city = "Porto Alegre";
  const region = "Zona Norte";

  const store = await sharedFindOrCreateStore(storeName, city);

  let inserted = 0;
  let updated = 0;
  let ignored = 0;

  for (const item of data) {
  const productName = item.productName;  

    if (!productName) {
      ignored += 1;
      continue;
    }

    if (!categoriaRelevante(productName)) {
      ignored += 1;
      continue;
    }

    const price =
      item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price ?? null;

    if (!price) {
      ignored += 1;
      continue;
    }

    const product = await sharedFindOrCreateProduct(productName, "Oferta");

    const result = await saveOrUpdateOffer({
  productId: product.id,
  storeId: store.id,
  price,
  city,
  region,
  source: "scraper",
});

if (result === "created") {
  inserted += 1;
} else {
  updated += 1;
}

    
  }

   console.log("\n=================================");
   console.log("      BARATORADAR SCRAPER");
   console.log("=================================");
   console.log("Supermercado :", storeName);
   console.log("Cidade       :", city);
   console.log("Novas        :", inserted);
   console.log("Atualizadas  :", updated);
   console.log("Ignoradas    :", ignored);
   console.log("=================================\n");
}

main()
  .catch((error) => {
    console.error("Erro no scraper Carrefour:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    
  });