import { PDFParse } from "pdf-parse";
import {
  findOrCreateProduct,
  findOrCreateStore,
  saveOrUpdateOffer,
} from "../../lib/scraper-utils";

const CONFIG = {
  name: "Akki Atacadista",
  storeName: "Akki Atacadista",
  city: "São Paulo",
  region: "São Paulo",
  source: "pdf:akki",
  offersPage: "https://akkiatacadista.com.br/jornal-de-ofertas/",
} as const;

type ParsedOffer = {
  name: string;
  price: number;
  unit: string;
  rule: string;
  category: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/");
}

function findPdfUrl(html: string): string {
  const decoded = decodeHtml(html);

  const candidates =
    decoded.match(/https?:\/\/[^"'<> ]+\.pdf/gi) ?? [];

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      const embedded = url.searchParams.get("file");

      if (embedded?.toLowerCase().endsWith(".pdf")) {
        return decodeURIComponent(embedded);
      }

      if (url.pathname.toLowerCase().endsWith(".pdf")) {
        return candidate;
      }
    } catch {
      // continua procurando
    }
  }

  throw new Error("PDF atual do Akki não encontrado.");
}

function parseBrazilianDate(
  value: string,
  endOfDay = false
): Date {
  const [day, month, year] = value.split("/").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
}

function findValidity(text: string) {
  const normalized = text.replace(/\s+/g, " ");

  const match = normalized.match(
    /OFERTAS\s+VÁLIDAS\s+DE\s+(\d{2}\/\d{2})\s+A\s+(\d{2}\/\d{2}\/\d{4})/i
  );

  if (!match) {
    throw new Error(
      "Não foi possível identificar a validade do tabloide."
    );
  }

  const year = match[2].slice(-4);
  const start = `${match[1]}/${year}`;
  const end = match[2];

  return {
    start,
    end,
    startDate: parseBrazilianDate(start),
    endDate: parseBrazilianDate(end, true),
  };
}

function mapCategory(name: string): string {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    n.includes("frango") ||
    n.includes("bovino") ||
    n.includes("patinho") ||
    n.includes("coxao") ||
    n.includes("linguica") ||
    n.includes("tilapia") ||
    n.includes("file mignon") ||
    n.includes("sassami") ||
    n.includes("bisteca") ||
    n.includes("hamburguer")
  ) {
    return "Proteínas";
  }

  if (
    n.includes("arroz") ||
    n.includes("feij") ||
    n.includes("oleo de soja") ||
    n.includes("cafe") ||
    n.includes("farinha") ||
    n.includes("macarrao") ||
    n.includes("leite condensado")
  ) {
    return "Cesta Básica";
  }

  if (
    n.includes("detergente") ||
    n.includes("lava roupas") ||
    n.includes("amaciante") ||
    n.includes("papel higienico") ||
    n.includes("limpador")
  ) {
    return "Limpeza";
  }

  return "Oferta";
}

function parseOffers(text: string): ParsedOffer[] {
  const start = text.indexOf("OFERTAS VÁLIDAS");
  const body = start >= 0 ? text.slice(start) : text;

  const lines = body
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\t+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  const priceRegex =
    /^(\d{1,4})\s*,\s*(\d{2})\s*(UNIDADE|PACOTE|KG|CAIXA|KIT|BALDE|FARDO)?$/i;

  const inlineVarejoRegex =
    /^(?:unidade|pacote|kg|caixa|kit|balde|fardo)?\s*(\d{1,4})\s*,\s*(\d{2})\s+Varejo$/i;

  const labels = [
    /^VAREJO$/i,
    /^ATACADO$/i,
    /^A PARTIR DE:?$/i,
    /^\d+\s+UNID\.?$/i,
    /^COMPRANDO COM$/i,
    /^PAGANDO COM/i,
    /^MEMBROS DO CLUBE/i,
    /^CLIENTE CLUBE/i,
    /^Nesta$/i,
    /^embalagem,$/i,
    /^a unid\. sai por:?$/i,
    /^o kg sai por:?$/i,
    /^Tam\. Quant\./i,
    /^[PMG] \d+$/i,
    /^XG \d+$/i,
    /^XXG \d+$/i,
    /^CONGELADO$/i,
    /^SÓ NO DIA:/i,
    /^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)$/i,
  ];

  const isLabel = (line: string) =>
    labels.some((rx) => rx.test(line));

  const priceValue = (match: RegExpMatchArray) =>
    Number(match[1]) + Number(match[2]) / 100;

  const cleanNamePart = (line: string) =>
    line
      .replace(
        /\s+\d{1,4}\s*,\s*\d{2}\s*(UNIDADE|PACOTE|KG|CAIXA|KIT|BALDE|FARDO)?$/i,
        ""
      )
      .trim();

  const offers: ParsedOffer[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].match(priceRegex);

    if (!current) continue;

    const contextBefore = lines
      .slice(Math.max(0, i - 4), i)
      .join(" ")
      .toLowerCase();

    if (
      contextBefore.includes("a unid. sai por") ||
      contextBefore.includes("o kg sai por")
    ) {
      continue;
    }

    let price = priceValue(current);
    const unit =
      (current[3] ?? "UNIDADE").toUpperCase();

    let rule = "preço único";

    if (/^VAREJO$/i.test(lines[i + 1] ?? "")) {
      rule = "varejo explícito";
    }

    const next = lines[i + 1] ?? "";
    const inlineVarejo =
      next.match(inlineVarejoRegex);

    if (inlineVarejo) {
      price = priceValue(inlineVarejo);
      rule = "varejo após atacado";
    }

    if (/^VAREJO$/i.test(lines[i - 1] ?? "")) {
      continue;
    }

    const nameParts: string[] = [];

    for (
      let j = i - 1;
      j >= 0 && j >= i - 5;
      j--
    ) {
      let line = lines[j];

      if (priceRegex.test(line)) break;
      if (inlineVarejoRegex.test(line)) break;

      if (
        /^CONGELADO$/i.test(line) ||
        /^SÓ NO DIA:/i.test(line) ||
        /^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)$/i.test(line)
      ) {
        break;
      }

      if (isLabel(line)) continue;

      if (
        /^\d{2}\/\d{2}/.test(line) ||
        /^\d+$/.test(line)
      ) {
        continue;
      }

      line = cleanNamePart(line);

      if (line) {
        nameParts.unshift(line);
      }
    }

    const name = nameParts.join(" ").trim();

    if (
      name.length < 4 ||
      /OFERTAS VÁLIDAS/i.test(name) ||
      /Nesta embalagem/i.test(name) ||
      /sai por/i.test(name)
    ) {
      continue;
    }

    offers.push({
      name,
      price,
      unit,
      rule,
      category: mapCategory(name),
    });
  }

  return offers;
}

