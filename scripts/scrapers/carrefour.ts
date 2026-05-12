import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

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
  const existing = await prisma.offer.findFirst({
    where: {
      productId: params.productId,
      storeId: params.storeId,
      price: params.price,
      city: params.city,
      region: params.region,
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
    throw new Error(`Erro ao buscar Carrefour: ${response.status}`);
  }

  const data: any[] = await response.json();

  console.log("Produtos encontrados:", data.length);

  const storeName = "Carrefour";
  const city = "Porto Alegre";
  const region = "Zona Norte";

  const store = await findOrCreateStore(storeName, city);

  let inserted = 0;
  let skipped = 0;
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

    const product = await findOrCreateProduct(productName);

    const exists = await offerAlreadyExists({
      productId: product.id,
      storeId: store.id,
      price,
      city,
      region,
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    await prisma.offer.create({
      data: {
        productId: product.id,
        storeId: store.id,
        price,
        city,
        region,
      },
    });

    inserted += 1;
    console.log("Salvo:", productName, price);
  }

  console.log("Novas ofertas inseridas:", inserted);
  console.log("Ofertas duplicadas ignoradas:", skipped);
  console.log("Produtos ignorados:", ignored);
  console.log("Scraper Carrefour finalizado.");
}

main()
  .catch((error) => {
    console.error("Erro no scraper Carrefour:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });