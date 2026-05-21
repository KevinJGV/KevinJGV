# KevinJGV — Portafolio (Astro 5)

Portafolio personal. Astro 5 SSR + TypeScript + GSAP. Deploy en Vercel.

## Comandos

- `npm run dev` — servidor de desarrollo (`astro dev`).
- `npm run build` — **incluye `astro check`** + build. Es el comando de verificación canónico antes de declarar trabajo completo.
- `npm run preview` — previsualiza el build local.
- `npm install` — instalar dependencias (Node >= 18).

## Estructura

- `src/pages/` — rutas Astro (`.astro`). Cada archivo es una ruta.
- `src/layouts/` — layouts compartidos.
- `src/components/` — componentes `.astro` reutilizables.
- `src/styles/` — CSS global / variables.
- `public/` — estáticos servidos tal cual (no procesados).
- `astro.config.mjs` — config; usa `@astrojs/vercel` con `output: 'server'`, `functionPerRoute: false`, `maxDuration: 60`, `webAnalytics`, `imageService`, `middleware`.

## Convenciones

- Componentes y páginas en `.astro` con frontmatter TypeScript.
- Animaciones: **GSAP**. Si vas a agregar una nueva, busca patrones existentes en `src/components/` antes de inventar.
- CSS scoped por defecto (Astro lo hace solo). Usar `is:global` solo cuando sea estrictamente necesario.
- No agregar dependencias sin razón concreta — el proyecto es deliberadamente liviano.

## Docs de librerías → usa el MCP context7

Antes de escribir o modificar código que toque APIs de **Astro, GSAP, Vercel, @astrojs/***, tu primera acción debe ser:

1. `mcp__plugin_context7_context7__resolve-library-id` con el nombre de la librería.
2. `mcp__plugin_context7_context7__query-docs` para la API específica.

No confíes en la memoria de entrenamiento para APIs de librerías — las versiones cambian. Hay un hook `UserPromptSubmit` que te recordará esto automáticamente cuando el prompt mencione librerías conocidas.

## Verificación antes de declarar listo

Tras cualquier cambio en `.astro`/`.ts`:

1. Hay un hook `PostToolUse` que corre `astro check` y bloquea con feedback si falla.
2. Antes de commitear, corre `npm run build` (esto verifica + buildea).

No declares trabajo completo sin que `npm run build` pase.

## Deploy

Vercel SSR. El adapter está en `astro.config.mjs`. No tocar `output: 'server'` ni `functionPerRoute: false` sin verificar el impacto en el deploy.

## No tocar

- `.astro/`, `.vercel/`, `dist/`, `node_modules/` — generados.
- `package-lock.json` — manipulado por npm, no editar a mano.
