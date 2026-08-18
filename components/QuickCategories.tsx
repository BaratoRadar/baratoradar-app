import Link from "next/link";

const quickCategories = [
  { icon: "🥛", label: "Leite", search: "leite" },
  { icon: "🍚", label: "Arroz", search: "arroz" },
  { icon: "🫘", label: "Feijão", search: "feijão" },
  { icon: "🛢️", label: "Óleo", search: "óleo" },
  { icon: "🥚", label: "Ovos", search: "ovos" },
  { icon: "🐔", label: "Frango", search: "frango" },
  { icon: "🥩", label: "Carne", search: "carne" },
  { icon: "☕", label: "Café", search: "café" },
];

export default function QuickCategories() {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          O que está na sua lista hoje?
        </h2>

        <p className="mt-2 text-slate-600">
          Escolha um produto e deixe o BaratoRadar mostrar onde vale mais a pena comprar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickCategories.map((item) => (
          <Link
            key={item.search}
            href={`/ofertas?busca=${encodeURIComponent(item.search)}`}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-xl"
          >
            <div className="text-5xl">{item.icon}</div>

            <div className="mt-4 text-xl font-bold text-slate-900">
              {item.label}
            </div>

            <div className="mt-2 text-sm font-semibold text-emerald-700">
              Ver onde comprar →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}