# Spec: Security Hardening — Portafolio KevinJGV

**Fecha:** 2026-05-22
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo:** `2026-05-21-foundation-react-islands-refactor-cleanup-design.md`
**Findings origen:** `docs/superpowers/findings/2026-05-21-foundation-findings.md`

## Resumen

Cerrar la deuda de seguridad acumulada en el portafolio: vulnerabilidades de npm, ausencia de headers HTTP de seguridad, enlaces `target="_blank"` sin `rel="noopener noreferrer"`, y tracking de terceros en el README. Resultado esperado: portafolio con grade ≥ B en `securityheaders.com`, 0 vulnerabilidades de `npm audit`, y sin tracking externo en assets propios.

## Goals

1. **Cerrar las 25 vulnerabilidades de npm audit** (1 low / 10 moderate / 14 high), incluyendo el upgrade major de `@astrojs/vercel` v8 → v10 que arregla la CVE `GHSA-mr6q-rp88-fx84` (Unauthenticated Path Override).
2. **Auditar y bumpear dependencias directas** (astro, react, react-dom, gsap, @astrojs/react, @astrojs/check) a las últimas versiones de su rango semver actual, con verificación de build entre cada bump.
3. **Configurar headers HTTP de seguridad** en Vercel vía `vercel.json`: CSP baseline pragmático + 5 headers complementarios.
4. **Añadir `rel="noopener noreferrer"`** a los 4 enlaces/form con `target="_blank"` que aún no lo tienen.
5. **Reemplazar el badge `visitcount.itsvg.in`** del README por un badge equivalente sin tracking de terceros.
6. **Aprovechar para arreglar** las 2 referencias obsoletas a `output: 'server'` en `CLAUDE.md` (consecuencia del cambio a `'static'` en el spec Foundation).

## Non-goals

- **Migrar `formsubmit.co` a un endpoint propio.** El form de `Contact.astro` envía datos a un tercero (formsubmit.co). Es una decisión de feature/producto, no de seguridad pura. Se documenta como finding para un spec futuro.
- **Subresource Integrity (SRI).** No aplica: el proyecto no carga scripts/CSS externos en su HTML. Todo está bundled por Astro.
- **Auditoría de seguridad operacional** (secrets management, CI/CD, supply chain más allá de npm audit). Es un portafolio estático sin secrets en código.
- **Rate limiting / abuse protection.** Sin backend propio no procede.
- **Refactorizaciones, cleanup de código, o nuevas features.** Este spec es de seguridad, no de calidad interna.

## Contract / preservación

- **Comportamiento funcional:** sin cambios. Animaciones GSAP, cursor personalizado, view transitions, Vercel Analytics, form de contacto deben funcionar idénticos.
- **Apariencia visual:** sin cambios.
- **Build:** sigue pasando con 0/0/0 (errors/warnings/hints).
- **Deploy:** sigue funcionando en Vercel en modo estático.

Si algún cambio rompe alguno de los 4 puntos anteriores, se trata como regresión y debe revertirse o ajustarse el approach.

## Arquitectura de cambios

Cinco buckets independientes. Cada bucket es atómico (1 commit o pocos commits relacionados) para facilitar revert quirúrgico.

### Bucket A — Dependencias

Archivos: `package.json`, `package-lock.json`.

Pasos:
1. Snapshot inicial: `npm audit` archivado en commit message del primer commit del bucket.
2. `npm audit fix` (sin `--force`) — aplica todos los fixes no-breaking.
3. Upgrade manual de `@astrojs/vercel` ^8.0.4 → ^10.x:
   - Antes del bump, consultar release notes vía `mcp__plugin_context7_context7__resolve-library-id` + `query-docs` para verificar cambios de API en `defineConfig({ adapter: vercel({...}) })`.
   - Confirmar que `webAnalytics: { enabled: true }`, `imageService: true` siguen siendo opciones válidas.
   - Bump + `npm run build` — debe pasar.
4. Audit de directas restantes (`astro`, `react`, `react-dom`, `gsap`, `@astrojs/react`, `@astrojs/check`):
   - Para cada una: `npm outdated <pkg>` para ver versión deseada dentro del rango semver actual.
   - Si hay update: `npm update <pkg>` + `npm run build`.
   - Si rompe el build: revertir con `git checkout package.json package-lock.json` y documentar como caso especial.
5. `npm audit` final: 0 vulns esperado. Si hay residuales, justificar cada una explícitamente.

### Bucket B — Headers HTTP

Archivo: `vercel.json` (nuevo, en raíz del repo).

