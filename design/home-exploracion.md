# 🏠 Sprint de descubrimiento — ¿Qué significa abrir SuperCarrito?

> **Documento de exploración. Nada de aquí es una decisión hasta que la PO lo apruebe.**
> Fecha: 2026-08-02 · Método: producto, no diseño visual.
> Insumos: §1, §4 y §H-D de `PROJECT_STATE.md`, y el sistema visual aprobado.

---

## 0. La pregunta del sprint

No preguntamos *"¿cómo debería verse el Home?"*. Preguntamos:

> **¿Por qué una familia volvería a abrir SuperCarrito varias veces durante la
> semana, incluso cuando todavía no va a comprar?**

Y su forma corta, la que decide todo:

> **¿Qué espera encontrar una familia que abre SuperCarrito un martes cualquiera
> durante cinco segundos?**

### La respuesta honesta a los cinco segundos del martes

Un martes por la noche nadie abre SuperCarrito *para hacer la compra*. La compra
es un evento semanal. Si el producto solo sirve para eso, se abre una vez por
semana y no hay activo, no hay perfil, no hay H6.

Lo que sí pasa un martes es esto:

```
19:40  se acaba el papel higiénico
19:41  alguien piensa "hay que comprar papel"
19:42  ese pensamiento tiene ~90 segundos de vida
```

**El evento no ocurre en la app. Ocurre en la casa.** La app solo puede ser el
sitio más barato donde soltarlo antes de que se pierda. De ahí salen dos
necesidades, y son las únicas dos reales del martes:

| | Necesidad | Qué exige del Home |
|---|---|---|
| **1** | **Soltar algo** antes de que se me olvide | Coste de anotar ≈ cero. Cursor puesto, sin pantalla intermedia, sin decisión previa. |
| **2** | **Comprobar que no tengo que acordarme** | Ver lo suyo, tal cual lo dejó, sin que nadie le diga que va atrasada. |

La necesidad 2 es la que casi todo el mundo diseña mal, y es la que crea el
hábito. **Abrir y no hacer nada tiene que ser una visita exitosa.** Si abrir sin
escribir se siente como una tarea no hecha, la familia deja de abrir.

### El competidor real no es otra app

No competimos con Wong ni con Listonic. Competimos con:

- el hilo de WhatsApp que la mamá se manda a sí misma;
- el papel en la refri;
- **acordarse**, que es gratis y funciona regular.

Los tres son *soltar una línea*. Ninguno de los tres tiene Home. **Eso ya es un
dato durísimo: el formato ganador de este trabajo históricamente no tiene
pantalla de inicio.**

---

## 1. Doce maneras de entender el Home

Modelos mentales, no layouts. Cada uno es defendible; varios están mal.

---

### H-A · El Home es la libreta *(el estado actual)*

- **Qué representa:** un sitio en blanco que es tuyo, donde caen cosas.
- **Emoción:** permiso. *"Aquí no me evalúan."*
- **Comportamiento:** anotar suelto, sin planificar.
- **Qué aprenderíamos probándolo:** si el concepto *libreta* se entiende sin
  explicación (HD-12), y si la gente vuelve sola entre semana (HD-2).
- **Contradicciones:** ninguna. Es la consecuencia directa de §4.
- **Ventaja a largo plazo:** cada visita deposita señal (léxico, orden, ritmo).
- **A seis meses:** el riesgo aparece justo aquí — la libreta empieza cada semana
  casi vacía, y **una superficie que casi siempre está vacía se siente inútil**
  aunque sea correcta. Necesita algo que la llene por mérito propio (el eco).

---

### H-B · No hay Home: siempre vuelves donde estabas

- **Qué representa:** el producto no tiene inicio, tiene *continuidad*. Abrir =
  reanudar. Si estabas eligiendo yogurt, vuelves eligiendo yogurt.
- **Emoción:** alivio. Nada se perdió.
- **Comportamiento:** sesiones fragmentadas sin coste de reentrada.
- **Qué aprenderíamos:** si la familia interrumpe de verdad la compra a medias, y
  si al volver reconoce dónde está o se siente perdida.
