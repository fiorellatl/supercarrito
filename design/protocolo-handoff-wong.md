# Protocolo de validación del handoff a Wong

**Una sola pregunta:** ¿una compra preparada en SuperCarrito llega correctamente
al carrito de Wong?

**Quién:** la PO, con su cuenta real de Wong. **Cuánto:** 30 minutos.
**Preparado el:** 2026-08-03 · los SKUs y precios son los del catálogo de ese día.

---

## ⚠️ Léelo antes de empezar: lo que ya sabemos y cambia la prueba

Al preparar este protocolo probé los enlaces contra wong.pe. Tres hallazgos que
tienes que conocer **antes** de gastar tus 30 minutos:

**1. El enlace que el producto genera hoy devuelve HTTP 500 sin sesión.**

| Enlace | Respuesta |
|---|---|
| SKU real, **sin `sc`** ← *el que enviamos hoy* | **500** «Se produjo un error al procesar tu solicitud» |
| SKU real, **con `sc=2`** | **302** → `/checkout/#/cart` |

Reproducido con y sin cookies de navegador, con uno y con 35 productos. La
decisión de no enviar `sc` —para heredar la sesión de la familia— es la que
está en duda. **Por eso cada escenario tiene dos enlaces: A (sin `sc`, el real)
y B (con `sc=2`).** Prueba SIEMPRE A primero. Si A falla y B funciona, la
respuesta del sprint es «añadir `sc=2`», y es una línea de código.

**2. El 302 que dimos por verificado el 2026-08-03 NO era prueba de éxito.**

Un SKU **inexistente** también devuelve 302. Es decir: 302 significa «no me caí»,
no «metí tus productos». Lo que documentamos como verificado era más débil de lo
que creímos. **La única prueba válida es mirar el carrito**, que es exactamente
lo que vas a hacer.

**3. El escenario 5 no se puede montar.** La API pública de Wong no devuelve
productos agotados: revisé 14 categorías y no hay ni uno. Ver E5.

---

## Antes de empezar (2 minutos)

1. Abre Chrome **normal** (no incógnito) e inicia sesión en wong.pe.
2. **Vacía el carrito por completo.** Si no, no sabrás qué llegó de nosotros.
3. Ten a mano dónde anotar. Cada escenario dice qué capturar.

**Regla de oro para las capturas:** que se vea **la URL completa** y **el
contenido del carrito** en la misma imagen. Una captura sin la URL no sirve como
evidencia de qué enlace la produjo.

---

## E1 · Ya autenticada en Wong

**Enlace A (el real, sin `sc`):**
```
https://www.wong.pe/checkout/cart/add?sku=39343578&qty=2&seller=1&sku=530&qty=1&seller=1
```
**Enlace B (con `sc=2`):**
```
https://www.wong.pe/checkout/cart/add?sku=39343578&qty=2&seller=1&sku=530&qty=1&seller=1&sc=2
```

**Qué debería ocurrir:** el navegador salta a `/checkout/#/cart` y el carrito
tiene **2 × Leche Gloria Niños Lata 390g** y **1 × Arroz Superior Costeño 5kg**.

**Qué observar, en este orden:**
1. ¿Llegas al carrito o a una pantalla de error?
2. ¿Están los **dos** productos, o solo uno?
3. ¿Las cantidades son 2 y 1?
4. ¿Qué tienda aparece asignada arriba? **Anótala.**
5. ¿Los precios coinciden con S/ 4.50 y S/ 19.90?

**Captura:** el carrito entero con la URL visible.

---

## E2 · Sin sesión iniciada

Ventana **incógnito**. Mismo enlace que E1 (el que haya funcionado).

**Qué observar, en este orden exacto — aquí está el riesgo real del producto:**

1. ¿Wong te pide iniciar sesión, o te deja ver un carrito anónimo?
2. **Inicia sesión desde ahí.**
3. Y ahora la pregunta que decide el flujo:
   - ¿el carrito **sigue** con los productos?
   - ¿se **vació**?
   - ¿se **fusionó** con el carrito que ya tenías en tu cuenta?
   - ¿tuviste que **volver a abrir el enlace**?

**Por qué importa:** si el carrito se pierde al iniciar sesión, nuestra pantalla
«si Wong te pide iniciar sesión, es normal» es insuficiente — habría que
advertir «vuelve a tocar el enlace después de entrar». Es la diferencia entre un
aviso y una instrucción.

**Captura:** el carrito **después** de iniciar sesión.

---

## E3 · Productos envasados

Usa el resultado de E1. Rellena:

| | Esperado | Observado |
|---|---|---|
| Leche Gloria Niños Lata 390g (SKU 39343578) | 2 uds · S/ 4.50 c/u | |
| Arroz Superior Costeño 5kg (SKU 530) | 1 ud · S/ 19.90 | |
| **Total** | **S/ 28.90** | |

