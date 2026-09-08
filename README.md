# AI Radar

AI Radar es el proyecto del curso avanzado de Codex.

El objetivo del producto es organizar noticias, herramientas, papers, repos y lanzamientos de IA para convertirlos en senales accionables para builders: que paso, por que importa, que tan confiable es y que vale la pena probar.

Estado actual: contrato local, consulta de snapshots, persistencia inicial en Supabase y API server-side. La implementación se construye por capas durante el curso con Codex.

## Problema

El ritmo de la inteligencia artificial genera demasiado ruido:

- lanzamientos repetidos en varias fuentes,
- repos que parecen importantes pero no tienen adopcion,
- demos sin documentacion suficiente,
- papers sin ejemplo practico,
- herramientas con impacto real mezcladas con marketing.

AI Radar debe ayudar a separar ruido de senales utiles.

## Producto Objetivo

Al final del curso, AI Radar debe poder:

- recopilar novedades de IA desde fuentes seleccionadas,
- normalizar noticias, repos, papers y productos,
- detectar duplicados y noticias parecidas,
- agrupar senales por tema,
- rankear por novedad, impacto, evidencia y accionabilidad,
- generar guias practicas para decidir que probar,
- exponer resultados en un dashboard,
- guardar trazas de decisiones y validaciones,
- desplegarse con infraestructura controlada.

## Estado del repositorio

El repositorio contiene:

- `contracts/ai-radar-daily.schema.json`: contrato de snapshots diarios.
- `data/daily/`: fixtures locales de señales.
- `scripts/query_signals.py`: consulta local de snapshots.
- `scripts/validate_snapshot.js`: validación de fixtures contra el contrato.
- `src/`: aplicación Next.js, configuración, validación, normalización, cliente Supabase y consultas.
- `src/app/api/`: Route Handlers server-side para health, señales e ingesta.
- `supabase/migrations/`: esquema y RLS de persistencia.

### Persistencia y desarrollo

El proyecto Supabase `test` (`zomlypehqzbtjjwcqwhq`) es el entorno de desarrollo actual. El esquema inicial conserva snapshots completos en JSONB y normaliza señales, fuentes, evidencia y acciones.

Para configurar el entorno local:

```bash
cp .env.example .env.local
supabase link --project-ref zomlypehqzbtjjwcqwhq
npm install
```

Las claves secretas solo se usan server-side. La lectura pública está protegida por RLS y la ingesta requiere `CRON_SECRET` u `OPERATOR_API_TOKEN`.

Comandos de verificación:

```bash
npm test
npm run validate:fixtures -- data/daily/2026-09-08.json data/daily/2026-09-08-alternatives.json
supabase migration list
```

La autenticación de usuarios y la automatización programada siguen intencionalmente fuera de esta primera capa; el dashboard inicial ya vive en `src/app/page.js`.

El repositorio conserva la separación entre contrato local, dominio y servicios externos para que cada capa pueda verificarse de forma independiente.

## Stack Objetivo

El stack debe mantenerse simple para que el foco del curso sea Codex, no el framework.

- Frontend: Next.js App Router, React, JavaScript y Tailwind CSS.
- Dominio: modulos JavaScript reutilizables.
- CLI: `airadar` para comandos internos del proyecto.
- Automatizacion local: scripts Node.js.
- Proyecto agent-friendly: Dekk cuando existan comandos que deban usar humanos y agentes.
- API: Route Handlers de Next.js dentro de la misma aplicación.
- Datos locales: fixtures y snapshots para validación reproducible.
- Base de datos: Supabase para persistencia normalizada y payloads auditables.
- QA: `node:test` para dominio y Playwright cuando exista interfaz visual.
- Demo final: video programatico con la evidencia del proyecto.

## Reglas Iniciales Para Codex

Antes de implementar, Codex debe distinguir:

- vision del producto,
- estado actual del repositorio,
- decisiones tecnicas tomadas,
- decisiones pendientes,
- limites de seguridad.

Codex no debe inventar archivos, comandos, servicios ni integraciones como si ya existieran.
