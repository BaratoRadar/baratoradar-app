import {
  findOrCreateProduct,
  findOrCreateStore,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";

const CONFIG = {
  name: "Desco",
  storeName: "Desco Atacado",
  city: "Porto Alegre",
  region: "Porto Alegre",
  source: "vipcommerce:desco",

  organizationId: 274,
  vipcommerceFilialId: 312,
  filialId: 1,
  centroDistribuicaoId: 11,

  domain: "loja.desco.com.br",

  baseUrl:
    "https://services.vipcommerce.com.br/api-admin/v1",
} as const;

type VipOferta = {
  preco_antigo?: string;
  preco_oferta?: string;
  quantidade_minima?: number;
  quantidade_maxima?: number;
  menor_preco?: string;
};

type VipProduct = {
  produto_id: number;
  classificacao_mercadologica_id?: number;
  marca_id?: number;
  descricao: string;
  imagem?: string;
  disponivel: boolean;
  preco: string;
  quantidade_minima?: string;
  quantidade_maxima?: string;
  link?: string;
  codigo_barras?: string;
  sku?: string;
  codigo_erp?: number;
  em_oferta?: boolean;
  oferta?: VipOferta | null;
  unidade_sigla?: string;
  secao_id?: number;
};

type VipSearchResponse = {
  success: boolean;
  data: {
    busca_id?: string;
    produtos: VipProduct[];
    digitado?: string;
    termo?: string;
    filtros?: unknown;
  };
};

type NormalizedProduct = {
  externalId: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  listPrice?: number;
  unit?: string;
  available: boolean;
  availableQuantity?: number;
  validUntil?: Date;
  imageUrl?: string;
  url?: string;
};

async function getPublicCredentials(): Promise<{
  username: string;
  key: string;
}> {
  console.log(
    "Obtendo configuração pública atual do Desco..."
  );

  const homeResponse = await fetch(
    "https://www.loja.desco.com.br",
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "BaratoRadar/1.0",
      },
    }
  );

  if (!homeResponse.ok) {
    throw new Error(
      `Falha ao abrir loja Desco: HTTP ${homeResponse.status}`
    );
  }

  const home = await homeResponse.text();

  const mainMatch = home.match(
    /(?:src=["']?)?(main-[A-Z0-9]+\.js)/i
  );

  if (!mainMatch) {
    throw new Error(
      "Bundle main do Desco não encontrado."
    );
  }

  const mainUrl =
    `https://www.loja.desco.com.br/${mainMatch[1]}`;

  const mainResponse = await fetch(mainUrl, {
    headers: {
      Accept: "*/*",
      "User-Agent": "BaratoRadar/1.0",
    },
  });

  if (!mainResponse.ok) {
    throw new Error(
      `Falha ao baixar main Desco: HTTP ${mainResponse.status}`
    );
  }

  const main = await mainResponse.text();

  const chunks = Array.from(
    new Set(
      main.match(/chunk-[A-Z0-9]+\.js/g) ?? []
    )
  );

  if (chunks.length === 0) {
    throw new Error(
      "Nenhum chunk do Desco encontrado."
    );
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch(
        `https://www.loja.desco.com.br/${chunk}`,
        {
          headers: {
            Accept: "*/*",
            "User-Agent": "BaratoRadar/1.0",
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const body = await response.text();

      const user =
        body.match(/lojaUser:"([^"]+)"/);

      const key =
        body.match(/lojaAuthJWT:"([^"]+)"/);

      if (user && key) {
        console.log(
          `Configuração pública encontrada em ${chunk}`
        );

        return {
          username: user[1],
          key: key[1],
        };
      }
    } catch {
      // Continua procurando nos demais chunks.
    }
  }

  throw new Error(
    "Credenciais públicas da loja não encontradas nos bundles atuais."
  );
}

async function getStoreToken(): Promise<string> {
  const credentials = await getPublicCredentials();

  const response = await fetch(
    `${CONFIG.baseUrl}/org/${CONFIG.organizationId}/auth/loja/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        DomainKey: CONFIG.domain,
        OrganizationId: String(CONFIG.organizationId),
      },
      body: JSON.stringify({
        domain: CONFIG.domain,
        username: credentials.username,
        key: credentials.key,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Falha no login Desco: HTTP ${response.status}`
    );
  }

  const body = (await response.json()) as {
    success: boolean;
    data?: string;
  };

  if (!body.success || !body.data) {
    throw new Error(
      "JWT público da loja Desco não recebido."
    );
  }

  return body.data;
}

