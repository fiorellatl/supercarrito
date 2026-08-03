# Cómo se integra un carrito con Wong, de forma oficial y sostenible

> ## ⚠️ CORREGIDO EL 2026-08-03
>
> **La conclusión principal de este documento es falsa.** Decía que «no existe
> ninguna vía técnica para llenarle el carrito a una familia sin un acuerdo con
> Wong». Sí existe: **la tienda opera en el canal de venta `70`**, no en el 1 ni
> en el 2, y con `sc=70` tanto la API de checkout como el enlace `cart/add`
> funcionan —verificado leyendo el carrito, con 35 productos y con productos al
> peso—. El canal es público: `GET /api/segments`.
>
> Lo que sigue siendo válido de aquí: appKey/appToken, Shareable Cart,
> regionalización, la trampa del «200 que no añade nada» y la intercepción de la
> app móvil. Lo que hay que leer en su lugar:
> **[arquitecturas-ultima-milla.md](arquitecturas-ultima-milla.md)**.

**Investigación · 2026-08-03.** Encargada tras falsar el deep link con la cuenta
real de la PO. Documentación oficial de VTEX + medición directa contra
www.wong.pe. No hay suposiciones: cada afirmación técnica lleva su prueba.

Wong corre sobre **VTEX** (cuenta `wongio`). Todo lo que sigue es, en realidad,
sobre VTEX.

---

## Resumen para decidir

**Sí existe una API oficial para crear y llenar un carrito.** Es pública, nos
responde, y **no nos deja escribir**. No es un fallo ni un parámetro mal puesto:
es una frontera deliberada de la plataforma. Leer el catálogo es público;
transaccionar exige que el comercio te autorice.

**No existe ninguna vía técnica para llenarle el carrito a una familia sin un
acuerdo con Wong.** Las tres que quedan son: pedirle a Wong credenciales, cambiar
la promesa, o cambiar de tienda.

---

## 1 · ¿Existe una API oficial para crear o completar un carrito?

Sí: la **Checkout API** de VTEX. Y la probamos entera.

| Paso | Endpoint | Resultado real contra wong.pe |
|---|---|---|
| Crear carrito | `POST /api/checkout/pub/orderForm` | ✅ **200** · `orderFormId`, `salesChannel: 1` |
| Añadir ítems | `POST /api/checkout/pub/orderForm/{id}/items` | ❌ **401** `ORD021.5` «Seller no autorizado 1 con la política comercial 1» |
| Añadir ítems con `sc=2` | idem `?sc=2` | ⚠️ **200 … y 0 ítems en el carrito** |
| Leer carrito ajeno | `GET /api/checkout/pub/orderForm/{id}` | ✅ 200 (pero vacío) |
| Simular precios | `POST /api/checkout/pub/orderForms/simulation` | ❌ 401 — **pero con `?sc=70` da 200** ⚠️ |
| Resolver zona | `GET /api/checkout/pub/regions?country=PER&postalCode=…` | ✅ 200 · `sellers: []` — **pero con `&sc=70` sí devuelve sellers** ⚠️ |

> ⚠️ **Corregido el 2026-08-03, misma causa que todo lo demás: faltaba el canal.**
> `simulation?sc=70` responde 200 con precio y disponibilidad reales, y acepta
> `regionId`. Con región, los mismos SKUs cambian de precio y pueden salir
> `withoutStock`. Es decir: **sí podemos preguntar por la tienda de una familia
> antes de prometerle nada.** Lo que este documento daba por imposible.

**La frontera está clarísima:** crear un carrito vacío es público; **meterle un
producto, no**. Y hay dos formas de que no nos deje, que conviene distinguir:

- **Política comercial 1** (donde los productos existen de verdad): nos rechaza
  con un error explícito. El `seller=1` es correcto —la API de catálogo devuelve
  `sellerId: "1"`, `sellerName: "WongIO"`—, lo que no está autorizado es que
  nosotros vendamos en ese canal.
- **Política comercial 2** (la única que nos acepta): responde 200 y **no añade
  nada**, porque su catálogo no contiene esos SKUs — buscar con `sc=2` devuelve
  cero productos.

⚠️ **Ese 200 con carrito vacío es la misma trampa que nos costó dos sprints con
el deep link.** VTEX responde «correcto» a una operación que no hizo nada. En
esta plataforma, *un código de éxito no es evidencia de éxito*: la única prueba
es leer el carrito.

### Sobre `/checkout/cart/add` (lo que teníamos)

Es un formato **oficialmente documentado** por VTEX («How to assemble the cart
URL»), con `sku`, `qty`, `seller` y `sc`. No inventamos nada. Pero es azúcar
sintáctico sobre la misma API: hereda exactamente las mismas restricciones, y por
eso da 500 sin `sc` y un carrito vacío con `sc=2`.

---

## 2 · ¿Existe alguna integración soportada para terceros?

Sí, tres. **Las tres exigen que Wong haga algo.** No hay ninguna que podamos
activar por nuestra cuenta.

### a) Application Keys (appKey / appToken) — el camino estándar

VTEX no ofrece OAuth para terceros. El mecanismo es una **clave de aplicación**
que **el administrador de la tienda** emite desde su panel, con roles y permisos
concretos (Checkout, Catálogo, OMS…).

- **Quién la emite:** Wong. Nosotros no podemos crearla.
- **Qué desbloquea:** escribir ítems en un carrito, simular precios por región,
  resolver zonas. Todo lo que hoy nos da 401.
- **Qué es de verdad:** un acuerdo comercial con forma de credencial.

### b) Shareable Cart / Social Selling — lo más parecido a lo que queríamos

VTEX tiene una app oficial que hace **exactamente** nuestro caso de uso: alguien
arma un carrito y lo comparte por WhatsApp con un enlace o un QR.

- **Pero es para dentro de la tienda:** la usan los asesores de venta de Wong,
  no aplicaciones de terceros.
- Se activa por tienda con `…/checkout/?socialselling=on` y depende de que Wong
  tenga la app instalada.
- **Pista fuerte de que Wong la conoce:** su archivo de enlaces de iOS excluye
  `*?qcart*` («Excluye cualquier URL con query param qcart»). Wong reserva
  deliberadamente un parámetro de carrito para que abra en el navegador y no en
  la app. Es decir: **la capacidad existe en su instalación**; lo que no tenemos
  es permiso para usarla.

### c) Ser vendedor o afiliado en su marketplace

Cambia el modelo de negocio entero: SuperCarrito dejaría de ser un asistente para
ser un canal de venta, con contrato, comisiones y responsabilidades. Es una
decisión de empresa, no de producto.

---

## 3 · ¿Qué requiere?

| Vía | Requiere | Lo podemos conseguir solos |
|---|---|---|
| Deep link `cart/add` | nada… y no funciona | — |
| Checkout API completa | **appKey + appToken emitidos por Wong** | ❌ |
| Shareable Cart | app instalada + rol de asesor en Wong | ❌ |
| Marketplace / afiliado | contrato comercial | ❌ |
| Leer catálogo | nada · **funciona hoy** | ✅ |

**No hay OAuth.** No hay «conectar tu cuenta de Wong» como en Google o Spotify.
Por eso la pantalla que proponía «Conectar con Wong · ✓ Conectado» no se puede
construir con verdad: no existe la conexión que anunciaría.

---

## 4 · ¿Qué limitaciones tiene, incluso con el acuerdo?

Aunque Wong nos diera las llaves mañana:

1. **Regionalización.** Precio, stock y catálogo dependen de la tienda asignada,
   y Wong asigna tienda **pidiendo el correo**. `regions` nos devuelve
   `sellers: []`: hoy no podemos resolver la zona ni sabiendo el código postal.
2. **Traspasar el carrito al navegador.** La propiedad del carrito viaja en una
   cookie `CheckoutOrderFormOwnership` (`HttpOnly`, `SameSite=Strict`,
   dominio wong.pe). Un carrito creado por nuestro servidor **no es** el carrito
   de su navegador. La URL `…/checkout/?orderFormId=…#/cart` existe, pero
   entregar la propiedad no es algo que podamos hacer desde fuera.
3. **La app se come los enlaces.** `assetlinks.json` de Android declara
   `handle_all_urls`: la app reclama **todas** las URLs de wong.pe y descarta los
   parámetros. En iOS reclama `/checkout/*`. **Cualquier** solución basada en
   URLs muere en el móvil, que es donde ocurre la compra de verdad.
