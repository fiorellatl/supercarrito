# PROJECT_STATE — SuperCarrito

> Memoria permanente del proyecto. Se actualiza al cerrar cada ciclo.
> **Última actualización: 2026-08-02 — la arquitectura ARQ-3 está IMPLEMENTADA en
> la aplicación real y lista para entrevistas. Ver §A al final.** Cambio de modo
> de la PO: se prioriza aprendizaje sobre perfección; se decide y se construye,
> y lo que solo puede responder un usuario se lleva a la entrevista.
>
> Histórico — 2026-08-01: ciclo de importación por captura cerrado:
> montos explicables, pasada de UX, benchmark de modelo/estrategia (Sonnet 5 +
> `completar`), pipeline de búsqueda con matiz, `DEBUG_MATCHING` para
> investigación. **Listo para pruebas con usuarios.**
> **En curso:** sprint de **Product Design** de las cuatro puertas de entrada
> (Lista → Menú → Recetas → Imagen), empezando por Lista. Cambio de método:
> *la investigación ocurre ahora a través del producto, no antes*. Sin código.
> Lo diseñado vive en **§H-D como hipótesis de diseño**, no como decisiones.
> **Base fijada: la libreta es el Home** — la pantalla de inicio con tres formas de
> empezar desaparece del prototipo. Siguiente paso: los estados de la Puerta 1.

---

## 1. Visión del producto

**SuperCarrito es un copiloto para hacer el supermercado.**

No es un conversor de recetas. No es un chat. Las recetas son **una** de las formas
de expresar una intención de compra, ni la principal ni la definitoria.

> **"Empieza tu compra como quieras. Nosotros la convertimos en un carrito."**

### 🧬 Principio fundamental: el activo es la memoria de compra de la familia

**No estamos construyendo un buscador de productos. Estamos construyendo la
memoria de compra de una familia.**

El verdadero activo del producto **no será el algoritmo de matching**. Será el
**perfil de preferencias** que construimos con cada compra. El matching es un
medio —el punto de partida cuando aún no sabemos nada— no el fin.

Con el tiempo, el producto deja de elegir *"la leche más relevante"* y empieza a
elegir *"la leche que esta familia esperaba"*.

Ese aprendizaje se extiende a cinco dimensiones:

| Dimensión | Ejemplo |
|---|---|
| **Marcas** | Leche → Gloria · Aceite → Primor |
| **Formatos** | Leche 1 L, no 400 ml · Arroz 5 kg, no 750 g |
| **Sensibilidad al precio** | Huevos → siempre el más barato · Detergente → Ariel cueste lo que cueste |
| **Sustituciones aceptadas** | Si no hay Gloria: Laive sí, Florida no |
| **Frecuencia de compra** | Leche semanal · Detergente mensual · Arroz cada 6 semanas |

### 🧾 El historial es hecho; el perfil es opinión

Distinción incorporada el 2026-07-26, y probablemente la más importante del modelo:

- **Historial (hecho)** — *"el 12 de marzo escribió 'Leche Gloria' y no corrigió"*.
  No caduca, no se discute, no se edita. Append-only.
- **Perfil (opinión)** — *"su marca de leche es Gloria"*. Es una **interpretación
  derivada** del historial, y nuestras interpretaciones van a cambiar muchas veces.

Por eso guardamos los hechos desde ya, aunque todavía no sepamos interpretarlos:
es barato ahora e **imposible de recuperar después**. Y resuelve sin responderla
la pregunta abierta —*¿una compra distinta es excepción o cambio de hábito?*—:
con los hechos guardados, el día que decidamos la política podremos recalcular el
perfil desde el principio. Con solo el perfil, esa decisión sería irreversible.

**Consecuencias que se derivan de este principio** (no son opcionales):

1. **La persistencia del perfil deja de ser un detalle de implementación y pasa
   a ser el camino crítico.** Un perfil que se pierde no es un activo.
2. **Cada corrección del usuario es un depósito en el activo**, no un fallo del
   sistema. Hay que capturarla, no solo permitirla.
3. **El foso competitivo es acumulativo:** un usuario con 6 meses de perfil no
   se cambia a otro producto, aunque el otro tenga mejor matching.
4. **Mejorar el matching tiene retorno decreciente**; mejorar el perfil tiene
   retorno creciente. Ante empate de esfuerzo, gana el perfil.
5. **La frecuencia de compra es la puerta natural a la lista recurrente (H3)**:
   una vez sabemos cada cuánto compra qué, "mi lista del domingo" se arma sola.

### 🔭 Una sola tarea: extraer la intención de una evidencia que ya existe

Ajuste conceptual del 2026-07-26. Dejamos de pensar en "entradas" como funciones
distintas —escribir, importar, fotografiar, dictar— porque **no son iniciativas
distintas: son manifestaciones del mismo problema**.

> **Extraer la intención de compra a partir de una evidencia que el usuario
> ya tiene.**

Esa evidencia puede ser texto, una captura, una receta, una conversación o, en el
futuro, una nota de voz. **Cambia el soporte; no cambia la tarea.** El usuario casi
nunca parte de cero: en su cabeza, en su papel, en su chat o en el carrito de Wong
de la semana pasada, la compra ya existe de alguna forma. Nuestro trabajo es
leerla, no pedirle que la vuelva a producir.

Consecuencia directa: **"Escuchar" e "Importar" son el mismo trabajo aplicado a
dos evidencias distintas**, no dos ciclos que compiten. Cuál se construye primero
lo decide la evidencia de las entrevistas, no una preferencia de diseño.
*(El roadmap NO se modifica por esto — ver §5.)*

| Evidencia | Ejemplo | Estado |
|---|---|---|
| Lista libre | `pollo, pan, leche` | ✅ funcionando |
| Receta | `ají de gallina` | ✅ funcionando |
| Menú | `menú 2` | ✅ funcionando |
| Compra que ya existe | captura del carrito de Wong, texto pegado | 🔬 en investigación |
| Foto de una lista | papel, pizarra, nota manuscrita | 🔜 futuro |
| Nota de voz | dictado natural | 🔜 futuro |
| Conversación | hilo de WhatsApp familiar | 🔜 futuro |

Regla arquitectónica derivada de la visión: **toda evidencia nueva entra por
`normalizarIntencion()` en `lib/cart.ts`**. Si una entrada necesita su propio
flujo paralelo, es señal de que la estamos modelando mal.

### El filtro de decisión (aplicar a TODA propuesta)

> **¿Esto nos acerca a ser el mejor copiloto para hacer el supermercado?**

Si la respuesta no es un sí claro, probablemente no debemos construirlo.
Este filtro tiene autoridad para cancelar features técnicamente buenas.

### Los cuatro dominios del producto

1. **Entender la intención** — cualquier forma de pedir → lista canónica de ingredientes.
2. **Elegir el producto** — de un ingrediente ambiguo al SKU correcto en Wong.
3. **Corregir cuando se equivoca** — el usuario puede reemplazar lo que elegimos.
4. **Aprender del usuario** ← *el dominio nuevo, y el más valioso.*

El dominio 4 cambia la definición de éxito:

- **Antes:** ¿encontramos el producto *correcto*?
- **Ahora:** ¿encontramos el producto **que esta familia esperaba**?

Son métricas completamente distintas. No optimizamos por relevancia de catálogo;
optimizamos por **preferencias de la familia**.

---

## 2. Estado actual (qué existe hoy)

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript. Sin base de datos.
Datos estáticos en `data/`. ~1.500 líneas en total. Deploy en Netlify.

### Flujo funcionando end-to-end

```
usuario escribe → /api/chat → comprarIntencion()
   → normalizarIntencion()  (menú | receta | lista libre)
   → ingredientes canónicos
   → buscarConAlternativa() por ingrediente, en paralelo
   → buscarEnWong()  [dispatcher]
        ├─ CATALOG_PROVIDER=fake → FakeWong (catálogo ficticio + ranking heurístico)
        └─ CATALOG_PROVIDER=wong → WongVTEX (API pública real); si falla, degrada a FakeWong
   → carrito con tarjetas de producto, precios y total estimado
```

### Mapa de archivos

| Archivo | Rol |
|---|---|
| `lib/catalog.ts` | **Contrato** `ProductoWong`. Lo único que conoce el resto del sistema. |
| `lib/cart.ts` | Corazón: normalizador de intención + armado del carrito. |
| `lib/wong.ts` | Dispatcher de proveedor + degradación elegante. |
| `lib/wongvtex.ts` | Conector real VTEX (`/api/catalog_system/pub/products/search`). |
| `lib/fakewong.ts` | Catálogo ficticio + motor de ranking heurístico (sin IA). |
| `lib/format.ts` | Texto amigable ⇄ JSON para editar menús/recetas sin tocar código. |
| `app/page.tsx` | Caja única + pantalla inicial con las 3 formas de empezar. |
| `app/editar/page.tsx` | Edición de menús y recetas en texto plano. |
| `scripts/medir_matching.mjs` | **Instrumento de medición** del ciclo 4 (no es código de producto). |
| `data/*.json` | Menús, recetas, catálogo ficticio, muestra de 59 ingredientes. |

### Ciclo 5 — cerrado ✅ (2026-07-26)

Primer depósito real en el activo. **Aprendizaje sin preguntas:** no se pregunta
nada; se aprende de la corrección. Fricción cero por diseño.

| Archivo | Rol |
|---|---|
| `lib/preferencias.ts` | Modelo conceptual + lógica pura. **Cero dependencias** de React, red o almacenamiento. |
| `lib/perfil-store.ts` | Puerto `RepositorioPerfil` (3 métodos, async) + impl. localStorage y memoria. |

- Las 5 dimensiones modeladas, incluida **prioridad de preferencias**: cada eje
  (`disponibilidad · marca · formato · precio`) filtra en orden; **un eje que
  dejaría cero candidatos se ignora** — es preferencia, no requisito.
- Los proveedores devuelven **Top-6** (`alternativas` en `ProductoWong`), no un
  solo producto: sin alternativas no hay corrección y sin corrección no hay activo.
- La app **nunca toca localStorage**: pasa por el repositorio. Migrar a backend =
  escribir `RepositorioApi`. Ni la lógica ni la UI cambian una línea.
- Ambos indicadores son visibles para el usuario en "🧠 SuperCarrito ya sabe cómo compras".

**Verificado en el navegador:** corregir leche Gloria→Laive, recargar, volver a
pedir "leche" → elige Laive sin preguntar. `preguntasEvitadas` sube. Al elegir la
más barata (Florida) aprendió `sensibilidadPrecio: "mas_barato"`, reordenó la
prioridad a `precio > marca` y guardó Laive como sustitución aceptada.

**Dos defectos encontrados y corregidos en QA:**
1. *(serio)* Dos correcciones seguidas se pisaban por closure obsoleto: se perdía
   la primera. **Perder aprendizaje es perder el activo.** Ahora toda escritura va
   por actualización funcional sobre el perfil más reciente.
2. Botón "Prefiero otra" en productos sin alternativas: llevaba a una lista vacía.
   Ya no se muestra.

**Deuda aceptada a conciencia:** el perfil vive en un navegador. Cambiar de
dispositivo = empezar de cero. Es la decisión 2 de la PO, pendiente.

### 🏁 Hito técnico — Wong real funcionando (2026-07-26)

**No es un ciclo de producto**: es un hito que quita riesgo. Verificado de punta a
punta en la máquina de la PO con `CATALOG_PROVIDER=wong`:

| DoD | Prueba |
|---|---|
| `CATALOG_PROVIDER=wong` | Sin degradación a FakeWong en ninguna consulta |
| Fotos reales | 4/4 cargadas desde `wongfood.vteximg.com.br`, 1000 px |
| Precios reales | S/ 10.90 · 23.90 · 42.90 · 1.60 |
| Links reales | 4/4 a `wong.pe`, verificados HTTP 200 |
| Carrito desde lista libre | "pollo, arroz, aceite, tomate" → carrito con total |

La API pública de VTEX responde sin API key, sin proxy y sin rate-limit visible
(~1.4 s, HTTP 206). **No hubo bloqueos técnicos.**

**⭐ El aprendizaje que cambia el proyecto — el problema dejó de ser encontrar
productos; el problema es elegir entre candidatos que ya tenemos.**

La evidencia: buscar `arroz` en Wong devuelve *Arroz Chaufa* como primer
resultado — pero **4 de los 6 candidatos del Top-6 eran Costeño real**. El
producto correcto ya estaba en la mano; solo no estaba primero. Lo mismo con
`leche` → chocolates, y `huevos` → *Cortador de Huevos, S/ 24.90*.

Esto significa que la solución **no es mejor búsqueda** (cara, dependiente del
proveedor, fuera de nuestro control) sino **mejor elección sobre el Top-N** —
barata, nuestra, y exactamente donde vive el perfil de compra.

**Efecto colateral: H2 queda respondida sin correr el termómetro del ciclo 4.**
Sabemos que la relevancia de Wong falla, y falla justo en los básicos. Ya no hace
falta medirlo para decidir; el instrumento sigue siendo útil solo para saber *qué
categorías son ambiguas* (o sea, dónde vale la pena preguntar).

### Historial append-only — en marcha (2026-07-26)

- `lib/historial.ts` — dos hechos: `escribio` (qué pidió + qué le propusimos) y
  `eligio` (qué corrigió + **entre qué candidatos**). En el lenguaje de la
  familia; el `sku` del proveedor va aislado en `origen`, como el atajo
  desechable que es.
- `RepositorioHistorial` con método `agregar`, no `guardar`: append-only por contrato.
- **Alcance deliberado (decisión de la PO):** solo se escribe. **Nadie lo lee
  todavía, y está bien.** No hay reproyección ni derivación del perfil desde el
  historial hasta que exista una segunda política que aplicar.
- Tope de 1000 hechos: localStorage tiene ~5 MB y un historial que rompe la
  escritura sería peor que uno recortado. Se quita cuando viva en un backend.

### Ciclo en curso — Importar una compra desde una captura (2026-07-26)

Cuarta puerta al mismo normalizador. La única pieza nueva es el extractor;
resolver productos, carrito, corrección, perfil e historial se reutilizan tal cual.

| Archivo | Rol |
|---|---|
| `lib/evidencia.ts` | **Contrato** `ExtractorDeEvidencia`. No nombra ningún proveedor. |
| `lib/extractor-claude.ts` | Implementación multimodal. **Solo servidor.** |
| `lib/extractor-contrato.mjs` | Prompt + esquema, compartidos con el medidor. |
| `scripts/comparar_extractores.mjs` | Instrumento para elegir modelo con datos. |
| `lib/extractor.ts` | Dispatcher de proveedor (`EXTRACTOR_PROVIDER`), con degradación. |
| `lib/extractor-muestra.ts` | **El FakeWong de la evidencia**: sin red, sin costo, determinista. |
| `app/api/importar-captura/route.ts` | Endpoint. Node runtime. Nunca devuelve el error crudo. |
| `app/RevisionCaptura.tsx` | Pantalla de revisión: quitar y **corregir** antes de comprar. |
| `data/capturas-prueba/verdad.json` | Verdad de referencia: 24 líneas transcritas a mano. |

Sin credencial configurada el sistema usa el extractor de muestra en vez de
romperse — la misma degradación elegante que ya aplicamos con Wong. Eso permite
demostrar y probar el flujo entero **sin gastar un token**.

**⭐ H7 confirmada con datos reales (2026-07-26).** El flujo completo, contra el
catálogo real de Wong, resolvió **6 de 6 productos correctamente** — incluidos
cinco con el nombre truncado por la app:

| Lo que se leyó de la captura | Lo que Wong devolvió |
|---|---|
| `Yogurt Laive Griego O` | Yogurt Laive Griego Original Endulzado 800g ✅ |
| `Lomos de Atún en Agua y Sal Campo` | Lomos de Atún en Agua y Sal Campomar 150g ✅ |
| `Trucha Desh` | Trucha Deshuesada Corte Mariposa x kg ✅ |
| `Galletas con Chips de Cacao Sin A` | Galletas con Chips de Cacao Sin Azúcar En Línea 120g ✅ |
| `Queso Edam Laive` | Queso Edam Laive x kg ✅ |

Los cinco coinciden con la boleta real de esa compra. **Contrasta brutalmente con
buscar ingredientes genéricos**, donde `leche` devuelve chocolates y `huevos` un
cortador de huevos. La conclusión práctica: **buscar un nombre de producto —
aunque venga incompleto— funciona muchísimo mejor que buscar una categoría.** La
truncadura de la app resultó ser mucho menos grave de lo que temíamos, porque la
búsqueda de VTEX tolera bien los prefijos.

Esto refuerza que el problema no es *encontrar* sino *elegir*, y sugiere que la
importación puede ser la entrada con mejor precisión de todas — al revés de lo
que habríamos apostado.

