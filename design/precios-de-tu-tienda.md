# Los precios de tu tienda

**Diseño técnico y de producto · 2026-08-03.** Objetivo: que cuando SuperCarrito
diga «tu compra cuesta S/ 182.40», Wong diga lo mismo cinco segundos después.
Sin implementar todavía.

---

## 0 · El problema, medido

Hoy leemos un catálogo **sin tienda**: el genérico de wong.pe. Y ese catálogo
miente de dos maneras distintas, las dos comprobadas hoy con la misma compra
consultada desde distintos puntos de Lima:

| Zona | Arroz 5kg | Crema de leche | Trucha x kg | Queso Laive x kg |
|---|---|---|---|---|
| Miraflores | ✓ S/ 19.90 | ✓ S/ 28.80 | ✓ S/ 30.50 | ✓ S/ 38.45 |
| San Isidro | ✓ S/ 19.90 | ✓ S/ 28.80 | ✓ **S/ 33.90** | ✓ S/ 38.45 |
| San Borja | ✓ S/ 19.90 | ✓ S/ 28.80 | ❌ **sin stock** | ✓ S/ 38.45 |
| Los Olivos | ✓ S/ 19.90 | ✓ S/ 28.80 | ❌ **sin stock** | ❌ **sin stock** |

Y el dato que más asusta: de una **compra semanal de 35 productos**, en una zona
real de Lima **12 salieron sin stock**. Hoy los habríamos enseñado todos, con
precio, y sumados al total.

**Por qué no lo detectábamos:** el catálogo genérico devuelve `AvailableQuantity:
100` para todo. No es que no miremos la disponibilidad — es que **la
disponibilidad que nos dan no existe**. Es un número de catálogo, no de tienda.

---

## 1 · La pieza que faltaba

`POST /api/checkout/pub/orderForms/simulation?sc=70`

Es el endpoint que Wong usa para calcular su propio carrito. Lo dábamos por
cerrado con 401; respondía 401 por lo mismo que todo lo demás: le faltaba el
canal. Con `sc=70` responde 200.

Le mandamos la compra entera y una ubicación. Nos devuelve, por producto:

```
{ id, price, sellingPrice, listPrice, unitMultiplier,
  measurementUnit, availability, seller }
```

y, sobre todo, **`totals` — el total calculado por Wong.**

Ese es el cambio conceptual del sprint: **dejamos de calcular el total y pasamos
a preguntarlo.** Hoy multiplicamos precio × cantidad nosotros; si Wong aplica una
promoción, un precio por local o un mínimo distinto, nuestro número se desvía. Si
el número lo da Wong, no puede desviarse.

Lo que **no** devuelve: nombre, marca, imagen. Así que la simulación **no
sustituye** a la búsqueda de catálogo: la completa. Seguimos buscando para saber
*qué* producto es, y simulamos para saber *cuánto cuesta y si lo hay*.

---

## 2 · ¿Cuándo podemos conocer la tienda?

Hay tres momentos posibles, y conviene verlos como una escalera de exactitud.

**a) Al abrir, por IP — gratis y silencioso.** Netlify nos da latitud y longitud
del visitante. Precisión: ciudad. Disponible solo en *middleware* o *edge
functions*, no en las rutas de API normales.

**b) Cuando la familia lo permite — preciso.** La API de geolocalización del
navegador da coordenadas exactas, a cambio de un permiso del sistema.

**c) Cuando la familia lo dice — exacto y permanente.** Elige su Wong de una
lista de tiendas reales. Es tu idea, y es la buena. Ver §7.

### La limitación honesta, que manda sobre todo el diseño

**No podemos saber cuál es la tienda de su cuenta de Wong.** Está dentro de su
sesión, detrás de cookies de otro dominio, y no hay forma de leerla desde fuera
—ni debe haberla—.

Por tanto: **cualquier vía automática es una inferencia.** Podemos acertar mucho,
pero no podemos garantizar el «exactamente el mismo número» que persigues sin que
la familia confirme cuál es su tienda.

