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

## Decisiones técnicas tomadas

- Menús/recetas: JSON estático en `data/`, editables en `/editar` (sin tocar código).
- Precios de Wong: **API pública de VTEX** (`/api/catalog_system/pub/products/search`).
  Descartamos Playwright/DOM por frágil. Solo Wong por ahora.
