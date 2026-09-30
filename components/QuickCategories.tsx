import Link from "next/link";

const quickCategories = [
  {
    icon: "🥛",
    label: "Leite",
    search: "leite",
    background: "#EFF8FF",
    border: "#B9DDF5",
  },
  {
    icon: "🍚",
    label: "Arroz",
    search: "arroz",
    background: "#FFF8E8",
    border: "#EED9A5",
  },
  {
    icon: "🫘",
    label: "Feijão",
    search: "feijão",
    background: "#FFF1E8",
    border: "#EFC6AA",
  },
  {
    icon: "🛢️",
    label: "Óleo",
    search: "óleo",
    background: "#FFFBE5",
    border: "#E9D98B",
  },
  {
    icon: "🥚",
    label: "Ovos",
    search: "ovos",
    background: "#FAF7F0",
    border: "#DDD5C5",
  },
  {
    icon: "🐔",
    label: "Frango",
    search: "frango",
    background: "#FFF0F2",
    border: "#EDC2C8",
  },
  {
    icon: "🥩",
    label: "Carne",
    search: "carne",
    background: "#FDEEEF",
    border: "#E6B9BC",
  },
  {
    icon: "☕",
    label: "Café",
    search: "café",
    background: "#F7F0E8",
    border: "#D8C0A5",
  },
];

export default function QuickCategories() {
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900">
        O que está na sua lista hoje?
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {quickCategories.map((item) => (
          <Link
            key={item.search}
            href={`/ofertas?categoria=${encodeURIComponent(
              item.search
            )}`}
            style={{
              backgroundColor: item.background,
              borderColor: item.border,
              borderWidth: "2px",
              borderStyle: "solid",
            }}
            className="flex min-h-28 flex-col items-center justify-center rounded-2xl p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.82)",
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full text-3xl shadow-sm"
            >
              {item.icon}
            </div>

            <div className="mt-2 text-base font-extrabold text-slate-900">
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
