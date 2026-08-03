# 🌱 Sprint — La primera experiencia de SuperCarrito

> **Documento de experiencia. Nada de aquí es decisión hasta que la PO lo apruebe.**
> Fecha: 2026-08-02 · Continúa `design/home-exploracion.md`.
> No se re-litiga: la libreta, el carrito, las cuatro puertas, el sistema visual.

---

## 0. ⛔ Alto: el problema no era el Home

La PO pidió detenerse y replantear si aparecía una pieza más fundamental.
**Apareció, y hay que decirla antes de diseñar nada.**

El sprint anterior definió bien el Home: *lo que falta en casa*. Pero esa
definición tiene un agujero exacto, y está justo en el minuto uno:

> **El Home vale por lo que acumula. Una familia nueva no ha acumulado nada.**

El martes del sprint anterior —abrir, ver lo suyo, no tener que acordarse— es una
experiencia **de la semana 3**. En la semana 1 esa misma pantalla es un folio en
blanco. Todo el valor que diseñamos con tanto cuidado **llega tarde para la
persona que más lo necesita: la que todavía no sabe qué es esto.**

### La pieza que faltaba

El *"ah, ya entendí"* **no ocurre en la libreta**. Ocurrir en la libreta es
imposible: escribir en una caja de texto no demuestra nada que un papel no haga
mejor. Ocurre exactamente aquí:

> **La primera vez que la familia ve sus propias palabras convertidas en un
> producto real, con un precio real de Wong.**

Ese es el momento. Y hasta ahora lo teníamos **al final del recorrido**, detrás de
un botón deliberadamente discreto, en un acto que solo pasa los domingos.

**Por eso este sprint no diseña una pantalla: diseña una distancia.**

```
                    LA MÉTRICA DEL SPRINT
        abrir  ─────────────────────────────▶  primer monto real

        Hoy:  1 abrir · 1 escribir · 1 tocar "hacer la compra" · 1 esperar
              …y solo si se atrevió a tocar un botón que diseñamos para no llamar la atención.

        Meta: que el primer indicio de valor llegue ANTES de tocar nada.
```

### La reformulación del sprint

No preguntamos *"¿qué ve al abrir?"*. Preguntamos:

> **¿Cuál es el número mínimo de gestos entre abrir SuperCarrito por primera vez
> y ver una prueba de que esto no es un bloc de notas?**

Y la respuesta que defiende este documento es **uno: escribir una línea.**

---

## 1. Las cuatro preguntas previas

### 1.1 ¿Qué ve alguien la primera vez? *(sin login, sin onboarding, sin Home)*

Sin nada acumulado, la pantalla solo puede contener cuatro cosas. Las cuatro
están justificadas una por una, y no hay una quinta:

| # | Qué | Por qué existe | Qué pasa si no está |
|---|---|---|---|
| 1 | **El cursor, puesto** | Es la única instrucción que no se lee. | Hay que decidir dónde tocar. |
| 2 | **Un renglón de texto tenue** (placeholder) | Contesta *"¿qué escribo aquí?"* sin ordenar nada. | El folio en blanco gana. Es el fallo más probable del día 1. |
| 3 | **«Hacer la compra», apagado** | Se ve desde el segundo cero **que hay un después**. Apagado, no oculto. | Parece un bloc de notas. Nada promete que esto compre. |
| 4 | **La oferta del portapapeles**, *solo si hay algo copiado* | Es la mejor primera acción posible (HD-7) y llega sin enseñar ningún gesto. | Se pierde a quien ya tenía su lista en WhatsApp — que es casi todo el mundo. |

**Y nada más. En concreto, no hay:** logo, nombre de producto, bienvenida, botón
de empezar, tres formas de entrar, carrusel, ejemplo de catálogo, tutorial,
cuenta, permisos, ni una sola pantalla antes de la libreta.

**El placeholder, palabra por palabra** (la PO exige razón de producto en cada una):

```
                    lo que se te acabó
                    └┬─┘ └──────┬────┘
                     │          └─ el evento doméstico REAL. No pide planificar,
                     │             pide recordar algo que ya pasó en la casa.
                     └─ no dice "tu lista" ni "escribe": no es una tarea,
                        y no manda. Describe el contenido, no la acción.
```

Rechazados, y por qué:
- *«Escribe tu lista»* — convierte la primera visita en una tarea. Y las tareas se posponen (§4).
- *«¿Qué necesitas?»* — pregunta abierta: obliga a recordarlo **todo** de golpe.
- *«leche, pan, huevos…»* — enseña un formato. Rompe HD-1: *el formato lo pone la familia*.
- *«Pega lo que sea, yo me encargo»* — es nuestra frase, no la suya. Y promete antes de demostrar.

**El placeholder desaparece con la primera letra y no vuelve jamás.** Es lo único
en todo el producto que existe una sola vez en la vida.

### 1.2 Cuatro aperturas, cuatro productos distintos — con la misma interfaz

| | Qué ve | Qué siente | Qué le pedimos |
|---|---|---|---|
| **1ª apertura** | Folio, cursor, un renglón tenue, «hacer la compra» apagado, y la oferta del portapapeles si la hay. | *"Puedo escribir cualquier cosa aquí."* | Una línea. Nada más. |
| **2ª apertura** *(dos horas después)* | Su línea, tal cual. El aire debajo. El cursor al final. El labio abajo con **un monto real**. | *"Se guardó. Y ya sabe cuánto cuesta."* | Nada. |
| **Una semana después** | Sus líneas, algún hueco de aire, y **el primer eco**: algo que ya compró y hoy no está anotado. | *"Me conoce un poco."* | Nada. Tocar el eco, si quiere. |
| **A los seis meses** | Casi nunca una libreta vacía: lo que quedó pendiente, y el eco lleno del ritmo de su casa. Escribe menos y confirma más. | *"Esto ya es de mi casa."* | Cada vez menos. |

**La regla que las une, y es la respuesta al reto de las dos madres:**

> **La interfaz no cambia nunca. Lo que cambia es cuánto tiene dentro.**

No hay modo principiante ni modo avanzado, ni funciones que se desbloquean, ni
un "ya te conoces esto, quitamos las ayudas". La madre del día 1 y la del mes 6
ven **la misma pantalla**; la diferencia la produce **la casa**, no el producto.
Por eso ninguna de las dos tiene que aprender nada nueva vez, y por eso el
producto no engorda al madurar: **madura el contenido, no la interfaz.**

La única excepción en todo el sistema es el placeholder de la línea 1.1. Existe
una vez y muere. Que la excepción sea exactamente una es la prueba de que la
regla se sostiene.

### 1.3 Las preguntas que el producto debe responder en los primeros segundos

Las seis de la PO, más tres que aparecieron al modelar el recorrido. **Ninguna se
responde con texto explicativo:**

| Segundo | Pregunta | Cómo se responde | ¿Con palabras? |
|---|---|---|---|
| 0 | **¿Qué hago aquí?** | El cursor puesto + el renglón tenue. | 4 palabras |
| 1 | **¿Qué es esto?** | Se pospone a propósito. Se contesta en el segundo 12, no en el 1. | No |
| 3 | **¿Qué puedo pegar?** | La oferta del portapapeles, si la hay. Si no, se descubre pegando: nada se rechaza. | No |
| 6 | **¿Qué pasa si escribo algo?** | No pasa nada. Y ese silencio es la respuesta: aquí escribir **no tiene consecuencias**. | No |
| 12 | **¿Esto entendió lo que dije?** ⭐ *(nueva)* | El labio de abajo, que decía `—`, ahora dice un monto real. | No |
| 15 | **¿Qué pasa si NO escribo nada?** | Nada. Nadie pregunta, nadie recuerda, nadie insiste. | No |
| 20 | **¿Esto va a hacer algo con mi lista, o solo la guarda?** ⭐ *(nueva)* | «Hacer la compra» pasó de apagado a disponible en cuanto hubo una línea. | No |
| 25 | **¿Y si me equivoco o escribo un desastre?** ⭐ *(nueva)* | Se toca una línea y se edita. Lo pegado entra entero, con emojis y con «mami». | No |
| 30 | **¿Por qué volvería?** | **No se responde hoy.** Se responde el martes siguiente, cuando se le acabe algo. | No |

