import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

console.log("SCRIPT INICIADO");

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("DATABASE_URL não encontrada no .env");
}

const pool = new Pool({
  connectionString: rawConnectionString,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function readCsv() {
const filePath = path.join(process.cwd(), "data", "ofertas_sp.csv");  console.log("Lendo CSV em:", filePath);

  const content = fs.readFileSync(filePath, "utf8");

  const lines = content.split("\n").filter(Boolean);

  console.log("Linhas no CSV:", lines.length);

  return lines.slice(1).map((line) => {
    const [productName, price, storeName, city, region, category] =
      line.split(",");

    return {
      productName,
      price: Number(price),
      storeName,
      city,
      region,
      category,
    };
  });
}

async function main() {
  const offers = readCsv();

  console.log("Ofertas no CSV:", offers.length);

  for (const o of offers) {
    console.log("Importando:", o.productName, o.price);

    let store = await prisma.store.findFirst({
  where: {
    name: o.storeName,
    city: o.city,
  },
});

if (!store) {
  store = await prisma.store.create({
    data: {
      name: o.storeName,
      city: o.city,
    },
  });
}

    let product = await prisma.product.findFirst({
  where: {
    name: o.productName,
  },
});

if (!product) {
  product = await prisma.product.create({
    data: {
      name: o.productName,
      category: o.category,
    },
  });
}

    await prisma.offer.create({
      data: {
        productId: product.id,
        storeId: store.id,
        price: o.price,
        city: o.city,
        region: o.region,
      },
    });
  }

  console.log("IMPORTAÇÃO FINALIZADA");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });