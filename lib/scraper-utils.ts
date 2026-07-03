import { prisma } from "./prisma";

export async function findOrCreateStore(
  name: string,
  city: string
) {
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

export async function findOrCreateProduct(
  name: string,
  category: string
) {
  const existing = await prisma.product.findFirst({
    where: {
      name,
    },
  });

  if (existing) return existing;

  return prisma.product.create({
    data: {
      name,
      category,
    },
  });
}

export async function saveOrUpdateOffer(params: {
  productId: string;
  storeId: string;
  price: number;
  city: string;
  region: string;
  source: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.offer.findFirst({
    where: {
      productId: params.productId,
      storeId: params.storeId,
      city: params.city,
      region: params.region,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (existing) {
    await prisma.offer.update({
      where: {
        id: existing.id,
      },
      data: {
        price: params.price,
        source: params.source,
      },
    });

    return "updated";
  }

  await prisma.offer.create({
    data: {
      productId: params.productId,
      storeId: params.storeId,
      price: params.price,
      city: params.city,
      region: params.region,
      source: params.source,
    },
  });

  return "created";
}