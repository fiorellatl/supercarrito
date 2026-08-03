# La última milla

**Investigación de arquitectura · 2026-08-03.** Encargo: explorar *todas* las
formas razonables de que una compra preparada en SuperCarrito continúe en el
supermercado con el mínimo esfuerzo. Sin implementar nada.

---

## 0 · Antes de comparar nada: la premisa del sprint era falsa

Este sprint nació de una conclusión mía: «el handoff mediante `cart/add` no
funciona de forma fiable». **Es incorrecta.** Al empezar a medir arquitecturas
alternativas encontré la causa real del fallo, y no era la arquitectura.

**El handoff funciona. Nos habíamos equivocado de canal de venta.**

Probamos `sc=1` (401) y `sc=2` (200 y carrito vacío). La tienda no usa ninguno de
los dos: **wong.pe opera en el canal `70`**, y lo publica en un endpoint público,
`GET /api/segments` → `{"channel":"70", …}`.

Medido hoy contra www.wong.pe, leyendo siempre el carrito para comprobarlo:

| Prueba | Resultado |
|---|---|
| `POST /orderForm/{id}/items?sc=70` desde el navegador | ✅ 200 · **2 ítems dentro**, S/ 62.10 |
| Lo mismo **desde un servidor**, sin navegador ni cookies previas | ✅ 200 · **2 ítems dentro**, S/ 62.10 |
| `GET /checkout/cart/add?sku=530&qty=1&seller=1&sc=70` | ✅ carrito real: **«Tienes 3 ítems»** |
| Enlace con **35 productos** (1 010 caracteres) | ✅ **los 35 entraron** · 40 ítems, S/ 1 079.57 |
| Producto al peso (trucha, `unitMultiplier` 0.4, `qty=3`) | ✅ **1,2 kg · S/ 37.08** — nuestro redondeo era exacto |
| Repetir el mismo enlace | ✅ **no duplica**: fija la cantidad, no la suma |
| Carrito armado **en el servidor** y abierto con `?orderFormId=…` | ✅ el navegador **lo adopta**: 3 ítems, S/ 135.90 |

Dos cosas que conviene decir con todas las letras:

1. **El catálogo que ya guardamos es el catálogo correcto.** `lib/wongvtex.ts`
   busca sin `sc`, y el valor por defecto de la tienda es justamente 70. Los SKUs
   que llevamos meses guardando son válidos en el canal donde sí se puede
   escribir. No hay que remigrar nada.
2. **El error anterior no fue de método, fue de cobertura.** El método —leer el
   carrito, no fiarse del código de respuesta— es el que ha encontrado esto. Lo
   que faltó fue preguntarle a la tienda en qué canal vive antes de suponerlo.

El documento anterior, `integracion-wong-investigacion.md`, queda **corregido en
su conclusión principal**: sí existe una vía técnica para llenar el carrito de
una familia sin acuerdo con Wong. Lo demás de aquel documento (appKey, Shareable
Cart, regionalización) sigue siendo válido.

⚠️ `lib/entrega.ts` conserva un comentario de cabecera que hoy es falso («EL
ENLACE DE CARRITO NO FUNCIONA»). No lo he tocado porque este sprint es de
investigación. Es una trampa para quien lea el código: conviene corregirlo en el
próximo commit.

---

## 1 · El marco: solo hay tres sitios donde puede correr el código

Toda esta lista de opciones —extensión, bookmarklet, Playwright, PWA, app de
escritorio— parece variada, pero se reduce a **dónde se ejecuta el código que
habla con Wong**. Y solo hay tres sitios posibles:

| | Dónde corre | Qué le da acceso | Qué le limita |
|---|---|---|---|
| **A** | El navegador de la familia, **navegando** | nada especial: es una URL | lo que quepa en una URL |
| **B** | El navegador de la familia, **dentro del origen wong.pe** | la sesión y las cookies de la familia | hay que instalar algo |
| **C** | **Nuestro servidor** | solo lo que sea público | no tiene la sesión de nadie |

