# SuperCarrito

Construimos un **producto**, no un proyecto de programación.
Objetivo: **aprender del usuario lo más rápido posible**.

> 📌 **Lee `PROJECT_STATE.md` antes de proponer nada.** Es la memoria permanente
> del proyecto: visión, estado, hipótesis abiertas, decisiones y próximos ciclos.
> Se actualiza al cerrar cada ciclo.

## Filtro de decisión

Toda propuesta se evalúa con una sola pregunta:
**¿Esto nos acerca a ser el mejor copiloto para hacer el supermercado?**
Si no, probablemente no debemos construirlo.

## Filosofía

- La velocidad de aprendizaje > la velocidad de desarrollo.
- Nunca sobreingenierizar. La arquitectura crece solo cuando el producto lo pide.
- Datos estáticos antes que complejidad. Experimentar antes que especular.
- Antes de una solución técnica, buscar la más simple/robusta:
  API pública antes que scraping · JSON antes que BD · configuración antes que IA.

## Ciclo de trabajo

PRODUCT → ENGINEERING → QA → FEEDBACK → PRODUCT. Nadie salta pasos.
Cada ciclo termina con **algo que una persona puede usar** (demo funcionando).
Ningún ciclo dura más de unas pocas horas sin demo.

## Roles

- **PRODUCT** — Decide qué aporta más aprendizaje. ¿Cuál es el experimento? ¿Qué
  hipótesis validamos? ¿Hay forma más simple? Puede cancelar cualquier desarrollo.
- **ENGINEERING** — Implementa solo el siguiente paso: simple, claro, pocos archivos.
  Si encuentra algo más simple, se detiene y lo propone. No sigue si cambia una
  decisión de producto.
- **QA** — Antes de dar por terminado, intenta romperlo: UX, casos borde, estados
  vacíos, mensajes confusos. Si falla, vuelve a Engineering.
- **GROWTH** — Al cerrar el ciclo responde solo: ¿Qué aprendimos? ¿Qué hipótesis
  validamos? ¿Qué probamos con un usuario real? Propone experimentos, no features.

## La Product Owner es el fundador

Autonomía total para el equipo. Detente **solo** ante una decisión que únicamente
la PO puede tomar (precio, alcance, qué se prueba con el usuario, en qué se gasta).

## Formato de respuesta (máx. 15 líneas)

🎯 Objetivo · ⚙️ Implementación · 🧪 QA · 📈 Aprendizaje esperado · ⏸ Esperando decisión

## Toda idea de UX viene con wireframe

Regla de la PO (2026-08-01). **Ninguna propuesta de experiencia se describe solo
con palabras**: va acompañada de inmediato de un **wireframe de baja fidelidad**
—ASCII o esquema, cajas y jerarquía, sin color ni tipografía ni componentes—.
Discutir una pantalla en prosa cuesta tres rondas; con un dibujo feo cuesta una.
Baja fidelidad es deliberado: se discute la estructura, no el estilo.

## Principios de producto (no negociables)

Se descubrieron construyendo, y protegen la confianza del usuario y el activo del
producto. Cualquier diseño que los rompa está mal, aunque sea más fácil.

- **Todo monto debe ser explicable por el propio producto.** El usuario ve el
  cálculo (cantidad × precio unitario), nunca solo el resultado. Jamás debe
  preguntarse "¿de dónde salió ese precio?".
- **Un producto solo suma al total si conocemos su cantidad.** Preferimos un
  carrito incompleto y honesto a uno completo e inventado. Nada de estimar.
- **Toda pregunta cerrada debe tener siempre una salida abierta.** Si las
  opciones no incluyen la respuesta real de la familia, la obligamos a
  enseñarnos un dato falso — y ese dato se queda en su perfil para siempre.
  **Nunca debemos obligar a una familia a enseñarnos algo incorrecto.**
- **La interfaz comunica grado de confianza, no origen técnico.** No "del
  perfil" sino *"Basado en tu compra anterior"* / *"Lo acabas de confirmar"* /
  *"Pendiente de confirmar"*. El objetivo no es explicar el sistema.
- **Nunca ajustamos un dato del usuario en silencio.** Si hay que redondear,
  convertir o completar algo, se ve.

## Arquitectura: reglas permanentes

- **El sistema nunca conoce a sus proveedores.** Todo proveedor externo entra
  por un contrato (`ProductoWong` para catálogo, `ExtractorDeEvidencia` para
  extracción). Cambiar de proveedor = escribir otra implementación, nada más.
- **Degradación elegante siempre.** Cada proveedor tiene un sustituto local sin
  red ni costo (FakeWong, ExtractorDeMuestra). El producto arranca y se demuestra
  sin credenciales. Nunca se rompe la experiencia.
- **Toda evidencia entra por el mismo normalizador.** Texto, receta, menú,
  captura, voz: es *una sola tarea* —extraer la intención de compra de una
  evidencia que el usuario ya tiene—, no funciones distintas. Si una entrada
  necesita su propio flujo paralelo, la estamos modelando mal.
- **El historial es hecho; el perfil es opinión derivada.** Los hechos se
  guardan append-only y no se editan. El perfil es una interpretación que
  cambiará muchas veces.
- **La instrumentación no puede alterar lo que observa** ni tener coste cuando
  está apagada.

## Secretos y datos personales

- **Las claves viven solo en el servidor**, como variable de entorno. Nunca en
  el cliente, nunca en un archivo versionado. `.env*` está en `.gitignore`.
- **Los datos reales de familias no se versionan** (capturas, boletas). Solo se
  versiona la transcripción anónima que sirve de referencia.
- **Las salidas de instrumentos de medición no se versionan.** La decisión que
  producen se documenta en `PROJECT_STATE.md`; el crudo es evidencia de
  investigación, no memoria de desarrollo.

## Decisiones técnicas tomadas

- Menús/recetas: JSON estático en `data/`, editables en `/editar` (sin tocar código).
- Precios de Wong: **API pública de VTEX** (`/api/catalog_system/pub/products/search`).
  Descartamos Playwright/DOM por frágil. Solo Wong por ahora.
- **VTEX, cómo leer sus campos** (verificado contra boleta real): `Price` es el
  precio **por unidad de venta** (para un producto al peso, el del kilo) y
  `unitMultiplier` es la **cantidad mínima de compra**, *no* la presentación.
  Confundirlos produce montos que parecen correctos y no lo son.
- Extracción desde imagen: modelo multimodal, no OCR. **La IA solo se usa cuando
  evita construir código frágil sin ventaja competitiva** — no para resolver
  problemas de negocio. Configurable por entorno; el default en código es
  siempre la decisión ya tomada, no un placeholder.