- **Contradicciones:** **una seria.** *Escribir de forma continuada es un derecho,
  no un deber* (§4). Si el martes te devuelve al carrito del domingo, el producto
  te devuelve **una tarea a medio hacer**, que es exactamente la anti-pantalla.
  Restaurar un estado de *compra* castiga a quien solo venía a soltar una línea.
- **Ventaja a largo plazo:** es la mejor política **dentro de una sesión** y en
  ventanas cortas.
- **A seis meses:** degenera en "la app siempre me abre en un sitio raro".
- **Veredicto:** ✂️ **no como Home, sí como regla.** Continuidad con caducidad:
  minutos, no días.

---

### H-C · El Home es *lo que falta en casa* ⭐

- **Qué representa:** el Home no es un documento ni una pantalla: es **el estado
  de una casa**. No *"tu lista"* (mía, mi tarea, mi rendimiento) sino *"lo que
  falta"* (de la casa, un hecho, no una obligación de nadie).
- **Emoción:** descarga. *"Ya no tengo que acordarme yo."*
- **Comportamiento:** abrir cuando **cambia el estado de la casa**, no cuando toca
  comprar. Eso ocurre 4–6 veces por semana, no una.
- **Qué aprenderíamos:** si la razón de volver es un evento doméstico (se acabó
  algo) o un momento de planificación. Es **la pregunta que decide el producto**.
- **Contradicciones:** ninguna estructural — es la misma superficie de H-A con
  otra identidad. **Un riesgo de tono, sí:** "lo que falta" mal escrito se lee
  como *"te falta"*, y §4 prohíbe que nada evalúe a la familia. La diferencia es
  el sujeto: falta **en la casa**, no le falta **a ella**. Hay que falsarlo.
- **Ventaja a largo plazo:** convierte una app de compra semanal en **un objeto
  doméstico de consulta diaria**. Es la única lectura que hace que abrir sin
  escribir sea una visita con sentido.
- **A seis meses:** con frecuencia de compra aprendida (dimensión 5), *lo que
  falta* deja de ser solo lo anotado y empieza a incluir lo deducido — **pero
  siempre en lápiz y siempre sin sumar al total** hasta que se toca.

---

### H-D · El Home resume la semana

- **Qué representa:** cuánto llevas gastado, cuántas cosas, qué compraste.
- **Emoción:** control… y evaluación.
- **Comportamiento:** mirar más, escribir menos.
- **Qué aprenderíamos:** si a las familias les importa el gasto agregado (probable
  que sí) y si lo quieren *en la puerta* (poco probable).
- **Contradicciones:** **directas y múltiples.** Es un dashboard. Rompe *la
  personalidad nace de no juzgar*, rompe *nada evalúa*, y §Sistema visual lo
  prohíbe explícitamente ("barras de progreso", "badges", "rachas").
- **Ventaja a largo plazo:** ninguna que no se sirva mejor desde el cierre de compra.
- **Veredicto:** ❌ **descartado sin llevarlo a nadie.**

---

### H-E · El Home es la compra (el carrito vivo)

- **Qué representa:** abrir es ver tu carrito con fotos y precios.
- **Emoción:** urgencia comercial.
- **Comportamiento:** convierte cada apertura en una decisión de compra.
- **Contradicciones:** rompe la frontera fundacional. *La foto marca la frontera
  entre escribir y comprar* (§4, 2026-08-02) y *un producto solo suma al total si
  conocemos su cantidad*. Un carrito permanente en la puerta obliga a validar
  elecciones no tomadas — que es exactamente por qué D1 · las fichas se descartó.
- **Veredicto:** ❌ **descartado.** Sería el Home de un supermercado, no de un copiloto.

---

### H-F · El Home es la casa (la despensa)

- **Qué representa:** inventario positivo: qué tienes, qué te queda.
- **Emoción:** al principio, orden; después, deuda.
- **Comportamiento:** exige **mantenimiento**. Marcar lo que se consume.
- **Qué aprenderíamos:** si alguna familia mantendría un inventario (spoiler:
  ninguna app de despensa ha sobrevivido a la semana 3).
