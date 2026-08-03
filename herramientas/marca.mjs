// Dibuja los PNG de la marca. Se ejecuta a mano cuando cambie el logo; lo que
// se publica son los ficheros, no este script.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const PINO = "#2E5D4B";
const PAPEL = "#F5F3ED";
const TINTA = "#223354";
const LAPIZ = "#7F8A80";
const RENGLON = "#E9E4D8";

const carro = (c, sw) => `
  <g fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 4h2.2l2.6 10.4h9.4L20 7.2H6.4"/>
  </g>
  <circle cx="9.5" cy="19" r="1.3" fill="${c}"/>
  <circle cx="16.5" cy="19" r="1.3" fill="${c}"/>`;

// iOS redondea la esquina él mismo: el fondo llega hasta el borde.
const icono = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="${PINO}"/>
  <g transform="translate(12,12) scale(0.78) translate(-12,-12)">${carro(PAPEL, 1.5)}</g>
</svg>`;

const renglones = Array.from(
  { length: 9 },
  (_, i) => `<rect x="0" y="${71 + i * 72}" width="1200" height="1" fill="${RENGLON}"/>`
).join("");

// Ojo con la fuente: rsvg usa las del sistema, no las del navegador. Se pide la
// misma familia que la aplicación y se deja que caiga en la que haya.
const F = "Segoe UI, SF Pro Rounded, system-ui, sans-serif";

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPEL}"/>
  ${renglones}
  <g transform="translate(96,196) scale(3.2)">${carro(PINO, 1.6)}</g>
  <text x="190" y="250" font-family="${F}" font-size="54" font-weight="600" fill="${TINTA}">SuperCarrito</text>
  <text x="96" y="368" font-family="${F}" font-size="46" font-weight="600" fill="${TINTA}">Anota lo que falta en casa</text>
  <text x="96" y="424" font-family="${F}" font-size="46" font-weight="600" fill="${TINTA}">como te salga.</text>
  <text x="96" y="492" font-family="${F}" font-size="32" font-weight="400" fill="${LAPIZ}">Yo lo convierto en tu carrito de Wong,</text>
  <text x="96" y="534" font-family="${F}" font-size="32" font-weight="400" fill="${LAPIZ}">con los precios de tu tienda.</text>
</svg>`;

const destino = process.argv[2];
for (const [nombre, svg] of [
  ["icono-apple.png", icono],
  ["enlace.png", og],
]) {
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`${destino}/${nombre}`, png);
  console.log(nombre, png.length, "bytes");
}
