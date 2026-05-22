# Findings durante Foundation refactor — 2026-05-21

Lista de hallazgos NO resueltos en este spec, propuestos como follow-up.

## Para spec de seguridad

- **26 vulnerabilidades** de npm audit detectadas al instalar dependencias (1 low, 10 moderate, 15 high). Correr `npm audit` para inventario y `npm audit fix` (sin `--force`) para las no-breaking. Las breaking changes requieren evaluación.
- Badge externo `visitcount.itsvg.in` en `README.md` carga en cada render del README en GitHub (tracking de terceros con implicaciones de privacidad).
- Revisar headers HTTP que Vercel sirve por defecto. Probable falta de CSP, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options.
- **4 enlaces con `target="_blank"` sin `rel="noopener noreferrer"`** detectados durante la verificación final:
  - `src/components/me/MeWhereImGoing.astro` — enlace a Código Ninja
  - `src/components/Card.astro` — enlace al proyecto
  - `src/components/me/SpotifyPlayer.astro` — enlace "Via Spotify"
  - `src/components/Contact.astro` — enlace de contacto
  Añadir `rel="noopener noreferrer"` a todos. Verificación rápida con `grep -r 'target="_blank"' src/ | grep -v noopener`.
- Considerar Subresource Integrity en cualquier `<script src>` externo (incluyendo el cursor base64 que NO es externo — ok ahí).

## Para spec de copy

- Texto de `/me` (4 secciones), `/`, `/contact` — pase de copywriting profesional alineado con el CV actual y el mercado.
- Mover los datos de `loves`/`hates` de `MeLikes.astro` y los textos hardcodeados de los componentes a `src/data/` o `src/content/` (Astro Content Collections) cuando el copy se rediseñe.
- Revisar tono, llamadas a la acción, jerarquía de información.

## Para spec de features (OGG interactivo)

- `public/VIN.ogg` y `public/VINXD.ogg` siguen sin uso. Pendiente diseño del feature.
- Considerar dónde encajaría visualmente la interacción (¿en el header? ¿en /me junto al Spotify player?).

## Para spec de mantenimiento / deuda técnica

- **CLAUDE.md tiene dos referencias obsoletas a `output: 'server'`** (líneas 19 y 67) tras el cambio a `output: 'static'` en Phase 6. La línea 19 describe el estado del adapter y la línea 67 advierte "no tocar `output: 'server'`". Ambas deben actualizarse para reflejar que el output es ahora `'static'` y que el adapter de Vercel funciona en modo estático.

## Otros findings durante ejecución

- **Tools.astro queda en 330 LOC**, por encima del threshold de 250. La revisión del Task 7.1 concluyó que es una unidad coherente (toolbar con estado de control de audio) que no se beneficia de partición. Si se añaden más herramientas al toolbar en el futuro, re-evaluar.
- El hook `astro-check` configurado en `.claude/hooks/` capturó al menos un error mid-edit durante el refactor (Task 4.5) — el setup agéntico funciona como se esperaba.
- `tagItem` y `renderTagItem` en `Card.astro` siguen retornando HTML como string + `set:html` en el markup. Pattern OK por compatibilidad pero podría refactorearse a componentes `.astro` reales en un spec futuro de quality interno.
- La cuenta de colores `dynamicColors` en `typewriter-words.ts` es 41 (el plan inicialmente decía 42 — fue corrección del implementer durante review).
- **FooterSocial.astro** enlaza a redes sociales con `target="_blank"` y sí tiene `rel="noopener noreferrer"` — correcto. La verificación final confirmó que los 4 enlaces problemáticos están en los otros archivos listados arriba.
