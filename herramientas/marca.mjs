// Dibuja la marca fuera de la aplicación: el icono de la pestaña, el de iPhone,
// el recortable de Android y la imagen del enlace. Se ejecuta a mano cuando
// cambie el logo; lo que se publica son los ficheros, no este script.
//
//   node herramientas/marca.mjs public && cp public/icono.svg app/icon.svg
//
// La papa es la misma de app/ui/Papa.tsx, quieta. Ojo con la fuente: rsvg usa
// las del sistema; para la imagen del enlace hay que tener Lilita One y
// Bricolage Grotesque instaladas (p. ej. en ~/.fonts), si no cae en otra.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const ROJO = "#E8412C";
const TINTA = "#141414";
const CREMA = "#FFF7F1";

// La papa con chullo, en las coordenadas de Papa.tsx (cabe en x 0–106, y -10–90).
const papa = ({ carrito = true } = {}) => `
  <path d="M12 62 C2 44 12 18 40 12 C62 6 92 10 98 32 C104 50 96 62 86 62 Z" fill="#D9A35B" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>
  <g fill="#A8733A"><circle cx="28" cy="40" r="2.4"/><circle cx="50" cy="24" r="2"/><circle cx="40" cy="52" r="1.8"/><circle cx="62" cy="46" r="2.2"/></g>
  <g stroke="#F1C98A" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M22 30l4-3"/><path d="M34 22l4-2"/><path d="M20 50l5-1"/><path d="M50 36l4-3"/><path d="M72 52l5-2"/></g>
  <path d="M52 11c-2-7 2-12 7-10m-7 10c5-5 10-5 12-1" stroke="#2F9E44" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <circle cx="91" cy="22" r="4.8" fill="${CREMA}" stroke="${TINTA}" stroke-width="1.8"/><circle cx="92" cy="22.6" r="2.1" fill="${TINTA}"/>
  <circle cx="80" cy="26" r="6.4" fill="${CREMA}" stroke="${TINTA}" stroke-width="2"/><circle cx="81.6" cy="26.6" r="2.7" fill="${TINTA}"/><circle cx="82.6" cy="25.4" r=".9" fill="${CREMA}"/>
  <circle cx="97" cy="38" r="2.4" fill="#8a5a2b"/>
  <path d="M84 44c3 4 8 4 11 0" stroke="${TINTA}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M70 12 C70 -4 92 -6 94 10 Z" fill="#FFD23F" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M73 4l4 3 4-3 4 3 4-3 3 2" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round" fill="none"/>
  <path d="M71 11l-1 9M93 10l1 8" stroke="${TINTA}" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="81" cy="-6" r="4" fill="${CREMA}" stroke="${TINTA}" stroke-width="2.2"/>
  ${carrito ? `
  <path d="M12 58 L2 40" stroke="${TINTA}" stroke-width="6" stroke-linecap="round"/>
  <rect x="8" y="62" width="82" height="7" rx="3.5" fill="${TINTA}"/>
  <circle cx="26" cy="81" r="8" fill="${TINTA}"/><rect x="24.6" y="75" width="2.8" height="12" rx="1.4" fill="${CREMA}"/>
  <circle cx="74" cy="81" r="8" fill="${TINTA}"/><rect x="72.6" y="75" width="2.8" height="12" rx="1.4" fill="${CREMA}"/>` : ""}`;

// Pestaña: la papa con su carrito sobre el rojo del toldo. (bbox ~ x -1..107, y -12..90)
const icono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="SuperCarrito">
  <rect width="64" height="64" rx="15" fill="${ROJO}"/>
  <g transform="translate(5.5 10.5) scale(0.5)">${papa()}</g>
</svg>
`;

// Android le hace un círculo por encima: la papa vive en el 80 % central.
const recortable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="SuperCarrito">
  <rect width="64" height="64" fill="${ROJO}"/>
  <g transform="translate(12 16.5) scale(0.38)">${papa()}</g>
</svg>
`;

// iOS redondea la esquina él mismo: el fondo llega hasta el borde.
const apple = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${ROJO}"/>
  <g transform="translate(8 13) scale(0.45)">${papa()}</g>
</svg>`;

// El enlace en WhatsApp: el letrero rojo, la papa grande y la promesa.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${ROJO}"/>
  <g transform="translate(110 150) scale(3.3)">${papa()}</g>
  <text font-family="Lilita One" font-size="120" fill="#fff" letter-spacing="1">
    <tspan x="560" y="250">SUPER</tspan><tspan x="560" y="360">CARRITO</tspan>
  </text>
  <text font-family="Bricolage Grotesque" font-weight="800" font-size="40" fill="#fff">
    <tspan x="560" y="450">Tu lista de la compra,</tspan><tspan x="560" y="500">ya hecha en tu Wong.</tspan>
  </text>
</svg>`;

const destino = process.argv[2];
writeFileSync(`${destino}/icono.svg`, icono);
writeFileSync(`${destino}/icono-recortable.svg`, recortable);
for (const [nombre, svg] of [
  ["icono-apple.png", apple],
  ["enlace.png", og],
]) {
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`${destino}/${nombre}`, png);
  console.log(nombre, png.length, "bytes");
}