**Total de palabras explicativas en el primer uso: cuatro.** Y ninguna explica el
producto: describen qué va en el renglón.

La pregunta *"¿qué es esto?"* se pospone a conciencia. Contestarla en el segundo 1
exige una frase que promete; contestarla en el segundo 12 exige un número real que
demuestra. **Preferimos demostrar tarde a prometer pronto.**

### 1.4 Qué se descubre solo · qué se explica · qué nunca se explica

**Se descubre solo** (el diseño lo hace obvio, y por eso no se dice):
pegar funciona · el formato da igual · se guarda sin botón · se puede editar
tocando · escribir no compra · el orden es suyo · nadie le va a exigir terminar.

**Merece una explicación —cuatro casos, ni uno más—** y todas son de una línea,
en lápiz, y solo cuando el hecho ya ocurrió:

| Cuándo | Qué se dice | Por qué no se resuelve con diseño |
|---|---|---|
| Al pegar por primera vez | *«Pegado tal cual. Yo lo ordeno cuando compres.»* | Ver su desorden intacto **parece un error del producto**. Sin esa frase, corrige a mano lo que no hacía falta corregir. Ningún diseño puede decir "esto es a propósito". |
| Al preguntar una cantidad | *«Lo recordaré para tus próximas compras.»* | Una pregunta sin promesa se siente como un formulario. Con promesa, es un depósito. |
| Al quedar algo sin comprar | *«quedó de la semana pasada»* | Sin ella, la línea que sobrevivió parece basura no borrada. |
| Al aparecer el eco | *«sueles los jueves»* · *«como siempre»* | Una sugerencia sin motivo es publicidad. **El motivo es lo que la vuelve memoria.** |

**Nunca se explica, porque explicarlo lo mata:**

- 🔇 **Que estamos aprendiendo de ella.** Decir *"analizamos tus compras para
  personalizar tu experiencia"* convierte un regalo en vigilancia. El aprendizaje
  se **demuestra** (el eco acierta) o no existe.
- 🔇 **Que la libreta es permanente.** *"No te preocupes, se guarda solo"* siembra
  la duda que quería quitar. La prueba de que se guardó **es ver su texto ahí**.
- 🔇 **Que puede volver cuando quiera.** Decirlo es pedir un hábito. §4 lo prohíbe.
- 🔇 **Que no hace falta terminar la lista.** Cualquier frase sobre la completitud
  —incluso para negarla— instala la idea de que existe una lista completa.
- 🔇 **Cómo funciona el matching, el perfil o el Top-6.** El usuario no quiere
  saber cómo pensamos. Quiere que acertemos.

> **La regla:** explicamos **hechos que ya ocurrieron y podrían malinterpretarse**.
> Nunca explicamos capacidades, intenciones ni funcionamiento.

---

## 2. Las seis filosofías de arranque, comparadas

| # | Filosofía | Qué propone | Contradicciones con §4 | Veredicto |
|---|---|---|---|---|
| **O-1** | **Sin onboarding puro** | Folio absolutamente en blanco. Ni placeholder. | Ninguna formal. Pero traslada **todo** el coste de arranque a la familia, y el fallo del día 1 no es el formato: es no tener nada en la cabeza (HD-8). | ✂️ Casi. Le falta una pieza. |
| **O-2** | **Una sola pantalla de bienvenida** | Una frase + un botón «empezar». | Rompe *ninguna pantalla aparece antes de la libreta* (§Sistema visual, explícito). Y un botón «empezar» es un peaje: el gesto que sobra siempre. | ❌ Descartada. |
| **O-3** | **Onboarding progresivo** | Pistas que aparecen etapa por etapa (*"ahora prueba a pegar"*). | Rompe *nada te evalúa*: un producto que te va guiando te está midiendo. Y las pistas **ocupan el lugar del cursor**, prohibido en §H-D. | ❌ Descartada. |
| **O-4** | **Onboarding invisible** ⭐ | No hay onboarding: el producto se explica **por lo que hace** en el momento en que lo hace. Cero palabras antes del primer gesto. | Ninguna. Es la lectura literal de *la personalidad nace de no juzgar*. | ⭐ **Base de la recomendación.** |
| **O-5** | **Descubrir haciendo (guiado)** | Se pide explícitamente la primera acción: *"escribe algo, lo que sea"*. | Roza *nada pide completitud*: pedir la primera línea es pedir un rendimiento, aunque sea mínimo. | ✂️ Su intención se rescata sin el imperativo. |
| **O-6** | **El portapapeles que se ofrece** (F1) | Si hay algo copiado, se ofrece soltarlo. Si no se toca, se va. | Ninguna, **si se ve siempre como oferta y nunca como lectura**. Es el único arranque que da valor sin pedir nada. | ✅ **Se suma a O-4.** |
| **O-7** | **El arranque prestado** | Empezar con una despensa típica: *"¿qué se te acabó?"* con productos genéricos que se tocan. | Rompe *el activo es la memoria de ESTA familia*: un arranque genérico enseña un léxico que no es suyo, y ese dato se queda en su perfil. Es exactamente la trampa que §4 prohíbe. | ❌ Descartada. Peligrosa. |

### La recomendación: **O-4 + O-6, y el placeholder como única concesión**

> **Onboarding invisible, con una oferta cuando la hay y cuatro palabras cuando
> no.** No hay tutorial, no hay bienvenida, no hay pantalla previa, no hay
> imperativos. El producto se explica ocurriendo.

**Por qué esta combinación y no O-1 puro:** O-1 es más limpia y **falla más**. El
folio absolutamente en blanco es honesto pero cruel: el problema del día 1 nunca
fue *cómo* escribir, fue **no tener nada en la cabeza todavía** (HD-8). Cuatro
palabras tenues que se borran al primer carácter son el precio más barato que
encontramos para resolverlo, y no violan ningún principio.

**Por qué no O-3 ni O-5, que es lo que todo el mundo construye:** ambas asumen que
el usuario tiene que aprender el producto. Aquí no hay nada que aprender.
**Hay algo que probar**, y la prueba dura un segundo: escribe una palabra y algo
real le contesta con un precio real.

---

## 3. El recorrido completo

Ocho momentos. Cada uno con **la auditoría de la PO en su sitio**: *¿en este
momento la familia entiende qué tiene que hacer?*

---

### ① Segundo 0 — abre por primera vez

```
┌─────────────────────────────────────┐
│  Casa                               │
│                                     │
│  lo que se te acabó   ▌             │  ← tenue. muere con la primera letra.
│                                     │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │ tienes algo copiado             │ │  ← solo si lo hay. oferta, no lectura.
│ │ ¿lo suelto aquí?      [Sí] [No] │ │     si no se toca, se va sola.
│ ╰─────────────────────────────────╯ │
│                                     │
│  [ Hacer la compra ]                │  ← apagado. visible. promete un después.
└─────────────────────────────────────┘
```

**🔍 ¿Entiende qué hacer?** **Sí.** Hay un cursor y una frase que describe qué va
ahí. No hay nada más que tocar. La ambigüedad es cero porque las opciones son una.

**Si no hay nada en el portapapeles**, no hay oferta y no la sustituye nada. Un
hueco es preferible a un relleno: lo que ocuparía ese sitio sería una explicación.

---

### ② Segundo 6 — escribe la primera línea

