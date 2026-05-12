import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("DATABASE_URL não encontrada no .env");
}

function sanitizeDatabaseUrl(url: string): string {
  return url
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/([?&])pgbouncer=true/g, "$1")
    .replace(/([?&])uselibpqcompat=true/g, "$1")
    .replace(/\?&/, "?")
    .replace(/&&/g, "&")
    .replace(/[?&]$/, "");
}

const pool = new Pool({
  connectionString: sanitizeDatabaseUrl(rawConnectionString),
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

type CsvOffer = {
  productName: string;
  price: number;
  storeName: string;
  city: string;
  region: string;
  category: string;
};

function parseCsvLine(line: string): string[] {
  return line.split(",").map((item) => item.trim());
}

function readOffersFromCsv(): CsvOffer[] {
  const csvPath = path.join(process.cwd(), "data", "ofertas.csv");
  const content = fs.readFileSync(csvPath, "utf8");

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [, ...rows] = lines;

  return rows.map((line) => {
    const [productName, priceRaw, storeName, city, region, category] =
      parseCsvLine(line);

    return {
      productName,
      price: Number(priceRaw.replace(",", ".")),
      storeName,
      city,
      region,
      category,
    };
  });
}

async function findOrCreateStore(name: string, city: string) {
  const existing = await prisma.store.findFirst({
    where: { name, city },
  });

  if (existing) return existing;

  return prisma.store.create({
    data: { name, city },
  });
}

async function findOrCreateProduct(name: string, category: string) {
  const existing = await prisma.product.findFirst({
    where: { name },
  });

  if (existing) return existing;

  return prisma.product.create({
    data: { name, category },
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
    where: params,
  });

  return !!existing;
}

async function main() {
  const offers = readOffersFromCsv();

  console.log("Ofertas no CSV:", offers.length);

  let inserted = 0;
  let skipped = 0;

  for (const offer of offers) {
    if (
      !offer.productName ||
      !offer.storeName ||
      !offer.city ||
      !offer.region ||
      !Number.isFinite(offer.price)
    ) {
      console.log("Linha ignorada por dados inválidos:", offer);
      continue;
    }

    const store = await findOrCreateStore(offer.storeName, offer.city);
    const product = await findOrCreateProduct(offer.productName, offer.category);

    const exists = await offerAlreadyExists({
      productId: product.id,
      storeId: store.id,
      price: offer.price,
      city: offer.city,
      region: offer.region,
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    await prisma.offer.create({
      data: {
        productId: product.id,
        storeId: store.id,
        price: offer.price,
        city: offer.city,
        region: offer.region,
      },
    });

    inserted += 1;
    console.log("Oferta importada:", offer.storeName, offer.productName, offer.price);
  }

  console.log("Importação concluída.");
  console.log("Novas ofertas inseridas:", inserted);
  console.log("Duplicadas ignoradas:", skipped);
}

main()
  .catch((error) => {
    console.error("Erro na importação:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });