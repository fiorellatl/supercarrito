# 🏛 Sprint — Arquitectura del producto

> **Propuesta de arquitectura. Nada es decisión hasta que la PO lo apruebe.**
> Fecha: 2026-08-02 · Sucede a `arquitectura.html` y `app.html`, y **revierte una
> de sus decisiones** (§4 de este documento, argumentada).
> No se re-litiga: la libreta como Home, la frontera escribir/comprar, el sistema
> visual, los montos explicables, las cuatro puertas.

---

## 0. El diagnóstico, y una tensión que hay que resolver antes de dibujar

La PO tiene razón: **nos desviamos.** Y el desvío tiene un nombre exacto.

Durante tres sprints resolvimos **un** problema muy bien —*cómo se siente escribir
en la libreta*— y fuimos cargando sobre esa misma pantalla **un segundo problema
que nunca resolvió**: *qué puede hacer aquí una familia*. Hoy la libreta es a la
vez el lienzo, el menú, la puerta al carrito, la puerta al historial y la puerta
al perfil. **Una superficie diseñada para no exigir nada acabó siendo la única
que lo sostiene todo.**

### La tensión que hay que nombrar

Existe una decisión consolidada en §4 que parece chocar con este encargo:

> *«La familia nunca clasifica su evidencia antes de entregárnosla: **no hay
> pestañas de Lista / Menú / Recetas / Imagen**.»*

Y la PO pide: *«no quiero esconder las cuatro puertas»* y *«si una convención
conocida mejora la comprensión, úsala»*.

**No se contradicen, y la distinción es la clave de todo el sprint:**

> El principio prohíbe **pestañas de tipo de evidencia** —obligar a declarar
> *"esto es una receta"* antes de pegarla—. No prohíbe **navegación**.
> Y hacer visibles las cuatro puertas **no exige convertirlas en destinos.**

De ahí sale la tesis del sprint:

> ### Hay dos problemas distintos y hoy intentamos resolver ambos con una sola pantalla. Por eso ninguno queda resuelto.
>
> | Problema | Naturaleza | Mecanismo correcto |
> |---|---|---|
> | *¿Dónde están las cosas?* (compra, historial, perfil) | **Lugares** | **Navegación** — una barra, convención conocida |
> | *¿Qué puedo meter aquí?* (lista, menú, receta, captura) | **Gestos sobre un lienzo** | **Una fila de gestos** dentro de la libreta, nunca pestañas |
>
> **Tres lugares. Cuatro gestos. Cero clasificación.**

De las seis cosas que la PO quiere que la mamá entienda al abrir, **cuatro son
entradas y dos son lugares**:

```
"agregar lo que falta"          → gesto   ┐
"pegar la compra de la semana"  → gesto   ├─ los cuatro viven en la libreta,
"cargar el menú"                → gesto   │  visibles bajo el renglón
"pegar una receta"              → gesto   ┘
"revisar mi compra"             → LUGAR   ┐  dos destinos reales,
"ver lo que falta en casa"      → LUGAR   ┘  hoy escondidos
```

---

## 1. Seis arquitecturas

Modelos de organización, no layouts.

### ARQ-1 · La libreta lo es todo *(el estado actual, `app.html`)*

Sin navegación. Todo cuelga de la libreta: el carrito hacia abajo, la casa detrás
de un monograma en la esquina, el historial dentro de la casa.

- **Entiende una persona nueva qué puede hacer:** ❌ **No.** Puede escribir, y ya.
  El monograma `MR` de la esquina no dice "aquí está tu historial y lo que sé de
  ti"; dice "cuenta de usuario", que es otra cosa.
- **Llega rápido quien vuelve a diario:** ✅ Sí, si lo que quiere es escribir.
- **La navegación ayuda o desaparece:** desaparece — y con ella, la mitad del producto.
- **Dónde está la innovación:** en la libreta. Pero **queda sepultada**, porque
  nadie descubre que hay más.
- **Su propia crítica ya lo dice** (`app.html`, punto 3): *«"La casa" mezcla dos
  cosas… si el perfil crece, esta pantalla se rompe antes que ninguna otra.»*
- **Veredicto:** ✂️ **Correcta como filosofía, insuficiente como arquitectura.**
  Es el punto de partida, no el destino.

### ARQ-2 · Home de acciones

Una rejilla de verbos al abrir: *escribir · pegar · menú · receta · repetir la
compra*. Se elige qué se quiere hacer y entonces se entra.

