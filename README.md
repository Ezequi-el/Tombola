# Tómbola

Aplicación React/Vite. Conserva boletos, bancos, configuración e historial en localStorage del navegador y perfil actuales.

## Desarrollo y compilación

Usa Node 22. Ejecuta `pnpm install`, `pnpm run lint` y `pnpm run build`.
El build genera iconos PNG de 192/512 y un service worker con todos los archivos finales (JS, CSS, fuentes y manifiesto).
Vercel usa esos comandos mediante vercel.json. Usa pnpm y su lockfile; Vercel instala con pnpm --frozen-lockfile.

## Instalar y trabajar sin internet

1. Abre la web publicada por HTTPS con internet.
2. Espera el aviso **Lista para usar sin conexión**. La descarga completa debe terminar antes de desconectar.
3. En navegadores compatibles aparecerá **Instalar Tómbola** cuando el navegador habilite su instalación. También puedes usar su menú de instalación; cada navegador decide la disponibilidad.
4. Abre la app o recarga el sitio sin internet. Sorteos, gráficos 3D, audio, bancos, boletos, configuración e historial usan recursos locales.

Las tipografías se incluyen desde Fontsource durante el build y se sirven desde el mismo sitio; no se solicitan Google Fonts en ejecución. Los gráficos/texturas son procedurales y el audio usa Web Audio. No hay servicios remotos activos en el código inspeccionado. No se añade base de datos ni sincronización.

La preparación offline funciona en el build de producción (`pnpm run preview` sirve para probar en localhost), no en Vite dev.
Cada versión se descarga completa. Las actualizaciones esperan a que se cierren todas las ventanas de Tómbola antes de activarse, para evitar mezclar archivos de distintas versiones. Si se actualiza desde el service worker anterior, cierra todas las ventanas y vuelve a abrir con internet hasta ver el aviso de preparación completa.
Borrar los datos del sitio elimina la caché y los datos locales. El navegador también puede desalojar almacenamiento; instalar no equivale a una copia de seguridad.

## Verificación

La prueba Chromium sobre producción prepara la primera visita, verifica fuentes/iconos y archivos cacheados, desconecta la red, recarga, sortea y comprueba la persistencia del historial y acceso al administrador.
Para ejecutarla: `pnpm add -D @playwright/test`, `pnpm exec playwright install chromium`, `pnpm exec playwright test`.

La prueba simula el evento de elegibilidad para comprobar el botón; el diálogo de instalación real se verifica manualmente en Chrome/Edge de escritorio. No se afirma soporte offline para futuros servicios remotos.

## Bancos incluidos

Solo se incluyen Sección de preguntas (9 entradas) y Sección de frases (10 entradas), en el orden entregado. La pregunta repetida se conserva. Una migración única reemplaza los bancos guardados anteriores; no borra boletos en juego, historial ni configuración. Después de la migración, las ediciones de bancos se conservan normalmente. La tómbola inicial de instalaciones nuevas carga las nueve preguntas. Los boletos en juego son independientes de los bancos y no mantienen referencias a ellos.

Verificado localmente: tipos, build, recarga/sorteo y creación de bancos sin internet, y migración de bancos con preservación de historial y configuración. Las licencias de las fuentes se distribuyen en /licenses/.