- **Contradicciones:** convierte el producto en una tarea permanente. Rompe
  *ningún diseño puede obligar a un hábito* y *nada pide completitud*.
- **Ventaja a largo plazo:** el dato sería oro. El coste de obtenerlo lo mata.
- **Veredicto:** ❌ **descartado como Home.** Es la versión cara de H-C: *lo que
  falta* es el complemento del inventario y **es gratis**, porque la familia solo
  anota la diferencia, que es lo único que le importa.

---

### H-G · El Home es un renglón *(A3, la captura instantánea)*

- **Qué representa:** abrir = un campo tipo Spotlight. Apuntas y se cierra. La
  libreta existe pero no se enseña.
- **Emoción:** ligereza extrema. Coste de anotar casi cero.
- **Comportamiento:** máxima frecuencia de anotación; **cero contacto** con lo
  acumulado.
- **Qué aprenderíamos:** si la necesidad 1 (soltar) domina tanto a la necesidad 2
  (comprobar) como para no enseñar nada más. Es el único concepto capaz de
  **falsar** "la libreta es el Home", y por eso merecía llegar hasta aquí.
- **Contradicciones:** una, y es fatal. **Nunca deja ver la prueba de que se
  guardó.** HD-6 dice que "puedes volver" se diseña contra el miedo *¿se habrá
  guardado?*, y la respuesta era **ver su texto**. Un renglón que se cierra pide
  fe. Además destruye la necesidad 2 entera: no hay nada que comprobar.
- **A seis meses:** la familia acumula 40 líneas que nunca ha visto juntas y el
  primer encuentro con ellas es un susto.
- **Veredicto:** ✂️ **no como Home, sí como atajo.** Es un widget / acción rápida
  / notificación, no la puerta. **Y ahí es excelente.**

---

### H-H · El Home es el hilo de la casa

- **Qué representa:** una cronología conversacional: quién anotó qué y cuándo.
  El WhatsApp familiar, pero que además compra.
- **Emoción:** pertenencia. La compra es de todos.
- **Comportamiento:** anotar se vuelve un acto social; sube la frecuencia.
- **Qué aprenderíamos:** si la compra es de una persona o de una casa — **la
  pregunta abierta nº 9 de la PO**.
- **Contradicciones:** el tiempo pasa a ser **estructura** (variante A de HD-13),
  y la recomendación de partida era la opuesta: *el tiempo va en el margen, nunca
  dentro del texto*. Un hilo con horas y autores hace que lo de hace cuatro días
  se vea **viejo**, no acompañado. Y B3 ya resolvió lo social con una marca
  mínima, sin pagar este precio.
- **Ventaja a largo plazo:** real y grande, si la libreta es de una casa.
- **Veredicto:** 🕓 **aplazado**, atado a la decisión 9. Hoy sería comprometer
  arquitectura por una hipótesis sin validar.

---

### H-I · El Home no está en la app *(F2 · el sobre)*

- **Qué representa:** la entrada ocurre **donde vive la evidencia**: el menú
  compartir del móvil, el teclado, una notificación. La app es donde aterriza.
- **Emoción:** invisibilidad. El producto nunca te hace ir a ningún sitio.
- **Comportamiento:** captura en el momento exacto, sin abrir nada.
- **Qué aprenderíamos:** si la compra nace fuera de la app (muy probable: nace en
  WhatsApp y en la cocina).
- **Contradicciones:** ninguna. **Amplifica** *"pega lo que sea"*.
- **Tensión, que no contradicción:** si todo entra por fuera, **el Home deja de
  ser el centro** y pasa a ser el sitio donde se revisa lo que llegó. Es la
  apuesta más grande del abanico y sigue siéndolo.
- **A seis meses:** es probablemente el canal de entrada nº 1. Pero un canal no es
  un Home: **sigue haciendo falta un sitio donde ver que llegó.** Refuerza H-C.
- **Veredicto:** ✅ **complementario, no alternativo.** No se puede prototipar en
  papel; merece pregunta directa en entrevista.

---

### H-J · El Home es la compra anterior *(concepto C)*

