# 🛒 Super Carrito

Chat que convierte "Compra el menú 2" en un carrito de Wong con precios y total.

## Correr en tu laptop (Wong real)

```bash
npm install
npm run dev
```

- Chat: http://localhost:3000 → escribe **"Compra el menú 2"**
- Editar tus menús: http://localhost:3000/editar

> En tu laptop pega a Wong real (API pública de VTEX). No necesitas Playwright ni login.

## Modo demo (sin acceso a Wong)

Si estás en una red que bloquea Wong, usa datos de ejemplo:

```bash
SUPERCARRITO_MOCK=1 npm run dev
```

## Cómo funciona

- `data/menus.json` y `data/recipes.json` → datos estáticos (editables en `/editar`).
- `lib/cart.ts` → menú → ingredientes → busca en Wong → total.
- `lib/wong.ts` → conector VTEX (`/api/catalog_system/pub/products/search`).

## Guión de prueba con un usuario (este fin de semana)

Hipótesis: *una persona prefiere pedir su menú por chat en vez de armar la lista a mano.*

1. No expliques nada. Dale el chat y pídele que "compre el menú 2".
2. Observa: ¿entiende qué escribir? ¿confía en los productos elegidos? ¿mira el total?
3. Pregunta al final: ¿usarías esto? ¿qué esperabas que pasara al terminar?
4. Anota la primera frase que escribió sin ayuda (le sirve a Iris para la conversación).
