import SiteChrome from "../components/SiteChrome";
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
        <SiteChrome />

        {children}

        <Analytics />
      </body>
    </html>
  );
}