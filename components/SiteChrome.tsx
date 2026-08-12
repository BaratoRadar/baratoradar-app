"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function SiteChrome() {
  const pathname = usePathname();

  // Páginas com identidade própria
  if (pathname === "/landing" || pathname === "/home-2") {
    return null;
  }

  return (
    <>
      <div className="border-b border-amber-200 bg-amber-50 py-2 text-center text-xs font-semibold text-amber-800">
        🟡 Em teste • Porto Alegre é nossa cidade piloto • Atualização diária das ofertas
      </div>

      <Header />
    </>
  );
}