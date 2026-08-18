import { prisma } from "../lib/prisma";

const DRY_RUN = false;

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" BARATORADAR — LIMPEZA DE REFERÊNCIAS");
  console.log("=================================");
  console.log(
    DRY_RUN
      ? "MODO PREVIEW — NADA SERÁ APAGADO"
      : "MODO EXECUÇÃO"
  );
  console.log("");

  const manual = await prisma.offer.count({
    where: {
      source: "manual",
    },
  });

  const oldZaffari = await prisma.offer.count({
    where: {
      source: "scraper",
      store: {
        name: "Zaffari",
      },
      city: "Porto Alegre",
    },
  });

  const testZaffari = await prisma.offer.count({
    where: {
      source: "vtex:zaffari",
      store: {
        name: "Zaffari",
      },
      city: "Porto Alegre",
    },
  });

  const officialZaffari = await prisma.offer.count({
    where: {
      source: "vtex:zaffari",
      store: {
        name: "Zaffari / Bourbon",
      },
      city: "Porto Alegre",
    },
  });

  const totalToDelete =
    manual + oldZaffari + testZaffari;

  console.log("SERÃO REMOVIDAS");
  console.log("---------------------------------");
  console.log(`Referências manuais:       ${manual}`);
  console.log(`Zaffari scraper antigo:    ${oldZaffari}`);
  console.log(`Zaffari VTEX teste:        ${testZaffari}`);
  console.log("---------------------------------");
  console.log(`TOTAL A REMOVER:           ${totalToDelete}`);

  console.log("");
  console.log("SERÃO PRESERVADAS");
  console.log("---------------------------------");
  console.log(`Zaffari / Bourbon VTEX:    ${officialZaffari}`);

  if (DRY_RUN) {
    console.log("");
    console.log("PREVIEW CONCLUÍDO.");
    console.log("Nenhum registro foi alterado.");
    return;
  }

  const result = await prisma.$transaction([
    prisma.offer.deleteMany({
      where: {
        source: "manual",
      },
    }),

    prisma.offer.deleteMany({
      where: {
        source: "scraper",
        store: {
          name: "Zaffari",
        },
        city: "Porto Alegre",
      },
    }),

    prisma.offer.deleteMany({
      where: {
        source: "vtex:zaffari",
        store: {
          name: "Zaffari",
        },
        city: "Porto Alegre",
      },
    }),
  ]);

  const deleted =
    result[0].count +
    result[1].count +
    result[2].count;

  console.log("");
  console.log(`REMOVIDAS: ${deleted}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });