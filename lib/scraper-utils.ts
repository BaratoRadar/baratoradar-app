import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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