**Lo que de verdad se está probando:** que `qty` significa «unidades» y que el
precio que enseñamos es el que cobra tu tienda. Si el precio difiere, **no es un
fallo del enlace: es la regionalización**, y confirma que nuestro catálogo
genérico no es el de tu tienda. Anota la diferencia exacta.

---

## E4 · Productos al peso · **el escenario más importante**

**Enlace A:**
```
https://www.wong.pe/checkout/cart/add?sku=4155&qty=2&seller=1&sku=3492&qty=4&seller=1
```
**Enlace B:**
```
https://www.wong.pe/checkout/cart/add?sku=4155&qty=2&seller=1&sku=3492&qty=4&seller=1&sc=2
```

Traducción de lo que hizo el producto:

| Producto | Pediste | Múltiplo de venta | `qty` que enviamos | Debe llegar | Precio | Subtotal esperado |
|---|---|---|---|---|---|---|
| Trucha Deshuesada Corte Mariposa x kg (4155) | 500 g | 0,4 kg | **2** | **0,8 kg** | S/ 33.90/kg | **S/ 27.12** |
| Queso Fresco Pasteurizado Laive x kg (3492) | 350 g | 0,1 kg | **4** | **0,4 kg** | S/ 38.45/kg | **S/ 15.38** |
| | | | | | **Total** | **S/ 42.50** |

**Qué observar:**
1. ¿El carrito dice **0,8 kg** de trucha, o dice «2»? (Si dice 2 unidades, `qty`
   no significa lo que creemos y **todos los pesos están mal**.)
2. ¿El subtotal de la trucha es S/ 27.12?
3. ¿Puedes bajarlo a 500 g desde el carrito de Wong, o el mínimo es 0,4?

**Por qué es el más importante:** es el único escenario donde traducimos. En el
resto copiamos un número; aquí hacemos una cuenta, y si la cuenta está mal la
familia recibe menos comida de la que iba a cocinar.

**Captura:** obligatoria, con las cantidades y los subtotales legibles.

---

## E5 · Producto agotado

**No se puede montar, y eso ya es un resultado.** La API pública de Wong no
devuelve productos sin stock: busqué en 14 categorías (panetón, vino, pavo,
chocolate, cerveza, helado, yogur, pan, detergente, shampoo, atún, aceite, café,
galletas) y **no apareció ni uno agotado**.

Consecuencia: **nunca sabremos por adelantado que algo está agotado en tu
tienda.** Nuestro filtro «hoy no hay en Wong» solo puede actuar sobre lo que la
API marca como no disponible, y la API no lo marca nunca.

**Lo que sí puedes observar (oportunista, sin preparación):** si en E7 —35
productos— alguno no aparece en el carrito, eso **es** un agotado o un producto
que tu tienda no vende. Anota cuál y qué hizo Wong: ¿lo omitió en silencio? ¿lo
avisó? ¿lo sustituyó?

Si Wong **omite en silencio**, tenemos un problema de confianza equivalente al
del sofá cama, en dirección contraria: la familia creerá que lleva algo que no
lleva.

---

## E6 · Producto inexistente

**Ya probado por mí, y el resultado es contraintuitivo:**

| Enlace | Respuesta |
|---|---|
| Solo SKU inexistente (`999999999`) | **302** → `/checkout/#/cart` |
| Real + inexistente, sin `sc` | 500 |
| Real + inexistente, con `sc=2` | **302** |

```
https://www.wong.pe/checkout/cart/add?sku=39343578&qty=1&seller=1&sku=999999999&qty=1&seller=1&sc=2
```

**Lo único que falta comprobar, y es en tu carrito:** ¿llegó la leche **a pesar**
del SKU inválido? Es decir: **¿un producto malo tumba toda la compra, o solo se
pierde él?**

- Si llega la leche → un SKU malo cuesta un producto. Tolerable.
- Si no llega nada → un solo SKU malo puede tirar la compra entera **sin avisar**.
  Eso sería bloqueante y cambiaría el diseño del enlace.

**Captura:** el carrito.

---

## E7 · Compra grande (35 productos)

