// Prueba del conector de Wong. Correr: node --experimental-strip-types scripts/probar-wong.ts
import { extraerPrimero, buscarEnWong } from "../lib/wong.ts";

// Muestra de la forma REAL que devuelve la API de VTEX (recortada a lo que usamos).
const muestraVtex = [
  {
    productName: "Pechuga de Pollo San Fernando x kg",
    linkText: "pechuga-de-pollo-san-fernando",
    items: [
      {
        images: [{ imageUrl: "https://.../pechuga.jpg" }],
        sellers: [{ commertialOffer: { Price: 15.9, IsAvailable: true } }],
      },
    ],
  },
];

console.log("=== 1) Lógica de extracción (respuesta VTEX de ejemplo) ===");
console.log(extraerPrimero("pollo", muestraVtex[0]));

console.log("\n=== 2) Casos borde de Sofía (QA) ===");
console.log("sin precio:", extraerPrimero("pollo", { productName: "X", items: [] }));
console.log("producto vacío:", extraerPrimero("humo", {}));

console.log("\n=== 3) Llamada EN VIVO a Wong (VTEX) ===");
const vivo = await buscarEnWong("pollo");
console.log(vivo);
console.log(
  vivo.encontrado
    ? "→ ✅ Wong respondió con precio real."
    : `→ ⚠️  No se pudo (esperado en este sandbox: red bloqueada). Motivo: ${vivo.motivo}. El chat NO se rompe.`
);
