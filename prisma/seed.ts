import "dotenv/config";
import { PrismaClient } from "@prisma/client";


const connectionString = process.env.DATABASE_URL;
const prisma = new PrismaClient();
if (!connectionString) {
  throw new Error("DATABASE_URL não encontrada no .env");
}



async function main() {
  // Lojas
const zaffari = await prisma.store.create({
  data: { name: "Zaffari", city: "Porto Alegre" },
});

const carrefour = await prisma.store.create({
  data: { name: "Carrefour", city: "Porto Alegre" },
});

const atacadao = await prisma.store.create({
  data: { name: "Atacadão", city: "Porto Alegre" },
});

  const [
  frango,
  patinho,
  linguica,
  ovos,
  arroz,
  feijao,
  macarrao,
  ervaMate,
  cafe,
  sabao,
  detergente,
  aguaSanitaria,
  desinfetante,
] = await Promise.all([
  prisma.product.create({
    data: { name: "Peito de frango", category: "Proteínas" },
  }),
  prisma.product.create({
    data: { name: "Carne bovina patinho", category: "Proteínas" },
  }),
  prisma.product.create({
    data: { name: "Linguiça suína", category: "Proteínas" },
  }),
  prisma.product.create({
    data: { name: "Ovos brancos dúzia", category: "Proteínas" },
  }),
  prisma.product.create({
    data: { name: "Arroz 5kg", category: "Cesta Básica" },
  }),
  prisma.product.create({
    data: { name: "Feijão preto 1kg", category: "Cesta Básica" },
  }),
  prisma.product.create({
    data: { name: "Macarrão espaguete 500g", category: "Cesta Básica" },
  }),
  prisma.product.create({
    data: { name: "Erva-mate 1kg", category: "Cesta Básica" },
  }),
  prisma.product.create({
    data: { name: "Café 500g", category: "Cesta Básica" },
  }),
  prisma.product.create({
    data: { name: "Sabão em pó 1kg", category: "Limpeza" },
  }),
  prisma.product.create({
    data: { name: "Detergente líquido 500ml", category: "Limpeza" },
  }),
  prisma.product.create({
    data: { name: "Água sanitária 1L", category: "Limpeza" },
  }),
  prisma.product.create({
    data: { name: "Desinfetante 500ml", category: "Limpeza" },
  }),
]);

  

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    
  });