```
│  papel higiénico                    │  ← tinta. suya.
│  ▌                                  │
│                                     │
│  [ Hacer la compra ]                │  ← se enciende. sin animación, sin color.
│ ─────────────────────────────────── │
│  1 · falta en casa          S/ 6.90 │  ← ⭐ EL MOMENTO. el labio despierta.
└─────────────────────────────────────┘
```

**⭐ Este es el *"ah, ya entendí"*, y llega en el segundo 12, no en el minuto 3.**

Sin tocar nada, la familia acaba de aprender tres cosas que nadie le dijo:
1. **la entendió** —escribió «papel higiénico» y no la corrigió, ni le pidió elegir;
2. **sabe precios reales** —esto no es un bloc de notas;
3. **hay algo debajo** —el labio existe, se puede levantar.

**El monto vive en el labio, jamás en la libreta.** El labio es el borde del
carrito, no de la libreta: *la foto marca la frontera* sigue intacta —no hay ni
una imagen— y *sin precios en la libreta* también. Ese renglón de abajo es la
única costura del producto, y lleva ahí desde `pantallas.html`.

**🔍 ¿Entiende qué hacer?** **Sí, y no tiene que hacer nada.** Es la primera vez
que el producto le da algo sin pedirle nada a cambio.

**⚠️ Riesgo real, sin solución perfecta:** que el monto se lea como *"ya estoy
comprando"* y asuste. Mitigación: aparece **sin animación** (180 ms de opacidad,
como el eco), en lápiz, sin negrita, y sin la palabra «total». Se falsa en
entrevista: **HD-19**.

---

### ③ Segundo 20 — cierra

No pasa nada. No hay «¿seguro que quieres salir?», ni resumen, ni notificación de
que su lista está a medias. **Que no pase nada es la funcionalidad.**

**🔍 ¿Entiende qué hacer?** No aplica: no le estamos pidiendo nada. Es el primer
momento del producto que demuestra —no dice— que no exige.

---

### ④ Dos horas después — vuelve

```
│  papel higiénico                    │  ← igual. exactamente igual.
│  ▌                                  │  ← el cursor, al final
│                                     │
│  1 · falta en casa          S/ 6.90 │
```

**Lo único que cambia es nada.** Ni «hace 2 horas», ni «bienvenida de nuevo», ni
un badge. **Ver su texto es la prueba de que se guardó** (HD-6), y esa prueba no
admite palabras encima.

**Móvil:** cursor sí, teclado no. Un teclado que salta solo tapa media libreta
justo cuando quiere ver lo que ya tiene.

**🔍 ¿Entiende qué hacer?** **Sí**, y ahora sabe algo que en el segundo 0 no
sabía: que esto es suyo y que puede irse sin coste.

---

### ⑤ Tres días después — vuelve otra vez

```
│  papel higiénico                    │
│  detergente                         │
│                                     │  ← aire. tres días son un hueco.
│  ▌                                  │
│                                     │
│  ⌁ ¿pollo? · lo escribiste el lunes │  ← NO. ver crítica §5.
```

**Sin fechas, sin «llevas 3 días sin abrir», sin badge.** Solo más aire y el
cursor. *Lo que hace que algo parezca abandonado no es el tiempo: es que el
producto te lo recuerde.*

**🔍 ¿Entiende qué hacer?** **Sí.** Y aquí ocurre el examen de verdad del
producto: si volvió, HD-16 está viva.

**⚠️ Aquí está el punto ciego más serio del recorrido, y se detalla en §5:** a los
tres días con dos líneas, la pantalla es **indistinguible** de la del día 1. Para
esta familia el producto todavía no ha hecho nada más que existir.

---

### ⑥ El domingo — la primera compra