Toda la comparación que sigue es, en el fondo, una elección entre estas tres.
Y el hallazgo del §0 la decide casi entera: **A y C funcionan hoy**, así que
todo el coste de B (instalar algo) compra un poder que ya no necesitamos.

---

## 2 · Las alternativas

### A1 · Enlace directo `cart/add` con el canal correcto ⭐

**Cómo funciona.** Construimos una URL con todos los SKUs, cantidades y `sc=70`.
La familia la toca y aterriza en su carrito de Wong, lleno.

- **Experiencia:** un toque. Es la promesa original, intacta.
- **Complejidad:** mínima. Es el código que ya teníamos más un parámetro.
- **Mantenimiento:** casi nulo. El `sc` se lee en caliente de `/api/segments`, así
  que si Wong cambia de canal nos enteramos solos.
- **Riesgos:** que Wong cierre el canal (improbable: es su propio storefront); la
  longitud de la URL (35 productos = 1 010 caracteres; el límite práctico ronda
  los 2 000, o sea ~70 productos).
- **Seguridad:** perfecta. No tocamos credenciales, no tocamos cookies, no
  tocamos pagos. La sesión es suya y ocurre en su navegador.
- **Escalabilidad:** infinita. Es una cadena de texto; no hay infraestructura.
- **Dependencia del súper:** media. Usamos un formato **documentado por VTEX**,
  no un comportamiento inventado, pero sin acuerdo con ellos.
- **Probabilidad de funcionar en producción:** **alta, verificada en escritorio.**
  Pendiente el móvil (§4).

### A2 · Carrito armado en nuestro servidor y traspasado por `orderFormId` ⭐

**Cómo funciona.** Nuestro servidor crea un carrito en Wong, le mete los
productos, **lo lee para comprobar qué entró de verdad**, y le pasa a la familia
un enlace `…/checkout/?orderFormId=…#/cart`. El navegador lo adopta.

- **Experiencia:** igual de buena que A1, y además podemos enseñar el total real
  *antes* de que se vaya.
- **Complejidad:** media. Estado en servidor, carritos que caducan.
- **Mantenimiento:** medio.
- **Riesgos:** el grande es que **el carrito adoptado sustituye al que la familia
  ya tuviera**. Si habían metido tres cosas ayer, desaparecen sin avisar. Eso
  choca de frente con «nunca ajustamos un dato del usuario en silencio».
  Con cuenta iniciada, además, no está verificado si VTEX fusiona o rechaza.
- **Seguridad:** buena, con un matiz: el `orderFormId` es un secreto de facto
  —cualquiera que lo tenga lee ese carrito, lo comprobé—. No debe viajar por
  sitios públicos.
- **Escalabilidad:** buena, pero ya es infraestructura.
- **Dependencia del súper:** media, la misma que A1.
- **Probabilidad:** **alta, verificada.** Pero paga un precio que A1 no paga.

> **La combinación que recomiendo sale de aquí:** A2 no como forma de entregar,
> sino como **forma de verificar**. Ver §5.

### B1 · Extensión de navegador

La idea que te intrigaba. La he mirado en serio, y la conclusión es que es una
buena arquitectura **para un problema que ya no tenemos**.

**Cómo funciona.** Una extensión con permiso sobre `wong.pe` inyecta un script
que, con la sesión ya abierta de la familia, llama a la API de checkout desde el
propio origen. Es exactamente lo que hice hoy con la consola del navegador, y
funciona.

- **Experiencia:** excelente *después* de instalarla. Antes: hay que descubrirla,
  instalarla y conceder permisos sobre un sitio donde la familia paga. Ese último
  paso es un muro de desconfianza real, y con razón.
- **Complejidad:** alta. Manifest V3, service worker, mensajería entre la
  extensión y nuestra web, empaquetado distinto para Chrome, Edge, Firefox y
  Safari.
- **Mantenimiento:** alto y **ajeno**: revisiones de la Chrome Web Store,
  políticas que cambian, la migración MV2→MV3 (ya completada, pero indicativa de
  cuánto se mueve el suelo).
- **Riesgos:** rechazo o retirada de la tienda de extensiones; una extensión con
  permisos sobre el súper es un objetivo de seguridad muy goloso.
- **Seguridad:** cumple tu restricción —nunca vemos contraseñas—, pero **amplía
  la superficie**: pedimos permiso permanente para ejecutar código en el sitio
  donde la familia mete su tarjeta.
- **Escalabilidad:** excelente. Tenías razón en eso: el trabajo lo hace el
  dispositivo de cada familia, no nuestra infraestructura.
- **Dependencia del súper:** baja si usamos su API; alta si tocamos su DOM.
- **Probabilidad de funcionar en producción:** técnica, alta. **De adopción,
  baja**, y por un motivo que la mata: **no hay extensiones en móvil.** Chrome
  para Android no las soporta; Kiwi, que era la salida, cerró en 2025; en iOS
  existen las de Safari pero se distribuyen por la App Store. La compra del
  súper se decide y se hace en el teléfono. Una solución que solo vive en el
  escritorio no cubre el caso principal.

**Veredicto:** guardarla. Es la mejor carta *si* Wong cierra el canal 70, porque
es la única que no depende de que nos dejen nada. Hoy no.

### B2 · Bookmarklet

Un marcador con `javascript:` que la familia toca estando en wong.pe.

- **Experiencia:** mala. Guardar un marcador especial y saber invocarlo desde la
  barra de marcadores es un gesto de programador. En iOS, además, hay que
  editarlo a mano.
- **Complejidad:** muy baja (una tarde). **Mantenimiento:** bajo.
- **Riesgos:** navegadores que restringen `javascript:`; el enlace se rompe si la
  familia lo copia mal.
- **Seguridad:** buena, mismo modelo que B1 pero sin permisos permanentes.
- **Escalabilidad:** infinita. **Dependencia:** baja.
- **Probabilidad:** técnicamente alta; **con familias reales, muy baja.**
- **Dónde sí sirve:** como herramienta *nuestra* de depuración. Barata y útil.

### B3 · Userscript (Tampermonkey)

Igual que B2 pero además hay que instalar Tampermonkey. Suma la fricción de B1 y
la torpeza de B2 sin las ventajas de ninguno. **Descartado.**

### B4 · Atajos de iOS · *la carta exótica*

Un Atajo de Apple con la acción «Ejecutar JavaScript en la página web» corre
nuestro código sobre wong.pe en Safari móvil, con la sesión de la familia. Es la
**única** vía de tipo B que existe en un teléfono.

- **Experiencia:** aceptable tras instalarlo; se invoca desde el menú Compartir.
- **Complejidad:** baja. **Mantenimiento:** bajo. **Escalabilidad:** infinita.
- **Riesgos:** solo iOS, solo Safari, y la instalación de Atajos de terceros
  asusta —con razón— a cualquiera que no sea entusiasta.
- **Probabilidad:** baja como producto; **interesante como plan B para iPhone**
  si el móvil resulta ser el muro (§4).

### C1 · Playwright remoto con la sesión de la familia

**Choca con tu restricción y con la línea roja del proyecto.** Para conducir su
sesión desde nuestra infraestructura habría que custodiar sus cookies de sesión,
que en la práctica es custodiar su cuenta. Además: un navegador por familia no
escala, y automatizar el checkout de un tercero invita a que lo bloqueen.
**Descartado por principio, no por dificultad.**

### C2 · Playwright local

Se ejecuta en el ordenador de la familia; ella se autentica en una ventana
visible. Respeta la restricción. Pero exige instalar Node y ~400 MB de
navegadores. **Descartado por distribución.** (Nota: `playwright` sigue en
`dependencies` sin usarse — está en el backlog quitarlo.)

