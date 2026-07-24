import { NextResponse } from "next/server";
import { menusResumen } from "@/lib/cart";

// Menús para la pantalla inicial (propuesta de valor + ejemplos tocables).
export async function GET() {
  const menus = await menusResumen();
  return NextResponse.json({ menus });
}
