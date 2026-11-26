// Prueba de humo. No es una suite de tests: es el recorrido mínimo que tiene
// que seguir funcionando antes de enseñarle el producto a una familia.
//
//   npm run humo                          → reglas de lib/contexto.ts
//   SUPERCARRITO_URL=http://localhost:3000 npm run humo
//                                         → además, /api/chat de punta a punta
//
// Los casos salen de WhatsApps reales de la bitácora (design/bitacora-de-uso.md):
// cada línea de conversación que una vez acabó en el carrito con precio está
// aquí para que no vuelva.

import { naturalezaDe } from "../lib/contexto.ts";

let fallos = 0;
const esperar = (cond: boolean, mensaje: string) => {
  if (!cond) {
    fallos++;
    console.error(`  ✗ ${mensaje}`);
  }
};

const CONVERSACION = [
  "Hola mami buenos días 🙋‍♀️",
  "para el almuerzo del domingo necesito:",
  "gracias!! 😘",
  "gracias mami",
  "buenos días mami",
  "hola amor, cómo estás",
  "para la semana:",
  "mami compra esto porfa",
  "besos mami",
  "te quiero mucho",
  "[10:03",
  "2/8/2026] Mamá: compra por favor",
];

const COMPRAS = [
  "2 kg de pollo", "arroz", "1/2 kg de queso fresco", "leche gloria",
  "papel higiénico", "papa amarilla", "té", "te verde", "sal",
  "pan para el desayuno", "huevos para mañana", "queso para mami",
  "pollo porfa", "hola, necesito pollo", "aceite primor 1L", "mil hojas",
];

console.log("Contexto: la conversación no se busca");
for (const l of CONVERSACION)
  esperar(naturalezaDe(l).naturaleza !== "compra", `«${l}» se iría al buscador`);

console.log("Contexto: las compras sí se buscan");
for (const l of COMPRAS)
  esperar(naturalezaDe(l).naturaleza === "compra", `«${l}» dejaría de buscarse`);

const base = process.env.SUPERCARRITO_URL;
if (base) {
  console.log(`API: ${base}/api/chat`);
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lineas: ["pollo", "arroz", "leche"] }),
  });
  const data = await res.json();
  esperar(data.ok === true, "no armó carrito");
  esperar(Array.isArray(data.items) && data.items.length === 3, "no devolvió 3 líneas");
  esperar(Array.isArray(data.sinRespuesta), "falta sinRespuesta");
  for (const it of data.items ?? [])
    esperar(
      !(it.encontrado && it.degradado),
      `«${it.ingrediente}» trae un producto inventado tras un fallo de Wong`
    );
  if ((data.sinRespuesta ?? []).length)
    console.log(`  (Wong no contestó para: ${data.sinRespuesta.join(", ")})`);
}

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo en orden.");
