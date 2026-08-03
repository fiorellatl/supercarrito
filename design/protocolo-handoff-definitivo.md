# Protocolo de validación definitiva del handoff

**2026-08-03.** Cierra las incógnitas que quedaron abiertas tras encontrar el
canal `sc=70`. Unos 25 minutos. Lo haces tú, con tu cuenta real.

## La única regla

**Cuenta los productos del carrito.** No mires la pantalla que se abre, no mires
si la URL cambió, no mires si «pareció funcionar». Un 302 y un 200 ya nos
mintieron una vez cada uno.

El criterio de aprobado es **cuántos productos hay en el carrito**, no cuánto
suman. El importe puede cambiar legítimamente cuando tengas tienda asignada
—precios por local, promociones—, y eso no es un fallo: es un dato que quiero
anotado aparte.

---

## Los dos enlaces

**Enlace chico** (4 productos: 2 envasados, 2 al peso). Es el que se usa en casi
todas las pruebas.

```
https://www.wong.pe/checkout/cart/add?sku=530&qty=2&seller=1&sku=8839&qty=1&seller=1&sku=4155&qty=3&seller=1&sku=3492&qty=5&seller=1&sc=70
```

Lo que debe aparecer —medido hoy en sesión anónima y sin tienda—:

| Producto | Debe salir | Importe |
|---|---|---|
| Arroz Superior Costeño 5kg | 2 unidades | S/ 39.80 |
| Crema de Leche Gloria 946ml | 1 unidad | S/ 21.90 |
| Trucha Deshuesada x kg | **1,2 kg** (3 × 400 g) | S/ 37.08 |
| Queso Fresco Laive x kg | **0,5 kg** (5 × 100 g) | S/ 19.22 |
| | **4 productos** | **S/ 118.00** |

**Enlace grande** (35 productos, 1 010 caracteres). Solo para la prueba 6.

```
https://www.wong.pe/checkout/cart/add?sku=39244362&qty=1&seller=1&sku=39210331&qty=1&seller=1&sku=39347088&qty=1&seller=1&sku=39214158&qty=1&seller=1&sku=39275659&qty=1&seller=1&sku=13571&qty=1&seller=1&sku=39267864&qty=1&seller=1&sku=39333556&qty=1&seller=1&sku=39328327&qty=1&seller=1&sku=39187659&qty=1&seller=1&sku=39324945&qty=1&seller=1&sku=39303136&qty=1&seller=1&sku=39228053&qty=1&seller=1&sku=39207365&qty=1&seller=1&sku=39248037&qty=1&seller=1&sku=39319525&qty=1&seller=1&sku=39318691&qty=1&seller=1&sku=2833&qty=1&seller=1&sku=39323095&qty=1&seller=1&sku=39144877&qty=1&seller=1&sku=39208313&qty=1&seller=1&sku=39245644&qty=1&seller=1&sku=39245615&qty=1&seller=1&sku=39314748&qty=1&seller=1&sku=39163163&qty=1&seller=1&sku=39205324&qty=1&seller=1&sku=30746&qty=1&seller=1&sku=39283708&qty=1&seller=1&sku=39273386&qty=1&seller=1&sku=39269351&qty=1&seller=1&sku=39211644&qty=1&seller=1&sku=39305788&qty=1&seller=1&sku=41091&qty=1&seller=1&sku=39279620&qty=1&seller=1&sku=39347081&qty=1&seller=1&sc=70
```

**Enlace chico con el escape de iPhone** (idéntico, más `&qcart=1`). Solo para la
prueba 5b.

```
https://www.wong.pe/checkout/cart/add?sku=530&qty=2&seller=1&sku=8839&qty=1&seller=1&sku=4155&qty=3&seller=1&sku=3492&qty=5&seller=1&sc=70&qcart=1
```

---

## Lo que ya está verificado — no gastes pruebas en esto

Medido hoy en sesión anónima de escritorio, leyendo el carrito:

- **Carrito previo:** el enlace **suma** a lo que ya había. Lo comprobé dos
  veces; un carrito con 3 productos pasó a 5 sin perder ninguno.
- **Repetir el mismo enlace no duplica líneas**, pero sobre un producto que ya
  estaba **se queda con la cantidad mayor y nunca la baja**: con 4 en el carrito,
  un enlace que pide 6 lo deja en 6; otro que pide 2 lo deja en 6 igual. Si en P1
  metes a mano uno de los 4 productos del enlace, cuenta con esto.
- **Producto inexistente:** se ignora en silencio y **el resto entra igual**. Un
  enlace con 2 válidos y 1 inválido metió los 2 válidos.
- **35 productos** en un solo enlace: entran los 35.
- **Redondeo al peso:** exacto.

Lo que **no** puedo verificar yo, y por eso es todo el protocolo: cualquier cosa
que necesite tu cuenta o tu teléfono. Elegir tienda en wong.pe exige correo y
aceptar sus términos; eso lo haces tú, no yo.

---

## Las pruebas

