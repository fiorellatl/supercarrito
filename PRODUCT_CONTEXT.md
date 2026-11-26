# PRODUCT_CONTEXT — SuperCarrito

> Estrategia y contexto competitivo. **Cambia poco**; se revisa cuando cambia la
> apuesta, no en cada ciclo. Lo operativo vive en `PROJECT_STATE.md`; las reglas
> de trabajo, en `CLAUDE.md`. Última revisión: 2026-11-26 (retomada tras la pausa
> de agosto a noviembre).

## Qué es SuperCarrito

Un asistente para hacer la compra del hogar en Perú (Lima primero). **No** es
otro comparador de precios: ayuda a una familia a resolver su compra semanal,
desde la necesidad cotidiana hasta un carrito que se puede comprar de verdad.

Visión: el lugar donde una familia **organiza y optimiza su compra habitual**.

## Principios estratégicos (PO, 2026-11-26)

1. La **lista** es el centro de la experiencia, no el chat.
2. De una necesidad cotidiana a una lista útil y accionable, **rápido**.
3. El ahorro es **comprensible y realista**: incluye delivery y todo costo
   relevante de comprar en una u otra tienda.
4. Sencillo para personas no especialmente tecnológicas.
5. Marca de consumo **cercana, útil y confiable**, no una herramienta técnica.
6. Una **razón para volver cada semana**.
7. Velocidad de ejecución y aprendizaje con usuarios reales. Nada innecesario.

La tecnología es cada vez más accesible: la ventaja no es poder construir
funcionalidades, es la marca, la experiencia y la relación habitual.

## Propuesta de valor — decisión abierta

Hoy el producto ahorra **tiempo** en una sola cadena (Wong). La visión promete
también ahorro de **dinero** entre cadenas. Son dos propuestas distintas y hay
que elegir con cuál se sale primero.

- Recomendación del equipo (2026-11-26): salir con **rapidez** (lista → carrito
  de Wong en 2 minutos) a 5 familias, y decidir el **ahorro** con datos: medir
  si la diferencia de una canasta típica entre Wong y Metro supera el costo de
  delivery. *Pendiente de la PO.*

## Dónde está la diferencia defendible (hipótesis)

Lo que ya tenemos y es difícil de copiar rápido:

- **Entender la evidencia que la familia ya tiene**: un WhatsApp de mamá, una
  captura, un menú. Separar compra de conversación.
- **Memoria del hogar**: marca, formato, cantidad habitual, tienda. Mejora con
  cada compra (historial append-only + perfil derivado).
- **Honestidad de los montos**: todo precio es `cantidad × precio unitario`,
  nada sin cantidad suma, lo agotado se ve.

La comparación entre tiendas debe **servir** a esto, no reemplazarlo. Competir
en "el mejor reparto entre N tiendas" es entrar tarde al juego de otro.

## Hipótesis de diferenciación — evaluadas el 2026-11-26

| Idea | Veredicto | Por qué |
|---|---|---|
| Compra recurrente ("repetir mi compra") | **Ahora**, versión mínima | Es la razón semanal para volver; el historial ya existe |
| Lista familiar compartida | **Versión barata primero** (compartir por enlace/WhatsApp, sin cuentas) | El caso real observado es mamá enviando la lista; la lista viva multiusuario exige backend |
| Memoria de compras | **Ya existe**; arreglar, no ampliar | Solo se nota desde la 2.ª–3.ª compra |
| Recetas / menú semanal | Congelar | Poco diferencial, fácil de copiar |
| Boletas e historial real | Congelar | La captura funciona; PDF de boleta es plan B |
| Presupuesto | Esperar | Necesita precios comparados fiables |
| Sustituciones inteligentes | Esperar | Importa cuando haya segunda cadena |
| Tarjetas de descuento | Esperar | Reglas por banco y por tienda; mucho costo para el MVP |

## Competencia y referencias

> Información aportada por la PO. **No es una auditoría técnica** de esos
> productos; tratarla como preliminar.

### Nada Menos (nadamenos.pe)

Referencia más cercana a lo que queremos. Lo que nos gustó:

- La lista como centro; varias formas de ingresarla.
- Control de marca, presentación y cantidad.
- Optimiza la canasta completa; explica el ahorro en una o varias tiendas.
- Considera disponibilidad y delivery.
- Marcar comprados y seguir con los pendientes.

Según su propio relato (compartido por la PO): antes de mostrar el reparto,
pregunta a cada tienda, con los productos exactos y el distrito, si puede
entregarlo; lo que no se puede se saca y el reparto se rearma. En su primera
medición, varios productos de una lista de quince no tenían despacho a un
distrito por ser voluminosos (saco de arroz, bidón de aceite), no por stock.
Tienen una revisión semanal de tarifas de envío y un aviso de marcha blanca.

**Qué aprendemos:** un carrito que no se puede comprar es peor que no tener
carrito. Verificar con la tienda antes de prometer (nosotros ya lo hacemos con
`orderForms/simulation` para stock y precio en Wong; falta delivery). Las
tarifas de envío cambian sin aviso: si las mostramos, hay que vigilarlas.

**Qué no copiar:** el optimizador de reparto multi-tienda como propuesta
central. Es su foso y su costo.

### Comparasuperm

Búsqueda paralela entre cadenas, **agrupación por EAN y presentación**, filtros
de relevancia y comparación de precios. Stack mencionado: React, Vite, Node
(sin verificar).

**Qué aprendemos:** para comparar el mismo producto entre cadenas, la llave es
el EAN + presentación, no el nombre. VTEX expone el EAN por SKU.

## Mercado y plataformas (hechos y supuestos)

- Wong y Metro son de Cencosud y comparten la cuenta VTEX: Metro ya aparece en
  el directorio de tiendas que consultamos (`lib/tienda.ts`). **Segunda cadena
  más barata de integrar.** *Por verificar que la API pública responda igual.*
- Plaza Vea: probablemente VTEX (por verificar). Tottus: no es VTEX, integración
  completa aparte.
- Ninguna cadena ofrece API de carrito con acuerdo; el handoff es por deep link
  (`/checkout/cart/add`, canal `sc=70` en Wong).

## Qué NO construimos por ahora

Optimizador de reparto entre 3+ tiendas · tarjetas de descuento · cuentas y
login · app nativa · voz · foto de lista manuscrita · extensión de navegador ·
scraping · Tottus · más documentos de diseño.