**Principio de diseño del extractor (decisión de la PO):** depende del
**significado** del contenido, **nunca de la posición visual**. El layout de Wong
va a cambiar; el prompt no nombra ninguna columna, orden de campos ni elemento
concreto de interfaz como criterio. Las tres capturas sirven para *validar*, no
para *diseñar*.

**Hallazgos de las capturas reales, antes de gastar un token:**
1. **La app trunca los nombres.** 7 de 8 productos de una captura llegan cortados
   (*"Trucha Desh…"*, *"Queso Philadel…"*). La evidencia es **lossy en origen**:
   ningún modelo puede leer lo que no está. Por eso el extractor tiene prohibido
   completar un nombre truncado, y por eso `textoOriginal` es obligatorio.
2. **Los precios de la captura no son fiables.** Papa amarilla 1 kg: S/ 89,90 en
   la app contra S/ 9,00 en la boleta de esa misma compra. Confirma la decisión
   de ignorar los precios de la evidencia y pedírselos siempre a Wong.
3. La comparación entre modelos exige fijar `thinking` explícitamente: Opus lo
   omite por defecto y Sonnet lo activa. Sin eso mediríamos dos configuraciones
   distintas y llamaríamos a eso "diferencia entre modelos".

### 💰 Cantidades y montos explicables (2026-08-01)

**Principio de producto:** *todo monto debe ser explicable por el propio
producto*. El usuario nunca debería preguntarse de dónde salió un precio.
**Regla dura que se deriva: un producto solo suma al total si conocemos su
cantidad.** Preferimos un carrito incompleto y honesto a uno completo e inventado.

**Empezó como un problema de confianza y resultó ser un error de cálculo.**
VTEX devuelve, para un producto al peso:
- `Price` = precio **por kilo**, no de la pieza (confirmado contra una boleta
  real: trucha `1,582 KG × 31.50`, y la API devuelve hoy exactamente 31.50);
- `unitMultiplier` = **cantidad mínima de compra** (queso de 100 en 100 g,
  trucha de 400 en 400), **no** la presentación.

Pintábamos `unitMultiplier` como presentación y `Price` como el precio de esa
presentación: *"0.1 kg — S/ 49.90"*. Cada número correcto, la pareja mentira.
**El carrito importado marcaba S/ 128,30 cuando lo confirmable eran S/ 44,50.**

Qué cambió:
- `ProductoWong` distingue `precio` (por unidad de venta), `unidadVenta` y
  `cantidadMinima`. `presentacion` vuelve a ser solo para envasados.
- `ItemCarrito` lleva `cantidad` (y `cantidadPedida`/`unidadPedida` en crudo,
  porque al cambiar de producto puede cambiar la unidad de venta).
- La cantidad se decide por prioridad: respuesta del usuario → evidencia (solo
  si habla la misma unidad) → perfil → **pendiente**.
- La tarjeta muestra la multiplicación, nunca solo el resultado:
  `1,6 kg × S/ 31.50/kg` → **S/ 50.40**.
- El pie dice **"Subtotal confirmado"** y, aparte, **"N productos pendientes"**.

**La primera pregunta proactiva del producto.** Cuando falta la cantidad de un
pesable, la tarjeta pregunta *"¿Cuánto compras normalmente?"* con opciones que
son **múltiplos reales del mínimo** de ese producto (trucha: 400 g / 800 g / 2 kg;
queso: 100 g / 200 g / 500 g / 1 kg) — así no hay nada que redondear a espaldas
del usuario. La respuesta se guarda en `cantidadHabitual` y **no se vuelve a
preguntar**; además cuenta como *pregunta evitada*, que antes no se contabilizaba.

**Deuda que NO se contrajo, a propósito:** ni conversiones de unidades, ni
paquetes, ni equivalencias, ni cantidades "sugeridas". Si no lo sabemos, no lo
inventamos.

**Verificado con Wong real:** `500 g × S/ 49.90/kg = S/ 24.95` al céntimo; el
subtotal sube solo cuando se confirma; a la segunda búsqueda del mismo producto
ya no pregunta y `preguntasEvitadas` sube a 1.

### 🎨 Pasada de UX previa a las entrevistas (2026-08-01)

Cinco cambios, ninguna funcionalidad nueva. La tarjeta ahora responde las cuatro
preguntas sin que el usuario interprete nada.

1. **🚪 Salida abierta.** "Otra cantidad…" abre un campo libre (en gramos, que es
   como habla la gente en el súper). Verificado: 1200 g → `1,2 kg × S/ 31.50/kg
   = S/ 37.80`, y el perfil guarda **1.2**, no un 0,8 forzado. Sin esto, una
   familia que compra 1,2 kg tenía que enseñarnos un dato falso.
2. **Grado de confianza, no origen técnico.** Tres estados: *"Pendiente de
   confirmar"* · *"Lo acabas de confirmar"* · *"Basado en tu compra anterior"*.
   Los productos por pieza no llevan etiqueta: 1 unidad no necesita explicación.
3. **El cálculo sube en la jerarquía** — justo debajo del nombre, a 13 px, antes
   que la marca. Era la pieza que construye confianza y estaba en el penúltimo lugar.
4. **Fila completa para pesables y pendientes** (`gridColumn: 1 / -1`, imagen a
   la izquierda). En una celda de 165 px la pregunta parecía un formulario
   comprimido; el problema no era el texto, era el ancho.
5. **"Total" cuando no queda nada pendiente** — "Subtotal confirmado" con cero
   pendientes sonaba a trabajo a medias.

Añadido: *"Lo recordaré para tus próximas compras."* bajo la pregunta. El
producto no promete memoria en abstracto — la anuncia y luego la demuestra.

**`para {ingrediente}` ahora es condicional**, en vez de estar siempre o nunca:
se muestra **solo cuando lo que pidió el usuario NO se reconoce en el nombre del
producto**. Bajo "Pollo Fresco Entero" es ruido; bajo "Ostras Vivas" es la señal
exacta que necesitamos ver en las entrevistas. Ruido fuera, señal dentro.

### 🔎 Sufijo de venta en la búsqueda — arreglado con matiz (2026-08-01)

El experimento decía que quitar `x kg` / `x un` valía 8 puntos. **Quitarlo
siempre resultó ser una regresión**, y la medición lo destapó:

| Consulta | Con sufijo | Sin sufijo |
|---|---|---|
| `Pepinillo x un` | Ostras Vivas ❌ | **Pepinillo x un** ✅ |
| `Mango Kent Wong x kg` | **Mango Edward Wong x kg** ✅ | Helado Premium Mango ❌ |

Con nombres cortos el sufijo **estorba**; con nombres largos **ayuda** (empuja
hacia el producto fresco). No hay regla fija buena, así que no se inventó una:
`buscarMejor()` consulta **las dos formas en paralelo** y se queda con el
resultado cuyo nombre contiene más palabras de lo que pidió el usuario,
desempatando por unidad de venta. **En empate gana el original**: no se cambia
nada sin una razón medible.

Verificado sobre los 10 términos con sufijo de las capturas reales: Pepinillo
arreglado, Mango sin regresión, el resto igual. `Maracuyá` sigue devolviendo
*Kombucha Veda Maracuyá* — Wong no parece tener la fruta suelta bien posicionada;
no se arregla manipulando el término.

### 🧪 Benchmark modelo × estrategia — cerrado, matching congelado (2026-08-01)

Referencia operativa. El caso de estudio completo (metodología, tablas, patrones
de error) queda fuera de este repo — es material de portafolio, no memoria de
desarrollo — y vive en `data/comparacion_extractores.md` + `.json` si hace falta
reabrirlo.

**Decisión: `claude-sonnet-5` + estrategia de prompt `completar`.** Empataba en
precisión con Opus 4.8 a 2,5× menos costo (criterio de la PO: sin diferencia
significativa, gana el más barato). **Es el default real en código**
(`MODELO_POR_DEFECTO` / `ESTRATEGIA_POR_DEFECTO` en `lib/extractor-claude.ts`,
overridable por `EXTRACTOR_MODELO` / `EXTRACTOR_ESTRATEGIA`) — en una revisión
de cierre de sprint se encontró que el código seguía apuntando a Opus + literal
por defecto; quedó corregido antes de este commit. Consecuencia de código ya
aplicada: el pipeline de búsqueda prueba el término con y sin sufijo de venta
(`x kg` / `x un`) y se queda con el que mejor puntúa contra Wong — ver
`buscarMejor()` en `lib/cart.ts` (§ Sufijo de venta arriba).

**No se sigue optimizando matching por ahora** (decisión de la PO). Lo que queda
pendiente de esta línea, si se retoma: la fila sin nombre visible en la captura
sigue siendo irrecuperable, y la métrica automática del script sobreestima
(confunde productos de la misma familia semántica) — cualquier cifra de precisión
citada de memoria debe revalidarse a mano antes de reusarse.

### 🔬 `DEBUG_MATCHING` — herramienta de investigación, no de producto (2026-08-01)

Con `DEBUG_MATCHING=1` en el entorno del servidor, cada `Carrito` devuelto por
`/api/chat` incluye `trazas: TrazaMatching[]` (uno por producto pedido): consulta
original, consulta normalizada, cada intento de búsqueda con su estrategia y
score, resultado elegido y motivo en texto. Vive en `lib/cart.ts`.

Diseño deliberado:
- **Coste cero cuando está apagada** — la traza ni se crea si la variable no
  está en `"1"`; `armarCarrito` sigue haciendo exactamente el mismo trabajo.
- **No puede alterar el matching que observa** — la traza es un parámetro
  opcional que solo se le *anota*; ninguna decisión de `buscarMejor` /
  `buscarConAlternativa` la consulta.
- **Nunca se pinta en la interfaz** — la UI normal (`app/page.tsx`) ignora el
  campo `trazas` porque no está en su tipo local; solo es visible leyendo el
  JSON crudo de la API. Uso previsto: depurar entrevistas y casos reales
  (`curl` al endpoint con la variable activa), no telemetría de producción.

### Lo que NO existe todavía

- ❌ Derivar el perfil del historial (reproyección). Aplazado a conciencia.
- ❌ Preguntar proactivamente ante ambigüedad (journey de "leche" con opciones).
- ❌ Aprendizaje de frecuencia de compra (dimensión 5, declarada pero sin lógica).
- ❌ Pantalla de perfil editable (hoy solo se ve, no se edita).
- ❌ Techo de preguntas por sesión (no hace falta aún: no preguntamos).
- ❌ Listas recurrentes ("mi lista del domingo").
- ❌ Persistencia de cualquier tipo por usuario. No hay usuarios.
- ❌ Foto y nota de voz (anunciados como "pronto" en la UI).
- ❌ Tests, CI.
- ❌ La medición del ciclo 4 **corrida y etiquetada** (falta `data/medicion_c4_raw.json`).

### Deuda técnica conocida (no urgente)

- `playwright` sigue en `package.json` aunque se descartó el scraping.
- `/api/data` escribe al filesystem: no sobrevive un deploy serverless.
- En modo real se toma `data[0]` de VTEX sin ningún filtro de clase de producto.

---

## 3. Hipótesis abiertas

### El riesgo del proyecto se movió (2026-07-26)

```
ANTES   "¿Podremos conectarnos a Wong?"
        → Respondido: sí. Riesgo eliminado.

AHORA   "¿Podemos construir un motor que entienda cómo compra una familia
         mejor que Wong?"
```

Es un riesgo mucho mejor: el primero dependía de un tercero y podía matar el
proyecto de un día para otro. El segundo depende **solo de nosotros**, se ataca
por partes y, si sale bien, es precisamente lo que nadie puede copiar.


| # | Hipótesis | Estado |
|---|---|---|
| **H1** | Una persona prefiere pedir su compra en lenguaje natural antes que armar la lista a mano. | Sin validar con usuario real. Es la hipótesis fundacional. |
| **H2** | El matching de Wong (`data[0]` crudo) falla lo bastante como para romper la confianza. | ✅ **Confirmada** por el hito técnico. Falla en los básicos (`leche`→chocolates, `huevos`→utensilio). Cerrada. |
| **H7** | **El producto correcto casi siempre ya está en el Top-N que traemos; el problema es elegirlo.** | Nueva y muy prometedora: 4 de 6 candidatos de `arroz` eran Costeño real. Es la hipótesis que abarata todo el roadmap. |
| **H3** | La compra recurrente ("mi lista del domingo") es el principal motor de retención. | Vigente. Ahora se entiende como **consecuencia** del perfil, no como feature aparte. |
| **H4** | El sistema puede aprender las preferencias de la familia con reglas simples, sin IA. | **Hipótesis central del producto.** Ver detalle abajo. |
| **H5** | Preguntar solo cuando no sabemos —y nunca dos veces lo mismo— se percibe como servicio, no como fricción. | Riesgo de UX de H4. Se valida junto con ella. |
| **H6** | **El perfil de compra es el activo defendible: a más historial, más difícil cambiarse a otro producto.** | Nueva. Es la apuesta de negocio. Solo se valida con retención en el tiempo. |

### H4 en detalle — el motor de preferencias

**Problema:** ingredientes ambiguos (`leche`, `pan`, `arroz`, `aceite`, `queso`,
`huevos`, `detergente`, `papel higiénico`) tienen decenas de SKUs válidos. El
"mejor" según el catálogo casi nunca es el que esa familia compra siempre.

**Qué debe aprender el sistema:**

- **marca preferida** — Leche → Gloria
- **sensibilidad al precio** — siempre la más barata / marca fija / sin preferencia
- **formato habitual** — 1 L, 2 L, 5 kg, six-pack…
- **sustituciones aceptadas** — si no hay Gloria, ¿Laive sí o no?
- **frecuencia de compra** — leche semanal, detergente mensual, arroz cada 6 semanas

**El principio rector:**

> El objetivo **no** es preguntar siempre.
> El objetivo es preguntar **solo cuando todavía no conoce la respuesta**.
> Cada interacción hace el siguiente supermercado más rápido y más personal.

**Journey de referencia:**

```
1ª compra   usuario: "leche"
            SuperCarrito: ¿Tienes alguna preferencia?
                          [Gloria] [Laive] [Florida] [Cualquiera, la más barata]
            usuario: "Gloria"
            → guarda:  leche → marca preferida = Gloria

2ª compra   usuario: "leche"
            → NO pregunta. Pone Gloria.

Si cambia   usuario reemplaza Gloria por Laive
            → aprende.

A los meses  el perfil ya no es "compra leche", es:
             Leche → Gloria · Huevos → el más barato · Pan → Bimbo
             Queso → Bonlé · Yogurt → Gloria · Aceite → Primor
             Arroz → Costeño · Detergente → Ariel · Papel higiénico → Suavel

Y entonces  usuario: "mi lista del domingo"
            → SuperCarrito ya sabe muchísimo ANTES de buscar en Wong.
```

**Sin IA. Empieza con reglas muy simples:**

```
Si el usuario reemplaza una marca      →  preguntar  →  guardar preferencia
Si compra el mismo SKU tres veces      →  dejar de preguntar
```

Eso solo ya produce muchísimo valor. La IA, si aparece, aparece después y por
necesidad demostrada.

---

### 🔬 Insights de investigación

> **Esto NO son decisiones de producto.** Es evidencia cruda de usuarios reales,
> registrada para no perderla. Nada de aquí modifica el roadmap hasta que esté
> validado. Cada insight lleva su tamaño de muestra: trátalo en consecuencia.

#### I-1 · "Quiero pegar una captura del carrito de Wong" · **n = 1** ⚠️

**Fecha:** 2026-07-26 · **Estado:** sin validar, requiere más entrevistas.

La primera persona entrevistada **no pidió OCR, ni IA, ni mejores
recomendaciones**. Dijo espontáneamente que quería pegar una captura de su carrito
de Wong.

**Lectura del equipo** (interpretación, no hecho):
- La fricción principal quizá no sea *escribir mejor*, sino **no tener que
  reconstruir una compra que ya existe**.
- El usuario propuso una **solución**, no describió un problema. "Captura" es su
  forma de decir *"ya hice este trabajo una vez"*. El trabajo real puede admitir
  caminos mucho más baratos que OCR: **pegar texto** primero; ver si Wong ofrece
  historial de pedidos después (casi seguro tras autenticación, que no haremos).
  OCR sería el paso más caro del proyecto: exige evidencia, no entusiasmo.
- Si se confirma, valida **H3 (compra recurrente)** desde una dirección que no
  diseñamos, y ataca el **arranque en frío**: un carrito real son decenas de
  preferencias de golpe (marcas, formatos, cantidades).
- Matiz importante: el chip "📷 Foto de tu lista · pronto" quedó validado **por la
  razón equivocada**. Lo pensamos para listas *manuscritas*; el usuario pidió una
  captura de un carrito *digital*. Son problemas distintos, y el segundo es mucho
  más fácil: texto limpio, marcas, formatos y precios que apuntan al catálogo.

**Lo que NO concluimos todavía:** que haya que construir importación, ni que
cambie el orden de las entradas, ni que el menú sobre. Es una persona.

