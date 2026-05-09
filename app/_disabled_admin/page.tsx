export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SP = {
  ok?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const ok = sp?.ok === "1";

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
  });

  async function createOffer(formData: FormData) {
    "use server";

    const productId = String(formData.get("productId") || "");
    const storeId = String(formData.get("storeId") || "");
    const city = String(formData.get("city") || "");
    const region = String(formData.get("region") || "");
    const priceRaw = String(formData.get("price") || "0");

    const price = Number(priceRaw.replace(",", "."));

    if (!productId || !storeId || !price || !region || !city) {
      throw new Error("Preencha produto, loja, preço, cidade e região.");
    }

    await prisma.offer.create({
      data: {
        productId,
        storeId,
        price,
        city,
        region,
      },
    });

    revalidatePath("/");
    revalidatePath("/ofertas");
    revalidatePath("/ranking");
    revalidatePath("/cesta-basica-ranking");
    revalidatePath("/cesta-basica-regiao");
    revalidatePath("/proteinas");
    revalidatePath("/limpeza");
    revalidatePath("/cesta-basica");
    revalidatePath("/admin");

    redirect("/admin?ok=1");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">
        Administração
      </h1>

      <p className="mt-2 text-slate-600">
        Cadastre novas ofertas com cidade e região
      </p>

      {ok && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Oferta salva com sucesso
        </div>
      )}

      <form
        action={createOffer}
        className="mt-8 space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold">Produto</label>
          <select
            name="productId"
            required
            className="w-full rounded-xl border px-4 py-3"
            defaultValue=""
          >
            <option value="">Selecione</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Loja</label>
          <select
            name="storeId"
            required
            className="w-full rounded-xl border px-4 py-3"
            defaultValue=""
          >
            <option value="">Selecione</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Preço</label>
          <input
            name="price"
            type="number"
            step="0.01"
            required
            placeholder="Ex: 9.99"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Cidade</label>
          <select
            name="city"
            required
            className="w-full rounded-xl border px-4 py-3"
            defaultValue=""
          >
            <option value="">Selecione a cidade</option>
            <option value="Porto Alegre">Porto Alegre</option>
            <option value="Canoas">Canoas</option>
            <option value="Novo Hamburgo">Novo Hamburgo</option>
            <option value="São Leopoldo">São Leopoldo</option>
            <option value="Gravataí">Gravataí</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Região</label>
          <select
            name="region"
            required
            className="w-full rounded-xl border px-4 py-3"
            defaultValue=""
          >
            <option value="">Selecione a região</option>
            <option value="Centro">Centro</option>
            <option value="Zona Norte">Zona Norte</option>
            <option value="Zona Sul">Zona Sul</option>
            <option value="Zona Leste">Zona Leste</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white hover:bg-green-800"
        >
          Salvar oferta
        </button>
      </form>
    </main>
  );
}