4. **Nunca pagamos nosotros.** Y está bien: es una línea roja del producto.
5. **El éxito silencioso.** Documentado arriba: hay que verificar leyendo el
   carrito, siempre.

---

## 5 · ¿Qué alternativas reales quedan?

Ordenadas por lo que cuesta conseguirlas.

### A · Pedirle a Wong un acuerdo de integración ⭐ el camino correcto a largo plazo

Es la única vía que devuelve la promesa original completa. Es una conversación
comercial: qué gana Wong. Y el argumento es bueno —les llevamos carritos llenos
de familias que ya eligieron— pero es una conversación de meses, no de días.

**No bloquea nada:** se puede empezar mientras el producto vive de la opción B.

### B · Cambiar la promesa: preparar la compra, abrir cada producto ⭐ lo que funciona hoy

En vez de «te lleno el carrito», **«te dejo la compra decidida y te abro cada
producto en Wong»**. La familia toca «añadir» ella.

- **Funciona hoy, sin permiso de nadie.** Las URLs de producto responden 200 y
  ya las guardamos (`producto.url`); `/busca?ft=…` sirve de respaldo.
- **En el móvil juega a favor:** que la app intercepte el enlace deja de ser un
  fallo y pasa a ser lo deseable — se abre la ficha en su app, con su tienda, su
  precio y su stock reales.
- **Lo que se pierde:** el «carrito listo en dos minutos». Hay que tocar N veces.
- **Lo que NO se pierde, y es casi todo el valor:** decidir qué comprar, cuánto,
  de qué marca, con qué presupuesto y sin repetir decisiones. El North Star pasa
  de «tu compra lista en Wong» a **«llegas a Wong sabiendo exactamente qué
  comprar»**.

### C · Probar con otro retailer

Plaza Vea, Metro, Tottus, Vega. Si alguno permite el carrito por enlace, la
arquitectura ya está preparada: `EntregaEnTienda` es un contrato, y cambiar de
tienda es escribir otra implementación. **Vale la pena medirlo: es media hora.**

### D · Wong ya tiene «Mis listas»

Se ve en la app de la PO. Si su API fuera accesible, entregaríamos una lista en
vez de un carrito. Habría que investigarlo — probablemente choque con el mismo
muro de autorización.

### E · Descartadas por principio, no por dificultad

Automatizar el checkout de Wong con las credenciales de la familia, o scrapear su
sesión. Es la línea roja del proyecto y sigue trazada donde estaba.

---

## Recomendación

**B ahora, A en paralelo, C esta semana.**

Cambiar la promesa a «llegas a Wong sabiendo qué comprar» conserva casi todo el
valor, es honesto y se puede enseñar a familias mañana. Mientras, abrir la
conversación con Wong —que es lenta— y medir si otro retailer nos deja hacer lo
que Wong no.

**Lo que NO haría:** seguir buscando combinaciones de `sc`, ni construir sobre
comportamientos no documentados. Ya sabemos cómo acaba eso: un 200 que no
significa nada.

---

## Fuentes

Documentación oficial:
[Checkout API — Overview](https://developers.vtex.com/docs/guides/checkout-api-overview) ·
[Creating a regular order with the Checkout API](https://developers.vtex.com/docs/guides/creating-a-regular-order-with-the-checkout-api) ·
[Get current or create a new cart](https://developers.vtex.com/docs/guides/create-a-new-cart) ·
[Get cart information by ID](https://developers.vtex.com/docs/guides/get-cart-information-by-id) ·
[How to assemble the cart URL](https://help.vtex.com/en/docs/tutorials/how-to-assemble-the-cart-url) ·
[How to use the Shareable Cart app (Social Selling)](https://help.vtex.com/en/tutorial/how-to-use-the-shareable-cart-app--3ePPpkmeZ96GXbeIoGZbTN) ·
[How to activate the Shareable Cart app](https://help.vtex.com/docs/tutorials/how-to-activate-the-shareable-cart-app) ·
[Sharing shopping cart using VTEX Sales App Social Selling](https://help.vtex.com/en/docs/tracks/sharing-shopping-cart-using-vtex-sales-app-social-selling)

Medición propia contra www.wong.pe, 2026-08-03: endpoints de la tabla del §1,
`/.well-known/assetlinks.json`, `/apple-app-site-association`, y la API pública
de catálogo.
