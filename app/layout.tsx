
import Header from "../components/Header";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "BaratoRadar",
  description: "O radar das melhores ofertas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
  <div className="bg-yellow-100 border-b border-yellow-300 text-center py-2 text-sm text-gray-800">
  🚧 Em teste — BaratoRadar está em sua versão inicial de lançamento. Estamos expandindo continuamente a cobertura de ofertas, regiões e funcionalidades para oferecer a melhor experiência aos consumidores.
</div>

  <Header />
  {children}
  <Analytics />
</body>
    </html>
  );
}