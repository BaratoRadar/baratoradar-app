import { prisma } from "../../lib/prisma";

import {
  findOrCreateStore,
  findOrCreateProduct,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";

import { logger } from "../../lib/logger";
import { retry } from "../../lib/retry";

type ParsedOffer = {
  productName: string;
  price: number;
  storeName: string;
  city: string;
  region: string;
  category: string;
  sourceUrl: string;
};
async function fetchOffers(): Promise<ParsedOffer[]> {
  // TODO:
  // Buscar as ofertas do supermercado.
  return [];
}

async function saveOffers(offers: ParsedOffer[]) {
  let inserted = 0;
  let updated = 0;

  for (const offer of offers) {
    const store = await findOrCreateStore(
      offer.storeName,
      offer.city
    );

    const product = await findOrCreateProduct(
      offer.productName,
      offer.category
    );

    const result = await saveOrUpdateOffer({
      productId: product.id,
      storeId: store.id,
      price: offer.price,
      city: offer.city,
      region: offer.region,
      source: "scraper",
    });

    if (result === "created") {
      inserted++;
    } else {
      updated++;
    }
  }

  logger.section("BARATORADAR SCRAPER");
  logger.info("Supermercado", offers[0]?.storeName ?? "-");
  logger.success("Novas ofertas", inserted);
  logger.info("Atualizadas", updated);
}
async function main() {
  const offers = await retry(() => fetchOffers());

  await saveOffers(offers);
}

main()
  .catch((error) => {
    logger.error("Erro no scraper", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });