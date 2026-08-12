const CONFIG = {
  name: "Grupo Zaffari",
  city: "Porto Alegre",
  source: "VTEX",
  clusterId: 863,
  pageSize: 50,
  baseUrl:
    "https://www.zaffari.com.br/api/catalog_system/pub/products/search",
} as const;

async function fetchPage(from: number, to: number) {
  const url = new URL(CONFIG.baseUrl);

  url.searchParams.set("fq", `H:${CONFIG.clusterId}`);
  url.searchParams.set("_from", String(from));
  url.searchParams.set("_to", String(to));

  console.log(`Buscando ${url.toString()}`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BaratoRadar/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} - ${await response.text()}`
    );
  }

  return response.json();
}

async function main() {
  console.log("");
  console.log("==============================");
  console.log(CONFIG.name);
  console.log("==============================");

  let from = 0;
  let total = 0;

  const allProducts: any[] = [];

  while (true) {
    const to = from + CONFIG.pageSize - 1;

    const products = await fetchPage(from, to);

    console.log(
      `Página ${from}-${to}: ${products.length} produtos`
    );

    allProducts.push(...products);
    total += products.length;

    if (products.length < CONFIG.pageSize) {
      break;
    }

    from += CONFIG.pageSize;
  }

  console.log("");
  console.log("==============================");
  console.log(`TOTAL: ${total} produtos`);
  console.log("==============================");

  console.log("");
  console.log("=== PRIMEIRO PRODUTO COMPLETO ===");

  console.dir(allProducts[0], {
    depth: null,
  });
}

main().catch(console.error);