- **Qué representa:** abres y ya hay un carrito propuesto con lo de la última vez.
  La familia **quita**, no construye.
- **Emoción:** las dos a la vez: magia y desconfianza.
- **Comportamiento:** máquina de correcciones — muchísima señal para el perfil.
- **Qué aprenderíamos:** H3 y H6 de frente, y rápido.
- **Contradicciones:** roza *un producto solo suma al total si conocemos su
  cantidad*, y frontalmente *la foto marca la frontera*: un carrito en la puerta
  es comprar antes de escribir. Solo es defendible si no suma hasta que se toca.
- **Ventaja a largo plazo:** resuelve el arranque en frío de la semana 2 en adelante.
- **Veredicto:** ✂️ **no como Home, sí como contenido.** Su valor real ya está
  capturado por **C1 · el eco**: la compra anterior devuelta **en lápiz, dentro de
  la libreta, línea a línea**, sin fotos y sin sumar. El eco es H-J domesticado.

---

### H-K · El Home es el calendario de la casa

- **Qué representa:** *"esta semana toca detergente"*. El producto predice por
  frecuencia.
- **Emoción:** asistencia real… o presión, según el tono.
- **Comportamiento:** aceptar/rechazar propuestas.
- **Contradicciones:** hoy es imposible — la dimensión 5 está declarada y sin
  lógica (§2 "lo que NO existe"). Y un calendario **es** una agenda: agenda
  incumplida = culpa, que §4 prohíbe.
- **A seis meses:** aquí sí vive, pero **como contenido del eco**, no como Home.
- **Veredicto:** 🕓 **aplazado.** Es combustible de H-C, no un competidor.

---

### H-L · El Home es un buzón vacío *(el buzón puro)*

- **Qué representa:** un espacio que acepta cualquier evidencia y no recuerda nada.
- **Emoción:** libertad total, cero compromiso.
- **Contradicciones:** *el trabajo del usuario no se pierde jamás*. Un buzón sin
  memoria es amnesia con buena prensa.
- **Veredicto:** ❌ **descartado.** El buzón ya vive como filosofía transversal
  (§H-D concepto A), no necesita ser una pantalla.

---

## 2. Matriz comparativa

Criterios elegidos por lo que este producto necesita, no por lo genérico:

- **Martes** — ¿da una razón real para abrir un martes sin comprar?
- **5 s** — ¿la visita de cinco segundos es exitosa aunque no escriba nada?
- **Señal** — ¿cuánto deposita en el activo (perfil / historial)?
- **Sin explicar** — ¿se entiende sin que nadie lo cuente?
- **Coherencia** — ¿respeta los principios de §4?
- **Semana 26** — ¿aguanta seis meses de uso o se degrada?

| # | Filosofía | Martes | 5 s | Señal | Sin explicar | Coherencia | Semana 26 | Veredicto |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **H-C** | **Lo que falta en casa** | ●●●● | ●●●● | ●●●● | ●●● | ●●●● | ●●●● | ⭐ **recomendada** |
| H-A | La libreta (hoy) | ●●● | ●●● | ●●● | ●●● | ●●●● | ●●○ | base de H-C |
| H-I | El sobre (fuera de la app) | ●●●● | — | ●●● | ●○○ | ●●●● | ●●●● | ✅ complementaria |
| H-G | Un renglón | ●●●● | ●○○ | ●●○ | ●●● | ●●○ | ●●○ | ✂️ atajo, no Home |
| H-J | La compra anterior | ●●○ | ●●○ | ●●●● | ●●● | ●○○ | ●●● | ✂️ ya es el eco |
| H-B | Volver donde estabas | ●○○ | ●●○ | ●○○ | ●●● | ●●○ | ●●○ | ✂️ regla, no Home |
| H-H | El hilo de la casa | ●●●● | ●●● | ●●●● | ●●● | ●●○ | ●●● | 🕓 atado a decisión 9 |
| H-K | El calendario | ●●● | ●●○ | ●●● | ●●○ | ●●○ | ●●● | 🕓 contenido del eco |
| H-F | La despensa | ●●● | ●●○ | ●●●● | ●●○ | ●○○ | ●○○ | ❌ exige mantenimiento |
| H-D | El resumen semanal | ●○○ | ●●○ | ●○○ | ●●●● | ●○○ | ●●○ | ❌ dashboard |
| H-E | El carrito vivo | ●○○ | ●○○ | ●●○ | ●●● | ●○○ | ●●○ | ❌ rompe la frontera |
| H-L | El buzón vacío | ●●○ | ●○○ | ●○○ | ●●● | ●○○ | ●○○ | ❌ sin memoria |

