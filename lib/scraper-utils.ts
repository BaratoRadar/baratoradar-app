import { prisma } from "./prisma";

export async function findOrCreateStore(
  name: string,
  city: string,
  network?: string,
  region?: string
) {
  const existing = await prisma.store.findFirst({
    where: {
      name,
      city,
    },
  });

  if (existing) {
    if (
      (network && existing.network !== network) ||
      (region && existing.region !== region)
    ) {
      return prisma.store.update({
        where: { id: existing.id },
        data: {
          network: network ?? existing.network,
          region: region ?? existing.region,
        },
      });
    }

    return existing;
  }

  return prisma.store.create({
    data: {
      name,
      city,
      network,
      region,
    },
  });
}

export async function findOrCreateProduct(
  name: string,
  category: string,
  options?: {
    externalId?: string;
    externalSource?: string;
    brand?: string;
    imageUrl?: string;
    url?: string;
  }
) {
  if (options?.externalId && options?.externalSource) {
    const byExternalId = await prisma.product.findUnique({
      where: {
        externalSource_externalId: {
          externalSource: options.externalSource,
          externalId: options.externalId,
        },
      },
    });

    if (byExternalId) {
      return prisma.product.update({
        where: { id: byExternalId.id },
        data: {
          name,
          category,
          brand: options.brand,
          imageUrl: options.imageUrl,
          url: options.url,
        },
      });
    }
  }

  const existing = await prisma.product.findFirst({
    where: {
      name,
    },
  });

  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data: {
        category,
        brand: options?.brand ?? existing.brand,
        externalId: options?.externalId ?? existing.externalId,
        externalSource:
          options?.externalSource ?? existing.externalSource,
        imageUrl: options?.imageUrl ?? existing.imageUrl,
        url: options?.url ?? existing.url,
      },
    });
  }

  return prisma.product.create({
    data: {
      name,
      category,
      brand: options?.brand,
      externalId: options?.externalId,
      externalSource: options?.externalSource,
      imageUrl: options?.imageUrl,
      url: options?.url,
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
  listPrice?: number;
  unit?: string;
  validUntil?: Date;
  available?: boolean;
  availableQuantity?: number;
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
        listPrice: params.listPrice,
        unit: params.unit,
        validUntil: params.validUntil,
        available: params.available ?? true,
        availableQuantity: params.availableQuantity,
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
      listPrice: params.listPrice,
      unit: params.unit,
      city: params.city,
      region: params.region,
      validUntil: params.validUntil,
      available: params.available ?? true,
      availableQuantity: params.availableQuantity,
      source: params.source,
    },
  });

  return "created";
}