async function main() {
  console.log("");
  console.log("=================================");
  console.log(" AKKI SÃO PAULO");
  console.log("=================================");

  console.log("Buscando página de ofertas...");

  const pageResponse = await fetch(CONFIG.offersPage, {
    headers: {
      "User-Agent": "BaratoRadar/1.0",
      Accept: "text/html",
    },
  });

  if (!pageResponse.ok) {
    throw new Error(
      `Página Akki respondeu HTTP ${pageResponse.status}`
    );
  }

  const html = await pageResponse.text();
  const pdfUrl = findPdfUrl(html);

  console.log("PDF encontrado:");
  console.log(pdfUrl);

  const pdfResponse = await fetch(pdfUrl, {
    headers: {
      "User-Agent": "BaratoRadar/1.0",
    },
  });

  if (!pdfResponse.ok) {
    throw new Error(
      `PDF Akki respondeu HTTP ${pdfResponse.status}`
    );
  }

  const buffer = Buffer.from(
    await pdfResponse.arrayBuffer()
  );

  console.log(
    `PDF baixado: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
  );

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text;

  console.log(
    `Texto extraído: ${text.length} caracteres`
  );

  const validity = findValidity(text);

  console.log("");
  console.log(`Validade inicial: ${validity.start}`);
  console.log(`Validade final:   ${validity.end}`);

  const now = new Date();

  const expired = now > validity.endDate;

  if (
    expired &&
    process.env.ALLOW_EXPIRED_DRY_RUN !== "1"
  ) {
    console.log("");
    console.log("=================================");
    console.log(" TABLOIDE VENCIDO");
    console.log("=================================");
    console.log("Nenhuma oferta será gravada.");
    console.log("Aguardando nova edição do Akki.");
    return;
  }

  const offers = parseOffers(text);

  console.log("");
  console.log("=================================");
  console.log(" PARSING CONCLUÍDO");
  console.log("=================================");
  console.log(`Ofertas seguras: ${offers.length}`);

  if (
    process.env.DRY_RUN === "1" ||
    process.env.ALLOW_EXPIRED_DRY_RUN === "1"
  ) {
    console.log("");
    console.log("=================================");
    console.log(" DRY RUN — AKKI SÃO PAULO");
    console.log("=================================");

    for (const item of offers) {
      console.log(
        `${item.price.toFixed(2).padStart(8)} | ` +
        `${item.unit.padEnd(8)} | ` +
        `${item.category.padEnd(13)} | ` +
        `${item.name}`
      );
    }

    console.log("");
    console.log(`Total seguro: ${offers.length}`);
    console.log("Nenhum registro foi gravado.");
    return;
  }

  if (now < validity.startDate) {
    console.log("Tabloide ainda não vigente.");
    console.log("Nenhuma oferta será gravada.");
    return;
  }

  const store = await findOrCreateStore(
    CONFIG.storeName,
    CONFIG.city,
    CONFIG.name,
    CONFIG.region
  );

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of offers) {
    try {
      const product =
        await findOrCreateProduct(
          item.name,
          item.category
        );

      const result =
        await saveOrUpdateOffer({
          productId: product.id,
          storeId: store.id,
          price: item.price,
          unit: item.unit,
          city: CONFIG.city,
          region: CONFIG.region,
          validUntil: validity.endDate,
          available: true,
          source: CONFIG.source,
        });

      if (result === "created") {
        created++;
      } else {
        updated++;
      }
    } catch (error) {
      errors++;
      console.error(
        `ERRO | ${item.name}`,
        error
      );
    }
  }

  console.log("");
  console.log("=================================");
  console.log(" AKKI — CARGA CONCLUÍDA");
  console.log("=================================");
  console.log(`Ofertas seguras: ${offers.length}`);
  console.log(`Novas ofertas: ${created}`);
  console.log(`Atualizadas: ${updated}`);
  console.log(`Erros: ${errors}`);
  console.log("=================================");
}

main().catch((error) => {
  console.error("");
  console.error("ERRO NO CONNECTOR AKKI");
  console.error(error);
  process.exit(1);
});
