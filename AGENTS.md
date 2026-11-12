# MeetingNotes — instrucciones para Codex

## Propósito

MeetingNotes será una herramienta para tomar notas de conversaciones de reuniones usando como fuente el audio de la computadora. El método de captura, las plataformas compatibles, la transcripción y el almacenamiento aún no están definidos. No implementes captura, transmisión ni persistencia de audio hasta que esas decisiones tengan aprobación humana.

## Mapa del repositorio

- `AGENTS.md`: contexto, límites y decisiones que requieren revisión humana.
- `README.md`: creado vacío intencionalmente en la inicialización.
- No hay todavía código fuente, aplicaciones, paquetes, manifiestos de dependencias ni configuración de pruebas.

La estructura de la imagen adjunta es una referencia posible, no un inventario aprobado. No asumas que Vike, React, TypeScript, Hono, Bun o Zod son decisiones tomadas, ni que `apps/`, `packages/` o `docs/` deban existir.

## Desarrollo y validación

Todavía no hay stack ni comandos de desarrollo o validación configurados. No inventes ni ejecutes comandos de `npm`, `bun` u otras herramientas. Cuando se apruebe el stack, verifica los comandos en sus manifiestos y configuración y documenta aquí los comandos reales.

## Convenciones

- El equipo usa Codex; sigue este archivo y cualquier instrucción vigente más específica que aparezca en el repositorio.
- No agregues dependencias, estructura de workspaces ni convenciones de código hasta que se apruebe el stack.
- Mantén las instrucciones factuales; marca lo no decidido como pendiente en vez de inferirlo.

## Plan aprobado

No hay un plan de implementación aprobado dentro del repositorio. La solicitud inicial describe el propósito del producto; la imagen es una referencia exploratoria y no aprueba tecnologías ni estructura. Antes de tomar decisiones de arquitectura, dependencias o alcance, pide al usuario la ubicación del plan aprobado o su aprobación explícita.

## Decisiones que requieren revisión humana

- Alcance del producto y plataformas compatibles.
- Fuente y método de captura del audio, permisos del sistema operativo y controles de grabación.
- Motor o servicio de transcripción, uso de servicios externos y costos.
- Privacidad de reuniones, consentimiento, seguridad, almacenamiento y retención de audio y notas.
- Stack, arquitectura, dependencias, estructura del monorepo, CI, publicación y despliegue.
- Creación del remoto de GitHub, visibilidad del repositorio y publicación de contenido.

No envíes audio o notas a servicios externos, ni habilites grabación o retención, sin aprobación explícita del alcance y del tratamiento de datos. No crees el remoto ni publiques cambios: el usuario indicó que creará el repositorio en su cuenta personal.
