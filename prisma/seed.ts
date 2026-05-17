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

  // Limpa ofertas antigas para não duplicar
  await prisma.offer.deleteMany();

  // Ofertas
  await prisma.offer.createMany({
    data: [
      { productId: frango.id, storeId: atacadao.id, price: 8.99, unit: "kg", region: "Zona Norte" },
      { productId: frango.id, storeId: zaffari.id, price: 9.49, unit: "kg", region: "Centro" },
      { productId: patinho.id, storeId: carrefour.id, price: 29.9, unit: "kg", region: "Zona Norte" },
      { productId: linguica.id, storeId: atacadao.id, price: 12.9, unit: "kg", region: "Zona Sul" },
      { productId: ovos.id, storeId: carrefour.id, price: 9.9, unit: "dúzia", region: "Centro" },

      { productId: arroz.id, storeId: atacadao.id, price: 24.9, unit: "5kg", region: "Zona Norte" },
      { productId: feijao.id, storeId: zaffari.id, price: 7.49, unit: "1kg", region: "Centro" },
      { productId: macarrao.id, storeId: carrefour.id, price: 3.99, unit: "500g", region: "Zona Norte" },
      { productId: ervaMate.id, storeId: zaffari.id, price: 15.9, unit: "kg", region: "Centro" },
      { productId: cafe.id, storeId: carrefour.id, price: 13.5, unit: "500g", region: "Zona Sul" },

      { productId: sabao.id, storeId: atacadao.id, price: 8.99, unit: "kg", region: "Zona Norte" },
      { productId: detergente.id, storeId: carrefour.id, price: 2.49, unit: "500ml", region: "Centro" },
      { productId: aguaSanitaria.id, storeId: atacadao.id, price: 3.19, unit: "1L", region: "Zona Norte" },
      { productId: desinfetante.id, storeId: zaffari.id, price: 4.99, unit: "500ml", region: "Zona Sul" },
    ],
  });

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