### P1 · Escritorio, sesión iniciada, con carrito previo · 4 min

La más importante de las de escritorio, y cubre dos incógnitas a la vez.

1. Entra en wong.pe **con tu cuenta**.
2. Mete **un producto cualquiera a mano** en el carrito. Anota cuál.
3. Abre el **enlace chico** en la misma pestaña.
4. **Cuenta el carrito.**

**Esperado:** 5 productos — el tuyo más los 4 míos. El tuyo intacto.

⚠️ Si tu producto desapareció, dímelo enseguida: es lo único de todo esto que
sería un daño real a una familia.

### P2 · Escritorio, con tienda asignada · 4 min

Sigue con la sesión de P1.

1. Elige tienda/zona en wong.pe («¿Cómo quieres recibir tu pedido?»). Anota cuál.
2. Vacía el carrito.
3. Abre el **enlace chico**.
4. **Cuenta el carrito y apunta el total.**

**Esperado:** los 4 productos. El total puede diferir de S/ 118.00 y está bien.

**Lo que de verdad estoy preguntando:** si al asignar tienda la tienda cambia de
canal de venta y nuestros SKUs dejan de existir. Si aparecen menos de 4
productos, el canal 70 no vale para todas las tiendas y hay que leerlo por
sesión. **Anota cuáles faltaron.**

### P3 · Android · 4 min

Desde el teléfono, con la app de Wong instalada.

1. Mándate el **enlace chico** por WhatsApp y tócalo.
2. Anota **qué se abrió**: ¿la app de Wong o el navegador?
3. **Cuenta el carrito**, ahí donde se haya abierto.

**Esperado, honestamente: no lo sé.** Es la incógnita que decide la
arquitectura. La app declara que reclama todas las URLs del dominio. Tu prueba
anterior falló, pero llevaba `sc=2`, que no habría llenado nada ni en
escritorio: no probaba nada.

### P4 · Android forzando el navegador · 2 min

Solo si P3 abrió la app y el carrito salió vacío.

Mantén pulsado el enlace → «Abrir en Chrome» (o copiar y pegar en Chrome).
**Cuenta el carrito.**

**Esperado:** 4 productos. Si es así, el problema es solo la app, y tiene arreglo
de producto: enseñar el enlace para copiar, o avisar.

### P5a · iPhone · 3 min

Igual que P3, con el **enlace chico**. Anota si abrió la app o Safari, y cuenta.

### P5b · iPhone con el escape `qcart` · 3 min

Con el **enlace chico + `&qcart=1`**.

Wong excluye explícitamente las URLs con `qcart` de su app en iOS, así que
debería abrirse en Safari. Ya comprobé que el parámetro no rompe el enlace.

**Esperado:** se abre Safari, 4 productos. Si P5a falla y P5b funciona, tenemos
solución para iPhone hoy mismo.

### P6 · Compra grande · 3 min

En el escritorio con sesión iniciada, con el carrito vacío, abre el **enlace
grande**. **Cuenta.**

**Esperado:** 35 productos. Es la prueba de que una compra semanal de verdad
cabe en un enlace.

---

## Tabla de resultados

| # | Prueba | Esperado | Observado | ¿Se abrió app o navegador? | ¿Cierra la arquitectura? |
|---|---|---|---|---|---|
| P1 | Escritorio, sesión, carrito previo | 5 productos, el tuyo intacto | | navegador | |
| P2 | Escritorio, tienda asignada | 4 productos | | navegador | |
| P3 | Android, por defecto | 4 productos | | | |
| P4 | Android forzando navegador | 4 productos | | navegador | |
| P5a | iPhone, por defecto | 4 productos | | | |
| P5b | iPhone con `qcart` | 4 productos | | | |
| P6 | 35 productos | 35 productos | | navegador | |

---

## Cómo leo yo los resultados

- **P1 y P2 bien → la entrega en escritorio queda cerrada.** Corrijo
  `lib/entrega.ts` y volvemos a tener la promesa entera.
- **P2 con menos de 4 → el canal depende de la tienda.** No es fatal: hay que
  leer el canal por sesión en vez de una vez. Es media hora.
- **P3/P5a bien → la arquitectura está cerrada del todo** y no hay nada más que
  discutir sobre la última milla.
- **P3/P5a mal pero P4/P5b bien → funciona, con fricción en móvil.** Ahí sí hay
  una decisión de producto que tomar, y la traeré con opciones.
- **P4 y P5b también mal → el móvil se queda sin entrega por enlace.** Entonces
  el modo degradado («abrir cada producto») pasa a ser el flujo de móvil, y la
  extensión de navegador vuelve a la mesa para escritorio.

**Ningún resultado nos deja sin producto.** Lo peor que puede pasar es que el
móvil use el flujo que ya está construido y desplegado hoy.

---

## Al terminar

Vacía el carrito («Vaciar Carrito» en la pantalla del carrito). Los productos de
prueba no son tu compra, y no quiero que aparezcan en tu próximo pedido.