```
│  papel higiénico                    │
│  detergente                         │
│  2 kg de pollo                      │
│ ╭─────────────────────────────────╮ │  ← se levanta. 320 ms. no navega.
│ │  ▭ Papel Higiénico Suave 12 un  │ │  ← ⭐ LA PRIMERA FOTO DEL PRODUCTO
│ │    1 paquete × S/ 6.90    6.90  │ │
│ │  ▭ Pollo Entero Fresco          │ │
│ │    ¿Cuánto compras normalmente? │ │  ← la primera pregunta del producto
│ │    [1 kg][2 kg][2,5 kg][Otra…]  │ │     con salida abierta, siempre
│ │  Subtotal confirmado    S/ 10.10│ │
│ │  1 producto pendiente           │ │
│ │  [ Confirmar la compra ]        │ │
│ ╰─────────────────────────────────╯ │
```

**El segundo *"ya entendí"*, y el grande.** Sus tres palabras sueltas son ahora
tres productos con foto, precio y multiplicación visible. Y una pregunta que
promete memoria: *«Lo recordaré para tus próximas compras.»*

**🔍 ¿Entiende qué hacer?** **Riesgo aquí, y es el mayor de todo el recorrido.** Es
el primer momento del producto que **le pide algo**. Tres defensas, todas ya
decididas: la pregunta solo aparece si el monto sería deshonesto sin ella; las
opciones son múltiplos reales del mínimo; y hay salida abierta siempre.

---

### ⑦ El lunes — la libreta se resolvió, no se vació

```
│  detergente                         │
│  ⌁ quedó de la semana pasada        │  ← lápiz. sin fecha, sin culpa.
│                                     │
│  ▌                                  │
│                                     │
│  ⌁ papel higiénico                  │  ← el primer eco. su propia compra.
```

**El primer eco es el tercer *"ya entendí"*, y el único que crea hábito.** Los dos
anteriores demostraron competencia (*me entendió*, *sabe precios*). Este demuestra
**memoria**: *me conoce*. Es la primera vez que el producto sabe algo que ella no
le dijo hoy.

**🔍 ¿Entiende qué hacer?** **Sí, y nada.** El eco no pide: se toca o se ignora, y
el ignorado no insiste ni se queja.

---

### ⑧ Seis meses — la misma pantalla, otra casa

```
│  ⌁ atún                             │  la libreta empieza casi llena,
│  ⌁ leche · sueles los jueves        │  pero de LÁPIZ, no de tinta:
│  ⌁ papel higiénico                  │  son propuestas, no su trabajo.
│                                     │
│  yogurt para la Vale                │  ← lo único en tinta: lo de hoy
│  ▌                                  │
│  ⌁ Gloria fresa 1 L, 2 · como       │
│    siempre           [Sí]  [Otro]   │  ← el eco ya se ganó preguntar
│                                     │
│  [ Hacer la compra ]                │  ← idéntico. seis meses después.
│  12 · falta en casa        S/ 187.40│
```

**La madre del mes 6 usa exactamente la misma pantalla que la del día 1.** No se
desbloqueó nada, no aprendió nada nuevo, no hay ajustes. Lo que cambió es que su
casa tiene historia, y el producto la devuelve **en lápiz** para que nunca se
confunda con lo que ella escribió.

**Y escribe menos.** Ese es el producto funcionando: la métrica de Growth
—*preguntas por compra*— bajando sola.

**🔍 ¿Entiende qué hacer?** **Sí, y cada vez menos tiene que hacer.**

---

## 4. Wireframes de la propuesta elegida

Baja fidelidad, una pregunta por wireframe.

### P1 · El día 1 con el portapapeles lleno
```
┌───────────────────────────┐
│ Casa                      │
│ lo que se te acabó  ▌     │
│                           │
│ ╭───────────────────────╮ │
│ │ tienes algo copiado   │ │
│ │ ¿lo suelto aquí?      │ │
│ │            [Sí] [No]  │ │
│ ╰───────────────────────╯ │
│ [ Hacer la compra ]  ⌀    │
└───────────────────────────┘
```
*Valida:* ¿la oferta se lee como servicio o como *"me está leyendo el móvil"*?