- **Entiende qué puede hacer:** ✅✅ **La mejor de todas.** Nadie tiene dudas.
- **Contradicciones:** dos, y ambas graves. Es **exactamente** la pantalla que la
  PO eliminó del prototipo (decisión 11: *"¿desaparece la pantalla de inicio con
  las tres formas de empezar?"* → **sí**). Y **obliga a clasificar la evidencia**
  antes de entregarla, que es la prohibición literal de §4.
- **Coste:** un peaje entre la familia y el renglón. Dos toques para escribir una
  palabra que se le acaba de ocurrir.
- **Veredicto:** ❌ **Descartada.** Pero **su intención se rescata entera**: el
  problema que ataca —*el producto no comunica lo que sabe hacer*— es real, y es
  el que este sprint tiene que resolver por otra vía.

### ARQ-3 · Tres lugares y una fila de gestos ⭐

Barra inferior de tres, por **propósito** y nunca por tipo de evidencia:

```
        Libreta              Compra                Casa
   lo que falta         lo que se compra      lo que sabemos
   (95 % del uso)       (1 vez por semana)    (1 vez al mes)
```

Y **dentro de la libreta**, bajo el renglón, una fila tenue de gestos:
`escribe · pega · foto · menú`. No son pestañas: no cambian de pantalla, solo
dicen qué acepta este lienzo.

- **Entiende una persona nueva qué puede hacer:** ✅ Sí. Tres palabras abajo le
  dicen que hay tres cosas; cuatro palabras en lápiz le dicen qué acepta la caja.
- **Llega rápido quien vuelve a diario:** ✅ Abre en Libreta con el cursor puesto.
  Cero toques hasta la primera letra.
- **La navegación ayuda o desaparece:** **ayuda, y es deliberadamente aburrida.**
  La innovación no está en cómo se navega.
- **Contradicciones con §4:** **ninguna.** Las pestañas son propósitos, no tipos
  de evidencia; la familia nunca declara qué está pegando.
- **Su coste, dicho sin adornos:** 56 px de cromo permanente bajo un producto
  cuya personalidad es *"esto es papel"*. Es real y se paga a cambio de que el
  producto deje de ser un secreto.
- **Veredicto:** ⭐ **Recomendada.** Ver §3.

### ARQ-4 · Dos modos: Escribir ⇄ Comprar

Un conmutador de dos estados que convierte la frontera de §4 en la arquitectura
entera. La casa y el historial cuelgan del modo Comprar.

- **Entiende qué puede hacer:** ⚠️ A medias. Comunica bien la frontera —que es lo
  más original del producto— y **esconde la memoria**, que es el activo.
- **Comportamiento:** un conmutador invita a alternar; comprar no es alternar, es
  cerrar. Y **le da a "comprar" la mitad de la pantalla permanentemente**, cuando
  ocurre una vez por semana: es el CTA que §4 prohíbe, disfrazado de navegación.
- **Veredicto:** ❌ **Descartada.** Convierte una frontera en un interruptor.

### ARQ-5 · Continuidad pura *(sin Home)*

No hay entrada fija: se restaura sección, scroll y línea a medio escribir.

- Ya evaluada y resuelta en `home-exploracion.md` (H-B) y en `arquitectura.html`
  (hipótesis C): **es una regla, no una arquitectura.** Restaurar dentro de la
  libreta es correcto; restaurar entre secciones deja a la familia en un carrito
  ya comprado o en un ajuste.
- **Veredicto:** ✂️ **Se adopta como regla con caducidad**, no como estructura.
  Ver principio 6 de §3.

### ARQ-6 · El buzón · la app como bandeja

El producto vive **fuera**: menú compartir, widget, teclado. La app es el sitio
donde aterriza lo que se mandó desde otro lado.

- **Entiende qué puede hacer:** ❌ No, porque casi nunca la abre.
- **Ventaja enorme y real:** la compra nace en WhatsApp y en la cocina, no en la app.
- **Contradicción:** ninguna. **Pero no es una arquitectura de aplicación: es un
  canal de entrada.** Sigue haciendo falta un sitio donde ver que llegó.
- **Veredicto:** ✅ **Complementaria a ARQ-3, no alternativa.** Ya está en el
  roadmap como F2 · el sobre.

---

## 2. Matriz comparativa

- **Nueva** — ¿una persona nueva entiende qué puede hacer, sin que se lo expliquen?
- **Diaria** — ¿quien vuelve todos los días llega rápido a lo que quiere?
- **4 puertas** — ¿las cuatro entradas quedan a la vista?
- **Descarga** — ¿libera a la libreta de sostener todo el producto?
- **Familiar** — ¿usa convenciones que ya conoce?
- **§4** — ¿respeta las decisiones consolidadas?
- **Escala** — ¿aguanta cuando el producto crezca (entrega, dos personas, gasto)?

| # | Arquitectura | Nueva | Diaria | 4 puertas | Descarga | Familiar | §4 | Escala | |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **ARQ-3** | **Tres lugares + fila de gestos** | ●●● | ●●●● | ●●●● | ●●●● | ●●●● | ●●●● | ●●●● | ⭐ |
| ARQ-1 | La libreta lo es todo | ●○○ | ●●●● | ●○○ | ●○○ | ●●○ | ●●●● | ●○○ | punto de partida |
| ARQ-2 | Home de acciones | ●●●● | ●○○ | ●●●● | ●●● | ●●●● | ●○○ | ●●○ | ❌ |
| ARQ-4 | Dos modos | ●●○ | ●●● | ●●○ | ●●○ | ●●○ | ●○○ | ●○○ | ❌ |
| ARQ-5 | Continuidad pura | ●○○ | ●●● | ●○○ | ●○○ | ●●○ | ●●○ | ●○○ | ✂️ regla |
| ARQ-6 | El buzón | ●○○ | ●●●● | ●●● | ●●●● | ●●● | ●●●● | ●●● | ✅ complemento |

**Lectura:** ARQ-2 gana en comprensión y pierde en todo lo demás; ARQ-1 gana en
uso diario y pierde en comprensión. **ARQ-3 es la única que no obliga a elegir
entre las dos madres del encargo.**

---

## 3. Recomendación: ARQ-3

> ### Tres lugares, cuatro gestos, cero clasificación.
> Una barra inferior de tres pestañas por propósito. Las cuatro puertas viven
> dentro de la libreta como gestos, no como destinos. La innovación se queda
> entera en el contenido; la navegación es deliberadamente aburrida.

### ⚠️ Esto revierte una decisión de `app.html`, y hay que decirlo

`app.html` decidió: *«Sin barra de pestañas: una barra inferior convierte una
libreta en una app.»* **Propongo revertirlo.** Los argumentos:

1. **No es una decisión de §4.** Es una elección de diseño de otro sprint, y la PO
   ha pedido explícitamente no romper convenciones por ser diferentes.
2. **La frase es verdad y ese es justo el punto.** Una libreta *sola* no es un
   producto que una familia use todos los días para gastar S/ 200. La barra no
   arruina la libreta: **le quita el peso que no le corresponde.**
3. **El coste real de no tenerla ya está medido en la crítica de `app.html`:** el
   historial y el perfil viven detrás de un monograma en una esquina, mezclados
   en una pantalla que su propio autor dice que *"se rompe antes que ninguna otra"*.
4. **La libreta no pierde ni un píxel de escritura.** La barra ocupa el lugar que
   hoy ocupa el labio, que desaparece (§4 de este documento).

### Los siete principios que gobiernan la arquitectura

1. **Tres lugares, y solo tres.** Libreta · Compra · Casa. Una cuarta pestaña es
   una decisión de la PO, nunca de diseño. *(El día que alguien quiera "Ofertas",
   este principio es lo único que lo impide.)*
2. **Las pestañas son propósitos, jamás tipos de evidencia.** Ninguna se llama
   Lista, Menú, Receta ni Imagen. La familia nunca clasifica lo que trae.
3. **Se abre siempre en Libreta, con el cursor puesto.** Ninguna otra pestaña
   puede ser el destino de arranque. Cero toques hasta la primera letra.
4. **Las cuatro puertas se enseñan como gestos, no como sitios.** Una fila tenue
   bajo el renglón: `escribe · pega · foto · menú`. No navegan: describen el lienzo.
5. **Ninguna pestaña grita.** Sin badges rojos, sin puntos, sin animación. La
   única señal permitida es un número en lápiz bajo *Compra*, y solo si hay algo.
6. **Continuidad con caducidad.** Se restaura scroll y borrador **dentro de la
   libreta**; nunca la pestaña. Pasadas ~6 h se abre en el renglón de hoy.
7. **La profundidad se gana con el tiempo, no se desbloquea.** Ninguna pantalla
   aparece por madurez del usuario: aparecen por **contenido**. Casa está desde el
   día 1 y el día 1 admite que no sabe nada.

### Dónde está realmente la innovación

**No está en la navegación, y es una decisión.** Está en cuatro sitios, todos de
contenido:

- el carrito que **no miente** (montos explicables, subtotal que solo sube al confirmar);
- el perfil escrito **en frases de casa**, no en tabla;
- lo agotado que **se muestra y no se sustituye** en silencio;
- y la libreta donde **escribir no tiene consecuencias**.

Una familia no debería tener que aprender una interfaz nueva para acceder a eso.

---

## 4. Mapa de navegación

```
                        ┌────────────────────────────┐
   (no hay pantalla)    │      abre la aplicación    │
        LOGIN ✗ ────────▶      cursor puesto         │
                        └──────────────┬─────────────┘
                                       ▼
   ╔═══════════════════════════════════════════════════════════════════╗
   ║   [ Libreta ]            [ Compra ]            [ Casa ]           ║  ← barra
   ╚═══════╤═══════════════════════╤═════════════════════╤═════════════╝
           │                       │                     │
     ┌─────▼──────┐        ┌───────▼────────┐    ┌───────▼─────────┐
     │  LIBRETA   │        │    COMPRA      │    │      CASA       │
     │ (Home)     │        │  vacía │ activa│    │  lo aprendido   │
     │            │        │        │ en    │    │  compras        │
     │ · renglón  │        │        │ camino│    │  gasto          │
     │ · gestos   │        └───┬────┴───────┘    └───┬───────┬─────┘
     │ · ecos     │            │                    │       │
     └─────┬──────┘            │              ┌─────▼──┐ ┌──▼──────┐
           │ "hacer la compra" │              │ BOLETA │ │ AJUSTES │
           ▼                   │              └────────┘ └─────────┘
     ┌───────────┐             │
     │ REVISIÓN  │  frontera   │
     └─────┬─────┘             │
           ▼                   │
     ┌───────────┐             │
     │  CARRITO  │◀────────────┘
     └─────┬─────┘
           │  hojas que suben y se cierran solas:
           │  · opciones de una línea (máx. 3 + salida abierta)
           │  · sustitución de un agotado
           │  · cantidad de un pesable
           ▼
     ┌───────────┐
     │ CONFIRMAR │ ← 🔑 AQUÍ y solo aquí: identidad, dirección, pago
     └─────┬─────┘
           ▼
     ┌───────────┐
     │  HECHO    │ ──▶ vuelve a Libreta (resuelta, no vaciada)
     └───────────┘
```

### El login: no es la primera pantalla, es la última del primer flujo de compra

**No hay login al abrir. Nunca.** Ni cuenta, ni correo, ni "continuar con Google",
ni permisos. El producto abre escribible con un perfil local.

La identidad se pide **exactamente una vez y en el único momento en que es
inevitable**: al confirmar la primera compra, donde de todos modos hacen falta
dirección y pago. Ahí la pregunta no es *"regístrate"* sino *"¿a dónde te lo
llevamos?"* — y la cuenta es una consecuencia de responderla, no un peaje previo.

**Por qué:** pedir una cuenta antes de demostrar valor es cobrar antes de servir.
Y es literalmente lo contrario de *"ninguna pantalla aparece antes de la libreta"*.

**Segundo momento, opcional y tardío:** cuando quiera su libreta en otro
dispositivo. Ese es el disparador que la decisión 2 de la PO dejó abierto.

### Qué vive en cada lugar

| Lugar | Vive aquí | **Nunca** aparece aquí |
|---|---|---|
| **Libreta** | Lo que falta en casa · el renglón con cursor · los gestos · los ecos en lápiz · lo pegado con su barra · las capturas con clip | Fotos de producto · precios por línea · fechas dentro del texto · contadores · progreso · publicidad |
| **Revisión** | Las líneas tal como se van a comprar, con su origen · quitar y corregir | Precios (aún no se han buscado) · nada que la libreta no dijera |
| **Carrito** | Foto en cada línea · la multiplicación visible · los seis estados · subtotal confirmado y pendientes aparte | Estimaciones · sustituciones automáticas · totales que incluyan lo no confirmado |
| **Casa** | Lo aprendido en frases · las compras anteriores · el gasto en tres cifras · quién escribe | Gráficas de banco · metas de ahorro · comparativas · rachas |
| **Boleta** | Cada línea con su multiplicación, meses después | Fotos — aquí ya no se elige, se consulta |
| **Ajustes** | Direcciones, pago, salir, ayuda | Cualquier cosa que decida cómo compra la familia |

### Qué está siempre disponible

La barra (las tres pestañas) · el renglón con el cursor, en la Libreta · volver,
siempre con el mismo gesto en la misma esquina · y **el trabajo de la familia**,
que sobrevive a todo: a recargar, a salir, a un error nuestro y a tres días.

### Qué aparece primero y qué aparece después

```
PRIMERO (al abrir, antes de cargar dato alguno)
  el renglón con el cursor · lo escrito hoy, nítido · la barra

DESPUÉS (cuando hay motivo, nunca de entrada)
  los ecos en lápiz · el número bajo Compra · lo pegado
  la franja de "tu pedido llega hoy" — una línea, se ignora, caduca

NUNCA
  saludo · logo · nombre de usuario · tour · ilustración de bienvenida
  badge rojo · "te falta" · barra de progreso
```

### Qué cambia con el tiempo

**La interfaz no cambia nunca. Cambia cuánto tiene dentro.** *(Es HD-21, de
`primera-experiencia.md`, y la arquitectura la respeta al pie de la letra.)*

| | Libreta | Compra | Casa |
|---|---|---|---|
| **Día 1** | vacía, con cuatro palabras tenues | vacía: *"aquí verás tu compra cuando la hagas"* | *"todavía no sé nada de ustedes"* |
| **Semana 2** | lo que quedó pendiente | la compra del domingo, consultable | 3 cosas aprendidas |
| **Mes 3** | ecos en lápiz: escribe la mitad | pedido en curso algunos días | 12 frases, gasto de 3 meses |
| **Mes 6** | casi se escribe sola | rutina | la memoria de la casa |

**Ninguna pestaña aparece o desaparece con la madurez.** Las tres están desde el
minuto cero, y dos de ellas admiten que están vacías. Admitir un vacío es más
honesto que esconder una sección hasta que "se la gane".

---

## 5. Wireframes de las pantallas principales

Baja fidelidad. Cada pantalla existe porque responde a una necesidad, y la
necesidad va escrita debajo.

### W1 · Libreta (Home) — día normal
```
┌─────────────────────────────────────┐
│  Casa                               │
│                                     │
│  galletas para el lonche            │
│  jabón                              │
│                                     │  ← aire
│  ▌                                  │  ← cursor, siempre
│                                     │
│  escribe · pega · foto · menú       │  ← ⭐ las 4 puertas, en lápiz
│                                     │     no navegan: describen el lienzo
│  ⌁ leche · sueles los jueves        │
│                                     │
├─────────────────────────────────────┤
│   Libreta       Compra        Casa  │  ← 3 propósitos. sin badges.
│   ▔▔▔▔▔▔▔         2                 │     el 2 en lápiz, solo si lo hay
└─────────────────────────────────────┘
```
*Necesidad:* soltar una línea en dos segundos **y** saber que hay más producto
detrás. Hoy resolvemos lo primero y fallamos lo segundo.

### W2 · Libreta — primera vez
```
│  Casa                               │
│  lo que se te acabó   ▌             │  ← muere con la primera letra
│                                     │
│  escribe · pega · foto · menú       │  ← lo único que dice qué es esto
├─────────────────────────────────────┤
│   Libreta       Compra        Casa  │
└─────────────────────────────────────┘
```
*Necesidad:* que una persona nueva entienda **en cinco segundos** que puede
escribir, pegar, fotografiar o cargar un menú — sin que nadie se lo explique y
sin una pantalla de bienvenida.

### W3 · Compra — vacía (día 1)
```
│  Compra                             │
│                                     │
│  Aquí verás tu compra               │
│  cuando la hagas.                   │
│                                     │
│  Se arma sola con lo que            │
│  anotes en la libreta.              │
│                                     │
│         [ Ir a la libreta ]         │
```
*Necesidad:* que la pestaña vacía **enseñe el modelo mental** en vez de decir "no
hay nada". Dos frases, y explican el producto entero.

### W4 · Revisión — la frontera
```
│  ← Antes de comprar                 │
│                                     │
│  galletas para el lonche       ✕    │
│  ⌁ lo escribiste tú                 │
│  2 kg de pollo                 ✕    │
│  ⌁ del WhatsApp de la casa          │
│  8 líneas de la captura        ✕    │
│  ⌁ de la captura de Wong            │
│                                     │
│  3 cosas    [ Buscar precios ]      │
```
*Necesidad:* que la familia sepa **qué autorizó** antes de que aparezcan precios.
Cada línea recuerda de dónde vino. *(Pantalla en discusión — ver §6.2.)*

### W5 · Carrito
```
│  ← Tu compra                        │
│  ▭ Pollo entero San Fernando        │
│    2 kg × S/ 12.90        S/ 25.80  │
│    ⌁ lo pediste así                 │
│  ▭ Trucha deshuesada                │
│    ⌁ falta la cantidad              │
│    [400 g][800 g][2 kg][Otra…]      │
│  ▭ Yogurt Gloria fresa   AGOTADO    │
│    ⌁ lo dejé anotado igual          │
│    [ Ver qué sí hay ]               │
│                                     │
│  Subtotal confirmado      S/ 25.80  │
│  2 productos pendientes             │
│           [ Comprar ]               │
```
*Necesidad:* comprar sin que el total mienta. Es la innovación real del producto.

### W6 · Confirmar — donde vive el login
```
│  ← Confirmar                        │
│  Total                   S/ 187.40  │
│                                     │
│  ¿A dónde te lo llevamos?           │
│  [                              ]   │
│  ¿Cuándo?  [ jueves 9–11 ]          │
│                                     │
│  Tu correo (para la boleta)         │
│  [                              ]   │  ← ⭐ la cuenta nace aquí
│                                     │
│           [ Comprar ]               │
```
*Necesidad:* no pedir identidad hasta que sea inevitable. Aquí lo es, y no se
siente como registro: se siente como comprar.

### W7 · Casa
```
│  Casa                               │
│  Lo que aprendí de ustedes          │
│                                     │
│  La leche es Gloria, siempre entera │
│  ⌁ cinco compras seguidas           │
│  El arroz es el grande, el de 5 kg  │
│  ⌁ lo escribiste así en marzo       │
│                                     │
│  Sus compras                        │
│  El domingo · 12 cosas   S/ 214.60  │
│  Hace dos semanas · 9    S/ 168.20  │
│                                     │
│  ⌁ ajustes                          │  ← al pie. lo más lejos posible.
├─────────────────────────────────────┤
│   Libreta       Compra        Casa  │
└─────────────────────────────────────┘
```
*Necesidad:* hacer el activo **tangible**. Es la única pantalla que contesta
*"¿qué perdería si me voy?"* — H6, la apuesta de negocio.

### W8 · Casa — día 1
```
│  Casa                               │
│                                     │
│  Todavía no sé nada de ustedes.     │
│                                     │
│  Después de la primera compra       │
│  empiezo a aprender cómo compran.   │
│                                     │
│  ⌁ ajustes                          │
```
*Necesidad:* admitir el vacío en vez de esconder la pestaña. Y **cero formulario
de preferencias**: pedirlas por adelantado es hacer trabajar por un beneficio que
todavía no ha visto.

---

## 6. 🔪 Crítica brutal

### 1. La barra inferior es una concesión, y puede ser la primera de muchas

Acabo de añadir cromo permanente a un producto cuya personalidad era *"esto es
papel, no software"*. **Lo defiendo porque el coste de no tenerla ya se pagó**
—media aplicación escondida detrás de un monograma— pero es innegable que la
libreta se parece hoy un poco más a cualquier otra app. Y una barra es una
superficie que **pide** ser llenada: el día que alguien proponga una cuarta
pestaña, el principio 1 será lo único que lo impida, y los principios pierden
contra los roadmaps.

### 2. Revisión sigue sin justificarse, y ahora molesta más

`app.html` ya lo señaló y no lo he resuelto: **editar y quitar ya se puede hacer
en la libreta**. Con una pestaña Compra que existe, Revisión es una pantalla
intermedia entre dos lugares que ya se ven. La mantengo solo porque comprar
merece una frontera consciente, pero **es la primera pantalla que eliminaría** si
en las entrevistas nadie la usa.

### 3. El número bajo *Compra* es un badge esperando su momento

Digo que es "un número en lápiz, no un badge". Es una distinción que sobrevive
tres sprints. En cuanto alguien mida engagement, ese número se pondrá naranja,
luego rojo, luego se animará. **La única defensa real sería no ponerlo**, y no lo
he hecho porque sin él la pestaña Compra parece muerta. **No estoy seguro de haber
elegido bien.**

### 4. La fila de gestos es texto disfrazado de arquitectura

`escribe · pega · foto · menú` es, literalmente, una explicación de cuatro
palabras — justo lo que dijimos que no haríamos. La diferencia con un tutorial es
que **no bloquea, no pide y no se cierra**; pero si en las entrevistas la familia
la lee y no la usa, es decoración con culpa. **Y `menú` es la más floja de las
cuatro:** nadie sabe qué significa "cargar el menú" sin haberlo hecho una vez.

### 5. La pestaña Compra tiene un problema de identidad los seis días que no se compra

Cinco días de cada siete no hay ninguna compra activa. **La pestaña vacía es una
promesa incumplida repetida cinco veces por semana.** El wireframe W3 lo maquilla
con dos frases bonitas, pero la verdad estructural es que un tercio de la
navegación está inactivo la mayor parte del tiempo.

### 6. Sigue sin existir el producto de dos personas

Es el tercer sprint que termina diciendo lo mismo. Toda esta arquitectura asume
un cursor, una voz, una casa con un solo autor. **Si la libreta es de una casa,
la pestaña Casa, la autoría de cada línea y el propio concepto de "lo que falta"
cambian.** Diseñar más pantallas sobre un supuesto sin decidir es acumular deuda.

### 7. Lo que sigue siendo demasiado conceptual

*"Lo que falta en casa"*, *"la libreta espera una línea"*, *"escribir no tiene
consecuencias"* — **ninguna de las tres se ha dicho jamás delante de una familia.**
Tres sprints de vocabulario interno cada vez más afinado y cero validación
externa. HD-16 sigue sin medir, y sostiene el edificio entero.

### 8. Y lo que sí parece ya una aplicación que se usaría a diario

La barra de tres. El cursor puesto al abrir. El carrito que no miente. El perfil
en frases. Que volver un martes no produzca **nada**. Esas cinco cosas están, y
son suficientes para poner esto delante de alguien — **en cuanto se resuelva la
decisión 17**, que sigue bloqueando: *qué pasa cuando el primer producto es el
equivocado.*

---

## 7. Recomendación única

> **Adoptar ARQ-3.** Tres lugares (Libreta · Compra · Casa) con barra inferior
> convencional; las cuatro puertas como fila de gestos dentro de la libreta; sin
> login hasta la primera compra; la innovación entera en el contenido y ni una
> gota en la navegación.

**Lo que hay que construir para probarlo:** nada nuevo de fondo. Es una
reorganización de pantallas que **ya existen** en `app.html` — libreta, revisión,
carrito, casa, boleta— más dos vacíos honestos (Compra vacía, Casa vacía) y el
paso de confirmar. El prototipo está en `design/prototipo-app.html`.

**Lo que NO hay que construir:** una cuarta pestaña · un dashboard en Compra · un
onboarding · una pantalla de bienvenida · badges.

---

## ⏸ Decisiones que solo la PO puede tomar

21. **¿Se acepta la barra inferior de tres**, revirtiendo la decisión de
    `app.html`? Es la decisión estructural del sprint.
22. **¿Sobrevive Revisión** como pantalla, o se compra directo desde la libreta?
23. **¿Se acepta el número en lápiz bajo *Compra***, sabiendo que es un badge en
    potencia (§6.3)?
24. **¿El login vive en Confirmar**, sin ninguna cuenta antes?
25. **¿Se desbloquea de una vez la decisión 9** (persona o casa)? Es el tercer
    sprint que la arrastra y ya condiciona tres pantallas.

### Hipótesis nuevas

| # | Hipótesis | Cómo se falsa |
|---|---|---|
| **HD-22** | Con tres pestañas, una persona nueva enumera sin ayuda al menos tres cosas que puede hacer. | Si al abrir solo menciona "escribir una lista". |
| **HD-23** | La fila de gestos se usa, no solo se lee. | Si nadie pega, fotografía ni carga un menú en la primera sesión — sería decoración. |
| **HD-24** | La barra no daña la sensación de papel. | Si alguien dice que "parece una app más" o deja de escribir con la misma soltura. |
| **HD-25** | Pedir la cuenta en Confirmar no rompe la primera compra. | Si abandona ahí. Es el punto de fuga clásico y hay que medirlo, no suponerlo. |