### C3 · Aplicación de escritorio (Electron / Tauri)

Un webview donde la familia entra en Wong y nosotros inyectamos el carrito.
Funciona y respeta la restricción, pero significa firmar binarios, actualizar y
mantener tres sistemas operativos para una lista del súper. **Desproporcionado**,
y otra vez: escritorio, no móvil.

### C4 · PWA

**No resuelve este problema, y conviene no confundirse.** Una PWA sigue estando
en nuestro origen: no puede leer las cookies de wong.pe. La PWA es buena por
otras razones (instalarse en la pantalla de inicio, funcionar sin señal en el
pasillo del súper) y **merece su propio sprint**, pero no es una arquitectura de
última milla.

### D1 · Integración oficial VTEX (appKey / appToken)

Sigue siendo el camino correcto a largo plazo y sigue exigiendo que Wong emita
las llaves: un acuerdo comercial con forma de credencial. **Ya no es urgente.**
Lo que compraría hoy no es la función —la tenemos— sino la **estabilidad**: un
permiso explícito que no dependa de que su storefront siga comportándose así.

### D2 · Shareable Cart / Social Selling

La app oficial de VTEX que hace exactamente esto para los asesores de la tienda.
Requiere que Wong nos dé rol dentro de su cuenta. Misma puerta que D1.

### D3 · Cambiar la promesa: abrir cada producto

Lo que recomendé la semana pasada y lo que está hoy en producción. **Deja de ser
la recomendación** y pasa a ser lo que debe ser: **el modo degradado**. Si el
enlace falla —móvil, producto agotado, canal cambiado—, la familia todavía llega
a Wong sabiendo qué comprar. Eso es exactamente la degradación elegante que pide
la arquitectura del proyecto.

### D4 · «Mis listas» de Wong

Entregar una lista en vez de un carrito. No lo he investigado a fondo porque el
carrito ya funciona. Queda anotado.

---

## 3 · Tabla de decisión

| | Experiencia | Funciona hoy | Móvil | Manteni­miento | Depende de Wong | Cumple tu restricción |
|---|---|---|---|---|---|---|
| **A1 enlace `sc=70`** | 1 toque | ✅ verificado | ⚠️ por probar | muy bajo | media | ✅ |
| **A2 servidor + `orderFormId`** | 1 toque | ✅ verificado | ⚠️ por probar | medio | media | ✅ |
| B1 extensión | buena tras instalar | ✅ técnicamente | ❌ **no existe** | alto | baja | ✅ |
| B2 bookmarklet | mala | ✅ | ❌ | bajo | baja | ✅ |
| B4 Atajos iOS | regular | probable | solo iPhone | bajo | baja | ✅ |
| C1 Playwright remoto | 1 toque | — | — | muy alto | baja | ❌ |
| C2 Playwright local | pésima | ✅ | ❌ | alto | baja | ✅ |
| C3 app escritorio | buena | ✅ | ❌ | muy alto | baja | ✅ |
| C4 PWA | — | no aplica | — | — | — | ✅ |
| D1 appKey oficial | 1 toque | ❌ sin acuerdo | ✅ | bajo | **total** | ✅ |
| D3 abrir cada producto | N toques | ✅ | ✅ | muy bajo | baja | ✅ |

---

## 4 · El único riesgo serio que queda abierto: el móvil

La app de Wong declara `handle_all_urls` en su `assetlinks.json` de Android:
reclama **todas** las URLs del dominio. Cuando probaste desde el teléfono, la app
se abrió y el carrito estaba vacío.

**Ese resultado ya no prueba nada**, porque el enlace que probaste llevaba `sc=2`
y no habría llenado ningún carrito ni en escritorio. **Hay que repetir la prueba
en el móvil con `sc=70`.** Son dos minutos y decide la arquitectura.

