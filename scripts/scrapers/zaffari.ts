
import * as cheerio from "cheerio";
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

const connectionString = sanitizeDatabaseUrl(rawConnectionString);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

type ParsedOffer = {
  productName: string;
  price: number;
  storeName: string;
  city: string;
  region: string;
  category: string;
  sourceUrl: string;
};

function parseBrazilianPrice(text: string): number | null {
  const match = text.match(/R\$\s*([\d.]+,\d{2})/);
  if (!match) return null;

  const value = match[1].replace(/\./g, "").replace(",", ".");
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();

  if (
    n.includes("frango") ||
    n.includes("carne") ||
    n.includes("ovos") ||
    n.includes("linguiça") ||
    n.includes("linguica") ||
    n.includes("peixe")
  ) {
    return "Proteínas";
  }

  if (
    n.includes("arroz") ||
    n.includes("feijão") ||
    n.includes("feijao") ||
    n.includes("macarrão") ||
    n.includes("macarrao") ||
    n.includes("café") ||
    n.includes("cafe") ||
    n.includes("erva-mate") ||
    n.includes("erva mate") ||
    n.includes("lentilha")
  ) {
    return "Cesta Básica";
  }

  if (
    n.includes("sabão") ||
    n.includes("sabao") ||
    n.includes("detergente") ||
    n.includes("desinfetante") ||
    n.includes("água sanitária") ||
    n.includes("agua sanitaria") ||
    n.includes("toalha de papel")
  ) {
    return "Limpeza";
  }

  return "Oferta";
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar ${url}: ${response.status}`);
  }

  return await response.text();
}

function extractOffers(html: string, sourceUrl: string): ParsedOffer[] {
  const $ = cheerio.load(html);
  const offers: ParsedOffer[] = [];

  $("a").each((_, element) => {
    const text = $(element).text().trim();

    if (!text.includes("R$")) return;
    if (text.length < 8) return;

    const price = parseBrazilianPrice(text);
    if (price === null) return;

    const productName = text.replace(/R\$\s*[\d.]+,\d{2}.*/, "").trim();
    if (!productName) return;

    offers.push({
      productName,
      price,
      storeName: "Zaffari",
      city: "Porto Alegre",
      region: "Centro",
      category: guessCategory(productName),
      sourceUrl,
    });
  });

  const unique = new Map<string, ParsedOffer>();
  for (const offer of offers) {
    const key = `${offer.productName}__${offer.price}`;
    if (!unique.has(key)) {
      unique.set(key, offer);
    }
  }

  return [...unique.values()];
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

async function saveOffers(offers: ParsedOffer[]) {
  const store = await findOrCreateStore("Zaffari", "Porto Alegre");

  let inserted = 0;
  let skipped = 0;

  for (const offer of offers) {
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
  }

  console.log(`Novas ofertas inseridas: ${inserted}`);
  console.log(`Ofertas duplicadas ignoradas: ${skipped}`);
}

async function main() {
  const url = "https://www.zaffari.com.br/ofertas";

  console.log("Baixando:", url);
  const html = await fetchHtml(url);

  const offers = extractOffers(html, url);

  console.log("Ofertas encontradas:", offers.length);
  console.log(offers.slice(0, 10));

  if (offers.length === 0) {
    console.log("Nenhuma oferta capturada. Precisamos ajustar o seletor.");
    return;
  }

  await saveOffers(offers);
  console.log("Processo concluído com sucesso.");
}

main()
  .catch((error) => {
    console.error("Erro no scraper Zaffari:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });