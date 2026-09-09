# Checklist de calidad para replicación visual

Lee esta referencia durante la implementación o el QA de una UI reconstruida desde una imagen. No conviertas cada punto en una abstracción si la pantalla no lo necesita; úsala para detectar omisiones.

## Fidelidad visual

- [ ] La estructura y el orden visual coinciden con la referencia.
- [ ] El contenedor, grid, alineaciones, espaciado y densidad se mantienen en el viewport de referencia.
- [ ] La escala tipográfica, peso, altura de línea y wrapping son coherentes.
- [ ] Colores, bordes, radios, sombras y estados no dependen de valores duplicados sin una razón.
- [ ] Iconos y assets tienen proporciones, tratamiento y contexto equivalentes; no se usan placeholders silenciosos en una entrega final.
- [ ] La UI no se rompe con texto largo, listas vacías o contenido que llega tarde.

## Accesibilidad

- [ ] Existe un `main` y landmarks (`header`, `nav`, `section`, `footer`) solo cuando representan regiones reales.
- [ ] Hay una jerarquía de headings lógica y normalmente un único `h1` por página.
- [ ] Links navegan y botones ejecutan acciones; no se simula interacción con `div` o `span`.
- [ ] Todo control tiene nombre accesible visible o mediante `aria-label`/`aria-labelledby` justificado.
- [ ] El orden de tabulación sigue el orden visual y todos los controles tienen `:focus-visible` reconocible.
- [ ] La información no depende solo del color, el hover, el movimiento o un icono.
- [ ] Texto y controles cumplen contraste suficiente; el contenido se conserva con zoom y reflow.
- [ ] Las imágenes informativas tienen `alt`; las decorativas usan `alt=""` o se marcan como decorativas.
- [ ] Errores, cambios de estado y actualizaciones asíncronas se exponen al usuario sin depender solo de cambios visuales.
- [ ] Animaciones respetan `prefers-reduced-motion`; no hay auto-play o parpadeo innecesario.
- [ ] Formularios, si existen, tienen `label`, instrucciones, validación comprensible y mensajes asociados al campo.

## Mantenibilidad y Next.js

- [ ] La solución usa el patrón App Router ya presente y conserva Server/Client Components según la necesidad real de interactividad.
- [ ] La obtención de datos, la presentación y las transformaciones de dominio permanecen separadas.
- [ ] Los componentes se extraen por responsabilidad o reutilización real, no por tamaño arbitrario.
- [ ] Los nombres describen intención; no hay números mágicos o clases repetidas que oculten decisiones de diseño.
- [ ] Los estados de loading/error/empty no rompen el layout ni duplican la consulta principal.
- [ ] Los enlaces externos conservan una relación segura y una indicación clara de que abren otra pestaña, si aplica.
- [ ] No se agregan dependencias ni assets remotos sin justificar su necesidad y compatibilidad con el repo.

## Verificación mínima

1. Ejecuta solo comandos declarados por `package.json` o por las instrucciones del repositorio.
2. Pasa `npm test`, `npm run lint` y `npm run build` cuando existan y sean relevantes.
3. Prueba el viewport de referencia y al menos un viewport móvil.
4. Revisa teclado desde el inicio de la página y prueba foco, enlaces, botones, formularios y estados de error.
5. Reporta cualquier validación no ejecutada, asset faltante o decisión inferida que pueda cambiar el resultado.
