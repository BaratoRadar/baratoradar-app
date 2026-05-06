"use client";

const storeLinks: Record<string, string> = {
  Zaffari: "https://www.zaffari.com.br",
  Carrefour: "https://mercado.carrefour.com.br",
  "Atacadão": "https://www.atacadao.com.br",
};

export default function ClickButtons({ storeName }: { storeName: string }) {
  const link = storeLinks[storeName] || "#";

  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={async () => {
          await fetch("/api/click", {
            method: "POST",
            body: JSON.stringify({
              type: "ver_ofertas",
              store: storeName,
            }),
          });
        }}
        className="rounded-xl bg-green-700 px-5 py-2 text-sm font-semibold text-white"
      >
        🛒 Ver ofertas
      </button>

      <button
        onClick={async () => {
          await fetch("/api/click", {
            method: "POST",
            body: JSON.stringify({
              type: "ir_loja",
              store: storeName,
            }),
          });

          if (link !== "#") {
            window.open(link, "_blank");
          }
        }}
        className="rounded-xl border px-5 py-2 text-sm font-semibold text-slate-700"
      >
        📍 Ir para loja
      </button>
    </div>
  );
}