**Lectura de la matriz:** ninguna alternativa gana a la libreta en coherencia.
Las tres que la superan en *razón para abrir el martes* (H-I, H-G, H-H) no son
Homes — son **canales de entrada** o **modelos colaborativos**. Y las cuatro que
sí querían ser Home (H-D, H-E, H-F, H-J) rompen un principio de §4 cada una.

---

## 3. Recomendación

### La conclusión incómoda primero

**SuperCarrito no necesita un Home. Ya tiene uno, y no lo sabíamos del todo.**

No hay que construir una pantalla nueva. Lo que hay que corregir es **qué creemos
que es la pantalla que ya tenemos**. Hoy la describimos como *"la libreta"* —un
continente, un sitio donde escribir—. Y un continente vacío no da razones para
volver un martes.

> ### Recomendación: el Home es **lo que falta en casa**, y su forma es la libreta.
>
> Mismo píxel, otra identidad. **Deja de ser un documento que la familia mantiene
> y pasa a ser el estado de una casa que el producto sostiene.**

### Por qué esta y no otra

1. **Contesta la pregunta del sprint sin inventar nada.** Se vuelve el martes
   porque *se acabó algo*, y eso ocurre cuatro veces por semana. "Hacer la lista"
   ocurre cero veces por semana: nadie hace eso.
2. **Hace que la visita de cinco segundos sin escribir sea exitosa.** Con H-A
   (*"tu libreta"*), abrir y no escribir es no haber hecho nada. Con H-C, abrir y
   ver *lo que falta* **es** el servicio: la prueba de que no tienes que acordarte.
3. **Explica por qué el eco no es una sugerencia sino contenido legítimo.** Si el
   Home es *lo que falta*, lo que compras cada semana y hoy no está anotado
   **falta de verdad**. C1 deja de ser una recomendación de catálogo (que
   necesitaría justificarse) y pasa a ser el Home haciendo su trabajo.
4. **Resuelve el problema de la semana 26 de H-A.** La libreta ya no empieza cada
   semana en blanco: empieza con lo que quedó pendiente y, con el tiempo, con lo
   que el ritmo de la casa deduce. **En lápiz, sin foto, sin sumar.**
5. **Es la única lectura compatible con H-I (el sobre).** Si la entrada migra al
   menú compartir, el Home no pierde su razón de ser: sigue siendo el único sitio
   donde ver el estado acumulado.
6. **No re-litiga nada de §4.** Es la misma decisión —*la libreta es el Home*—
   con su identidad afilada. Todo el sistema visual aprobado sigue válido, sin
   tocar un token.

### Lo que NO cambia (y es la mitad del valor de la recomendación)

- La libreta sigue ocupando casi toda la pantalla. Sin fotos, sin precios.
- "Hacer la compra" sigue fantasma, siempre disponible, siempre discreto.
- El cursor sigue puesto al abrir. Ninguna pantalla se interpone.
- Nada de días, badges, contadores ni progreso. El tiempo sigue siendo **el aire**.
- Ninguna pantalla aparece **antes** de la libreta.

### Lo que sí cambia — cuatro movimientos concretos

