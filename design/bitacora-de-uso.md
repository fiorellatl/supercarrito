# Bitácora de uso

Deja de valer «esto se puede construir». Empieza a valer «una familia lo usó y
pasó esto».

## Cómo se registra

Cada observación responde tres preguntas y ninguna más:

1. **¿Qué esperaba hacer la familia?**
2. **¿Qué hizo realmente el producto?**
3. **¿Qué aprendizaje deja?**

Reglas de esta fase:

- **No se corrige nada al encontrarlo.** Primero se acumula evidencia.
- **No se abre un sprint por problema.** Se abre cuando aparece un *patrón*: lo
  mismo, en sesiones distintas, sin que nadie lo provoque.
- **No se buscan mejoras.** Se busca uso real y lo que le pasa por el camino.
- Lo que sale bien también se registra. Una bitácora que solo tiene fallos miente
  igual que un total inventado.

Las nueve preguntas que vigilamos: cómo empezar · encontrar el producto correcto
· confiar en el precio · entender la tienda · sentir el stock · el paso a Wong ·
cuándo el producto piensa demasiado · cuándo la familia duda · qué todavía huele
a prototipo.

---

# Sesión 1 · 2026-08-03 · versión desplegada, casa nueva

Compra pegada desde un WhatsApp real, tal cual llegaría:

```
Hola mami buenos días 🙋‍♀️
para el almuerzo del domingo necesito:
2 kg de pollo
arroz
1/2 kg de queso fresco
leche gloria
papel higiénico
gracias!! 😘
```

---

## O1 · El saludo terminó en el carrito, con precio ⚠️

**Esperaba:** que "Hola mami buenos días" y "para el almuerzo del domingo
necesito:" fueran lo que son, conversación.

**Pasó:** las dos entraron al buscador. Salió esto:

| Línea | Producto | Precio |
|---|---|---|
| Hola mami buenos días 🙋‍♀️ | **Arti Creativo Rompecabezas Infantil Buenos Días 20 Piezas** | S/ 21.30 |
| para el almuerzo del domingo necesito: | **Sirope para Panqueques American Classic 473g** | S/ 14.90 |

**S/ 36.20 de un total de S/ 83.20 — el 43 % del carrito— eran conversación.**
"gracias!! 😘" sí se detuvo («es una fórmula de conversación»).

**Aprendizaje:** el filtro de contexto atrapa las despedidas pero no los saludos
ni las frases de encuadre. Y el fallo no es silencioso: es un juguete con precio
dentro de la compra del domingo. Es el mismo daño de confianza del «sofá cama»,
en la primera pantalla que ve una familia.

---

## O2 · El total cambió solo, un segundo después ⚠️

**Esperaba:** que el número de abajo se quedara quieto mientras lo leía.

**Pasó:** el carrito apareció con **S/ 83.20** y al rato pasó a **S/ 57.80**, sin
decir que el primero era provisional. Es el momento en que llega la respuesta de
la tienda y dos productos pasan a «no hay».

**Aprendizaje:** ganamos que el número final sea el de Wong, pero por el camino
enseñamos uno que no lo era. Un total que se mueve solo enseña a desconfiar del
total, que es justo lo contrario de lo que este ciclo vino a construir.

---

## O3 · Lo que sí quería no estaba; lo que nunca pidió, sí ⚠️

**Esperaba:** llevarse el pollo del almuerzo del domingo.

**Pasó:** «2 kg de pollo» se resolvió como *Muslo de Pollo Sadia Congelado 1kg*
y su tienda no lo tenía: **desapareció de la entrega**. El rompecabezas se quedó.

**Aprendizaje:** la lista final quedó al revés de la intención — sin la carne del
almuerzo y con un juguete. El stock real y el ruido del parser se combinan, y el
resultado es peor que cada uno por separado.

---

## O4 · Le volvimos a preguntar algo que ya había dicho

**Esperaba:** que «1/2 kg de queso fresco» fuera medio kilo.

**Pasó:** *Queso Fresco Gloria x kg · **falta la cantidad*** · «¿Cuánto llevas?»

**Aprendizaje:** la cantidad venía escrita en la línea y aun así se preguntó. La
promesa de «cada compra requiere menos decisiones» se rompe en la primera.

---

## O5 · «2 kg de pollo» se convirtió en 1

**Esperaba:** dos kilos.

**Pasó:** un paquete de 1 kg, cantidad 1, S/ 10.50.

**Aprendizaje:** cuando lo pedido va al peso y lo encontrado viene envasado, la
cantidad se pierde sin avisar. La familia habría llevado la mitad de lo que
quería, y el monto era explicable pero equivocado.

---

## O6 · Botones que no responden y no dicen por qué (×2)

**Esperaba:** tocar «Empezar» y empezar.

**Pasó:** el botón está apagado hasta escribir el nombre de la casa, **el campo
no viene enfocado** y nada dice qué falta. Lo mismo con «Hacer la compra» en una
compra vacía: se ve, se toca, no pasa nada.

**Aprendizaje:** dos veces el mismo gesto en la misma sesión. Un botón visible
que no responde y no explica es la definición de dudar qué hacer.

---

## O7 · Dos maneras de decir lo mismo, en pantallas seguidas

**Pasó:** el carrito dice *«hoy no hay en Wong»* **y** *«no hay en Wong Ovalo
Gutierrez · lo dejé anotado»* en la misma línea. La entrega, un toque después,
vuelve a *«hoy no hay en Wong»*, sin nombrar la tienda.

**Aprendizaje:** el mismo hecho contado de tres formas. La tienda con nombre
—que es lo que la hace creíble— se pierde justo antes del salto.

---

## O8 · «Tienes 8 cosas anotadas»

**Pasó:** tres de las ocho eran conversación.

**Aprendizaje:** contamos líneas, no compra. El número promete más de lo que hay
y prepara la decepción de la pantalla siguiente.

---

## Lo que salió bien, y hay que anotarlo igual ✅

- **El producto no piensa demasiado.** Revisión 1,2 s · tiendas <2 s · carrito
  1,7 s · entrega 1,5 s. En ningún momento hubo que esperar mirando la pantalla.
- **Pegar un WhatsApp entero funciona y se siente natural.** *«Pegado tal cual.
  Yo lo ordeno cuando compres»* es exactamente la promesa correcta.
- **La pantalla de la tienda no generó ninguna duda.** Se lee como una pregunta
  normal, no como un permiso técnico.
- **El paso a Wong es un enlace y ya.** Cuatro productos, un toque.
- **La despedida se detuvo sola**, con su motivo escrito.

---

## Patrones (se llenan solos; un sprint solo nace de aquí)

| Patrón | Sesiones | Observaciones |
|---|---|---|
| El parser mete conversación en el carrito | 1 | O1, O8 |
| La cantidad pedida se pierde | 1 | O4, O5 |
| Números que se mueven sin avisar | 1 | O2 |
| Estados sin explicación | 1 | O6 |
| El mismo hecho, dicho de varias formas | 1 | O7 |

**Ninguno tiene todavía repetición.** Nada se toca.
