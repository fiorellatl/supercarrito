# 🛒 SuperCarrito

Tu compra de la semana, lista en el súper en dos minutos. Escribe o pega tu lista
(un WhatsApp, una captura del carrito, un menú), elige tu tienda Wong y
SuperCarrito arma el carrito con los precios y el stock de esa tienda, y lo lleva
a wong.pe con un enlace.

## Correr en tu laptop

```bash
npm install
npm run dev                         # datos REALES de Wong (por defecto)
CATALOG_PROVIDER=fake npm run dev   # catálogo ficticio, sin red (para demos)
```

- App: http://localhost:3000
- Editar menús y recetas (solo en local): http://localhost:3000/editar
- Leer capturas con IA: define `ANTHROPIC_API_KEY` en `.env.local`. Sin ella se
  usa un extractor de muestra y el resto funciona igual.

## Dónde está cada cosa

- `CLAUDE.md` — reglas de trabajo, arquitectura y comandos.
- `PRODUCT_CONTEXT.md` — visión, estrategia y competencia.
- `PROJECT_STATE.md` — estado actual (cabecera) e historia de decisiones.