| # | Cambio | Por qué |
|---|---|---|
| **1** | El encabezado deja de ser un título de documento. Hoy dice `Casa · lunes`; el día se va. | La fecha es lo único de la pantalla que puede leerse como *retraso*. El aire ya cuenta el tiempo (HD-13 · C). |
| **2** | El pie deja de contar cosas anotadas y pasa a nombrar el estado: **`falta en casa`**. Sin número grande, sin evaluación. | *"12 cosas anotadas"* mide el rendimiento de la familia. *"falta en casa"* describe la casa. |
| **3** | El eco (C1) **no es una función opcional del Home: es su contenido en reposo.** Cuando no hay nada anotado, lo que falta según el ritmo de la casa es lo que se ve —en lápiz, tocable, nunca sumado. | Sin esto, el Home está vacío 5 de 7 días y no da razón para volver. |
| **4** | Continuidad **con caducidad** (H-B domesticado): si vuelves en minutos a media compra, vuelves al carrito; si vuelves horas o días después, vuelves **siempre a la libreta**. | Devolver una compra a medias tres días después es entregar una tarea pendiente — la anti-pantalla. |

### Lo que se rechaza explícitamente, para no volver a discutirlo

Un dashboard semanal · un carrito permanente en la puerta · un inventario de
despensa · una pantalla de bienvenida · pestañas Lista/Menú/Recetas/Imagen ·
restauración ciega del último estado · un Home porque toda app tiene Home.

### Hipótesis nuevas que esto abre (a falsar con familias)

| # | Hipótesis | Cómo se falsa |
|---|---|---|
| **HD-15** | *"Lo que falta"* se lee como un hecho de la casa, no como un reproche a la persona. | Si alguien dice *"me falta hacer eso"*, *"voy atrasada"* o justifica por qué no ha comprado. **Si falla, el pie vuelve a ser neutro; el modelo mental no cambia.** |
| **HD-16** | La familia abre entre semana sin intención de comprar, y esa visita se siente útil aunque no escriba. | Si nadie abre entre semana, o si al abrir y no escribir dice *"no tenía nada que hacer aquí"*. **Es la hipótesis que define el producto.** |
| **HD-17** | El eco en reposo (lo que falta según el ritmo) se percibe como servicio y no como intrusión ni como carrito encubierto. | Si intenta borrarlo, si pregunta *"¿ya lo compré?"*, o si cree que eso **ya está** en su compra. |
| **HD-18** | Volver a la libreta —y no al carrito— tras días es un alivio, no una pérdida. | Si busca *"dónde quedó mi compra"* o rehace trabajo. |

---

## 4. La experiencia completa del Home

### Qué aparece, qué desaparece

```
SIEMPRE                      libreta (casi toda la pantalla) · cursor al final
                             "Hacer la compra" (fantasma, discreto, inmutable)

CUANDO HAY MOTIVO            eco en lápiz (lo que falta y no está anotado)
                             marca de lo pegado (barra al costado, se va sola)
                             aviso de pegado + Deshacer (efímero, ~6 s)
                             labio del carrito (solo si hay algo que comprar)

NUNCA APARECE                fotos · precios · días · badges · progreso
                             "sigues sin terminar" · rachas · ilustraciones
                             menú · pestañas · pantalla de bienvenida
```

### Jerarquía (de más a menos peso visual)

```
1. lo que escribió la familia            tinta · 17 px · peso 500
2. la línea activa + cursor              lo único nítido (A2)
3. el eco                                lápiz · 12,5 px · tocable
4. "Hacer la compra"                     fantasma · nunca verde
5. el labio del carrito                  borde inferior, asa visible
6. el encabezado                         mínimo, sin fecha
```

**La regla de oro de la jerarquía:** nada de lo que dice el producto puede tener
más peso que lo que escribió la familia. Si alguna vez ocurre, el Home dejó de
ser suyo.

### Navegación — un lugar, dos alturas y una salida (E3)

```
                    ┌──────────────────────────┐
        ┌──────────▶│         LIBRETA          │◀──────────┐
        │           │   (superficie · Home)    │           │
        │           └────────────┬─────────────┘           │
        │              "hacer la compra"                   │
        │                        ▼                         │
        │           ┌──────────────────────────┐           │
   "volver a        │         CARRITO          │  ← se levanta,
   la libreta"      │  (hoja · efímero)        │    no navega
        │           └────────────┬─────────────┘           │
        │                    confirmar                     │
        │                        ▼                         │
        │           ┌──────────────────────────┐           │
        └───────────│         CIERRE           │───────────┘
                    │   (pantalla completa,    │
                    │    dura 4 segundos)      │
                    └──────────────────────────┘
```