#### 💡 O-1 · La boleta PDF de Wong ya trae texto legible por máquina

**Fecha:** 2026-07-26 · **Estado:** oportunidad documentada, **fuera del alcance
del ciclo actual** (decisión de la PO).

Al revisar la boleta electrónica de una compra real, resultó ser un PDF con
**texto extraíble, no una imagen**. Se leyó con ~20 líneas de Python y cero IA:
37 artículos con código de barras, peso, precio unitario y precio final.

Por qué importa:
- Cumple la **misma propuesta de valor** que la captura —*reutilizar una compra
  que ya existe*— con mucha menos complejidad y **costo de extracción cero**.
- El dato es de mejor calidad que el de la captura: **nombres completos** (la app
  los trunca) y **precios reales** (los de la captura no son fiables — ver abajo).
- Encaja con el principio del proyecto: *API pública > scraping · JSON > BD ·
  configuración > IA*. Es el camino barato que hay que mirar antes que el caro.

Limitaciones conocidas, por las que **no** sustituye a la captura:
- Exige que la familia **encuentre y descargue** su boleta. Una captura se toma
  en dos segundos; una boleta hay que ir a buscarla al correo o a la web.
- Los nombres de la boleta vienen en jerga de caja (`PECH ALA POLL KG`,
  `YOG. GR ORIG 115`), no en lenguaje de catálogo. Buscarlos en Wong es un
  problema distinto —y quizá peor— que buscar el nombre de la app.
- Es una compra **cerrada**, no un carrito en curso.

**Decisión de la PO:** se documenta como oportunidad; **no se cambia el alcance
del ciclo**. Si mañana la captura resulta cara o imprecisa, este es el plan B —
y ya sabemos que funciona técnicamente.

#### Recolección de artefactos — aprobada (2026-07-26)

Durante las próximas entrevistas se recopilan, **con consentimiento explícito de
cada persona**, listas reales y capturas de compras.

- **No** porque vayamos a construir OCR de inmediato.
- Sí porque son el insumo para **diseñar y validar el parser** más adelante, y
  para evaluarlo sin volver a molestar a nadie.
- Mismo argumento que usamos para el historial: **es gratis recogerlo ahora e
  imposible de recuperar después.**

**Método** (corrección de Growth): no preguntar *en qué formato* quieren traer su
compra — la gente responde con soluciones. Pedir que **muestren** cómo lo harían,
con su teléfono en la mano. La pregunta que decide el próximo ciclo no es "¿cómo
escriben su lista?" sino **"¿de dónde sale su compra semanal?"**.

---

## 4. Decisiones importantes (tomadas, no re-litigar)

**Producto**

- SuperCarrito es un **copiloto de supermercado**, no un conversor de recetas.
- Toda entrada pasa por **un único normalizador**. Nada de flujos paralelos.
- Optimizamos por **preferencias de la familia**, no por relevancia de catálogo.
- Éxito = *el producto que esta familia esperaba*, no *el producto correcto*.
- **El activo del producto es el perfil de compra familiar, no el matching.**
  El matching es el comportamiento por defecto mientras el perfil está vacío.
- **El historial es hecho; el perfil es opinión derivada.** Se guardan los hechos
  desde el primer día, aunque aún no sepamos interpretarlos.
- **La estrategia de compra es por categoría, no por usuario.** La misma familia
  es "siempre Gloria" en leche y "el más barato" en huevos.
- **Nunca preguntes algo que el usuario ya dijo.** Si escribe "Leche Gloria 1L",
  ya conocemos marca y formato.
- **Lo implícito nunca pisa a lo explícito.** Lo que el usuario escribe *ahora*
  es la máxima autoridad; el perfil es solo lo que recordamos de antes.
- **La integración con Wong es un hito técnico, no un ciclo de producto.** No se
  renumera el roadmap por ella.
- **El producto es una sola tarea: extraer la intención de una evidencia que el
  usuario ya tiene.** "Escuchar" e "Importar" no son iniciativas distintas.
- **Los insights de investigación no mueven el roadmap** hasta estar validados, y
  se registran con su tamaño de muestra (§3).
- **Todo monto debe ser explicable por el propio producto.** El usuario nunca
  hace cuentas mentales: ve la multiplicación, no solo el resultado.
- **Un producto solo suma al total si conocemos su cantidad.** Nada de estimar.
- **Nunca ajustamos una cantidad en silencio.** Las opciones que ofrecemos son
  múltiplos reales del mínimo de venta.
- 🚪 **Toda pregunta cerrada debe tener siempre una salida abierta.** Da igual si
  son gramos, litros, paquetes o unidades: si las opciones que ofrecemos no
  incluyen la respuesta real de la familia, la obligamos a enseñarnos un dato
  falso — y ese dato se queda en el perfil para siempre. **Nunca debemos obligar
  a una familia a enseñarnos algo incorrecto.** Este principio protege el activo
  más importante del producto.
- 🛡️ **La interfaz comunica el grado de confianza, no el origen técnico.** No
  "de tu captura" ni "del perfil", sino *"Basado en tu compra anterior"*, *"Lo
  acabas de confirmar"*, *"Pendiente de confirmar"*. El objetivo no es explicar
  el sistema: es transmitir confianza.
- **La pantalla de revisión confirma y quita; corregir es secundario** — y se
  mide, para saber si esa edición merece existir.
- **El extractor está desacoplado del proveedor** (`ExtractorDeEvidencia`). El
  resto del sistema no conoce Anthropic, igual que no conoce a Wong.
- **El extractor lee significado, no posición.** Se valida con capturas reales,
  pero no se diseña sobre ellas: el layout cambiará.
- **La API key vive solo en el servidor**, como variable de entorno. Nunca en el
  navegador, nunca en un archivo del repositorio.
- **El modelo se elige con datos** (precisión, tiempo, costo), no por su nombre.
- **Las capturas y boletas reales no se versionan** — llevan datos personales.
  Solo se versiona la transcripción anónima que sirve de verdad de referencia.
- Usar un modelo multimodal **no contradice** *"configuración antes que IA"*: la
  IA no resuelve aquí un problema de negocio, evita construir un parser frágil
  cuyo mantenimiento no aporta ventaja competitiva (criterio de la PO).
- Nombres de archivos y clases **no se renombran todavía** (`preferencias.ts`,
  `Preferencia`) hasta que el modelo conceptual se estabilice.
- **La persistencia del perfil es camino crítico**, no detalle de implementación.
- **Cada corrección del usuario se captura como aprendizaje**, no se descarta.
- La compra recurrente es **consecuencia** del perfil (vía frecuencia de compra),
  no una feature independiente. Sigue sin implementarse.
- El filtro de la sección 1 puede cancelar cualquier desarrollo.

**De experiencia** *(consolidados al cerrar la fase conceptual, 2026-08-01. Salieron
del sprint de Product Design y la PO los considera suficientemente sólidos como
para no volver a discutirlos. Todo lo demás siguió en §H-D.)*

- 🚪 **El producto tiene cuatro puertas y un solo motor.** Lista → Menú → Recetas →
  Imagen, en ese orden, una por sprint, cada una con entregable usable. No son
  cuatro productos: son cuatro formas de llegar al mismo sitio.
- 📥 **"Pega lo que sea. Yo me encargo."** No le pedimos a la familia que
  reconstruya una compra que ya existe. Atraviesa las cuatro puertas. Corolario
  operativo: **nunca existe un "eso aquí no"**.
- 🎯 **Una sola intención, no un solo gesto.** *(Reformulado por la PO el
  2026-08-01; sustituye a "una sola boca".)* Todas las entradas responden a la
  misma pregunta —**¿qué evidencia ya tienes?**— y por eso **la familia nunca
  clasifica su evidencia antes de entregárnosla**: no hay pestañas de Lista /
  Menú / Recetas / Imagen. Pero **puede entregarla con el gesto que le salga
  natural**: escribir, pegar, arrastrar una foto, soltar un enlace. Un gesto
  distinto no es una puerta distinta si desemboca en el mismo sitio.
- 📝 **La libreta nunca está esperando una lista. Está esperando una línea.**
  *(Promovido a principio por la PO, 2026-08-01.)* Nadie debe pensar *"hoy voy a
  hacer mi lista"* —eso es una tarea, y las tareas se posponen— sino *"déjame
  apuntar esto antes de que se me olvide"*. La lista aparece sola, como
  consecuencia. Consecuencias: el producto se adapta al ritmo de la familia, no al
  revés; la unidad de interacción es **la línea**, no la sesión; y ningún diseño
  puede sugerir que falta algo para estar completo.
- 🏠 **La libreta es el Home.** No es la primera pantalla: es el centro del
  producto. Ocupa casi toda la pantalla y **todo lo demás gira a su alrededor**,
  apareciendo solo cuando hace falta. El primer contacto con SuperCarrito es la
  **propia compra**, nunca una decisión sobre cómo empezar.
- ✍️ **El formato lo pone la familia, nunca nosotros.** Líneas, comas, guiones,
  párrafos, emojis, numeración, todo mezclado. El separador se detecta, no se
  declara. Si el usuario tiene que pensar *cómo* escribirlo, ya perdimos.
- 💾 **El trabajo del usuario no se pierde jamás.** Ni al recargar, ni al salir, ni
  en tres días. Una entrada a medias es sagrada.
- 🤍 **La personalidad nace de no juzgar.** Sin títulos que rellenar, sin botón de
  guardar, sin contadores de progreso, sin "te falta", sin regañar por repetir. Un
  sitio donde tirar pensamientos es un sitio **donde nada te evalúa**.
- 🛒 **"Hacer la compra" es un acto claramente identificable, y nunca un CTA.**
  Separamos escribir de comprar, pero comprar no desaparece: es el **único momento
  donde pedimos completitud**, y todo lo demás puede ser libre de exigencias porque
  existe. Está **siempre disponible y siempre discreto** —con menos peso visual que
  la propia libreta—: no es el objetivo de la pantalla, es la consecuencia natural
  de que la compra ya está lista. **La protagonista es siempre la compra que la
  familia está construyendo.**
- 🕊️ **Escribir de forma continuada es un derecho, no un deber.** La familia que
  entra una vez por semana, pega algo, compra y se va debe sentirse igual de
  natural que la que anota durante días. Ningún diseño puede obligar a un hábito.
- 📸 **La foto marca la frontera entre escribir y comprar.** En la libreta **no
  hay ni una imagen de producto**: poner una miniatura junto a *"leche"* obliga a
  la familia a validar una elección que todavía no ha tomado, y convierte anotar
  en comprar. En el carrito hay foto en **cada** línea: comprar online es visual,
  y la imagen responde en medio segundo lo que un nombre largo no responde nunca
  —*"¿es ese yogurt?"*—. Una sola regla dibuja toda la frontera del producto.
  (PO, 2026-08-02.)