### P2 · El labio despierta (el momento)
```
│ papel higiénico           │
│ ▌                         │
│ [ Hacer la compra ]       │
│ ───────────────────────── │
│ 1 · falta en casa  S/ 6.90│  ← antes decía —
```
*Valida:* **HD-19.** ¿El primer monto es *"me entendió"* o *"ya estoy comprando"*?

### P3 · Día 1 con el portapapeles vacío (el caso duro)
```
│ Casa                      │
│                           │
│ lo que se te acabó  ▌     │
│                           │
│                           │
│ [ Hacer la compra ]  ⌀    │
└───────────────────────────┘
```
*Valida:* **HD-20.** ¿Escribe algo, o se queda mirando? Es el peor escenario y no
tiene red de seguridad **a propósito**.

### P4 · Día 3 sin haber comprado (el punto ciego)
```
│ papel higiénico           │
│ detergente                │
│                           │
│ ▌                         │
│ 2 · falta en casa S/ 14.20│  ← lo único que creció
```
*Valida:* ¿percibe algún progreso, o es el día 1 otra vez? Ver §5.

### P5 · Mes 6 — la misma pantalla, llena de lápiz
```
│ ⌁ atún                    │
│ ⌁ leche · sueles el jueves│
│ yogurt para la Vale       │  ← tinta
│ ▌                         │
│ 12 · falta en casa S/187.40│
```
*Valida:* ¿distingue lo que escribió ella de lo que propusimos, sin que nadie se
lo explique?

---

## 5. 🔪 Crítica brutal del recorrido

Sin defender nada de lo anterior. Ocho fallos, ordenados por lo que más puede
matar el producto.

### 1. **El *"ya entendí"* está subcontratado a Wong, y Wong falla en los básicos**

El momento entero depende de que `papel higiénico` devuelva papel higiénico. Y
`PROJECT_STATE` §2 dice, con datos: `leche` → chocolates, `huevos` → *Cortador de
Huevos S/ 24.90*, `arroz` → Arroz Chaufa. **El primer uso de una familia real
tiene una probabilidad alta de producir el momento contrario:** *"esto no me
entendió nada"*. Y de eso no se vuelve.

**Es el riesgo número uno del producto y no es un problema de diseño.** H7 dice
que el producto correcto ya está en el Top-6; elegirlo es el ciclo 6, que está
congelado. **No se puede poner esto delante de una familia sin decidir antes qué
pasa cuando el primer producto es el equivocado.**

### 2. **El día 3 no tiene nada que ofrecer, y es cuando se decide todo**

Una familia con dos líneas y sin compra hecha vuelve a una pantalla idéntica a la
del día 1. **El eco —que es lo que hace que volver valga la pena— necesita
historial de compra, y esa familia no tiene ninguno.** Es un círculo: no vuelve
porque no hay eco, y no hay eco porque no ha comprado.

Diseñar un arranque de eco sin historial nos llevaría directo a O-7 (el arranque
prestado), que descartamos por corromper el perfil. **No tengo solución que no
rompa un principio. Lo dejo abierto y señalado, no maquillado.**

### 3. **El placeholder es la grieta por donde entra el onboarding**

Cuatro palabras hoy. En tres meses alguien querrá cinco, luego dos renglones,
luego un ejemplo, luego una flechita. **Todos los tutoriales del mundo empezaron
siendo un placeholder razonable.** Propongo que quede escrito como límite duro: el
producto tiene **cuatro palabras de explicación no contextual**, y añadir una
quinta es una decisión de la PO, no de diseño.

### 4. **La oferta del portapapeles puede leerse como espionaje**

*"¿Cómo sabe que copié algo?"* En iOS el aviso del sistema al leer el portapapeles
puede aparecer **antes** que nuestra oferta, y entonces el orden de lectura es
*"me leyó"* → *"me ofrece"*. Sería el peor primer segundo posible. **No se puede
resolver desde el diseño: es una restricción de plataforma que hay que verificar
en un móvil real antes de comprometerse.**