- **No hay navegación. Hay altura.** El carrito no es otra pantalla: es una hoja
  que se levanta sobre la libreta. La libreta se ve debajo, siempre. Nunca sales
  de tu sitio. (320 ms, la única sombra con peso del producto.)
- **No hay botón "atrás" que haya que buscar:** se baja la hoja con el asa, con un
  gesto o tocando la libreta que asoma. Tres formas para el mismo camino de vuelta.
- **La única pantalla completa de todo el producto es el cierre de compra**, y
  dura lo que dura leerla. Es el precio de que comprar sea un acto identificable.
- **La boleta y el histórico se llegan solo desde el cierre**, nunca desde el
  Home. Mirar hacia atrás no puede ser una opción permanente en la puerta.

### Relación con la libreta

El Home **es** la libreta. No la contiene, no la enlaza, no la resume. Si alguien
pregunta *"¿y dónde está mi libreta?"*, el diseño falló.

### Relación con el carrito

La frontera vive intacta, y ahora tiene una consecuencia más precisa:

| | Libreta (Home) | Carrito |
|---|---|---|
| Qué es | lo que falta en casa | lo que vamos a comprar hoy |
| Permanencia | permanente | efímero |
| Orden | el suyo | el nuestro |
| Fotos | **ninguna** | **en cada línea** |
| Precios | ninguno | montos explicables |
| Exige | nada | confirmación |
| Al cerrar | queda lo no comprado | desaparece entero |

**El carrito nunca reescribe la libreta (HD-9).** Y al comprar, la libreta no se
vacía: **se resuelve**. Lo comprado se va sin ceremonia; lo no comprado se queda
con una línea en lápiz que explica por qué sigue ahí. Esa diferencia —entre lo
que pensó y lo que compró— es la señal más limpia que tenemos.

### Qué lugar ocupa dentro de la aplicación

**El Home no es una sección del producto. Es el producto en reposo.**

Todo lo demás —carrito, elección, cierre, boleta— es el producto *ocurriendo*, y
tiene principio y fin. El Home no empieza ni termina: está. Por eso no lleva
título de pantalla, no aparece en ningún menú y no hay forma de "ir" a él: solo
de volver.

### Los cinco segundos del martes, dibujados

```
┌──────────────────────────────┐   0,0 s  abre
│  Casa                        │   0,4 s  ve lo suyo, tal cual lo dejó
│                              │   0,6 s  no hay nada que le reproche nada
│  galletas para el lonche     │
│  jabón                       │   ── AQUÍ YA GANAMOS ──
│                              │      no tiene que acordarse. Esa es la promesa.
│  ▌                           │   1,2 s  el cursor ya está puesto
│                              │   1,4 s  escribe "papel higiénico"
│  ⌁ leche · sueles el jueves  │   3,0 s  ve el eco. lo toca (o no).
│                              │   4,0 s  cierra. No pasó nada más.
│  [ Hacer la compra ]         │
│  ─────────────────────────   │   Y NO COMPRÓ NADA.
│  3 · falta en casa       S/ —│   Y la visita fue un éxito.
└──────────────────────────────┘
```

---

## 5. Wireframes de la dirección elegida

Baja fidelidad, una pregunta por wireframe (regla de la PO).

### W1 · Martes · lo que falta

```
┌─────────────────────────────────────┐
│  Casa                               │  ← sin fecha. sin menú.
│                                     │
│  galletas para el lonche            │  tinta
│  jabón                              │  tinta
│                                     │  ← aire = el tiempo
│  ▌                                  │  ← cursor puesto al abrir
│                                     │
│  ⌁ leche                            │  lápiz · el eco en reposo
│  ⌁ papel higiénico                  │  lápiz
│                                     │
│  [ Hacer la compra ]                │  fantasma. inmutable.
│ ─────────────────────────────────── │
│  2 · falta en casa            S/ —  │  labio del carrito
└─────────────────────────────────────┘
```
*Valida:* **HD-16.** ¿Abrir sin escribir se siente útil, o se siente vacío?

