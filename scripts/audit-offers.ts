import { prisma } from "../lib/prisma";

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" BARATORADAR — AUDITORIA DE OFERTAS");
  console.log("=================================");

  const bySource = await prisma.offer.groupBy({
    by: ["source"],
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        source: "desc",
      },
    },
  });

  console.log("");
  console.log("OFERTAS POR ORIGEM");
  console.log("---------------------------------");

  for (const item of bySource) {
    console.log(
      `${item.source.padEnd(20)} ${item._count._all}`
    );
  }

  const total = await prisma.offer.count();

  console.log("---------------------------------");
  console.log(`TOTAL                ${total}`);

  const manualByStore = await prisma.offer.groupBy({
    by: ["storeId"],
    where: {
      source: "manual",
    },
    _count: {
      _all: true,
    },
  });

  console.log("");
  console.log("OFERTAS MANUAIS POR LOJA");
  console.log("---------------------------------");

  for (const item of manualByStore) {
    const store = await prisma.store.findUnique({
      where: {
        id: item.storeId,
      },
    });

    console.log(
      `${(store?.name ?? "Loja desconhecida").padEnd(30)} ${item._count._all}`
    );
  }
  const sources = ["manual", "scraper", "vtex:zaffari"];

  for (const source of sources) {
    const groups = await prisma.offer.groupBy({
      by: ["storeId", "city"],
      where: {
        source,
      },
      _count: {
        _all: true,
      },
    });

    console.log("");
    console.log(`DETALHE — ${source.toUpperCase()}`);
    console.log("---------------------------------");

    for (const item of groups) {
      const store = await prisma.store.findUnique({
        where: {
          id: item.storeId,
        },
      });

      console.log(
        `${(store?.name ?? "Loja desconhecida").padEnd(28)} | ${(item.city ?? "sem cidade").padEnd(18)} | ${item._count._all}`
      );
    }
  }
  console.log("");
  console.log("Nenhum registro foi alterado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });