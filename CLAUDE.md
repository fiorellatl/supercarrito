# SuperCarrito

Asistente para hacer la compra del hogar en Perú: de una lista escrita o pegada
(WhatsApp, captura, menú) a un carrito real en el supermercado, con precios de
tu tienda. Construimos un **producto**, no un proyecto de programación.
Objetivo: **aprender del usuario lo más rápido posible**.

## Qué leer y dónde escribir

| Archivo | Para qué | Cuándo se toca |
|---|---|---|
| `CLAUDE.md` | Reglas de trabajo, arquitectura real, comandos | Cuando cambia una regla |
| `PRODUCT_CONTEXT.md` | Visión, estrategia, competencia, qué no construir | Cuando cambia la apuesta |
| `PROJECT_STATE.md` | Estado actual (cabecera) + historia de ciclos y decisiones | Al cerrar cada ciclo |
| `design/bitacora-de-uso.md` | Observaciones de uso real | Tras cada sesión con una familia |

📌 **Antes de proponer nada:** lee la cabecera «Estado actual» de
`PROJECT_STATE.md` y `PRODUCT_CONTEXT.md`. La historia de abajo se consulta, no
se relee entera. No abrir documentos nuevos en `design/`: los hallazgos van a
`PROJECT_STATE.md` o a la bitácora.

## Filtro de decisión

**¿Esto nos acerca a ser el mejor copiloto para hacer el supermercado?**
Si no, probablemente no debemos construirlo.

## Filosofía

- La velocidad de aprendizaje > la velocidad de desarrollo.
- Nunca sobreingenierizar. La arquitectura crece solo cuando el producto lo pide.
- Datos estáticos antes que complejidad. Experimentar antes que especular.
- Lo más simple/robusto primero: API pública antes que scraping · JSON antes
  que BD · configuración antes que IA.

## Ciclo de trabajo y roles

PRODUCT → ENGINEERING → QA → FEEDBACK → PRODUCT. Nadie salta pasos. Cada ciclo
termina con **algo que una persona puede usar** (desplegado) en pocas horas.

- **PRODUCT** — ¿Qué aporta más aprendizaje? ¿Hay forma más simple? Puede cancelar.
- **ENGINEERING** — Solo el siguiente paso, pocos archivos. Si algo cambia una
  decisión de producto, se detiene y lo propone.
- **QA** — Intenta romperlo: UX, casos borde, vacíos, mensajes confusos.
- **GROWTH** — ¿Qué aprendimos? ¿Qué probamos con un usuario real? Experimentos, no features.

## La Product Owner es el fundador

Autonomía total para el equipo. Detente **solo** ante una decisión que únicamente
la PO puede tomar (precio, alcance, qué se prueba con el usuario, en qué se gasta).
Sé crítico: no valides ideas por defecto, ni copies a un competidor.

## Formato de respuesta (máx. 15 líneas)

🎯 Objetivo · ⚙️ Implementación · 🧪 QA · 📈 Aprendizaje esperado · ⏸ Esperando decisión

## Toda idea de UX viene con wireframe

Regla de la PO (2026-08-01). Ninguna propuesta de experiencia se describe solo
con palabras: va con un **wireframe de baja fidelidad** (ASCII o esquema, cajas
y jerarquía, sin color ni tipografía). Se discute la estructura, no el estilo.

## Principios de producto (no negociables)

- **La lista es el centro, no el chat.** Comprar es un acto aparte y discreto.
- **Todo monto debe ser explicable por el propio producto.** El usuario ve
  `cantidad × precio unitario`, nunca solo el resultado.
- **Un producto solo suma al total si conocemos su cantidad.** Carrito incompleto
  y honesto antes que completo e inventado. Nunca un S/ 0.00 como total.
- **Un carrito que no se puede comprar es peor que no tener carrito.** Se
  verifica con la tienda antes de prometer; lo agotado se ve, no se esconde.
- **Toda pregunta cerrada tiene siempre una salida abierta.** Nunca obligar a
  una familia a enseñarnos un dato falso.
- **La interfaz comunica grado de confianza, no origen técnico**
  (*"Basado en tu compra anterior"*, *"Pendiente de confirmar"*).
- **Nunca ajustamos un dato del usuario en silencio.** Redondeos y conversiones se ven.
- **El ahorro es realista**: si comparamos tiendas, el delivery cuenta y se ve aparte.

## Arquitectura real (2026-11)

Next.js 15 (App Router) · React 19 · TypeScript · sin BD · Netlify.
Todo lo de la familia vive en `localStorage` detrás de repositorios async
(`lib/perfil-store.ts`): migrar a backend = escribir otra implementación.

```
app/page.tsx  (orquesta: Mi lista = carrito · Revisar y pedir · Mis compras) ── app/ui/*
   │
   ├─ /api/chat (una llamada por línea) → lib/cart.ts comprarLibreta()
   │                           (lib/contexto.ts separa compra · contexto · duda)
   │                           → lib/wong.ts (dispatcher) → lib/wongvtex.ts | lib/fakewong.ts
   ├─ /api/tiendas, /precios → lib/tienda.ts  directorio de tiendas + orderForms/simulation
   ├─ /api/importar-captura → lib/extractor.ts → extractor-claude | extractor-muestra
   └─ (cliente) lib/entrega.ts  deep link /checkout/cart/add?…&sc=70&qcart=1
lib/preferencias.ts (perfil) · lib/historial.ts (hechos) · lib/carrito.ts (identidad)
```

Reglas permanentes:

- **El sistema nunca conoce a sus proveedores.** Todo entra por contrato:
  `ProductoWong` (catálogo), `CatalogoDeTienda` (precios/stock por tienda),
  `EntregaEnTienda` (handoff), `ExtractorDeEvidencia` (lectura de evidencia).
- **Degradación elegante, sin inventar.** Cada proveedor tiene sustituto local
  (FakeWong, ExtractorDeMuestra) para desarrollar sin red ni credenciales.
  En producción, si Wong falla la línea vuelve `degradado` y la pantalla dice
  «Wong no contestó»: nunca se rellena con FakeWong (solo `CATALOG_PROVIDER=fake`).
- **Toda evidencia entra por el mismo normalizador** (`lib/cart.ts`).
- **El historial es hecho; el perfil es opinión derivada.** Append-only.
- **La identidad de un producto se guarda; su estado (precio, stock) se vuelve a preguntar.**
- **La instrumentación no altera lo que observa** ni cuesta cuando está apagada.

## Decisiones técnicas tomadas

- Catálogo: **API pública VTEX** de Wong (`/api/catalog_system/pub/products/search`),
  sin credenciales. Playwright/DOM descartado (la dependencia sigue en
  `package.json` sin uso).
- **VTEX, cómo leer sus campos** (verificado contra boleta real): `Price` es el
  precio **por unidad de venta** (al peso, el del kilo); `unitMultiplier` es la
  **cantidad mínima de compra**, no la presentación.
- **Canal de venta de wong.pe = `sc=70`.** Precios y stock por tienda con
  `orderForms/simulation?sc=70`; el carrito se entrega por deep link con
  `sc=70&qcart=1` (`qcart` evita la app en iPhone; en Android la app se come el
  enlace → «Copiar el enlace»).
- **Cuatro cadenas: Wong, Metro, Plaza Vea y Makro** (2026-11-27), como configuración en
  `lib/cadenas.ts` (dirección, canal, seller, cómo ubica la tienda, tarjetas).
  Metro: `sc=1`; Plaza Vea: `sc=1`; Makro: `sc=9` (mismo dueño y reglas que
  Plaza Vea), verificados leyendo el carrito. Wong y Metro
  comparten los IDs de SKU; Plaza Vea (Intercorp) no: se compara por EAN.
  Plaza Vea ubica por **código postal** (con coordenadas solas dice
  «cannotBeDelivered»), redirige búsquedas comunes a su categoría (se sigue la
  redirección) y su `price` es de lista: el que se cobra es `sellingPrice`. Buscador: **Intelligent Search**
  (`/api/io/_v/api/intelligent-search/product_search/`), no catalog_system.
- Envío: la simulación con `shippingData.address.geoCoordinates` lo trae en
  `availableDeliveryWindows[].price` (hora de Lima aunque diga `+00:00`).
  Precio con tarjeta: VTEX lo publica como «teaser» por producto (con
  `RestrictionsBins`; `[TCENCO]` = Tarjeta Cencosud), en `PromotionTeasers` del
  catálogo. Se enseña por producto a quien tiene la tarjeta; no se resta del total
  (`lib/tarjetas.ts`).
- Menús/recetas: JSON estático en `data/`; `/editar` solo persiste en local.
- Extracción desde imagen: modelo multimodal, no OCR (`claude-sonnet-5`, estrategia
  `completar`; override `EXTRACTOR_MODELO` / `EXTRACTOR_ESTRATEGIA`). La IA solo
  se usa cuando evita código frágil sin ventaja competitiva.

## Comandos

```bash
npm install
npm run dev                         # Wong real por defecto (necesita red a wong.pe)
CATALOG_PROVIDER=fake npm run dev   # catálogo ficticio, sin red
npx tsc --noEmit                    # tipos
npm run humo                        # prueba de humo (scripts/humo.mts)
npm run build                       # build de producción
DEBUG_MATCHING=1 npm run dev        # /api/chat devuelve trazas de matching
```

Variables: `CATALOG_PROVIDER` (`wong`|`fake`), `ANTHROPIC_API_KEY` (opcional;
sin ella la captura usa el extractor de muestra), `EXTRACTOR_PROVIDER`.

**No hay tests ni CI.** Verificar = `tsc` + `build` + `npm run humo` (reglas de
contexto; con `SUPERCARRITO_URL` también la API) + recorrido en navegador a
375×812 (bienvenida → lista → elegir tienda → revisar y pedir → mis compras →
repetir). Con wong.pe bloqueado (p. ej. sandbox) usa `CATALOG_PROVIDER=fake`.

## Secretos y datos personales

- **Las claves viven solo en el servidor**, como variable de entorno. Nunca en
  el cliente ni versionadas. `.env*` está en `.gitignore`.
- **Los datos reales de familias no se versionan** (capturas, boletas). Solo la
  transcripción anónima de referencia.
- **Las salidas de instrumentos de medición no se versionan.** La decisión que
  producen se documenta en `PROJECT_STATE.md`.

## Convenciones

- Código, comentarios, commits y documentación en **español**. Nombres de
  dominio en español (`libreta`, `tienda`, `entrega`); no renombrar hasta que el
  modelo se estabilice.
- Commits con mensaje en lenguaje de producto («Guardar el carrito: un producto
  no se vuelve a emparejar»).
- Toda cifra en pantalla pasa por `app/ui/sistema.ts` (`soles`, colores, tiempos).