### 5. **«Hacer la compra» apagado en el día 1 rompe una regla nuestra**

*Si algo se puede tocar, se ve tocable* (§Sistema visual). Un botón apagado se ve
sin poder tocarse — es la regla al revés. Lo defiendo porque **promete el después
desde el segundo cero**, que es lo único que separa esto de un bloc de notas. Pero
es una excepción, y las excepciones hay que declararlas, no esconderlas.

### 6. **Nunca hemos diseñado cómo muere un eco**

Al mes 6 la libreta abre con lápiz. ¿Y al mes 18? Si el eco solo crece, la
pantalla que diseñamos para estar en calma acaba siendo una lista de sugerencias
—exactamente el dashboard que la PO prohibió, construido por acumulación en vez
de por decisión. **Un eco que nunca se toca en seis semanas tiene que apagarse
solo, y eso no está diseñado.**

### 7. **Todo el recorrido asume una sola persona escribiendo**

La decisión 9 (*¿la libreta es de una persona o de una casa?*) sigue aplazada, y
este documento la asume resuelta en silencio: un cursor, una voz, un *"lo que se
te acabó"* en singular. Si la libreta es de una casa, el día 1 de la **segunda**
persona es una experiencia que no existe en ningún documento: **abre y encuentra
la libreta llena de cosas que ella no escribió.** No sabemos qué siente ahí.

### 8. **HD-16 sigue sin validar, y sostiene el edificio entero**

*La familia abre entre semana sin intención de comprar.* Si es falsa, el Home no
importa, la primera experiencia no importa, y el producto es una herramienta
dominical. **Todo lo diseñado en dos sprints descansa en una hipótesis que nadie
ha puesto delante de una familia.** Sigue siendo la primera cosa que hay que
medir, no la última.

---

## 6. Prototipo navegable

`design/prototipo-primera-vez.html` — un archivo, sin dependencias. Recorre los
ocho momentos en orden y se puede escribir de verdad en todos.

**Qué observar, en orden de importancia:**
1. Segundo 0 con el portapapeles vacío: ¿escribe o se queda mirando? *(HD-20)*
2. Al aparecer el monto en el labio: ¿qué cara pone? ¿lo menciona? *(HD-19)*
3. ¿Vuelve sin que se lo pidamos? *(HD-16 — la que decide todo)*
4. Al ver el eco: ¿cree que ya está en su compra?
5. Mes 6: ¿distingue el lápiz de su tinta sin explicación?
6. Y en cualquier momento: **si dice *"¿y ahora qué?"*, el diseño falló ahí.**

---

## ⏸ Decisiones que solo la PO puede tomar

16. **¿Se acepta el placeholder de cuatro palabras** como única explicación no
    contextual del producto, con el límite duro de §5.3?
17. **¿Qué pasa cuando el primer producto es el equivocado?** (§5.1). **Bloquea
    poner esto delante de una familia real**, y probablemente reabre el ciclo 6.
18. **¿Se acepta la excepción del botón apagado** en el día 1 (§5.5)?
19. **¿Se diseña ya la muerte del eco** (§5.6) o se acepta la deuda?
20. **¿Se desbloquea la decisión 9** (persona o casa)? El día 1 de la segunda
    persona de la casa no existe en ningún documento (§5.7).

### Hipótesis nuevas

| # | Hipótesis | Cómo se falsa |
|---|---|---|
| **HD-19** | El primer monto en el labio se lee como *"me entendió"*, no como *"ya estoy comprando"*. | Si duda, si pregunta si ya compró algo, o si deja de escribir para que no suba. |
| **HD-20** | Con el portapapeles vacío, el placeholder basta para producir la primera línea. | Si se queda mirando la pantalla más de diez segundos, o pregunta qué tiene que hacer. |
| **HD-21** | La misma interfaz sirve al día 1 y al mes 6 sin modos ni ajustes. | Si la familia del mes 6 pide "una vista rápida", o la del día 1 se siente perdida ante una pantalla pensada para llenarse. |