```
https://www.wong.pe/checkout/cart/add?sku=39244362&qty=1&seller=1&sku=39223907&qty=1&seller=1&sku=537&qty=1&seller=1&sku=39252985&qty=1&seller=1&sku=530&qty=1&seller=1&sku=39210331&qty=1&seller=1&sku=39267401&qty=1&seller=1&sku=39210330&qty=1&seller=1&sku=39320556&qty=1&seller=1&sku=39272867&qty=1&seller=1&sku=39275659&qty=1&seller=1&sku=13257&qty=1&seller=1&sku=39303271&qty=1&seller=1&sku=39177829&qty=1&seller=1&sku=39340574&qty=1&seller=1&sku=13571&qty=1&seller=1&sku=39140709&qty=1&seller=1&sku=39176708&qty=1&seller=1&sku=39290742&qty=1&seller=1&sku=8669&qty=1&seller=1&sku=39347088&qty=1&seller=1&sku=39347080&qty=1&seller=1&sku=39347078&qty=1&seller=1&sku=39347096&qty=1&seller=1&sku=39347085&qty=1&seller=1&sku=39214158&qty=1&seller=1&sku=39214160&qty=1&seller=1&sku=39322296&qty=1&seller=1&sku=2651&qty=1&seller=1&sku=39337060&qty=1&seller=1&sku=39245615&qty=1&seller=1&sku=39245614&qty=1&seller=1&sku=39245617&qty=1&seller=1&sku=13569&qty=1&seller=1&sku=39177355&qty=1&seller=1&sc=2
```

URL de 995 caracteres · devuelve **302** (comprobado). Total de catálogo:
**S/ 905.16**.

**Qué observar:**
1. **Cuenta los productos del carrito.** ¿35? Si son menos, **anota cuáles
   faltan** — esa lista es el resultado de E5.
2. ¿Wong tardó mucho o se quedó colgado?
3. ¿El total se parece a S/ 905?

**Nota:** el enlace mezcla comida con un mueble para gatos y tazas de café. Es a
propósito: son productos reales del catálogo y sirven igual para contar.

---

## E8 · El mismo enlace dos veces

Con el carrito **ya cargado** de E1, vuelve a abrir **el mismo enlace de E1**.

| Si el carrito queda con… | Significa | Qué implica |
|---|---|---|
| 2 leches y 1 arroz | **sobrescribe** | Lo ideal. Reabrir es inofensivo. |
| 4 leches y 2 arroces | **acumula** | Peligroso: volver atrás en el navegador **duplica la compra**. Habría que avisar. |
| 2 leches y 1 arroz, pero se añadió una línea nueva | **duplica líneas** | Confuso pero no caro. |

**Es el escenario que más gente real va a provocar sin querer**, con el botón
«atrás» del móvil. **Captura obligatoria.**

---

## E9 · Tres entornos

Mismo enlace de E1 en:

| Entorno | ¿Llega al carrito? | ¿Pide sesión? | Notas |
|---|---|---|---|
| Chrome escritorio, con sesión | | | |
| **Móvil** (como llegaría un WhatsApp) | | | ¿abre la **app** de Wong o el navegador? |
| Incógnito | | | debería comportarse como E2 |

**El de móvil es el que cuenta.** Es como va a ocurrir de verdad. Si la app de
Wong intercepta el enlace y **pierde el carrito**, el handoff no funciona en el
único sitio donde importa.

---

## Tabla de resultados

| # | Escenario | Resultado esperado | Resultado observado | ¿Bloquea entrevistas? |
|---|---|---|---|---|
| 1 | Ya autenticada | Carrito con 2 leches + 1 arroz, S/ 28.90 | | |
| 2 | Sin sesión | Pide login; **el carrito sobrevive** | | |
| 3 | Envasados | Cantidades y precios exactos | | |
| 4 | Al peso | 0,8 kg trucha (S/ 27.12) + 0,4 kg queso (S/ 15.38) | | |
| 5 | Agotado | *no montable* — observar omisiones en E7 | | |
| 6 | Inexistente | La leche llega igual; solo se pierde el SKU malo | | |
| 7 | 35 productos | Los 35 en el carrito, ~S/ 905 | | |
| 8 | Enlace repetido | Sobrescribe (no acumula) | | |
| 9 | Escritorio / móvil / incógnito | Igual en los tres | | |
| 0 | **`sc`** | A (sin `sc`) funciona en tu navegador | | |

### Cómo decidir «¿bloquea entrevistas?»

**Bloquea** (no se puede enseñar a una familia):
- E1 no llega al carrito ni con A ni con B.
- E4 llega con el peso equivocado — estaríamos dando de comer mal.
- E6 un SKU malo tumba la compra entera.
- E9 móvil pierde el carrito.

**No bloquea** (se anota y se sigue):
- Precios distintos por regionalización → ya lo sabíamos; la pantalla ya dice
  «el total lo confirma tu tienda».
- E8 acumula → se avisa en la pantalla y listo.
- E2 exige reabrir el enlace → se cambia una frase.
- Falta algún producto en E7 → es E5, y ya sabemos que no podemos preverlo.

---

## Después

**Si nada bloquea:** congelamos la integración con Wong y no se toca hasta que
las entrevistas demuestren otra necesidad.

**Si A falla y B funciona:** una línea en `lib/entrega.ts` y se vuelve a
congelar. No es un sprint.

**Si algo bloquea de verdad:** el enlace de carrito no es el mecanismo, y hay que
volver a la mesa antes de enseñar el producto a nadie.