### W2 · El eco se gana el derecho a preguntar

```
│  jabón                              │
│  yogurt              ▌              │  ← acaba de escribirlo
│  ⌁ Gloria fresa 1 L, 2 · como       │
│    siempre        [Sí]  [Otro]      │  ← solo tras verlo 2 veces
```
*Valida:* **HD-17.** ¿Servicio o intrusión? ¿"Otro" se entiende como campo libre?

### W3 · Se levanta el carrito (nunca sales de la libreta)

```
┌─────────────────────────────────────┐
│  galletas para el lonche            │  ← la libreta sigue ahí, arriba
│  jabón                              │
│ ╭─────────────────────────────────╮ │  ← asa. una sola sombra con peso.
│ │  ▭  Galletas Margarita  1 · 4.50│ │  ← foto en CADA línea
│ │  ▭  Jabón Bolívar      2 · 3.20 │ │
│ │  ▭  Yogurt Gloria   ¿cuánto?    │ │  ← pendiente. no suma.
│ │                                 │ │
│ │  Subtotal confirmado    S/ 10.90│ │
│ │  1 producto pendiente           │ │
│ │  [ Confirmar la compra ]        │ │  ← lleno. el único de la pantalla.
│ ╰─────────────────────────────────╯ │
└─────────────────────────────────────┘
```
*Valida:* ¿entiende que sigue en su sitio, o cree que cambió de pantalla?

### W4 · El lunes siguiente — la libreta se resolvió, no se vació

```
┌─────────────────────────────────────┐
│  Casa                               │
│                                     │
│  galletas para el lonche            │  ← no se compró. sigue.
│  ⌁ quedó de la semana pasada        │  ← lápiz. sin culpa. sin fecha.
│                                     │
│  ▌                                  │
│                                     │
│  ⌁ leche                            │  ← el eco vuelve a llenar el Home
│                                     │
│  [ Hacer la compra ]                │
└─────────────────────────────────────┘
```
*Valida:* **HD-18** y HD-13. ¿"Quedó" se lee como cuidado o como deuda?

---

## 6. Prototipo navegable

`design/prototipo-home.html` — un solo archivo, se abre en el navegador, sin
dependencias. Recorre el ciclo completo:

```
libreta (martes) → escribir → eco → hacer la compra → carrito (se levanta)
   → resolver un pendiente → confirmar → cierre → libreta (lunes siguiente)
```

Se puede escribir de verdad, pegar de verdad (Ctrl+V), tocar los ecos, levantar y
bajar el carrito, y reiniciar la semana. Usa los tokens del sistema visual
aprobado, sin cambiar ninguno.

**Qué observar cuando esté delante de una familia:**
1. Al abrir, ¿escribe, lee, o busca un menú?
2. ¿Abre otra vez sin que se lo pidamos? *(HD-16, la que decide todo.)*
3. ¿Qué dice al ver el eco? ¿Lo toca? ¿Cree que ya está en su compra? *(HD-17)*
4. Al levantarse el carrito, ¿dice "salí de mi lista" o "se abrió abajo"?
5. Al ver el pie *"falta en casa"*, ¿habla de la casa o de sí misma? *(HD-15)*
6. La semana 2, ¿lo que quedó se lee como cuidado o como reproche? *(HD-18)*

---

## ⏸ Decisiones que solo la PO puede tomar

13. **¿Se acepta el afinado de identidad —de *"la libreta"* a *"lo que falta en
    casa"*—?** No es re-litigar §4: la libreta sigue siendo el Home. Cambia lo que
    creemos que es esa superficie, y con ello el encabezado, el pie y el estatus
    del eco.
14. **¿El eco en reposo entra al prototipo de entrevistas?** Es lo que da razón
    para volver un martes, y es también el mayor riesgo de intrusión (HD-17).
15. **¿Se prueba H-G (un renglón) como atajo en la misma entrevista**, o se deja
    fuera para no contaminar la lectura del Home?
