import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const ofertas = await prisma.offer.findMany();

    return NextResponse.json(ofertas);
  } catch (error) {
    console.error("Erro ao buscar ofertas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}