Estructura:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' https://va.vercel-scripts.com; font-src 'self' data:; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://formsubmit.co" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" }
      ]
    }
  ]
}
```

Notas sobre el CSP:
- `'unsafe-inline'` en `style-src` es necesario por `define:vars`, `style={...}` inline, y estilos generados por GSAP. Una migración a nonces requeriría reescribir patrones — fuera de scope.
- `data:` en `img-src` y `font-src` es necesario por el cursor base64 y posibles SVGs/fonts inline.
- `https:` en `img-src` deja margen para badges externos en futuras secciones del portafolio sin re-tocar el header.
- `script-src` solo permite Vercel Analytics. Si en el futuro se añade otro script externo, ampliar aquí.
- `form-action` permite `formsubmit.co` para que el form de Contact siga funcionando. Si Bucket A o un spec futuro migra el form a un endpoint propio, eliminar este host.
- `frame-ancestors 'none'` previene embedding en iframes ajenos (clickjacking).

### Bucket C — `rel="noopener noreferrer"`

4 archivos, 1 línea cada uno:
- `src/components/Card.astro` línea 52: añadir `rel="noopener noreferrer"` al `<a target="_blank">` del proyecto.
- `src/components/me/SpotifyPlayer.astro` línea ~24: añadir al anchor "Via Spotify".
- `src/components/me/MeWhereImGoing.astro` línea ~18: añadir al anchor "Código Ninja".
- `src/components/Contact.astro` línea ~9: añadir al `<form target="_blank">` (válido en HTML5 sobre forms).

Verificación: `grep -rln 'target="_blank"' src/ | xargs grep -L 'noopener noreferrer'` no debe devolver ningún archivo. Equivalentemente: cada archivo con `target="_blank"` debe contener también `noopener noreferrer`.

### Bucket D — README badge

Archivo: `README.md`, línea 12.

Reemplazo: badge actual de visitcount.itsvg.in por un shields.io equivalente que no haga tracking. Opción concreta (a definir en plan de implementación): `https://img.shields.io/github/last-commit/KevinJGV/KevinJGV` o `https://img.shields.io/github/stars/KevinJGV/KevinJGV?style=social`. Decisión final en el plan.

### Bucket E — Housekeeping `CLAUDE.md`

Archivo: `CLAUDE.md`, líneas 19 y 67.

Cambios:
- Línea 19: actualizar la descripción del adapter de Vercel para reflejar `output: 'static'`.
- Línea 67: en la sección "No tocar", cambiar "`output: 'server'`" por "`output: 'static'`" — la directiva sigue siendo "no tocar sin verificar impacto en deploy", solo cambia el valor.

## Orden de ejecución sugerido

```
1. Bucket E (CLAUDE.md)    ← trivial, sin riesgo, contextualiza al implementer
2. Bucket C (rel=noopener) ← trivial, sin riesgo
3. Bucket D (badge README) ← trivial, sin riesgo
4. Bucket A (deps)         ← el más riesgoso por v10 major
5. Bucket B (headers)      ← depende solo de Vercel, no del build
```

Buckets A y B se pueden swappear si se prefiere; la dependencia mínima es que A se haga antes del deploy final para asegurar que `@astrojs/vercel` v10 esté en producción.

## Riesgos y mitigaciones

**R1 — `@astrojs/vercel` v10 introduce cambios de API.**
- Mitigación: consultar release notes vía context7 antes del bump. Commit aislado para revert limpio.
- Fallback: si rompe, evaluar versión intermedia (v9.x) o documentar la CVE de v8 como aceptada (CVSS 6.5, requiere ataque dirigido en runtime SSR — somos static, vector menos relevante).

**R2 — CSP rompe algo visual no obvio.**
- Mitigación: el baseline permite los inline styles, data: URIs, y scripts de Vercel Analytics que el portafolio usa hoy.
- Verificación: `npm run preview` + DevTools console en `/`, `/me`, `/contact`, y cualquier otra ruta. 0 reportes de CSP violation.
- Fallback: relajar la directiva específica que falle, no debilitar el header entero.

**R3 — Bump de Astro/React/GSAP rompe build.**
- Mitigación: bumpar uno por uno con `npm run build` entre cada uno.
- Fallback: revertir el bump específico y documentarlo.

**R4 — Vercel Web Analytics requiere hosts adicionales en CSP no documentados.**
- Mitigación: el CSP ya incluye `va.vercel-scripts.com` y `vitals.vercel-insights.com`. Si en runtime aparecen otros hosts en console, ampliar.

**R5 — Reemplazo de badge sin equivalencia visual.**
- Aceptado: el badge era vanity metric, no funcional. Cualquier badge de shields.io cumple el rol decorativo.

## Criterios de aceptación

Automáticamente verificables:
1. `npm audit` reporta 0 vulnerabilidades (o N residuales documentadas con justificación explícita).
2. `npm run build` pasa con 0 errores, 0 warnings, 0 hints.
3. `grep -rn 'target="_blank"' src/` no devuelve líneas sin `rel="noopener noreferrer"`.
4. `grep -n "visitcount\|itsvg" README.md` no devuelve nada.
5. `grep -n "output: 'server'" CLAUDE.md` no devuelve nada.
6. `vercel.json` existe en raíz con los 6 headers especificados.
7. `@astrojs/vercel` en `package.json` es `^10.x` o superior.

Verificables visualmente (usuario):
8. Response headers de cualquier ruta en DevTools incluyen los 6 headers.
9. `npm run preview` en rutas relevantes: 0 errores de CSP en consola.
10. Funcionalidad sin regresiones: cursor, GSAP, view transitions, Vercel Analytics, form de contacto.
11. Badge nuevo renderiza correctamente en GitHub tras push.

Post-deploy real:
12. Deploy a Vercel completa sin errores.
13. `securityheaders.com` evaluando la URL devuelve grade ≥ B (idealmente A).

## Follow-ups esperados (para spec futuro)

- Migración de `formsubmit.co` a endpoint propio (serverless function en Vercel + variable de entorno para destino).
- Si CSP `'unsafe-inline'` se quiere remover en el futuro: migración a nonces/hashes y reescritura de patrones inline.
- Política de actualización de dependencias (Dependabot/Renovate) para evitar acumulación futura.
