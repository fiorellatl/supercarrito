# PROJECT_STATE — SuperCarrito

> Memoria permanente del proyecto. Se actualiza al cerrar cada ciclo.
> Última actualización: 2026-08-01 — ciclo de importación por captura cerrado:
> montos explicables, pasada de UX, benchmark de modelo/estrategia (Sonnet 5 +
> `completar`), pipeline de búsqueda con matiz, `DEBUG_MATCHING` para
> investigación. **Listo para pruebas con usuarios.** Próximo: sprint de
> Momento Cero (Product + UX), sin código todavía.

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

> ⏸ **Roadmap congelado a la espera de investigación (2026-07-26).** La PO abrió
> una investigación de producto —*¿cómo expresa una familia su compra semanal?*—
> antes de abrir el ciclo 6. El objetivo ya no es validar el motor de selección,
> sino **observar listas reales antes de diseñar el parser**. Mientras tanto:
> **ningún cambio de arquitectura.** El producto ya tiene nivel suficiente para
> enseñarlo. El insight I-1 (§3) podría reordenar lo de abajo; todavía no lo hace.

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