Y si la app sí se come los parámetros, hay salida, al menos en iPhone: su
`apple-app-site-association` **excluye explícitamente las URLs con el parámetro
`qcart`** para que abran en el navegador. Comprobé que añadir `&qcart=1` a
nuestro enlace no lo rompe: el carrito se llenó igual. Es una puerta que Wong
dejó abierta a propósito. En Android no hay equivalente limpio, y ahí el modo
degradado sería D3.

---

## 5 · Recomendación

Si tuviera que construir esto hoy como una startup pequeña, sin acceso
privilegiado a Wong ni a Cencosud:

> **Entregar con A1. Verificar con A2. Degradar a D3. Empezar la conversación de
> D1 sin depender de ella.**

Y en concreto:

**1. El enlace es la entrega.** `cart/add` con el canal leído en caliente de
`/api/segments`, nunca escrito a mano. Un toque, sin instalar nada, sin
infraestructura, en cualquier navegador, y **añadiendo** a lo que la familia ya
tuviera en su carrito en vez de borrárselo. Ninguna otra opción combina eso.

**2. El servidor es el verificador, no el entregador.** Antes de enseñar el
enlace, armamos ese mismo carrito en un carrito desechable y **lo leemos**. Así
sabemos, con evidencia y no con suposiciones, cuántos productos entrarán, a qué
precio real y con qué promociones, y podemos decírselo a la familia antes de que
salga de la app. Esto es la lección de las últimas semanas convertida en
arquitectura: *nunca prometemos una entrega que no acabamos de comprobar*. Y
alimenta el principio de que todo monto debe ser explicable, con el precio de
checkout y no con el de catálogo.

**3. D3 es el modo degradado, no el plan.** Si la verificación falla o el móvil
se come el enlace, la familia sigue llegando a Wong sabiendo qué comprar. Ya está
construido: no se tira nada de esta semana.

**4. La extensión se queda en la recámara.** Tenías razón en que merecía estar en
la comparación —es la más elegante de las que dan acceso a la sesión, y la única
que escala sin infraestructura— pero pierde por una razón que no se puede
argumentar en contra: **no hay extensiones en el móvil**, y la compra se hace en
el móvil. Si algún día Wong cierra el canal 70, es la primera carta que jugaría,
porque no depende de que nadie nos autorice.

**Por qué esta combinación y no la más sofisticada:** es la que se puede poner
delante de una familia esta semana. No pide instalar nada, no pide permisos, no
guarda credenciales, no añade infraestructura, y deja el negocio validable a la
velocidad de las entrevistas, que es la única velocidad que importa ahora.

---

## 6 · Antes de dar esto por bueno

Con la cuenta real, que es la única prueba que vale:

1. **Móvil con `sc=70`.** Lo que decide todo (§4).
2. **Con la sesión iniciada.** Verificado anónimo; con cuenta, no.
3. **Con una tienda/zona asignada.** Nuestro canal se midió con `regionId: null`.
   Falta comprobar que 70 sigue siendo el canal cuando hay tienda elegida, y que
   los precios coinciden.
4. **Un producto agotado** dentro del enlace: ¿entra el resto o falla todo?

Y una tarea de higiene: corregir el comentario de `lib/entrega.ts`, que hoy
afirma lo contrario de lo que sabemos.

---

## Fuentes

Medición propia contra www.wong.pe, 2026-08-03: `/api/segments`,
`/api/checkout/pub/orderForm`, `/orderForm/{id}/items`, `/checkout/cart/add`,
`/checkout/?orderFormId=`, `/api/catalog_system/pub/products/search`,
`/.well-known/assetlinks.json`, `/apple-app-site-association`.

Documentación: [How to assemble the cart URL](https://help.vtex.com/en/docs/tutorials/how-to-assemble-the-cart-url) ·
[Checkout API](https://developers.vtex.com/docs/guides/checkout-api-overview) ·
[Manifest V3 / fin de MV2](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline) ·
[Extensiones en Android: qué navegadores las soportan](https://www.quetta.net/blog/best-browsers-for-android-that-support-extensions-in-2025)