- 🔢 **Las opciones son tres, ordenadas, y siempre con una salida abierta.** Nunca
  un catálogo. Orden fijo: **lo que ya compraste** → **el mismo producto en otro
  formato** → **otra marca**; cada una dice *en lápiz* por qué está ahí (*"marzo y
  abril"*, *"misma leche, otro formato"*). El orden **es** la recomendación: no
  hace falta un banner. Todo lo que venga en pack o al peso lleva **precio por
  unidad**; sin eso, comparar una mano de seis con un kilo suelto es mentira.
  Ante una línea vaga (*"galletas para el lonche"*) **no devolvemos la pregunta**
  —*"¿a qué te refieres?"* le devuelve el trabajo—: mostramos candidatas.
- 🚫 **Lo agotado se muestra, nunca se esconde ni se sustituye en silencio.** En
  gris, con sello, en su sitio. Si desaparece, la familia cree que **no la
  entendimos**; viéndolo, entiende que el problema es la tienda. Debajo, la
  alternativa diciendo **qué es lo que cambia** (el formato o la marca), y una
  tercera salida siempre: **dejarlo anotado** —no comprarlo hoy sin perderlo.

**Técnicas**

- Menús y recetas: **JSON estático** en `data/`, editables en `/editar`.
- Precios de Wong: **API pública de VTEX**. Playwright/DOM descartado por frágil.
- Solo Wong por ahora. Un proveedor a la vez.
- `lib/catalog.ts` es el contrato; el resto del sistema **nunca** sabe qué
  proveedor está activo.
- Degradación elegante siempre: si Wong falla, FakeWong. La experiencia no se rompe.
- Antes de una solución técnica, la más simple: **API pública > scraping ·
  JSON > BD · configuración > IA**.
- **Medir antes de optimizar.** El ciclo 4 construyó un termómetro, no un mejor matcher.

---

## 5. Roadmap — replanteado (2026-07-26)

> Roadmap rehecho por PRODUCT · ENGINEERING · QA · GROWTH tras elevar el perfil
> de compra familiar a activo principal. El acta de la reunión está en §6.

**El eje que ordena todo el roadmap:**

```
capturar señal  →  guardarla  →  usarla  →  no volver a preguntar
```

Un ciclo que no avanza por ese eje no está construyendo el activo.

### ~~Ciclo 5 — Corregir y recordar~~ ✅ CERRADO

Alcance final (ampliado por la PO): corregir + guardar + aplicar, con el perfil en
localStorage y el modelo independiente del almacenamiento. Ver §2.
→ *Pendiente de aprendizaje real: nadie fuera del equipo lo ha usado todavía.*

---

## 🎯 SPRINT EN CURSO — Diseñar las cuatro puertas de entrada (Product Design)

**Empezar aquí.** Abierto el 2026-08-01 como sprint de Research (*"Rediseñar el
Momento Cero"*) y **reconvertido el mismo día por la PO en sprint de Product
Design**. Ver el cambio de método abajo.

### 🔄 Cambio de método — la investigación ocurre a través del producto

Decisión de la PO, 2026-08-01. Ya no ampliamos el mapa del problema: hay evidencia
suficiente. A partir de ahora **investigamos diseñando y probando**:

```
hipótesis de experiencia → prototipo → familias reales → observar → iterar
```

Consecuencia para este documento: **ya no estamos descubriendo el problema, estamos
explorando soluciones.** Y las soluciones todavía tienen que sobrevivir a las
entrevistas. Por eso lo de este sprint se registra como **hipótesis de diseño**
(§H-D, abajo) y **no** como decisiones de §4. La distinción es deliberada:

| §4 Decisiones | §H-D Hipótesis de diseño |
|---|---|
| Consolidadas. No se re-litigan. | **En competencia entre sí.** |
| Salieron de construir y de la visión. | Salen de diseñar. Sin validar con usuario. |
| Cambiarlas es un evento. | Se espera que varias mueran. |

### La estructura: cuatro puertas, un solo motor

Decisión de la PO (esta sí es estructural). SuperCarrito tiene **cuatro puertas de
entrada**, ordenadas por frecuencia de uso, no por sofisticación:

| # | Puerta | Estado |
|---|---|---|
| 1 | **Lista** — la más importante | 🎨 en diseño |
| 2 | **Menú** | 🔜 |
| 3 | **Recetas** | 🔜 |
| 4 | **Imagen / evidencia existente** (captura, foto, PDF) | 🔜 (mucho trabajo técnico ya hecho, §2) |

- **No son cuatro productos: son cuatro formas de llegar al mismo sitio.** Todas
  desembocan en `normalizarIntencion()`, como manda §1.
- **Se diseñan en secuencia, una por sprint,** y cada sprint deja un entregable
  usable. No esperamos a tener "el Momento Cero" perfecto.
- Cada puerta se optimiza para el **comportamiento real de quien la usa**, pero
  todas comparten la misma filosofía (abajo).

### La filosofía que atraviesa las cuatro puertas

> **"No le pidas a la familia que reconstruya su compra.
> Acepta cualquier evidencia que ya exista."**
> Formulación de cara al usuario: **"Pega lo que sea. Yo me encargo."**

No es una puerta adicional: es lo que las cuatro tienen en común. Corolario
operativo: **nunca existe un "eso aquí no"**.

**Reglas del sprint:** no se escribe código; no se habla de matching, modelos ni
extracción (congelado, §2); no se diseñan componentes ni pantallas completas — se
diseñan **experiencias**.

**Mandato permanente de la PO (ampliado):** el equipo **no está obligado a proteger
el diseño actual**. Si aparece una experiencia claramente superior aunque contradiga
lo construido, hay que proponerla. Y si estamos optimizando el lugar equivocado,
hay que parar y decirlo.

**Insumos:** insight I-1 (§3, n=1), artefactos reales recolectados, oportunidad O-1.

---

## 🎨 H-D · Hipótesis de diseño (en competencia, sin validar)

> **Nada de esta sección es una decisión.** Son conceptos que compiten y que deben
> sobrevivir a familias reales. Al validarse suben a §4; al falsarse se tachan aquí.

> ✅ **Fase conceptual cerrada (2026-08-01).** HD-1, HD-3, HD-4, HD-5, HD-7 y HD-10
> se consideraron suficientemente sólidos y **subieron a §4 como principios de
> experiencia**. Se quedan aquí abajo por trazabilidad, marcados. Lo que sigue sin
> marcar es lo que todavía compite y se valida con usuarios.

### Conceptos de Momento Cero explorados (2026-08-01)

Tres conceptos radicalmente distintos, todos defendibles desde producto:

- **A · El buzón** — *"No me la cuentes, dámela."* Un solo espacio que acepta
  evidencia cruda y heterogénea. → **Adoptado no como concepto sino como
  filosofía transversal a las cuatro puertas** (arriba).
- **B · El recorrido** — *"¿Qué se te acabó?"* El producto enseña la despensa
  típica y la familia responde sí/no/ya tengo. Reconocer en vez de recordar.
  → Vive hoy dentro de la puerta Lista, en pequeño: como arranque para quien no
  tiene nada que pegar (HD-8).
- **C · La compra ya hecha** — el producto propone un carrito lleno y la familia
  **quita**. Convierte el Momento Cero en una máquina de correcciones. Ataca H3 y
  H6 de frente. → **Vivo, sin construir.** Riesgo propio serio: roza el principio
  *"un producto solo suma al total si conocemos su cantidad"*; solo es defendible
  si lo propuesto se ve como propuesta y **no suma al total hasta que se toca**.

### Puerta 1 — Lista · hipótesis de diseño

| # | Hipótesis de diseño | Estado |
|---|---|---|
| **HD-1** | **El formato lo pone la familia, nunca nosotros.** Aceptamos líneas, comas, guiones, párrafos, emojis, numeración y todo mezclado. El separador se detecta, no se declara. Si el usuario piensa *cómo* escribirlo, ya perdimos. | ⬆️ **Consolidada → §4.** |
| **HD-2** | **La caja no es una lista: es una libreta.** Un objeto vivo donde caen cosas durante días, no un formulario que se rellena de una vez. La unidad deja de ser *la lista* y pasa a ser *la línea*. | Vigente **como hipótesis**. La PO **no compromete la arquitectura** con ella todavía. |
| **HD-3** | **La libreta permanente es un derecho, no un deber.** La familia que entra una vez por semana, pega una captura, compra y se va debe sentirse igual de natural: usa la misma caja, su libreta vive tres segundos. | ⬆️ **Consolidada → §4.** Restricción de la PO sobre HD-2. |
| **HD-4** | **El trabajo nunca se pierde**, ni al recargar, ni al salir, ni en tres días. Una lista a medias es sagrada. | ⬆️ **Consolidada → §4.** |
| **HD-5** | **La personalidad nace de no juzgar.** Se abre ya escribiendo, sin título, sin "nueva lista", sin botón de guardar, sin contadores de progreso, sin "te falta". Un sitio donde tirar pensamientos es un sitio **donde nada te evalúa**. Si repite algo, no se le corrige: a lo sumo *"también el martes"*. | ⬆️ **Consolidada → §4.** |
| **HD-6** | **"Puedes volver" se diseña contra tres miedos:** *¿se habrá guardado?* (se ve su texto, esa es la prueba) · *¿tengo que terminarla?* (nada pide completitud) · *¿lo habré apuntado ya?* (nunca se regaña). Volver ideal = 2 segundos: abre, ve lo suyo con el cursor al final, escribe una línea, se va. | Fuerte. |
| **HD-7** | **Pegar es la acción principal, no escribir.** Escribir es el caso secundario —el de quien no tiene nada que pegar. Lo que hay que diseñar con obsesión es **el segundo posterior a pegar**: decimos lo que **sí** leímos (nunca lo que no), el ruido de WhatsApp **se atenúa, no se borra**, pegar dos veces **añade** y nunca sobrescribe, y pegar algo que no es una compra **no es un error**. | ⬆️ **La promesa consolidada → §4.** El diseño del segundo posterior a pegar sigue siendo hipótesis. |
| **HD-8** | **El primer producto es el que rompe el miedo al vacío**, y el problema no es el formato: es no tener nada en la cabeza todavía. Tres respuestas: de la semana 2 en adelante **la caja nunca está vacía**; en la semana 1 la mejor primera acción **es pegar** (HD-7); y para quien no tiene nada que pegar, la pregunta que arranca no es *"¿qué necesitas?"* sino *"¿qué se te acabó?"*. | Vigente. |
| **HD-9** | **La libreta y el carrito son objetos distintos, y el carrito nunca reescribe la libreta.** Libreta = pensamiento, permanente, orden suyo, sin precios, no exige nada. Carrito = decisiones, efímero, orden nuestro, montos explicables, exige confirmación. Si quita el detergente del carrito, la libreta sigue diciendo *detergente*: **la distancia entre lo que pensó y lo que compró es la señal más limpia que tenemos**. | **La decisión más importante en juego** (PO). A explorar. |
| **HD-10** | **"Hacer la compra" sigue existiendo como acto claramente identificable.** Separamos escribir de comprar, pero no eliminamos la frontera: es el **único momento del producto donde sí pedimos completitud**, y todo lo demás puede ser libre de exigencias precisamente porque ese momento existe. | ⬆️ **Consolidada → §4.** Restricción de la PO. |

### La libreta como Home — hipótesis derivadas (2026-08-01)

Al consolidar §4 *"la libreta es el Home"*, quedan tres hipótesis abiertas que el
prototipo debe poner delante de familias reales:

| # | Hipótesis de diseño | Cómo se falsa |
|---|---|---|
| **HD-12** | **La libreta como Home se entiende sin explicación.** La familia ve un sitio que es suyo y entiende que todo lo demás está a su servicio. | Si busca un menú, un botón de "empezar" o pregunta *"¿dónde va cada cosa?"*. |
| **HD-13** | **El paso del tiempo hace que la compra se sienta acompañada, no atrasada.** *"Esta compra vive contigo durante la semana."* Dos variantes opuestas a entrevista: **A · el tiempo como estructura** (marca de día al margen, ordena la lectura) · **B · el tiempo como susurro** (el texto queda limpio; solo al volver, un rastro discreto tipo *"lo último, ayer"*). Recomendación de partida: **B** — el tiempo va en el margen, nunca dentro del texto que escribió la familia. | Si ver *lun* junto a algo de hace cinco días transmite **retraso** o culpa en vez de compañía. Es el riesgo real y solo lo dirá una familia mirando la pantalla. |
| **HD-14** | **Los gestos sobre la libreta se descubren solos.** La familia entiende de forma natural que puede **escribir, pegar, arrastrar una foto o soltar un enlace directamente sobre la libreta**, sin buscar un botón de "añadir". | Si busca un botón de añadir, o si no se le ocurre arrastrar la captura que tiene en el móvil. **Decisión anticipada de la PO: si HD-14 falla, NO se cambia el Home — se cambia únicamente cómo enseñamos el gesto.** |

### ~~H10 · "El silencio produce listas más completas"~~ → retirada, reemplazada

Era una verdad disfrazada de hipótesis (corrección de la PO). El silencio no es un
valor: es la respuesta correcta **a un momento concreto**. En su lugar, el
**mapa de momentos de ayuda** — qué casilla merece ayuda lo dicen las entrevistas:

| Momento | Qué hace la persona | Ayuda |
|---|---|---|
| Escribiendo seguido | **recordando** (recorre la casa mentalmente) | Silencio total. Interrumpir borra recuerdos. |
| Pausa larga, mano fuera | terminó un bloque, no está pensando | Aquí **sí** cabe. Es el momento a probar. |
| Acaba de pegar | no recuerda: **espera** | Ayuda esperada. Callar se siente roto. |
| Vuelve al día siguiente | retoma | Silencio. Solo su texto. |

Dos reglas para cualquier ayuda que aparezca: **nunca ocupa el lugar del cursor** y
**nunca modifica su texto**.

### Cuándo corregimos · sugerimos · preguntamos (puerta Lista)

- **Corregimos** después de enviar, nunca durante, y siempre a la vista.
  `platano`→`plátano` sí; `leche`→`Leche Gloria 1L` **no es corregir, es suponer**,
  y se etiqueta *"pendiente de confirmar"*.
- **Sugerimos** solo después del primer carrito y solo con historial detrás. Sin
  historial no sugerimos nada: sería adivinar.
- **Preguntamos** solo cuando falta una cantidad **y** hace falta para que el monto
  sea honesto. Nunca por marca ni formato — eso se aprende observando. Siempre con
  salida abierta (§4).

### Qué aprendemos sin preguntar nada (puerta Lista)

Escribir es la puerta que más señal regala gratis: **especificidad** (marca y
formato escritos — hoy se tiran, es la deuda del ciclo 6) · **léxico de la casa**
(*"papel"*, *"gaseosa"*) · **el orden**, que revela el recorrido mental y es la
mejor pista para ordenar lo que devolvamos · **cómo llega** (teclea o pega, de una
vez o en cinco visitas) · **lo que corrige después**.

### Por qué esto gana a buscar dentro de Wong

La comparación **no se gana en tiempo, se gana en número de decisiones**. En Wong:
buscar + comparar + elegir + cantidad ≈ 4 decisiones × 25 productos ≈ **100
decisiones**, cada una con riesgo de *"no lo encuentro"*. Aquí: **un acto de
volcado, sin decisiones**, y confirmar solo lo poco que no sabemos. A la segunda
semana, con perfil, también eso desaparece.

### 🔭 HD-11 · El ciclo no empieza al abrir SuperCarrito

Reflexión de la PO (2026-08-01), anotada **sin diseñar todavía**:

> **El verdadero ciclo del producto probablemente empieza cuando termina la
> compra anterior, no cuando alguien abre la app.**

Hemos diseñado mucho **cómo entra** la información y casi nada **cómo sale**. Si la
libreta acaba siendo donde vive la compra semanal, la experiencia de **volver
después de comprar** es tan importante como la de empezar. La PO señala aquí una
oportunidad grande de diferenciación. No se diseña en este sprint.

### Preguntas abiertas del sprint (deliberadamente sin responder)

- **¿La libreta es de una persona o de una casa?** Decisión enorme (invitaciones,
  sincronización, permisos, conflictos, historial). **No se fija todavía**: primero
  la experiencia. Mientras tanto, cualquier decisión que asuma un solo autor es
  provisional.
- Al hacer la compra, ¿lo comprado **se queda marcado** en la libreta o **se
  archiva** por semanas?
- ¿La caja acepta imágenes desde ya —aunque la puerta 4 no esté diseñada— para que
  nunca haya un *"eso aquí no"*?

---

## 🎨 Diseño de la Puerta 1 — exploración (2026-08-01)

> **Exploración, no decisiones.** Wireframes de baja fidelidad producidos en el
> sprint de diseño. Se conservan porque reconstruirlos es caro. Ninguno está
> elegido; los tres finalistas son candidatos a prototipo, nada más.
>
> ⬆️ **Superado en parte (2026-08-02).** La PO cerró la exploración y eligió cuatro
> direcciones: **E3 · el carrito debajo** (estructura), **C1 · el eco** (ayudar sin
> empujar), **A2 · la última línea** (tratamiento visual) y **F2 · el sobre** (futura
> puerta, sin diseñar todavía). **Todo lo demás queda archivado como exploración.**
> El resultado en alta fidelidad está en `design/pantallas.html` y en
> *🎨 Sistema visual*.

### Estado 1 — Home = la libreta

```
┌─────────────────────────────────────────────┐
│  Tu compra                          ⌄       │
│ ┌─────────────────────────────────────────┐ │
│ │  leche gloria                           │ │
│ │  2 kg de pollo                          │ │
│ │  pan, huevos                            │ │
│ │  ▌                                      │ │  ← la libreta ocupa
│ │                                         │ │    casi toda la pantalla
│ └─────────────────────────────────────────┘ │
│   ✎ escribe   ⌘V pega   📷 foto   🔗 enlace │  ← gestos al margen,
│   ────────────────────────────────────────  │    nunca pestañas
│   12 cosas anotadas        hacer la compra →│  ← texto, no botón
└─────────────────────────────────────────────┘
```
*Pregunta que valida:* ¿entiende que este sitio es suyo y que todo lo demás está
a su servicio, o busca un menú / un botón de empezar?

**El mapa del sistema:** `LIBRETA` (permanente, suya, pensamiento, su orden, sin
precios, no exige nada) → *hacer la compra*, **única frontera** → `CARRITO`
(efímero, nuestro, decisiones, montos explicables, exige confirmar) → comprar →
**¿?** (HD-11, sin diseñar).

### Estado 2 — Volver al día siguiente

```
┌─────────────────────────────────────────────┐
│ │  leche gloria                           │ │
│ │  2 kg de pollo                          │ │
│ │  pan, huevos                            │ │
│ │                                         │ │  ← un hueco. nada más.
│ │  ▌                                      │ │  ← el cursor ya está aquí
│   3 cosas anotadas         hacer la compra →│  ← idéntico a ayer
└─────────────────────────────────────────────┘
```
*Pregunta que valida:* ¿siente que su compra le estuvo esperando, o que tiene una
tarea pendiente?

- **Qué cambia desde ayer: casi nada, y eso es el diseño.** Lo único: el cursor
  esperando al final.
- **Lo que hace que algo parezca abandonado no es el tiempo: es que el producto te
  lo recuerde.** *"Hace 1 día"*, *"sigues sin terminar"*, *"40% completo"*
  convierten una libreta en una tarea.
- **"Hacer la compra" no reaparece porque nunca se fue.** No crece, no cambia de
  color, no se anima. **Su inmutabilidad es el mensaje.**

**El tiempo — tres variantes.** A · *estructura* (marca de día al margen; riesgo:
transmite retraso) · B · *susurro* (*"lo último, ayer"*; riesgo: innecesario) ·
**C · el aire** (el hueco en blanco **es** el tiempo; nadie dice nada).
→ **La PO elige C** y quiere llevar **A vs C** a entrevistas: son las dos
filosofías opuestas — el tiempo como dato vs el tiempo como silencio.

**La anti-pantalla, para no construirla nunca:** *"👋 ¡Hola de nuevo! Tu lista
lleva 1 día parada · 3 productos · 40% completo · [CONTINUAR MI LISTA]"*. Cada
línea rompe un principio de §4, y es exactamente lo que se construye por defecto
si nadie lo impide.

**Pendiente de móvil real:** al volver, ¿cursor puesto **y** teclado abierto? Un
teclado que salta solo tapa media libreta justo cuando quiere ver lo que ya tiene.
Recomendación: cursor sí, teclado no.

### Las 16 propuestas — abanico completo

**Familia A · Minimalismo radical** — *el producto desaparece y queda la compra.*
- **A1 · El folio** — sin marcos ni barras; el texto flota, el cromo aparece solo
  al detenerse. Riesgo: parece una app rota.
- **A2 · La última línea** — lo escrito reposa (más tenue), la línea activa es lo
  único nítido. **No es un concepto, es un tratamiento**: se aplica encima de
  cualquier otro. Riesgo: atenuar lo suyo se puede leer como pérdida.
- **A3 · Un renglón** ⭐ — abre en modo captura: un solo renglón tipo Spotlight,
  apuntas y se cierra; la libreta está a un gesto pero no se enseña.
- **B1 · La libreta de la nevera** — papel, renglones tenues, sombra. *Un renglón
  vacío pide ser llenado; un área en blanco no.* Riesgo: el renglón puede pasar de
  invitación a casilla que hay que rellenar.
- **B2 · El aire** — el espacio en blanco como único lenguaje temporal. Riesgo: se
  lee como fallo de maquetación; a las seis semanas es un desierto.
- **B3 · Las manos de la casa** — marca mínima (· / ○) por autor, sin nombres ni
  avatares. Permite **sentir** el modelo colaborativo sin construirlo.
- **C1 · El eco** ⭐ — bajo la línea activa, en tenue, lo que esta familia suele
  comprar y hoy no ha anotado; tocar = añadir. **Su propio historial devuelto**,
  no sugerencia de catálogo.
- **C2 · El margen** — columna lateral con la interpretación de cada línea
  (`leche gloria │ Gloria 1 L`). Riesgo alto: interrumpe el recuerdo; no cabe en móvil.
- **C3 · El total que respira** — un total aproximado que crece al escribir.
  Riesgo **muy alto**: roza *"solo suma si conocemos la cantidad"*, y puede hacer
  que se deje de anotar para que no suba. **Descartado sin llevarlo a nadie.**
- **D1 · Las fichas** — cada línea como tarjeta con imagen. **Descartado**: una
  imagen es una afirmación, y si enseñamos la leche equivocada mentimos con más
  fuerza que con texto. Además destruye su orden.
- **D2 · El estante** — agrupado por zona del súper. Rompe *"su orden es dato"*.
  Vale la pena falsarlo: si el orden propio no importa, se abre mucho diseño.
- **D3 · El póster de la compra** — al comprar queda **un objeto** (fecha, total,
  iconos, *repetir esta compra*), no un vacío. Ataca HD-11. Es estado de salida.
- **E1 · Dos lugares** — libreta y carrito en pantallas separadas, transición
  explícita. Modelo mental limpio; la vuelta atrás debe ser perfecta.
- **E2 · El carrito al lado** — split con el carrito llenándose en vivo. Máxima
  confianza, **máxima interrupción**; no cabe en móvil.
- **E3 · El carrito debajo** ⭐ — un lugar, **dos alturas**: la libreta es la
  superficie y el carrito una hoja que se levanta. Nunca sales de tu libreta.
- **F1 · El portapapeles que se ofrece** — *"tienes algo copiado, ¿lo suelto
  aquí?"*, y si no lo tocas se va. Resuelve HD-14 sin enseñar el gesto. Debe verse
  siempre como oferta, nunca como lectura.
- **F2 · El sobre** — SuperCarrito en el menú *compartir* del móvil: la entrada
  ocurre **donde y cuando la evidencia existe**, fuera de la app. **La apuesta más
  grande del abanico:** si la compra nace fuera, el Home deja de ser el centro.

### Matriz comparativa

| Concepto | Confianza | Rapidez | Aprendizaje | Facilidad | Riesgo |
|---|:--:|:--:|:--:|:--:|:--:|
| A1 · El folio | ●●○ | ●●● | ●○○ | ●●○ | medio |
| **A2 · La última línea** | ●●○ | ●●● | ●○○ | ●●● | bajo |
| **A3 · Un renglón** | ●●○ | ●●●● | ●●○ | ●●● | medio |
| B1 · Libreta de la nevera | ●●● | ●●○ | ●○○ | ●●● | bajo |
| B2 · El aire | ●●○ | ●●● | ●○○ | ●●○ | bajo |
| B3 · Las manos de la casa | ●●○ | ●●○ | ●●●● | ●●○ | medio |
| **C1 · El eco** | ●●○ | ●●● | ●●●● | ●●● | medio |
| C2 · El margen | ●●●● | ●●○ | ●●○ | ●●○ | alto |
| C3 · El total que respira | ●○○ | ●●○ | ●●○ | ●●● | muy alto |
| D1 · Las fichas | ●○○ | ●○○ | ●○○ | ●●● | alto |
| D2 · El estante | ●●○ | ●●○ | ●○○ | ●●○ | alto |
| D3 · El póster | ●●● | — | ●●● | ●●● | medio |
| E1 · Dos lugares | ●●● | ●●○ | ●●○ | ●●● | bajo |
| E2 · El carrito al lado | ●●●● | ●○○ | ●●○ | ●●○ | alto |
| **E3 · El carrito debajo** | ●●● | ●●● | ●●○ | ●●● | bajo |
| F1 · Portapapeles ofrecido | ●●○ | ●●●● | ●●○ | ●●●● | medio |
| F2 · El sobre | ●●○ | ●●●● | ●●● | ●○○ | medio |

*Confianza = ¿creo lo que veo? · Rapidez = coste de anotar una línea · Aprendizaje
= señal para el perfil · Facilidad = ¿lo entiende sin explicación? · Riesgo =
probabilidad de romper un principio o la confianza.*

### Las tres finalistas (candidatas a prototipo, sin elegir)

```
  A3 · Un renglón          C1 · El eco              E3 · El carrito debajo
┌────────────────────┐  ┌────────────────────┐   ┌────────────────────┐
│                    │  │  leche gloria      │   │  leche gloria      │
│  ┌──────────────┐  │  │  2 kg de pollo     │   │  2 kg de pollo     │
│  │ ▌            │  │  │  ▌                 │   │  pan, huevos       │
│  └──────────────┘  │  │                    │   │  ▌                 │
│                    │  │  ⌁ papel higiénico │   │ ╭────────────────╮ │
│   ▲ 11 cosas       │  │  ⌁ arroz           │   │ │ 12 · S/ —      │ │
└────────────────────┘  └────────────────────┘   └─┴────────────────┴─┘
```

1. **A3 · Un renglón** — la única propuesta que traduce en interacción el principio
   *esperando una línea, no una lista*. Cinco anotaciones cortas dan **cinco veces
   más señal** que una sesión larga. **Contradice "la libreta es el Home", y por eso
   vale: es el único concepto capaz de falsar una decisión recién tomada.**
2. **C1 · El eco** — la mejor respuesta a la pregunta abierta de la PO (*cómo
   invitar sin empujar*), y la única que invita con algo que solo nosotros tenemos.
   Pone a prueba **H5** sin construir el motor entero.
3. **E3 · El carrito debajo** — resuelve HD-9 sin pagar su precio: dos objetos
   distintos que comparten **un lugar**, no una pantalla. El que mejor sobrevive
   en móvil.

**No finalistas que no deben perderse:** **A2** (tratamiento aplicable sobre
cualquiera de los tres) y **F2 · El sobre** (no se puede prototipar en papel, pero
**merece una pregunta directa en la próxima entrevista**).

---

## 🎨 Sistema visual — aprobado por la PO (2026-08-02)

> **Esto sí son decisiones.** La PO aprobó el look and feel completo tras la v2:
> *"Increíble. Me encanta."* Las 21 pantallas viven en **`design/pantallas.html`**
> (un solo archivo, se abre en el navegador). Es la referencia visual del
> prototipo: si el código y este documento discrepan, gana el archivo.

### La regla que gobierna cada pantalla

**La familia escribe en tinta; SuperCarrito habla en lápiz.** Lo escrito por la
familia va en tinta azul, peso 500, 17 px. Lo que dice el producto va en lápiz
gris-verde, peso 400, 12,5 px. **Misma tipografía para ambos** —la diferencia la
hacen color y peso, no la familia tipográfica—, de forma que el producto nunca
puede fingir ser ella y nunca hay duda de quién dijo qué.

### Color

| Token | Hex (claro) | Para qué |
|---|---|---|
| Papel | `#F5F3ED` | Fondo. Hueso ligeramente frío, no crema nostálgica. |
| Tinta | `#223354` | **Todo lo que escribe la familia.** |
| Lápiz | `#7F8A80` | **Todo lo que dice SuperCarrito.** |
| Pino | `#2E5D4B` | Dinero, confirmar, botón lleno. Nunca decoración. |
| Papaya | `#E0864B` | El guiño: *"más barato"*, foco de teclado. Aparece poco. |
| Ladrillo | `#A8503C` | Agotado y error. **Dos veces en toda la app.** |

Tema oscuro con la misma jerarquía (grafito `#16191C`, pino claro `#84C4A6`).

### Tipografía · **sin serif** (decisión de la PO)

Una sola familia **redondeada del sistema** (`ui-rounded` → `SF Pro Rounded` →
`Segoe UI`), tracking negativo en tamaños grandes. Cifras **tabulares** en todo
lo que sea plata. Se descartó el serif por solemne: el producto puede permitirse
no ser tan serio.

### Botones · **se sienten como botones** (decisión de la PO)

- **Lleno** — pino, doble sombra, se hunde 1 px al tocar. La acción principal de
  cada pantalla. **Nunca hay dos.**
- **Fantasma** — blanco, borde de 1 px, sombra mínima. La alternativa, y todo lo
  que vive en la libreta.
- Radio 13 px, alto mínimo 44 px. **Si algo se puede tocar, se ve tocable**: se
  acabaron los textos subrayados como acción.
- ⚠️ **Tensión resuelta con "hacer la compra" (nunca un CTA):** es un botón real
  y tocable, pero **fantasma, jamás verde**. Tocable sin gritar. El principio se
  mantiene; lo que cambia es que ya no es un texto suelto que hay que adivinar.

### Fotos de producto

Tile blanco, radio 12 px, borde 1 px. **46 px** en el carrito, **60 px** al
elegir. Fondo blanco siempre —el papel hueso detrás de un packshot lo ensucia—.
Dónde no van: **en la libreta**. En `design/pantallas.html` son dibujos de
relleno; en producción son las imágenes del catálogo de Wong.

### Profundidad, textura y movimiento

- **Una sola sombra** con peso en todo el producto: la del carrito al levantarse.
  Nada más flota; las tarjetas elevadas convierten una libreta en un panel de control.
- Renglón al 50 % de opacidad, desvanecido arriba y abajo. **Debe sentirse antes
  de verse**; si se nota, está mal.
- Levantar el carrito **320 ms**; aparecer un eco **180 ms solo de opacidad** —el
  texto de arriba nunca se mueve—; respirar mientras se buscan precios **2,6 s**,
  el ritmo de una exhalación y no el de un spinner. **Nada rebota, nada gira.**
- Los esqueletos de carga tienen **la forma final** (mismo alto, mismo hueco
  cuadrado) para que al llegar los datos no salte ni un píxel. Y ocurren **entre**
  las líneas ya escritas, nunca encima.

### Iconografía y tono

Trazo 1,5 px, puntas redondeadas. Sin emojis en la interfaz —pero los emojis
**pegados** por la familia se conservan tal cual: su desorden es suyo—. **Una
excepción aprobada**: el estado vacío dice *"todo comprado 🎉 por ahora"*. Un
emoji en toda la app, y el chiste está en el *"por ahora"*.

### Lo que nunca se construye

Badges con pendientes · rachas · barras de progreso de "lista completada" ·
ilustraciones de estado vacío · sustituciones automáticas al agotarse algo ·
fotos dentro de la libreta · un botón grande y de color que diga "HACER LA
COMPRA" · cualquier pantalla que aparezca **antes** de la libreta.

---

## 🪡 El diseño deja de ser exploración (2026-08-03)

**Un solo SuperCarrito.** El prototipo y la aplicación dejan de ser dos cosas.
`design/app.html` pasa a ser la **especificación visual oficial del MVP**: si el
código y ese documento discrepan, cambia el código.

### Cómo está construido ahora

`app/ui/` es el sistema, y cada pieza existe **una sola vez**:

`sistema.ts` (color · tipografía · renglón · tiempos) · `sistema.css` (keyframes,
papel, foco) · `Boton` · `Sello` · `Foto` · `Hoja` · `HojaCantidad` ·
`HojaOpciones` · `LineaCarrito` · `Libreta` (línea, compositor, puertas) ·
`Pantalla` (+ `Vacio`, `Seccion`) · `PantallaCalma` · `Aviso` · `Campo`.

`app/page.tsx` pasó de **1365 a ~980 líneas** y ya no contiene **ni un solo
color**: orquesta estado y reglas, nada más. Se borraron `RevisionCaptura.tsx`
(su papel es ahora la pantalla *Antes de comprar*) y dos componentes muertos.

### Decisiones de esta integración

- **Fuera la barra de pestañas.** Contradecía el sistema visual —*«una barra
  inferior convierte una libreta en una app»*—. Todo cuelga de la libreta: la
  compra hacia abajo, la casa detrás del monograma, y **siempre se vuelve con la
  misma flecha en la misma esquina**.
- **La pregunta de cantidad y las alternativas suben en hoja**, no en la tarjeta.
  Elegir comida es visual, y a 12 px cuatro arroces son cuatro filas idénticas.
- **`window.prompt` fuera.** La salida abierta de *«otra cantidad»* es ahora un
  campo real dentro de la hoja. Un diálogo del navegador es la señal más barata
  de que algo es un prototipo.
- **Lo pendiente vale un guion, nunca `S/ 0.00`.** Un cero al lado de su propia
  multiplicación es un monto que ya no se puede explicar.
- **Lo agotado se atenúa y lleva sello**, no se tacha ni se esconde.
- **La libreta persiste** (`lib/libreta.ts` + `repositorioLibreta`). Sin esto,
  *«volver una semana después»* no se puede enseñar en una entrevista. Al comprar
  la libreta no se vacía: se **resuelve**, y lo que no se compró se queda con su
  *«quedó de la semana pasada»* — sin fechas dentro del texto de la familia.
- **Wong real por defecto** (`lib/wong.ts`) y `netlify.toml` con el plugin de
  Next: que producción use datos reales deja de depender de que alguien recuerde
  poner una variable en un panel. La degradación a FakeWong ya existía.

### 🐞 Arreglado antes de enseñarlo

**Corregir una línea la borraba.** Al tocar una línea para editarla, vaciar el
campo para reescribirla —el gesto más normal del mundo— aplicaba `editar()` con
texto vacío, que equivale a `quitar()`: la línea desaparecía a media corrección y
lo que se escribía después caía sobre un id que ya no existía. Rompía §4 *«el
trabajo del usuario no se pierde jamás»* en el gesto más común de todos. Ahora el
texto vive en el estado de la edición y **solo se aplica al cerrar**.

### 🟡 Diferencias con el diseño, a propósito

- **Sin esqueleto de carga entre líneas.** Pegar es síncrono (no hay red) y la
  captura ocupa la pantalla de calma. No hay ningún momento donde ese esqueleto
  tenga sentido; dejarlo sería código muerto.
- **La libreta se resuelve comparando textos**, así que una línea cuyo texto no
  coincide con el ingrediente extraído (*«maracuyá para el jugo»* → `maracuyá`)
  sobrevive a la compra aunque sí se comprara. Falla del lado seguro —nunca borra
  de más—. Arreglarlo exige que el carrito devuelva el id de la línea de origen,
  y eso es tocar el modelo: **queda fuera a propósito**.
- **`/editar` solo se alcanza por URL.** No cuelga de la libreta ni del
  monograma: es trastienda, y *«cuenta y ayuda»* va lo más lejos posible.

---

## 🧊 Congelación para entrevistas — MVP demostrable (2026-08-02)

**Cierre de la fase de construcción.** A partir de este punto no se construye:
se observa. Decisión de la PO: *"congelar el estado actual y dejarlo listo para
desplegar"*. Cualquier cambio de código antes de las entrevistas necesita su
aprobación explícita.

### Lo verificado antes de congelar

Recorrido completo contra **datos reales de Wong** (`CATALOG_PROVIDER=wong`) y
contra el **extractor real de Claude**, no con mocks:

| Paso | Resultado |
|---|---|
| Escribir una lista | ✅ |
| Buscar productos reales de Wong | ✅ VTEX responde; precios reales |
| Importar una captura | ✅ 7 líneas leídas de una captura real, truncados marcados |
| Revisar productos | ✅ quitar / corregir antes de comprar |
| Confirmar cantidades | ✅ pesables preguntan; `800 g × S/ 21.90/kg = S/ 17.52` |
| Armar el carrito | ✅ |
| Montos explicables | ✅ toda cifra es `cantidad × precio` visible |
| Manejar agotados | ⚠️ código correcto, **camino inalcanzable** (ver riesgos) |
| Total correcto | ✅ `Subtotal confirmado` mientras algo esté pendiente; `Total` solo cuando no queda nada |

Build ✅ · typecheck ✅ · sin errores en consola ni en servidor · sin secretos
versionados · `.env.local` fuera de git y nunca en la historia · las tres
capturas reales y los crudos de medición siguen ignorados.

### 🔍 Mejoras de UX detectadas y NO implementadas

Documentadas por orden de daño en una entrevista. **Ninguna se toca antes de
mostrarlo a usuarios**: son justamente lo que las entrevistas deben confirmar o
desmentir.

1. **La relevancia de una palabra suelta es mala.** Con datos reales, `leche`
   devuelve *Crema de Leche Gloria 946 ml*; `arroz`, *Arroz Chaufa 500 g*;
   `pollo`, *Pollo Rostizado*. Tomamos el orden de VTEX tal cual y no lo
   reordenamos. Con términos específicos (`pechuga de pollo x kg`, `arroz
   costeño`) acierta. **No se arregla ahora**: reordenar es un motor de ranking,
   o sea un sprint. Es la primera pregunta que deben responder las entrevistas —
   ¿la familia corrige, se resigna, o se va?
2. **La categoría de VTEX se muestra cruda.** *"INGREDIENTES Y COMPLEMENTOS DE
   DECORACIÓN"* sobre una crema de leche. Es ruido, y además delata el error de
   emparejamiento antes que el nombre.
3. **`Prefiero otra (5)` no dice qué hay detrás.** El aprendizaje del perfil
   entero depende de que alguien pulse ese enlace, y hoy no promete nada.
4. **Un agotado mostraría `S/ 0.00`** junto a su propia multiplicación. El
   monto deja de ser explicable justo en la pantalla que sostiene la confianza.
   No es alcanzable hoy (ver riesgos), por eso queda documentado y no corregido.
5. **`/api/data` escribe en el filesystem.** En Netlify no persiste: editar
   menús funciona en local y se pierde en producción. Ya estaba anotado; sigue
   sin tocarse.

### ⚠️ Riesgos vivos para una entrevista

- **Los agotados no se pueden demostrar.** FakeWong no tiene ninguno (y su
  ranking los hunde 1000 puntos, así que jamás aparecen) y el buscador de Wong
  solo devuelve disponibles. El camino existe en el código y no se ha visto
  nunca funcionando. Si en una entrevista aparece uno de verdad, mostrará el
  `S/ 0.00` del punto 4.
- **Los pesables solo existen con Wong real.** El catálogo ficticio es todo por
  pieza, así que con `CATALOG_PROVIDER=fake` la pregunta de cantidad —una de las
  mejores piezas del producto— **no aparece nunca**.
- **Dependemos de dos servicios ajenos en vivo.** Wong (VTEX, sin contrato ni
  SLA) y la API de Claude. Wong degrada a FakeWong con elegancia; el extractor
  degrada a muestra. Ninguna de las dos degradaciones se le explica al usuario
  durante la entrevista.
- **El perfil vive en el navegador.** Otro dispositivo, otra pestaña en
  incógnito o borrar datos = familia nueva. Dos entrevistas seguidas en el mismo
  navegador comparten perfil: **hay que limpiarlo entre familias** o la segunda
  verá las preferencias de la primera.
- **La captura sale del país.** Se envía a la API de Claude. La pantalla lo
  dice; conviene decirlo también en voz alta antes de pedir una captura real.

### 🚫 Lo que NO se toca antes de mostrarlo

`lib/cart.ts` (normalizador único) · `lib/wong.ts` y `lib/wongvtex.ts`
(contrato y degradación) · la pantalla de revisión de captura · la pregunta de
cantidad y su salida abierta · la regla del total que no miente. Son
exactamente las piezas que las entrevistas tienen que poner a prueba: cambiarlas
antes invalida lo que aprendamos.

---

## 🚀 SIGUIENTE SPRINT — Diseño de la Puerta 1 · Lista

**Empezar aquí.** Abierto por la PO el 2026-08-01 al **cerrar la fase conceptual**.

> Dejamos de buscar mejores ideas. Ahora construimos la primera versión de la
> mejor experiencia posible y **aprendemos viéndola usar**.

**Ya no es un sprint de definición de producto. Es un sprint de diseño.**

**Entregable:** wireframes, flujos y un prototipo que se pueda **poner delante de
familias reales**. Con el mayor nivel de detalle posible.

**Base del prototipo (decidida por la PO, 2026-08-01):**
- **La libreta es el Home.** La pantalla de inicio actual con las tres formas de
  empezar (`app/page.tsx`) **desaparece del prototipo**. El primer contacto es la
  propia compra, no una decisión sobre cómo empezar.
- **Libreta y carrito son dos objetos distintos**, con "hacer la compra" como única
  frontera entre ellos.

**Orden de trabajo del sprint (fijado por la PO):**
1. ✅ **La Puerta 1 como sistema** — el mapa completo. Hecho: la libreta como Home,
   los gestos alrededor, "hacer la compra" sin protagonismo.
2. **Los estados**, uno a uno y cada uno con su wireframe. **Orden fijado por la
   PO** (el estado vacío ocurre una vez; volver ocurre toda la vida del producto):
   ✅ Home = la libreta · ✅ **volver al día siguiente** · ▶️ volver después de
   comprar · volver tras varias semanas · lista a medio construir · hacer la
   compra · **y al final** el estado completamente vacío.
3. **Los microflujos:** pegar un WhatsApp · pegar una captura · escribir una línea ·
   editar una línea · duplicados · volver después de tres días · hacer la compra.
4. **El prototipo navegable** para entrevistas — solo cuando el flujo completo
   tenga sentido.

**Reglas:**
- **Cada wireframe responde UNA sola pregunta.** Ninguna pantalla intenta resolver
  todo. Un wireframe existe porque queremos validar **una hipótesis concreta** con
  una familia; eso los obliga a ser extremadamente simples.
- **Se piensa visualmente.** Nada de documentos largos describiendo una pantalla:
  antes un dibujo imperfecto que dos mil palabras sobre una interfaz que todavía
  no hemos visto.
- **Toda idea de UX viene con wireframe de baja fidelidad, en el momento.** Regla
  permanente, también en `CLAUDE.md`. Nada de describir pantallas en prosa.
- Se parte de los **principios de experiencia de §4** (consolidados, no se
  re-litigan) y de las **hipótesis de §H-D** (que el prototipo debe poner a prueba).
- Cada hipótesis de diseño que entre en el prototipo tiene que llevar asociado
  **qué observaríamos para saber si es falsa**.

---

### Qué observar en las entrevistas (puerta Lista)

Si al ver la caja **escriben o buscan el móvil** · si el primer producto tarda o
sale solo · si escriben marcas espontáneamente (¿cuánta gente es Perfil A?) · si se
detienen a *"arreglar"* lo escrito antes de enviar (señal de que no dimos permiso
suficiente) · si al terminar dicen *"ah, y también…"* · si vuelven a entrar más de
una vez en la misma semana sin que se lo pidamos (falsa o confirma HD-2).

---

> ⏸ **Roadmap de desarrollo congelado (2026-07-26 → sigue vigente).** Los ciclos
> de abajo esperan al resultado del sprint de Momento Cero. Mientras tanto:
> **ningún cambio de arquitectura.** El producto ya tiene nivel suficiente para
> enseñarlo. El insight I-1 (§3) podría reordenarlos; todavía no lo hace.

### Ciclo 6 — **Escuchar** ⭐ siguiente

Aprender de lo que el usuario **ya expresó**, antes de diseñar ninguna pregunta
nueva. Hoy hacemos lo contrario: `leche laive` devuelve **Gloria** y `pan bimbo`
devuelve **Panadería Wong** — el sistema ignora activamente lo que le dijeron con
todas las letras. El Perfil A (el que escribe "Leche Gloria" y solo quiere dejar
de buscar producto por producto) hoy **no está mal servido: está traicionado**.

Alcance:
1. **Parsear la especificidad** — de `"leche gloria 1L"` a
   `{ingrediente: "leche", marca: "Gloria", formato: "1 L"}`. Sin IA: diccionario
   de marcas (que el propio perfil alimenta) + patrón de formatos.
2. **Aprendizaje implícito** — lo que escribe rellena las dimensiones y se guarda.
   Aplica la regla *"nunca preguntes algo que el usuario ya dijo"*.
3. **Arreglar la clave del perfil** — `clave()` normaliza la cadena entera, así
   que `"leche gloria"` y `"leche"` son claves **distintas**. En cuanto la gente
   escriba marcas, el perfil se llena de entradas basura que nunca se cruzan.
   Corrompe el activo en silencio; es el defecto más caro pendiente.
→ *Aprendizaje: ¿cuánta gente es Perfil A? Con parseo, su cifra de decisiones por
compra debería ser **cero desde la primera**.*

> **Preguntar proactivamente** (el journey de "leche" con opciones) queda
> **aplazado sin número**, condicionado a la prueba con usuario: si la gente
> corrige y escribe con especificidad, quizá no haga falta preguntar nunca.

### Ciclo 7 — El perfil visible

Una pantalla donde la familia **ve y edita su perfil**: "Leche → Gloria · Huevos →
el más barato · Pan → Bimbo". Hace el activo tangible para el usuario (y para
nosotros). También es el mejor instrumento de QA que podemos tener.
→ *Aprendizaje: H6. ¿Al ver su perfil el usuario siente que perdería algo si se va?*

### Ciclo 8 — Sustituciones y agotados

"No hay Gloria hoy: ¿Laive o lo dejamos?" → guardar la respuesta como regla de
sustitución. Es la dimensión 4 y el caso donde el producto se ve más inteligente.
→ *Aprendizaje: ¿la sustitución aprendida se percibe como confianza o como intrusión?*

### Ciclo 9 — Frecuencia y "mi lista del domingo" (H3)

Con historial de compras, inferir cada cuánto se compra qué y **proponer** la
lista recurrente. Ya no es una lista guardada: es una lista que el producto arma
porque conoce a la familia.
→ *Aprendizaje: H3, el motor de retención.*

### En paralelo, sin bloquear (cuándo salga)

- **Prueba con un usuario real (H1)** — el guión del README nunca se ha corrido.
  Es el ciclo más barato y valida la hipótesis fundacional. **Puede correrse ya**,
  con lo que hay hoy.
- ~~**Medición del ciclo 4 (H2)**~~ — ya no hace falta para decidir: el hito
  técnico respondió H2. El instrumento sigue sirviendo solo para mapear **qué
  categorías son ambiguas**, o sea dónde vale la pena preguntar (insumo del ciclo 7).

### Explícitamente NO ahora

- **Foto y nota de voz** — amplían la *entrada*, no construyen el activo. El
  filtro de decisión no las aprueba todavía.
- **Mejorar la *búsqueda*** — es del proveedor, no nuestra, y ya sabemos que el
  producto correcto suele venir en el Top-N (H7). Lo que sí haremos algún día es
  **elegir mejor sobre esos candidatos**, que es trabajo del perfil de compra y
  vive en `elegir()`. No es un ciclo aparte: es el ciclo 6 y los siguientes.
- **Segundo supermercado (Metro, Plaza Vea)** — el perfil es transferible entre
  supermercados; esa es una ventaja futura, pero primero hay que tener perfil.

---

## 6. Acta de la reunión de replanteo (2026-07-26)

Motivo: la PO establece que el activo principal es el perfil de compra familiar,
no el matching. Los cuatro roles replantean el roadmap completo.

**PRODUCT**
> El roadmap anterior estaba ordenado por "dónde falla el sistema". El nuevo debe
> ordenarse por "dónde se acumula el activo". Son órdenes distintos y llevan a
> ciclos distintos. Cancelo foto y voz del horizonte cercano: son puertas de
> entrada bonitas que no depositan nada en el perfil. Y reordeno: corregir ya no
> es "el dominio 3", es **el mecanismo de captura**. Es el ciclo 5, no una mejora.

**ENGINEERING**
> Dos consecuencias técnicas serias. Primera: `ProductoWong` ya no basta como
> contrato. Necesitaremos un segundo contrato —`PreferenciaFamiliar`— y la elección
> pasa a ser `catálogo + perfil → producto`, no `catálogo → producto`. Prefiero
> introducirlo cuando el ciclo 6 lo exija, no antes.
> Segunda, y más importante: **hoy no existe ninguna forma de persistir nada por
> usuario**. `/api/data` escribe al filesystem y eso ya no sobrevive Netlify. El
> perfil es el activo, así que su almacenamiento no puede ser un parche. Necesito
> la decisión de la PO (§⏸) antes del ciclo 6. El ciclo 5 no la necesita: puedo
> capturar correcciones en memoria de sesión y aprender del comportamiento sin
> guardarlo todavía.

**QA**
> Mi definición de "roto" cambia. Antes: producto irrelevante. Ahora: **preguntar
> dos veces lo mismo**. Eso es peor que equivocarse, porque rompe la promesa del
> producto. Casos borde que ya reclamo para el ciclo 6: perfil vacío en la primera
> compra; ingrediente ambiguo sin alternativas reales en Wong; usuario que responde
> "cualquiera" (eso también es una preferencia y hay que guardarla); marca preferida
> agotada; y el peor de todos, **perfil que se pierde** —si eso pasa el usuario no
> vuelve. También: preguntar por 8 ingredientes ambiguos en la primera compra es
> un interrogatorio. Hay que poner un techo de preguntas por sesión.

**GROWTH**
> Esto cambia la métrica principal. Ya no es "% de aciertos de matching". Es
> **"preguntas por compra"** — y debe **bajar** compra tras compra. Esa curva
> descendente *es* el producto funcionando, y es la única prueba de H6.
> La métrica secundaria: compras 2, 3 y 4 por usuario (retención), no descargas.
> El experimento que propongo no es una feature: darle el producto a una familia
> real **dos domingos seguidos** y medir si el segundo fue más rápido que el
> primero. Si no lo fue, H4 es falsa y el roadmap entero está mal.

**Puntos de fricción resueltos**

- *¿La medición del ciclo 4 sigue siendo prioritaria?* **No.** Mide relevancia de
  catálogo, y acabamos de decidir que la relevancia no es la métrica de éxito.
  Sigue siendo útil (nos dice qué ingredientes son ambiguos y por tanto **dónde
  vale la pena preguntar**), pero no bloquea nada. Se corre cuando se pueda.
- *¿Ciclo 5 y 6 juntos?* **No.** Engineering y QA coinciden: corregir sin memoria
  es demostrable en horas y ya enseña qué corrige la gente. Juntarlos nos haría
  diseñar el modelo de preferencias antes de ver una sola corrección real.

---

## ⏸ Decisiones que solo la PO puede tomar

1. ~~¿Abrimos el ciclo 5?~~ ✅ Aprobado y cerrado.
2. ~~¿Dónde vive el perfil?~~ ✅ localStorage, sin autenticación, con el diseño
   desacoplado del almacenamiento. **Queda abierto el *cuándo* migrar a backend:**
   el disparador natural es que una familia real pida usarlo desde el celular
   *y* la laptop.
3. **¿Cuándo y con qué familia** hacemos la prueba de los dos domingos (Growth)?
   Es lo único que puede falsar H4, y ahora ya hay algo real que probar.
4. ~~¿Abrimos el ciclo 6 o la prueba con usuario primero?~~ ✅ **Investigación
   primero.** Roadmap congelado hasta tener listas reales.
5. **Tras la investigación: ¿el ciclo 6 sigue siendo "Escuchar" o pasa a ser
   "Importar"?** Son el mismo trabajo de parseo sobre evidencias distintas; decide
   cuál domina en las entrevistas, no la preferencia de diseño.
6. ~~¿Seguimos investigando antes de construir?~~ ✅ **No.** Cambio de método
   (2026-08-01): se investiga diseñando y probando. Ver §H-D.
7. ~~¿Eliminamos el momento de "hacer la compra"?~~ ✅ **No.** Se separa escribir
   de comprar, pero comprar sigue siendo un acto identificable (HD-10).
8. ~~¿La libreta pasa a ser el corazón del producto?~~ ✅ **Todavía no.** Se permite
   vivir así, no se obliga (HD-3). La arquitectura no se compromete.
9. **¿La libreta es de una persona o de una casa?** Aplazada a conciencia: primero
   la experiencia, luego el modelo colaborativo.
10. **¿Los tres conceptos (A/B/C) van a prototipo o matamos alguno?** Y: ¿se prueban
    con la misma familia (contraste) o con familias distintas (reacción limpia)?
11. ~~¿Desaparece la pantalla de inicio con las tres formas de empezar?~~ ✅ **Sí,
    para el prototipo.** La libreta es el Home. El primer contacto es la compra.
12. ~~¿"Una sola boca" o "una sola intención"?~~ ✅ **Una sola intención.** La
    filosofía obliga a no clasificar la evidencia; no obliga a un único gesto.

---

## 🏗 §A · La aplicación real — ARQ-3 implementada (2026-08-02)

> **Cambio de modo de la PO (2026-08-02):** se acabaron los sprints de
> exploración. *"Construir la mejor versión que podamos probar, no la mejor que
> podamos imaginar."* Ante dos soluciones razonables que no rompen ningún
> principio, se elige una, se anota la hipótesis y se sigue. Lo que solo puede
> responder una familia **no bloquea**: se lleva a la entrevista.

### Decisiones tomadas y ya construidas (no se re-litigan; se falsan con familias)

| # | Decisión | Estado |
|---|---|---|
| 21 | **Barra inferior de tres lugares** — Libreta · Compra · Casa, por propósito y nunca por tipo de evidencia. Revierte el *"sin barra de pestañas"* de `design/app.html`. | ✅ construida |
| 22 | **Revisión sobrevive** como frontera antes de buscar precios. Cada línea dice de dónde vino. Se elimina si nadie la usa en 5 entrevistas. | ✅ construida |
| 23 | **La cuenta bajo *Compra*** existe, en lápiz, sin badge ni color. | ✅ construida |
| 24 | **El login vive en Confirmar**, no al abrir. La cuenta nace al pedir dirección y correo, que hacen falta igual. | ✅ construida (formulario; sin backend) |
| — | **Las cuatro puertas son gestos, no pestañas:** `escribe · pega · foto · menú` bajo el renglón. La familia nunca clasifica su evidencia. | ✅ construida |
| — | **La normalización pasa a ser por LÍNEA**, no por mensaje. Es lo que hace real *"cuatro puertas, un solo motor"*: en la misma libreta conviven una lista, un menú, una receta y lo leído de una captura. `comprarLibreta()` en `lib/cart.ts`. | ✅ construida |
| — | **La libreta se resuelve al comprar, no se vacía.** Lo comprado se va; lo demás sobrevive marcado `quedo` → *"quedó de la semana pasada"*. | ✅ construida |
| 9 | **¿Persona o casa?** Se asume **una libreta por dispositivo** para poder salir a entrevistar. No es la respuesta, es la versión probable. | ⏸ se decide con evidencia |

### 🐞 Defecto encontrado al integrar (y por qué importa)

`extraerNumeroMenu()` tomaba **el primer número del texto**. Con el chat era
tolerable —todo el mensaje era una intención—, pero con la libreta cada línea se
normaliza sola y las líneas traen cantidades constantemente: **"2 kg de pollo"
se convertía en el menú 2 y expandía la semana entera, en silencio.** Ahora exige
la palabra `menú`. Es exactamente la clase de fallo que ningún documento de
arquitectura habría encontrado y que la primera entrevista habría hecho
inservible.

### Mapa de archivos nuevos y tocados

| Archivo | Rol |
|---|---|
| `lib/libreta.ts` | **Nuevo.** Modelo puro: partir por cualquier separador, anotar, editar, quitar, deshacer un pegado, `resolverCompra()`. Cero React, cero almacenamiento. |
| `lib/perfil-store.ts` | `RepositorioLibreta` y `RepositorioCompras` junto a perfil e historial. Sigue siendo **la única pieza que sabe de almacenamiento**. |
| `lib/cart.ts` | `comprarLibreta()` — normaliza línea a línea y une; dedupe silencioso (repetir no es un error). Arreglado `extraerNumeroMenu()`. |
| `app/api/chat/route.ts` | Acepta `lineas` (entrada normal), y conserva `lista` y `mensaje`. |
| `app/page.tsx` | **Reescrito.** Las siete pantallas: Libreta · Revisión · Compra · Confirmar · Hecho · Casa · Boleta. Sistema visual aprobado, sin dependencias nuevas. |
| `app/layout.tsx` | Papel de fondo, tipografía redondeada, las dos únicas animaciones. |
| `app/RevisionCaptura.tsx` | **Huérfano:** la captura entra ahora directa a la libreta. Se borra cuando la PO confirme que no lo quiere de vuelta. |

### Verificado en el navegador (no en teoría)

Escribir · separadores mezclados (`"2 kg de pollo, arroz"` → dos líneas) ·
persistencia tras recargar · Hacer la compra → Revisión con el origen de cada
línea → Buscar precios → carrito · corregir un producto y que **el perfil
aprenda** (*"Leche es Laive"* aparece en Casa) · comprar · **la libreta queda con
lo no comprado y su *"quedó de la semana pasada"*** · Casa con lo aprendido y la
compra · boleta con la multiplicación conservada · Compra vacía explicando el
modelo mental. `tsc --noEmit` limpio.

### Lo que falta para una entrevista de verdad

1. **Decisión 17, sigue bloqueando:** qué pasa cuando el primer producto es el
   equivocado. Con `CATALOG_PROVIDER=fake` no se ve; con Wong real, `leche`
   devuelve chocolates. **Es el primer riesgo del guion, no un detalle.**
2. Confirmar no tiene backend: es un formulario que no manda nada.
3. El eco (C1) no está construido. Es lo que da razón para volver un martes.

### Qué observar en las cinco entrevistas

Si al abrir escribe o busca un menú · si usa algún gesto además de escribir
(**si nadie pega, fotografía ni carga menú, la fila de gestos es decoración**) ·
si entiende que hay tres lugares o solo ve la libreta · si vuelve entre semana
sin que se lo pidamos (**HD-16, la que decide el producto**) · si abandona en
Confirmar · y si al ver Casa dice que perdería algo al irse (H6).

---

## 🧊 §B · Producto congelado — listo para entrevistas (2026-08-02)

> **Las decisiones 21–24 quedan IMPLEMENTADAS, no cerradas.** Siguen así hasta
> que las entrevistas demuestren lo contrario. A partir de aquí: **no más cambios
> de UX, no más arquitectura, no más pantallas.** Toda mejora futura exige
> observaciones repetidas en usuarios reales, no discusiones de diseño.

Antes de congelar se hicieron exactamente tres cosas, y ninguna más.

### 1 · Decisión 17 — los fallos que rompen la confianza, sin sprint de ranking

No se tocó el ranking. Se **reordena el Top-6 que ya traíamos**, apoyándose en H7
(*el producto correcto suele estar entre los candidatos; el problema es cuál va
primero*). Tres reglas en `reordenarPorClase()` / `puntuarCandidato()`, en
`lib/cart.ts`, agnósticas del proveedor:

1. **La categoría que da la tienda manda.** Era la señal más fiable y la estábamos
   tirando: `mapear()` guardaba solo la hoja (*"Chocolates de Leche"*). Ahora
   `ProductoWong.categoriaRuta` conserva la ruta completa y un candidato
   clasificado en lo que se pidió va delante.
2. **Un utensilio nunca es el primero** cuando se pidió un alimento.
3. **Desempate:** si el nombre empieza por lo que pidió la familia, va delante.

**Nada se descarta ni se esconde:** todos los candidatos siguen ahí como
alternativas, que es de donde sale el aprendizaje. Solo cambia el orden.

Medido contra el catálogo **real** de Wong, 15 términos básicos: **6 mejoran, 0
empeoran.**

| Término | Antes | Ahora |
|---|---|---|
| `huevos` | Cortador de Huevos Bynd | **Huevos la Calera Pardos 14un** |
| `arroz` | Arroz Chaufa Cuisine & Co | **Arroz Extra Wong 750g** |
| `queso` | Pack Doritos Queso Atrevido | **Queso Mozzarella Laive 250g** |
| `yogurt` | Envase para Yogurt Lock & Lock | **Yogurt Natural Ecologic 1L** |
| `tomate` | Puré de Tomate Gourmet | **Tomate Italiano x kg** |
| `fideos` | Salsa de Ají El Charrúa | **Fideos de Arroz Bárcidda** |

**Iteración intermedia descartada:** una primera versión sin categoría arreglaba
`huevos`, `queso` y `yogurt` pero **rompía `pollo`** (*Muslo de Pollo* →
*Pollo Rostizado*). Con la categoría, la regresión desaparece. La regla de la
tienda vale más que cualquier heurística nuestra.

### ⚠️ Lo que este arreglo NO puede arreglar, y hay que llevar a la entrevista

`leche` y `azúcar` **siguen mal, y no es reordenable: el producto correcto no
está en el Top-6.** Wong devuelve seis chocolates para `leche` y cuatro bebidas
sin azúcar para `azúcar`. Reordenar no puede inventar un candidato que no vino.

**Pero el fallo desaparece en cuanto la familia añade una palabra:**

| Consulta | Resultado |
|---|---|
| `leche` | Chocolate-con-Leche 29g ❌ |
| `leche gloria` | **Leche Gloria Niños Lata 390g** ✅ |
| `azúcar` | Bebida de Almendra Sin Azúcar ❌ |
| `azúcar rubia` | **Azúcar Rubia Paramonga 1kg** ✅ |

Esto es **exactamente el ciclo 6 (Escuchar)** visto desde el otro lado, y ahora
es una pregunta de entrevista en vez de una discusión: *¿cuánta gente escribe
`leche` a secas y cuánta escribe `leche gloria`?* Si casi nadie escribe genérico,
el problema es menor de lo que temíamos. **No se construye nada hasta saberlo.**

### 2 · Netlify usa el catálogo real — por construcción, no por memoria

El defecto de `CATALOG_PROVIDER` pasa de `fake` a **`wong`** (`lib/wong.ts`).
Antes, que producción usara datos reales dependía de que alguien recordara poner
una variable en el panel de Netlify — y no había `netlify.toml` ni forma de
verificarlo desde el repositorio. Ahora es verdad por defecto y usar el catálogo
ficticio exige pedirlo a propósito.

Es seguro porque **la degradación elegante ya existía**: si Wong falla, se cae a
FakeWong solo. Equivocarse hacia datos reales no cuesta nada; equivocarse hacia
datos ficticios era enseñarle precios inventados a una familia sin que nadie se
diera cuenta.

Añadido `netlify.toml` (config-as-code) con una advertencia escrita: las
variables de `[build.environment]` llegan al build y **no necesariamente a las
funciones en ejecución** — por eso la garantía real es el defecto en código, no
el archivo. La clave de Anthropic sigue solo en el panel, como secreto.

**Verificado end-to-end contra Wong real:** 6/6 productos correctos, proveedor
`wong`, sin una sola degradación, y `tomate` queda **pendiente de cantidad** en
vez de inventar un monto.

### 3 · Código muerto

`app/RevisionCaptura.tsx` eliminado (cero referencias en el repositorio; la
captura entra ahora directa a la libreta). `playwright` sigue en `package.json`
como deuda conocida, y **no se toca**: quitarlo no aporta nada a las entrevistas.

### Estado del congelado

`tsc --noEmit` limpio · sin errores de consola · flujo completo verificado en el
navegador con Wong real: escribir → Hacer la compra → revisión → precios →
carrito honesto → comprar → la libreta se resuelve.

**Lo único que sigue sin backend es Confirmar:** es un formulario que no manda
nada. Para las entrevistas sirve; para cobrar, no. Es deuda declarada, no olvido.

---

## 🔗 §C · Integración del Home en la aplicación real (2026-08-02)

Sprint de integración, no de producto. Cero funcionalidades nuevas, cero
hipótesis nuevas, cero rediseño. Solo conectar el Home con estado que **ya
existía** y borrar duplicación.

### Integrado

| Qué | De dónde sale el dato |
|---|---|
| **Las cuatro puertas, siempre visibles** | — (arreglo de capacidad, ver abajo) |
| **El labio: "tu compra está a medias · seguir donde la dejaste"** | `items !== null` — un carrito construido y no comprado |
| **El labio: "la última compra fue hoy / hace dos semanas"** | `compras[0].ts` vía `cuando()` |
| **"todo comprado 🎉 por ahora"** | `libreta` vacía **y** `compras.length > 0` |
| **"lo que se te acabó"** | `primeraVez`: sin líneas, sin compras y sin perfil |
| **`Fila`** — una sola fila para revisión, perfil, compras y boleta | sustituye cuatro bloques de estilos casi iguales |

### 🐞 Capacidad perdida que la integración destapó

`Puertas` se renderizaba solo con la libreta vacía (*"enseñan el gesto y se
van"*). Consecuencia real: **en cuanto había una línea escrita, `foto` y `menú`
quedaban inalcanzables** — dos de las cuatro puertas del producto, muertas
después del primer uso. No era una decisión de estilo, era una funcionalidad que
desaparecía. Ahora están siempre, en lápiz y sin navegar a ningún sitio.

### Simplificado a propósito

- **El labio no cuenta cuántas cosas hay anotadas.** El diseño de
  `design/pantallas.html` ya lo había quitado: *un número que sube es lo más
  parecido a una evaluación*. Dice el estado de la casa o calla.
- **El eco (C1) no se implementó.** Requiere frecuencia de compra, que no existe
  (dimensión 5, declarada sin lógica). Fingirlo sería inventar datos. Queda un
  comentario en su sitio exacto de `app/page.tsx`.
- **Ninguna barra de pestañas.** La navegación vigente es la de la aplicación:
  Compra cuelga de la libreta, Casa detrás del monograma.

### Backlog (encontrado integrando · NO implementado)

1. **El carrito no se persiste.** Recargar a media compra pierde las
   correcciones; la libreta sí sobrevive. Roza *"el trabajo del usuario no se
   pierde jamás"*. Es el único hueco serio que queda.
2. `design/prototipo-app.html` enseña una barra de pestañas que el producto ya no
   tiene: como artefacto de diseño, hoy contradice la implementación.
3. `/api/data` escribe al filesystem: no sobrevive un deploy serverless.
4. `playwright` sigue en `package.json`.

### Auditoría de cierre

`npm run build` limpio (9 rutas) · `tsc --noEmit` limpio · sin componentes
huérfanos en `app/ui/` · sin estilos de fila sueltos en `app/page.tsx` · flujo
completo verificado contra Wong real con los cuatro estados del Home: día 1 ·
con líneas · compra a medias · después de comprar.

---

## 🧷 Encabezados de mensaje: contexto, no productos (2026-08-03)

Último arreglo antes de las entrevistas. Un solo bug, elegido porque no es de
precisión sino de credibilidad.

**El fallo.** Un WhatsApp real casi nunca empieza por un producto: empieza por a
quién va dirigido («Mami») y por lo que se pide hacer («compra…», «lista del
mercado»). Cada una de esas líneas viajaba al buscador como si fuera comida, y
«Mami» volvía convertido en *Pizza Don Mamino*. Basta una para que la familia
deje de creer que el producto entiende su mensaje.

**La solución, deliberadamente pequeña.** `sinEncabezado()` en `lib/libreta.ts`:
una lista cerrada de palabras que solo se quitan **al principio** de la línea y
solo mientras se encadenen; en cuanto aparece cualquier otra cosa se para. No es
un motor, no aprende y no toca el normalizador. Tres consecuencias:

- `aPedidos()` no manda las líneas que son solo encabezado.
- `terminoDeBusqueda()` busca «2 kg de pollo», no «mami compra 2 kg de pollo».
- «Antes de comprar» solo enumera lo que de verdad se va a buscar. Prometer que
  buscamos «Mami» y no hacerlo sería peor que el bug.

**Lo que NO cambia:** la línea sigue escrita, literal, en la libreta. No se
borra, no se corrige y no se le reprocha haber quedado pendiente al comprar.
*Nunca ajustamos un dato del usuario en silencio.*

**Fuera de la lista a propósito: «papa» y «papi».** En Perú *papa* es un producto
semanal; confundirlo con un vocativo sería mucho peor que el fallo que estamos
arreglando.

Verificado: 16 casos en `sinEncabezado` (incluidos «papa», «papa amarilla» y
«una piña», que deben sobrevivir intactos) y el flujo completo contra Wong real
— pegar el mensaje de cinco líneas deja cinco líneas escritas, tres cosas por
buscar y S/ 29.90 de tres productos correctos.

---

## 🚪 §D · La entrada al producto — rediseñada (2026-08-02)

> **Decisión de la PO, explícita:** *"En este caso el producto está por encima
> del diseño."* El Home reflejaba bien el estado interno pero no ayudaba a
> entender qué es SuperCarrito. Se rediseña la entrada.

### Tres principios de §4 quedan revertidos, a conciencia

| Antes (§4) | Ahora | Por qué |
|---|---|---|
| *Ninguna pantalla aparece antes de la libreta* | **Bienvenida con identidad** | Un folio en blanco no explica nada a quien llega de cero |
| *Sin bienvenida, sin títulos* | *"Te damos la bienvenida"* + *"Escribe aquí tu lista de compras"* | La primera pantalla decía **"Casa"**, que es el nombre de una pantalla, no el de un producto |
| *🚫 Sin barra de pestañas* | **Mi lista · Mi compra · Mi casa** | La compra colgaba de un pie y la casa de un monograma: dos capacidades que solo encontraba quien ya sabía que estaban |

Lo que **no** se tocó: lógica de negocio, Wong, extracción, normalización,
libreta, perfil, historial, carrito y montos explicables.

### Qué contesta el Home ahora, y con qué

| Pregunta | Respuesta en pantalla |
|---|---|
| ¿Qué es esta aplicación? | Logo + *"Apunta lo que falta en casa y nosotros lo convertimos en tu compra de Wong, con precios de hoy"* |
| ¿Qué puedo hacer aquí? | Cuatro botones con nombre: Pegar un mensaje · Subir una foto · Cargar un menú · Seguir escribiendo |
| ¿Qué pasó desde la última vez? | `Resumen`, del estado real: compra a medias · cuándo compraste · qué quedó sin comprar |
| ¿Cuál es el siguiente paso? | Un solo botón: *Hacer la compra*, o *Seguir mi compra* si quedó a medias |

### Piezas nuevas

`lib/casa.ts` (identidad: un nombre, sin contraseñas ni correo) ·
`RepositorioCasa` · `Bienvenida` · `Logo` · `Cabecera` · `Navegacion` ·
`Resumen` · `Acciones`. Eliminado `Puertas`, que `Acciones` sustituye.

### ⚠️ Nota operativa para las entrevistas

**Dos veces** el servidor de desarrollo quedó sirviendo *chunks* en 404 tras un
error de compilación transitorio: la página se renderiza pero **no responde al
teclado**. Si pasa en una entrevista: `rm -rf .next` y reiniciar. No es un fallo
del producto y no aparece en el build de producción.

### Backlog (no implementado)

Cambiar el nombre de la casa desde *Mi casa* · el carrito sigue sin persistirse ·
`design/*.html` describen un Home anterior a esta entrada.

---

## 🛒 §E · La salida del producto — entregar la compra a Wong (2026-08-03)

Origen: **la PO usó el producto como usuaria** y encontró dos cosas. La primera,
un fallo: la cantidad solo se podía editar en lo que se vende al peso. La
segunda, estructural: *el recorrido terminaba antes de cumplir la promesa*.
Decía «Compraste 3 cosas» cuando en realidad no se había comprado nada.

### El North Star, en una frase de la PO

> «En menos de dos minutos pasé de ideas sueltas a tener mi compra lista en Wong.»

No somos una app de listas: somos un **acelerador de la compra semanal**. El
final del recorrido no está en nuestra pantalla, está en el carrito de Wong.

### Investigación de integración con Wong (hecha contra el Wong real, no en docs)

| Mecanismo | Resultado |
|---|---|
| **Deep link `/checkout/cart/add?sku&qty&seller`** | ✅ **Vivo.** 302 → `/checkout/#/cart`. `sku`/`qty`/`seller` se repiten por producto. **Elegido.** |
| API pública de Checkout (orderForm) desde servidor | ❌ Crear carrito: 200. Añadir ítems: **401**. Y la cookie de propiedad (`CheckoutOrderFormOwnership`, HttpOnly + SameSite=Strict) impide traspasar el carrito al navegador de la familia. Vía muerta por diseño. |
| APIs de administración VTEX | 🔒 Exigen `appKey`/`appToken` emitidos por Wong: acuerdo comercial, no técnico. |
| App móvil / «Mis listas» | ❌ Sin deep links públicos; las listas exigen login y no tienen API. |
| Automatizar el checkout | 🚫 Línea roja: rompe «API antes que scraping» y tocaría las credenciales de la familia. |

### ⚠️ Hallazgo que sigue abierto: el catálogo depende de la zona

- `sc=1` no existe para la cuenta `wongio`; `sc=2` es un catálogo distinto y
  reducido; `sc=3..20` no están disponibles. La búsqueda **sin `sc`** es la que
  devuelve el catálogo real de supermercado con precios correctos.
- El carrito rechaza los SKU de esa búsqueda: *«Seller no autorizado 1 con la
  política comercial N»* / *«ítem no encontrado o no disponible»*.
- En el propio wong.pe, pulsar AGREGAR **sin haber elegido tienda no añade
  nada**, y Wong asigna la tienda **pidiendo el correo**:
  *«Para asignarte una tienda, por favor ingresa tu mail»*.

**Consecuencia:** la zona→catálogo **no es resoluble desde nuestro servidor**.
Wong solo la resuelve dentro de una sesión identificada. Por eso el enlace **no
envía `sc`**: se abre en el navegador de la familia y hereda SU sesión —su
tienda, su zona, su login—, que es el único contexto correcto que existe.

**Y por eso NO se implementó la pregunta de zona** que la PO había pedido para
el momento de la entrega: hoy no podríamos usar la respuesta para nada
—ni precios, ni disponibilidad, ni el enlace— y Wong volvería a preguntar lo
mismo del otro lado. Preguntar algo que no podemos usar es exactamente lo que
el producto no hace. Queda como decisión abierta para la PO.

### Lo que se construyó

1. **Cantidad editable en TODO lo que se puede comprar.** `cantidadDe` ya no
   devuelve `1` fijo para lo envasado: `1` pasa a ser el valor por defecto más
   honesto, y la línea trae un contador `− n +` con los pasos reales de la
   tienda. El número central abre la hoja para escribir cualquier otra cantidad.
2. **`lib/entrega.ts`** — contrato `EntregaEnTienda` + `wongDeepLink`. El
   producto no conoce a Wong.
3. **Pantalla «Llevar a Wong»**, que sustituye al checkout falso (dirección,
   fecha, correo) y al «Compraste N cosas». Enseña **antes de saltar**: qué
   cruza, qué no y por qué, y los redondeos.
4. **Redondeo siempre hacia ARRIBA** con su monto recalculado. Quedarse corto no
   se arregla en la cocina; y el total de la entrega es el que Wong va a cobrar,
   no el del carrito (500 g de trucha que se vende de 400 en 400 son 800 g y
   S/ 27.12, no S/ 16.95). **Encontrado en QA de esta misma implementación.**
5. **El historial guarda lo que cruzó**, no lo que se pidió. El hecho es la
   entrega.
6. `Preferencia.unidadHabitual` — el perfil ya no guarda «0.5» sin mundo: ahora
   se lee «Trucha, 500 g de siempre» y un hábito aprendido en kg no se aplica a
   un producto que se vende por unidad.

### Verificado en el navegador (extremo a extremo)

Libreta → carrito → contador (3 × S/ 4.50 = S/ 13.50; `−` en 1 no baja a 0) →
trucha 500 g → entrega: enlace
`…/cart/add?sku=4155&qty=2&seller=1&sku=39343578&qty=1&seller=1`, total
S/ 31.62, ajuste «pediste 500 g · van 800 g» → «Tu compra está en Wong» →
historial S/ 31.62 y «Trucha, 500 g de siempre».

### ⏸ Lo único que falta para cerrar el ciclo: una prueba humana de 5 minutos

**No se pudo verificar que los productos aterricen de verdad en el carrito de
una familia**, porque para probarlo hace falta una sesión de Wong identificada
(correo + aceptar términos), y eso no lo hace el equipo por nadie. El enlace
responde 302 y es el mecanismo documentado de VTEX, pero eso no es prueba.

**Experimento pendiente (la PO, con su cuenta real de Wong):** abrir un enlace
generado por el producto y mirar el carrito. Responde de una vez si toda la
estrategia de salida se sostiene. Es más barato que cualquier cosa que podamos
construir encima.

### Métrica del North Star, ya medible

**Segundos desde la primera tecla hasta el carrito lleno en Wong** ·
**% de productos que sobreviven el salto** (`viajan` / anotados).

---

## F. Sprint 0 — Estabilización (2026-08-03)

Objetivo: NO mejorar el producto, sino dejar una base limpia después de integrar
el trabajo de dos sesiones en paralelo (rediseño visual + salida a Wong).

### Estado de la base

| Comprobación | Resultado |
|---|---|
| `npm run build` | ✅ exit 0 · compila, 9 páginas estáticas, `/` 16.2 kB (122 kB First Load) |
| `npx tsc --noEmit` | ✅ exit 0 · sin errores |
| `tsc --noUnusedLocals --noUnusedParameters` | ✅ sin imports ni variables sin usar |
| Consola del navegador | ✅ sin errores en todo el recorrido |
| Logs del servidor | ✅ sin errores |
| Netlify | ✅ `netlify.toml` correcto (plugin-nextjs, `CATALOG_PROVIDER=wong`); `.gitignore` protege `.env*`, `.next/`, `*.tsbuildinfo` y las capturas reales |

**La integración de las dos sesiones no dejó ningún error de compilación ni de
tipos.** Es el resultado de que las dos trabajaran contra contratos (`sistema.ts`,
`EntregaEnTienda`, `perfil-store`) y no contra las tripas de la otra.

### Lo único que se corrigió

- **`app/ui/Campo.tsx`: componente huérfano, eliminado.** Su único consumidor era
  la pantalla `confirmar` (dirección/fecha/correo) que se borró al reemplazar el
  checkout falso por la entrega a Wong. Además era no controlado (`defaultValue`,
  sin `onChange`): no podía transportar dato alguno. Su CSS `.sc-campo` SÍ sigue
  viva (Libreta, Bienvenida, HojaCantidad, /editar) y se conserva.

Nada más: no había imports muertos, ni rutas inalcanzables (`libreta`, `revision`,
`compra`, `entregar`, `entregado`, `casa`, `boleta` se alcanzan todas), ni estados
imposibles detectables.

### Recorrido completo verificado a mano

Perfil limpio (`localStorage.clear()`) → bienvenida → «los Torres» → home →
escribir «leche» → pegar un WhatsApp de 5 líneas → revisión (se pueden quitar) →
carrito con precios reales de Wong → **subir cantidad de arroz a 2** (el paso se
propaga al enlace: `sku=530&qty=2`) → **bajar el chocolate: se queda en 1, no
baja a 0** → «Dejarlo anotado» devuelve la línea a la libreta → entrega («5
productos», S/ 775.70, «esto no cruza») → enlace de 5 SKUs → «Tu compra está en
Wong» → la libreta conserva solo lo que no cruzó → perfil («2 de siempre») →
historial (S/ 775.70) → boleta (suma exacta). Menú semanal: se anota. Importar
captura con una imagen ilegible: **degrada bien** («No pude leerla»), sin
excepción ni error en consola.

### 🗒 Backlog — encontrado durante la revisión, NO implementado

1. ⚠️ **El ruido de un WhatsApp se convierte en compra cara.** `«gracias!»` →
   *Cama El Cisne Munay + Sofá Cama, S/ 659.00*; `«2/8/2026] Mamá: compra por
   favor»` → *Rompecabeza Disney*. `esContexto()` existe pero no filtra en la
   revisión. Es el fallo más caro del producto hoy: el matcher siempre devuelve
   algo, y «algo» a veces son S/ 659. **Prioridad alta.**
2. **`«leche»` empareja con `Chocolate-con-Leche-Triangulo-29g`.** El matcher
   premia la subcadena sobre el sustantivo principal.
3. **La clave del ingrediente es la línea cruda.** El perfil aprendió «2 kg de
   arroz» como ingrediente, así que la lección no se reutiliza si la próxima vez
   escribe «arroz».
4. **«2 de siempre» para unidades** debería decir «2 paquetes» o similar.
5. **Partir por comas rompe las horas:** `«[10:03, 2/8/2026]»` se parte en dos.
6. **`playwright` está en `dependencies` y no lo usa ningún archivo del código.**
   Engorda el build de Netlify sin motivo.
7. **`/api/data` escribe en el filesystem** (ya documentado): en Netlify no
   persiste. `/editar` solo sirve en local.


---

## G. Separar la compra de la conversación (2026-08-03)

**Origen:** el fallo nº 1 del backlog del Sprint 0. Pegar un WhatsApp normal y
que `«gracias!»` volviera convertido en *Cama El Cisne Munay + Sofá Cama,
S/ 659.00*. No es un fallo de precisión: es el momento en que la familia deja de
creer que el producto entiende lo que le escribe.

**El objetivo NO era mejorar el matching.** Era dejar de preguntarle al buscador
por cosas que no son compras. Un buscador siempre devuelve algo; la culpa era de
la pregunta, no de la respuesta.

### La decisión de diseño: tres naturalezas, no dos

Hasta hoy toda línea era **producto** o **encabezado**, y lo que no encajaba en
encabezado se iba al buscador **por descarte**. Ese «por descarte» era el fallo.

| Naturaleza | Qué pasa |
|---|---|
| `compra` | se busca |
| `contexto` | no se busca, se enseña con su motivo, y **no se le reprocha** haber quedado pendiente |
| `duda` | **no se busca sin preguntar antes** |

La pieza que faltaba era el «no sé». Ante el empate, gana no buscar: una línea
que no encontramos deja a la familia donde estaba; una línea inventada de S/ 659
le enseña que no la entendemos.

### Cómo, sin abrir un motor de NLP

`lib/contexto.ts` — una lista cerrada de palabras y un puñado de formas
reconocibles, en el mismo sitio que el normalizador que ya existía
(`sinEncabezado`, que se movió aquí; `lib/libreta.ts` lo re-exporta). Cuando la
regla se equivoque, se ve por qué.

- **Formas imposibles de comprar** → contexto: hora (`[10:03`), fecha
  (`2/8/2026]…`), enlace, correo, teléfono, solo emojis.
- **Fórmulas de conversación** (lista cerrada, solo si son la línea entera):
  gracias, ok, listo, dale, besos, buenas noches, jaja…
- **Sospechas** → duda: termina en `?`, o más de 6 palabras sin una sola cifra.

Detalles que importan:
- La fecha exige **tres** grupos, para que `1/2 kg de queso` siga siendo queso.
- La cortesía se juzga **sin encabezado**: «porfa gracias» es tan poco producto
  como «gracias».
- «gracias» dentro de una línea larga no descarta nada: solo cuenta la línea
  entera.

### La salida abierta (§ «toda pregunta cerrada tiene salida abierta»)

Lo que no se busca **no desaparece en silencio** —eso sería indistinguible de
perder el trabajo de la familia—. La pantalla de revisión, que ya existía, gana
un bloque **«ESTO NO PARECE COMPRA»** con el motivo de cada línea y un botón
**«Sí es compra»**. Ese veredicto se guarda en la línea (`esCompra`) y **manda
sobre cualquier regla**, para siempre: una regla es una sospecha, `esCompra` es
un hecho. Cero pantallas nuevas.

### Verificado (perfil vacío, catálogo real de Wong)

Pegado un WhatsApp con 10 líneas: 3 compras, 1 pregunta, 6 ruidos.

- **Al buscador van 3.** Antes iban 10.
- Los 7 restantes se enseñan con su motivo: *«es la hora del mensaje»*, *«es la
  fecha del mensaje»*, *«es una fórmula de conversación»*, *«es un número de
  teléfono»*, *«no dice nada que se pueda comprar»*, *«parece una frase, no un
  producto»*.
- **«¿compramos pollo?» → «Sí es compra»** la mueve arriba y la busca: *Filete de
  Pechuga de Pollo x kg*, pendiente de cantidad.
- **Carrito: S/ 65.60.** Antes, con el mismo mensaje: **S/ 775.70**, de los
  cuales S/ 659.00 eran un sofá cama que nadie pidió.
- Tras comprar, solo «¿compramos pollo?» lleva *«quedó de la semana pasada»*. Las
  7 líneas de conversación se quedan calladas: nunca prometimos buscarlas.

`npm run build` exit 0 · `tsc --noEmit` exit 0 · sin imports ni variables sin
usar · consola limpia.

### Lo que sigue sin resolverse (backlog)

- `«leche»` sigue emparejando con `Chocolate-con-Leche-Triangulo-29g`. Eso es
  matching, y este sprint no lo tocó a propósito.
- La clave del ingrediente sigue siendo la línea cruda («2 kg de arroz»).
- El `esCompra` de una línea **no se aprende entre compras**: si la próxima
  semana vuelve a escribir la misma frase, se le vuelve a preguntar. Llevarlo al
  perfil es una decisión de producto, no un descuido.


---

## H · Sprint «La última milla» — investigación de arquitectura (2026-08-03)

Encargo: explorar todas las arquitecturas posibles para que una compra preparada
en SuperCarrito continúe en el supermercado. Sin implementar nada.

### El resultado no fue una arquitectura nueva: fue que la premisa era falsa

**El handoff sí funciona. Nos habíamos equivocado de canal de venta.** wong.pe
opera en el canal `70` —público en `GET /api/segments`—, no en el 1 ni en el 2,
los dos únicos que habíamos probado.

Verificado hoy leyendo el carrito, que es la única prueba que vale:

- `/checkout/cart/add?…&sc=70` → carrito real lleno.
- 35 productos en un enlace de 1 010 caracteres → entran los 35 (S/ 1 079.57).
- Al peso: trucha `unitMultiplier` 0.4 con `qty=3` → 1,2 kg, S/ 37.08. El
  redondeo hacia arriba de `unidadesDeVenta` era exacto.
- Repetir el enlace **no duplica**: fija la cantidad.
- La API de checkout acepta escrituras con `sc=70` **también desde un servidor**,
  y un carrito armado ahí se adopta en el navegador con `?orderFormId=…`.
- `lib/wongvtex.ts` busca sin `sc`, y ese defecto **es** el canal 70: los SKUs
  guardados ya son válidos donde se puede escribir.

### Arquitectura recomendada

**Entregar con el enlace. Verificar con el servidor. Degradar a «abrir cada
producto». Pedir el acuerdo con Wong sin depender de él.**

La verificación es la parte importante: antes de enseñar el enlace, armar ese
mismo carrito en uno desechable y **leerlo**. Convierte en arquitectura la
lección que costó dos sprints: nunca prometemos una entrega que no acabamos de
comprobar. Y da precios de checkout, no de catálogo.

La **extensión de navegador** —la opción que más interesaba a la PO— se estudió
en serio y se descartó por una razón que no admite discusión: **no hay
extensiones en móvil** (Chrome Android no las soporta, Kiwi cerró en 2025) y la
compra se hace en el móvil. Queda en la recámara: es la única carta que no
depende de que nadie nos autorice, si Wong cerrara el canal 70.

Descartadas: Playwright remoto (exige custodiar la sesión de la familia, línea
roja), Playwright local y app de escritorio (distribución imposible para
familias), bookmarklet y userscript (gesto de programador), PWA (no resuelve
este problema; buena por otras razones).

Documento: `design/arquitecturas-ultima-milla.md`.
`design/integracion-wong-investigacion.md` queda corregido en su conclusión.

### Pendiente de verificar con la cuenta real

1. **Móvil con `sc=70`** — la prueba que falló se hizo con `sc=2`, así que no
   prueba nada. Decide la arquitectura.
2. Con sesión iniciada (lo verificado es anónimo).
3. Con tienda/zona asignada (se midió con `regionId: null`).
4. Un producto agotado dentro del enlace: ¿entra el resto o falla todo?

### Deuda que deja este sprint

`lib/entrega.ts` conserva un comentario de cabecera que hoy es falso («EL ENLACE
DE CARRITO NO FUNCIONA») y devuelve `url: null`. No se tocó porque el sprint era
de investigación. Es una trampa para quien lea el código.