const DEPARTMENTS = [
  { id: 1, name: "BAZAR E UTILIDADES" },
  { id: 2, name: "BEBIDAS" },
  { id: 3, name: "BISCOITOS E CHOCOLATES" },
  { id: 4, name: "CARNES" },
  { id: 5, name: "CEREAIS E FARINÁCEOS" },
  { id: 6, name: "CONGELADOS" },
  { id: 7, name: "FRIOS E LATICÍNIOS" },
  { id: 8, name: "HORTIFRÚTI" },
  { id: 9, name: "LIMPEZA" },
  { id: 10, name: "MATINAIS E SOBREMESAS" },
  { id: 11, name: "MERCEARIA" },
  { id: 12, name: "PADARIA" },
  { id: 13, name: "PERFUMARIA E HIGIENE" },
  { id: 14, name: "PET SHOP" },
] as const;

type VipDepartmentResponse = {
  success: boolean;
  data: VipProduct[];
  paginator?: {
    page: number;
    items_per_page: number;
    total_pages: number;
    total_items: number;
  };
  isRedirect?: boolean;
};

async function fetchDepartmentPage(
  token: string,
  departmentId: number,
  page: number,
  maxRetries = 5
): Promise<VipDepartmentResponse> {
  const url =
    `${CONFIG.baseUrl}` +
    `/org/${CONFIG.organizationId}` +
    `/filial/${CONFIG.filialId}` +
    `/centro_distribuicao/${CONFIG.centroDistribuicaoId}` +
    `/loja/classificacoes_mercadologicas` +
    `/departamentos/${departmentId}/produtos` +
    `?page=${page}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Departamento ${departmentId} | página ${page}` +
      (attempt > 1
        ? ` | tentativa ${attempt}/${maxRetries}`
        : "")
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          DomainKey: CONFIG.domain,
          OrganizationId:
            String(CONFIG.organizationId),
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(60000),
      });

      if (response.ok) {
        return (await response.json()) as VipDepartmentResponse;
      }

      const body = await response.text();

      console.warn(
        `HTTP ${response.status} | departamento ${departmentId} | página ${page}`
      );

      if (
        response.status < 500 ||
        attempt === maxRetries
      ) {
        throw new Error(
          `HTTP ${response.status} - ${body}`
        );
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `Falha temporária. Nova tentativa em ${attempt * 3}s...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 3000)
      );
    }
  }

  throw new Error(
    `Não foi possível buscar departamento ${departmentId}, página ${page}`
  );
}

function mapCategory(product: VipProduct): string {
  const name = product.descricao.toLowerCase();

  if (
    name.includes("frango") ||
    name.includes("carne") ||
    name.includes("bovina") ||
    name.includes("suína") ||
    name.includes("suina") ||
    name.includes("linguiça") ||
    name.includes("linguica") ||
    name.includes("peixe") ||
    name.includes("pescado") ||
    name.includes("ovo")
  ) {
    return "Proteínas";
  }

  if (
    name.includes("arroz") ||
    name.includes("feijão") ||
    name.includes("feijao") ||
    name.includes("macarrão") ||
    name.includes("macarrao") ||
    name.includes("farinha") ||
    name.includes("açúcar") ||
    name.includes("acucar") ||
    name.includes("café") ||
    name.includes("cafe") ||
    name.includes("leite") ||
    name.includes("erva-mate") ||
    name.includes("erva mate")
  ) {
    return "Cesta Básica";
  }

  if (
    name.includes("detergente") ||
    name.includes("desinfetante") ||
    name.includes("sabão") ||
    name.includes("sabao") ||
    name.includes("água sanitária") ||
    name.includes("agua sanitaria") ||
    name.includes("lava roupas") ||
    name.includes("limpador")
  ) {
    return "Limpeza";
  }

  return "Oferta";
}

function normalizeProduct(
  product: VipProduct
): NormalizedProduct | null {
  if (!product.disponivel) {
    return null;
  }

  const normalPrice = Number(product.preco);

  if (!Number.isFinite(normalPrice) || normalPrice <= 0) {
    return null;
  }

  /*
   * O preço promocional da VIPCommerce pode exigir
   * quantidade mínima. Por isso o BaratoRadar mantém
   * inicialmente o preço unitário normal como principal.
   */
  const listPrice =
    product.em_oferta &&
    product.oferta?.preco_antigo
      ? Number(product.oferta.preco_antigo)
      : normalPrice;

  const maxQuantity = product.quantidade_maxima
    ? Number(product.quantidade_maxima)
    : undefined;

  return {
    externalId: String(product.produto_id),
    name: product.descricao.trim(),
    category: mapCategory(product),
    price: normalPrice,
    listPrice:
      Number.isFinite(listPrice) ? listPrice : normalPrice,
    unit: product.unidade_sigla,
    available: product.disponivel,
    availableQuantity:
      maxQuantity !== undefined &&
      Number.isFinite(maxQuantity)
        ? maxQuantity
        : undefined,
    imageUrl: product.imagem,
    url: product.link
      ? `https://www.loja.desco.com.br/produto/${product.produto_id}/${product.link}`
      : undefined,
  };
}

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" BARATORADAR — DESCO");
  console.log("=================================");
  console.log("CATÁLOGO REAL — PREÇOS ATUAIS");
  console.log("");

  console.log("Obtendo token da loja...");
  const token = await getStoreToken();

  console.log("LOGIN: OK");

  const uniqueProducts =
    new Map<number, VipProduct>();

  let totalReceived = 0;
  let totalPages = 0;

  for (const department of DEPARTMENTS) {
    console.log("");
    console.log("---------------------------------");
    console.log(
      `${department.id} — ${department.name}`
    );
    console.log("---------------------------------");

    let page = 1;
    let lastPage = 1;

    do {
      const response = await fetchDepartmentPage(
        token,
        department.id,
        page
      );

      const pageProducts =
        response.data ?? [];

      totalReceived += pageProducts.length;
      totalPages += 1;

      for (const product of pageProducts) {
        uniqueProducts.set(
          product.produto_id,
          product
        );
      }

      lastPage =
        response.paginator?.total_pages ?? page;

      console.log(
        `Página ${page}/${lastPage}: ` +
        `${pageProducts.length} produtos | ` +
        `únicos acumulados: ${uniqueProducts.size}`
      );

      page += 1;
    } while (page <= lastPage);
  }

  const allProducts =
    Array.from(uniqueProducts.values());

  console.log("");
  console.log("=================================");
  console.log(" COLETA CONCLUÍDA");
  console.log("=================================");
  console.log(
    `Recebidos brutos: ${totalReceived}`
  );
  console.log(
    `Produtos únicos: ${allProducts.length}`
  );
  console.log(
    `Páginas: ${totalPages}`
  );

  const products = allProducts
    .map(normalizeProduct)
    .filter(
      (product): product is NormalizedProduct =>
        product !== null
    );

  const ignored =
    allProducts.length - products.length;

  console.log("");
  console.log(
    `${allProducts.length} únicos / ` +
    `${products.length} normalizados / ` +
    `${ignored} ignorados`
  );
  console.log("");

  const store = await findOrCreateStore(
    CONFIG.storeName,
    CONFIG.city,
    CONFIG.name,
    CONFIG.region
  );

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of products) {
    try {
      const product = await findOrCreateProduct(
        item.name,
        item.category,
        {
          externalId: item.externalId,
          externalSource: CONFIG.source,
          brand: item.brand,
          imageUrl: item.imageUrl,
          url: item.url,
        }
      );

      const result = await saveOrUpdateOffer({
        productId: product.id,
        storeId: store.id,
        price: item.price,
        listPrice: item.listPrice,
        unit: item.unit,
        city: CONFIG.city,
        region: CONFIG.region,
        validUntil: item.validUntil,
        available: item.available,
        availableQuantity:
          item.availableQuantity,
        source: CONFIG.source,
      });

      if (result === "created") {
        created += 1;
      } else {
        updated += 1;
      }

      if ((created + updated) % 100 === 0) {
        console.log(
          `Gravação: ${created + updated}/${products.length}`
        );
      }
    } catch (error) {
      errors += 1;

      console.error(
        `ERRO | ${item.name}`,
        error
      );
    }
  }

  console.log("");
  console.log("=================================");
  console.log(" DESCO — CARGA CONCLUÍDA");
  console.log("=================================");
  console.log(
    `Recebidos brutos: ${totalReceived}`
  );
  console.log(
    `Produtos únicos: ${allProducts.length}`
  );
  console.log(
    `Normalizados: ${products.length}`
  );
  console.log(`Ignorados: ${ignored}`);
  console.log(`Novas ofertas: ${created}`);
  console.log(`Atualizadas: ${updated}`);
  console.log(`Erros: ${errors}`);
  console.log("=================================");
}

main().catch((error) => {
  console.error("");
  console.error("ERRO NO CONNECTOR DESCO");
  console.error(error);
  process.exit(1);
});
