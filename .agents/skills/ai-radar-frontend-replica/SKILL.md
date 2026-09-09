---
name: ai-radar-frontend-replica
description: Reproduce a Next.js App Router frontend from one or more reference images in the AI Radar repository, translating visual evidence into responsive, semantic, accessible, and maintainable React/Tailwind UI. Use when the user asks to replicate or rebuild a frontend from a screenshot or mockup; do not use for a read-only design critique.
metadata:
  short-description: Replicar frontend Next.js desde una imagen
---

# AI Radar Frontend Replica

Replica la interfaz visible en una imagen dentro del repositorio AI Radar sin tratar la captura como una especificación completa. La imagen es evidencia visual; el código existente, los contratos de datos y las restricciones del proyecto siguen siendo la fuente de verdad.

## Límites del repositorio

- Inspecciona primero el repo, sus instrucciones, rutas, estilos, contratos, API y cambios pendientes. Conserva trabajo del usuario que no esté relacionado.
- Mantén el stack existente: Next.js App Router, JavaScript, React y Tailwind CSS. No introduzcas otra librería de UI, TypeScript, autenticación, un backend separado o una integración externa salvo que el usuario lo pida.
- Respeta las fronteras actuales entre UI, dominio, Route Handlers y Supabase. No reemplaces datos dinámicos por texto hardcodeado solo para que coincida con la imagen.
- No inventes assets, rutas, comandos ni estados de datos como si existieran. Si falta la imagen, un asset esencial o una decisión de producto, detente y pide únicamente lo imprescindible.
- No uses la captura como `background-image`, como un `<img>` de la interfaz ni como sustituto de componentes reales. El resultado debe ser una UI funcional.

## Flujo de trabajo

1. **Analiza la imagen y explicita inferencias.** Identifica viewport aproximado, regiones, jerarquía, grid, espaciado, tipografía, colores, bordes, sombras, estados visibles, patrones de interacción y assets. Separa lo observado de lo inferido y anota qué debe comprobarse en responsive. Si hay varias imágenes, trátalas como estados o breakpoints del mismo sistema salvo evidencia contraria.
2. **Reconoce la aplicación actual.** Revisa `AGENTS.md`, `README.md`, `package.json`, `src/app`, `src/components` si existe, `src/app/globals.css`, contratos, fixtures y endpoints relevantes. Decide si se modifica una ruta existente o se crea una nueva, evitando duplicar lógica.
3. **Diseña una estructura mantenible antes de estilizar.** Divide por responsabilidad y reutilización: layout, navegación, encabezado, contenido, tarjeta, controles y estados. Coloca componentes compartidos en una carpeta coherente; no extraigas abstracciones de un solo uso si no mejoran claridad. Centraliza tokens visuales repetidos mediante variables CSS o clases reutilizables en lugar de copiar valores por todo el JSX.
4. **Implementa la composición visual.** Construye primero el layout y la jerarquía; después ajusta tipografía, color, spacing, borders y motion. Usa HTML semántico y componentes interactivos nativos. Usa `next/image` solo cuando aporte optimización y con dimensiones/`alt` apropiados; para iconos, conserva un nombre accesible y no comuniques información únicamente por color.
5. **Completa los estados reales.** Mantén o añade estados de loading, error, vacío, éxito, foco, hover, disabled y contenido largo cuando apliquen. Conecta la UI a los datos y APIs ya existentes; si la imagen muestra contenido de ejemplo, úsalo como fixture o dato de prueba solo cuando el contrato lo permita.
6. **Haz responsive de forma intencional.** Implementa los breakpoints a partir de la composición y no de una reducción mecánica. Verifica como mínimo el ancho de la imagen de referencia y un viewport móvil; evita overflow horizontal, texto truncado que oculte información y controles demasiado pequeños.
7. **Valida calidad y fidelidad.** Ejecuta los comandos que realmente existan en el repo, priorizando `npm test`, `npm run lint` y `npm run build`. Levanta la app y compara capturas en los viewports relevantes cuando haya una herramienta de navegador disponible. Revisa errores de consola, navegación por teclado, foco visible, zoom/reflow, contraste y estados interactivos. Lee [references/quality-checklist.md](references/quality-checklist.md) antes de cerrar.
8. **Entrega evidencia.** Resume archivos modificados, decisiones visuales inferidas, validaciones ejecutadas, limitaciones y cualquier punto que requiera revisión humana. Si no fue posible hacer QA visual en navegador, dilo explícitamente.

## Criterios de aceptación

- La página replica la jerarquía y composición observables, pero sigue siendo responsive y funcional.
- La UI tiene landmarks y headings coherentes, controles operables por teclado, foco visible, nombres accesibles, alternativas textuales y estados comunicados correctamente.
- Los datos, navegación y errores respetan los límites existentes del proyecto.
- Los estilos repetidos están tokenizados o encapsulados; los componentes tienen responsabilidades claras y no hay una mega-componente difícil de mantener.
- Test, lint y build pasan, o se reporta con precisión qué falló y por qué. No se marca como terminado solo por parecerse visualmente a la imagen.
