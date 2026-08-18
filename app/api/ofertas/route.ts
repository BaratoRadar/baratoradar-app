import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeOfferWhere } from "@/lib/active-offers";
export async function GET() {
  try {
    const ofertas = await prisma.offer.findMany({
  where: {
    ...activeOfferWhere(),
  },
  include: {
    product: true,
    store: true,
  },
  orderBy: {
    createdAt: "desc",
  },
});

    return NextResponse.json(
      ofertas.map((o) => ({
        productName: o.product?.name ?? "",
        price: o.price,
        storeName: o.store?.name ?? "",
        city: o.city ?? "",
        region: o.region ?? "",
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar ofertas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
