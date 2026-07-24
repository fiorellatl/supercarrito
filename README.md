# 🛒 Super Carrito

Chat que convierte "Compra el menú 2" en un carrito de Wong con precios y total.

## Correr en tu laptop

```bash
npm install
npm run dev            # por defecto usa FakeWong (catálogo ficticio, sin red)
```

- Chat: http://localhost:3000 → escribe **"Compra el menú 2"**
- Editar tus menús: http://localhost:3000/editar

## Proveedor de catálogo (una sola configuración)

```bash
CATALOG_PROVIDER=fake npm run dev   # catálogo ficticio (por defecto)
CATALOG_PROVIDER=wong npm run dev   # datos REALES de Wong (API pública de VTEX)
```

- En **Netlify**, pon la variable de entorno `CATALOG_PROVIDER=wong` para datos reales.
- Si Wong no responde (timeout, 403, 429, endpoint caído), el sistema **degrada
  automáticamente a FakeWong**: nunca se rompe la experiencia.
- El resto del código nunca sabe qué proveedor está activo (contrato en `lib/catalog.ts`).

## Cómo funciona

- `data/menus.json` y `data/recipes.json` → datos estáticos (editables en `/editar`).
- `lib/cart.ts` → menú → ingredientes → busca productos → total.
- `lib/catalog.ts` → **contrato** `ProductoWong` (lo único que conoce el sistema).
- `lib/fakewong.ts` → catálogo ficticio + motor de ranking heurístico.
- `lib/wongvtex.ts` → conector real VTEX (`/api/catalog_system/pub/products/search`).
- `lib/wong.ts` → dispatcher: elige proveedor y degrada con elegancia.

## Guión de prueba con un usuario (este fin de semana)

Hipótesis: *una persona prefiere pedir su menú por chat en vez de armar la lista a mano.*

1. No expliques nada. Dale el chat y pídele que "compre el menú 2".
2. Observa: ¿entiende qué escribir? ¿confía en los productos elegidos? ¿mira el total?
3. Pregunta al final: ¿usarías esto? ¿qué esperabas que pasara al terminar?
4. Anota la primera frase que escribió sin ayuda (le sirve a Iris para la conversación).
