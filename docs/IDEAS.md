# Ideas / Roadmap futuro

Ideas para implementar a **medio/largo plazo**. No son trabajo activo. Cualquier LLM o dev que
retome el proyecto: leer el prerequisito de cada idea antes de empezar.

---

## 🥚 Easter egg: modo "personal / psicodélico" (alt-skin de toda la web)

**Estado:** idea futura (medio/largo plazo). **NO implementar todavía.**

**Prerequisito (bloqueante):** primero terminar el **portafolio profesional** lo más pulido/completo
posible. Esto es una *extensión* que reinterpreta la web "final"; sin esa base no tiene sentido.
Solo invertir recursos acá una vez que la versión profesional esté terminada.

### Concepto
Un **easter egg** que transforma la web entera en una versión alterna, más **personal, banal y
psicodélica**, que cambia el *significado* de muchas cosas de la página (mismo esqueleto, otro "alma").
Es un "modo paralelo": mismos componentes, otro set de datos/estilos/assets.

### Qué cambia al activarlo
- **Tecnologías (panal de hexágonos):** en vez de skills profesionales, mostrar **conocimientos
  triviales/cotidianos**: Word, Excel, Canva, Facebook, etc.
- **Casos (cards):** en vez de proyectos serios, **"chismes", banalidades o logros intrascendentes**.
- **Fondo:** otro fondo (más psicodélico).
- **Fotos:** fotos distintas (más personales/random).
- **Textos / descripciones:** copy en un tono **menos serio**.
- **Música de fondo:** cambia a un tema más **"meme"**.
- **Redes sociales:** reemplazar por versiones más **personales**, que **NO** lleven a una red social
  real — o que solo lleven al **login** de dicha red (sin exponer un perfil real).
- **Más referencias a hobbies / enlaces personales:** p.ej. **perfil de Steam**, etc.

### Activación
Mecanismo de easter egg a definir (ej.: Konami code, secuencia de clicks secreta, query param oculto,
combinación en el toolbar...). Debe sentirse como un descubrimiento, no un toggle obvio.

### Notas de arquitectura (para cuando se implemente)
- Conviene modelarlo como un **"modo/tema" conmutable** que intercambie las fuentes de datos ya
  existentes: `src/data/*.ts` (technologies, cases, heroPhotos), los diccionarios `src/i18n/*.ts`
  (textos), assets (fondo, fotos, audio `/VIN.ogg` → tema meme) y los links sociales.
- Idealmente: un set **paralelo** de datos (p.ej. `technologies.fun.ts`, `cases.fun.ts`, copy alterno
  en i18n, audio alterno) + un switch global (clase en `<html>` / store) que el resto de componentes
  ya consuma. Mantener el esqueleto/componentes; solo cambia la data y el styling.
- Persistir el estado (sessionStorage/localStorage) para que sobreviva navegación con ClientRouter.