Eso convierte tu intuición en la arquitectura: **preguntar no es el plan B. Es la
única forma de ser exactos.** Lo bonito es consecuencia de lo correcto, no un
adorno encima.

---

## 3 · Qué datos necesitamos

**Uno solo: `geoCoordinates` — [longitud, latitud].**

Y un resultado negativo que ahorra trabajo: **el código postal no sirve.**
Probado con cuatro códigos de Lima, todos devuelven **todo sin stock y total
cero**. VTEX no resuelve la zona por código postal en esta cuenta. Esto importa
porque el código postal es justo lo que ofrecen las bases de datos de IP: aunque
tuviéramos el CP, no valdría. Las coordenadas sí.

Lo que **no** necesitamos, y conviene decirlo: ni la dirección, ni el correo, ni
la contraseña, ni la sesión de Wong, ni ninguna integración con ellos. La familia
no nos da nada que no quiera darnos.

Lo que guardaríamos en el perfil: **coordenadas + nombre de la tienda**. Dos
campos.

---

## 4 · ¿Podemos obtenerlo sin pedir nada?

**Sí, pero no lo bastante bien para la promesa.**

La IP nos sitúa en Lima con precisión de ciudad, y Lima es exactamente donde eso
falla: Miraflores y Los Olivos dan resultados distintos para la misma compra. Un
punto en el centro de la ciudad acertaría con unas familias y fallaría con otras,
y —peor— **fallaría en silencio**: enseñaríamos un número equivocado con la misma
confianza que uno correcto.

**Propuesta:** usar la IP como **suposición inicial**, nunca como verdad. Sirve
para que la primera compra ya salga razonable sin preguntar nada, y para que la
pregunta del §7 llegue con una respuesta ya rellenada en vez de con un formulario
en blanco.

---

## 5 · Cómo cambia el flujo

**Hoy:**

```
buscar productos (N llamadas al catálogo)
   -> pintar el carrito con precios de catálogo genérico
   -> entrega
```

**Propuesto:**

```
buscar productos (N llamadas al catálogo)   ← igual, no se toca
   -> SIMULAR la compra entera (1 llamada, con las coordenadas)
   -> pintar el carrito con precio, stock y TOTAL de su tienda
   -> entrega
```

Un solo punto nuevo, entre resolver los productos y pintar el carrito. **No toca
el parser, ni el Home, ni el onboarding**, como pediste.

Lo que cambia en pantalla:

- **El total** deja de ser nuestro y pasa a ser el de Wong.
- **«No hay en tu Wong de Óvalo Gutiérrez»** sustituye a la disponibilidad
  inventada del catálogo. Un motivo con nombre propio, que además explica por qué
  ese producto no suma.
- **Los ajustes por múltiplo de venta** siguen igual: esa parte ya era correcta.

**Degradación, que aquí es obligatoria:** si la simulación falla o tarda
demasiado, se pintan los precios de catálogo **diciéndolo**: «precios
referenciales, todavía no sé cuál es tu tienda». Nunca en silencio. Es el mismo
principio que ya rige el resto del producto.

---

## 6 · Rendimiento

Medido hoy contra wong.pe, una sola llamada para la compra entera:

| Productos | Tiempo |
|---|---|
| 5 | 535 ms |
| 15 | 623 ms |
| 35 | **1 050 ms** |

Es **una** llamada, no una por producto. Comparado con lo que ya hacemos
—N búsquedas de catálogo, una por ingrediente— es marginal: añade alrededor de un
segundo a un paso que ya tarda varios.

Dónde corre: **en nuestro servidor**, como el catálogo. No añade CORS ni expone
nada nuevo al navegador.

Qué se puede cachear: el resultado por `(tienda, sku)` con vida corta —minutos—.
El stock cambia durante el día y cachearlo mucho reintroduce el problema que
venimos a resolver. **Si hay que elegir entre rápido y cierto, aquí manda cierto**:
todo este sprint existe porque enseñamos un número cómodo en vez de uno real.

---

## 7 · El momento después de la primera compra

Tu idea, y creo que es la pieza que cierra el diseño.

**Cuándo:** al volver de la primera entrega, no antes. La familia acaba de ver su
compra en Wong; es el único momento en el que la pregunta se explica sola.

**Qué se enseña** —con el nombre real de la tienda, que sí podemos obtener: la API
de puntos de retiro devuelve «Wong Óvalo Gutiérrez», «Wong Larcomar», «Wong
Bajada Balta»—:

> **¿Tu Wong es el de Óvalo Gutiérrez?**
>
> Cada tienda tiene sus precios y su stock. Si me dices cuál es la tuya, los
> precios que te enseñe serán los que vas a pagar.
>
> [Sí, ese es] · [Es otro] · [Ahora no]

**Por qué funciona como producto:** no pide un dato, ofrece una mejora. Y enseña
algo verdadero del mundo —cada tienda es distinta— que la familia ya intuye
cuando va al súper y no encuentra su queso. Convierte una limitación técnica en
lo que dijiste: *«ah, SuperCarrito sabe cuál es mi Wong»*.

**Invariantes que tiene que respetar**, y que no son negociables:

- **Toda pregunta cerrada tiene salida abierta:** «Es otro» abre la lista de
  tiendas; «Ahora no» sigue funcionando con precios referenciales, marcados.
- **Nunca en silencio:** si cambiamos de tienda, se dice y se ve.
- **Se puede cambiar después**, desde el perfil. Una familia se muda.

---

## 8 · Lo que este diseño NO resuelve

Conviene tenerlo escrito antes de construir:

1. **La tienda de su cuenta puede seguir siendo otra.** Si ella elige «Óvalo
   Gutiérrez» y su cuenta de Wong tiene asignada otra, volveremos a desviarnos.
   Mitigación: la pregunta se hace justo después de ver su carrito real, que es
   cuando más fácil le resulta acertar.
2. **Reparto y retiro en tienda no son lo mismo.** El precio puede depender de si
   recibe en casa o recoge. Está sin medir.
3. **El tiempo.** Entre nuestra simulación y su checkout pasan minutos; un precio
   puede cambiar. La promesa realista es «el mismo número ahora», no «para
   siempre».
4. **El carrito va a encoger, y eso va a doler.** Si 12 de 35 productos no están
   en su tienda, la compra que hoy se ve completa se verá con huecos. Es la
   verdad, y es mejor verla aquí que en el pasillo — pero es un cambio de
   sensación grande y hay que diseñarlo, no soltarlo.

---

## 9 · Lo que tienes que decidir

1. **Suposición por IP, ¿sí o no?** Añade middleware y una dependencia de
   Netlify a cambio de que la primera compra ya salga bien. La alternativa es no
   suponer nada y enseñar «precios referenciales» hasta que ella elija tienda.
2. **Los productos sin stock: ¿se quitan del carrito o se quedan a la vista?**
   Mi voto es que se queden, con su motivo y sin sumar — igual que hacemos con
   «esto no cruza»—, porque un producto que desaparece sin explicación es
   exactamente lo que rompe la confianza.
3. **¿La pregunta va después de la primera compra, o la primera vez que
   detectamos que un producto no está en su zona?** La segunda llega antes y con
   más motivo; la primera es más tranquila.

---

## Fuentes

Medición propia contra www.wong.pe, 2026-08-03: `orderForms/simulation?sc=70`
(con y sin `regionId`, con `geoCoordinates` de cinco distritos de Lima y con
cuatro códigos postales), `checkout/pub/regions`, `checkout/pub/pickup-points`,
y la API pública de catálogo.

[Geolocalización en Netlify](https://docs.netlify.com/build/functions/api/) ·
[Middleware de Next.js en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/legacy-runtime/middleware/)
