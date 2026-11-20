# Educa Lambayeque

Portal ciudadano, panel administrativo y aplicación Android de la Gerencia Regional de Educación de Lambayeque.

## Estado actual

El proyecto está en etapa de demostración. Los datos de ejemplo no son oficiales y no deben utilizarse para tomar decisiones reales. La conexión con la base de datos real y la publicación de una versión de producción siguen pendientes.

El objetivo de la integración es que el panel administre la información y que el landing y la APK consulten la misma fuente a través de la API. **Esto aún no está resuelto para las tres experiencias**:

- La demo guarda datos en el almacenamiento local del navegador o de la aplicación. Estos datos no se sincronizan entre dispositivos.
- En modo demo, el landing usa datos de ejemplo propios, distintos de los del adaptador de demostración del panel.
- El código móvil activa el adaptador de demostración incluso si se configura `VITE_API_URL`. Por tanto, configurar esa variable no conecta actualmente la APK a la API.
- La demo conectada web permite usar la API y una base local de pruebas compartida entre panel y landing; no conecta la APK.

La aplicación Android es una versión de consulta: abre directamente los módulos, sin iniciar sesión, con el rol `CONSULTOR` y sin acciones de administración. La navegación del teléfono tiene una barra inferior y un acceso a alertas en el encabezado.

## Estructura

| Ruta | Función |
| --- | --- |
| `apps/admin` | Aplicación React: landing, panel y recursos web de la APK. |
| `apps/admin/android` | Proyecto Android con Capacitor. |
| `apps/api` | API Express, esquema y migraciones de Prisma. |
| `apps/shared` | Esquemas y tipos compartidos entre frontend y API. |
| `scripts` | Herramientas auxiliares de captura, PostgreSQL local y carga. |

Rutas web principales: `/` y `/portal` para el landing, `/descargar` para la descarga y `/login` para el panel. Las antiguas rutas de simulación `/app` y `/app/consulta` redirigen al landing. El panel incluye dashboard, instituciones, convocatorias, plazas, vacantes, infraestructura y alertas. El landing muestra vacantes, plazas, convocatorias y comunicados.

## Desarrollo local

Requisitos: Node.js 22 o superior y npm. Para usar la API conectada se necesita además PostgreSQL y un archivo de entorno válido.

```powershell
npm ci
npm run dev:admin
```

Vite muestra la dirección local al iniciar. Por defecto, la web usa la API; sin ella, las consultas conectadas no funcionarán. Para usar datos ficticios en la web, configura `VITE_APP_DEMO=true` en `apps\admin\.env.local` antes de iniciar Vite. El inicio de sesión de esta demo acepta un correo válido y una contraseña no vacía y permite elegir un rol de prueba; no equivale a una cuenta administrativa real.

En «Alertas», la sección «Comunicados y avisos» permite consultar y gestionar comunicados según el rol: administrador y editor pueden crear; solo el administrador puede editar o eliminar. En la demo local sin conexión estos cambios permanecen en el almacenamiento del navegador y no se reflejan en el landing ni en otros dispositivos.

En «Instituciones» se administran los datos de las instituciones y una foto opcional por URL o archivo. Administrador y editor pueden crear; solo el administrador puede editar o desactivar y reactivar. La desactivación conserva los registros asociados, que pueden seguir apareciendo. En la demo conectada las fotos se muestran en las tarjetas públicas de vacantes y plazas disponibles; en la demo sin conexión el landing conserva sus propios datos. Es necesario aplicar la migración `20261120130000_institucion_foto` a la base de desarrollo.

Cada comunicado puede incluir una imagen y un PDF, mediante URL o carga de archivo. En demo se guardan en el almacenamiento local (máximo 2 MB por archivo); en modo conectado se usa el almacenamiento de la API (máximo 10 MB por archivo). Para usar el PDF en una base de desarrollo es necesario aplicar las migraciones, incluida la que agrega `documento_url`; no se ha aplicado automáticamente.

Para la API, copia `.env.example` como `apps\api\.env` si todavía no existe y configura la conexión a una **base de datos de desarrollo** y las demás variables necesarias. Nunca compartas ni subas archivos `.env` con credenciales.

```powershell
npm run db:generate --workspace @educa/api
npm run db:migrate
npm run dev:api
```

`db:migrate` modifica la base de datos configurada y puede generar migraciones: úsalo solo en desarrollo. `npm run db:seed` carga datos y usuarios de ejemplo; no lo ejecutes contra una base de datos real o de producción. La API ofrece `/health` y documentación de rutas en `/docs`.

### Demo web con base local

Esta modalidad es solo para datos ficticios: no representa la estructura ni los accesos de la base oficial. Confirma que `DATABASE_URL` en `apps\api\.env` apunta a tu base local de pruebas y que sus migraciones están aplicadas. Conserva los datos existentes; no ejecutes el seed sobre una base que no quieras modificar.

En una terminal inicia la API limitada a la computadora:

```powershell
$env:API_HOST = '127.0.0.1'
npm run dev:api
```

En otra terminal inicia la web:

```powershell
npm run dev:demo-conectada --workspace @educa/admin
```

Abre `http://127.0.0.1:5173` para el landing y `/login` para el panel. El inicio de sesión usa las cuentas existentes de la base local, no el selector de roles de la demo sin conexión. El modo rechaza `VITE_APP_DEMO=true`, `VITE_APP_MOBILE=true` o una `VITE_API_URL` distinta de `/api`: revisa cualquier archivo de entorno local o variable de la terminal si no arranca.

Los cambios publicados en el panel se consultan desde la misma base en el landing; los filtros públicos y la caché corta pueden afectar su aparición. Los datos guardados previamente en el navegador no se copian ni borran. La APK de demostración sigue usando datos locales separados.

El archivo `docker-compose.yml` incluye PostgreSQL y la API, pero el servicio `admin` referencia `apps/admin/Dockerfile`, que actualmente no existe. Por ello, levantar el conjunto completo con Compose está pendiente de corrección. La configuración de Compose es para desarrollo y no debe usarse tal cual en producción.

## APK de demostración

El botón «Descargar aplicación» lleva a `/descargar` y descarga `apps/admin/public/downloads/educa-lambayeque-demo.apk`. Es un APK de demostración firmado para depuración, no una versión de producción. El manifiesto solicita acceso a Internet, pero la demo usa datos ficticios locales y no necesita conectarse a una API.

Para compilar la demo se necesitan Android SDK Platform 36, Build-Tools 36.0.0, Platform-Tools y JDK 21. El proyecto usa Gradle 8.14.3.

Si existe `apps\admin\.env.mobile.local`, conserva una copia antes de reemplazarlo. Para configurar una compilación de demostración:

```powershell
Copy-Item apps\admin\.env.mobile.demo.example apps\admin\.env.mobile.local
npm run android:sync --workspace @educa/admin
Set-Location apps\admin\android
.\gradlew.bat assembleDebug
Set-Location ..\..\..
```

El resultado está en `apps/admin/android/app/build/outputs/apk/debug/app-debug.apk`. Para actualizar la descarga web, sustituye explícitamente el APK publicado en `apps/admin/public/downloads/` por la nueva compilación de demostración y vuelve a desplegar la web. Cambiar el código fuente no actualiza automáticamente un APK ya compilado.

Para una distribución real habrá que completar la conexión móvil, comprobar el acceso a los datos autorizados y generar una versión de producción firmada. `apps/admin/.env.mobile.example` documenta variables previstas para esa integración, no una funcionalidad ya terminada.

## API, archivos y despliegue

Las rutas públicas bajo `/api/public` ofrecen datos para el landing; las rutas administrativas requieren autenticación y sus permisos dependen del rol. Los endpoints públicos filtran qué registros muestran, por lo que un registro administrativo no siempre será visible: por ejemplo, las convocatorias deben estar activas y vigentes.

En modo conectado, las cargas autenticadas se guardan en `DIRECTORIO_ARCHIVOS`, con un máximo de 10 MB por archivo. El directorio necesita almacenamiento persistente. Los enlaces `/uploads` son públicos: no se deben subir documentos confidenciales. En modo demo, los adjuntos se guardan localmente y están limitados a 2 MB en total por campo de carga.

Para Railway se incluyen `railway.json` y `apps/api/Dockerfile`: configura PostgreSQL, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `NODE_ENV` y `DIRECTORIO_ARCHIVOS` en el servicio, y monta almacenamiento persistente para los archivos. Railway ejecuta las migraciones existentes antes del despliegue y comprueba `/health`; no carga el seed automáticamente. Revisa y valida la configuración antes de usarla con datos reales.

## Herramientas auxiliares

- `scripts/carga-publica.k6.js`: prueba de carga de los cinco endpoints públicos de la API, no de la APK completa. Requiere k6 y una API conectada a una base de pruebas con volumen representativo. Ejemplo: `k6 run -e BASE_URL=http://localhost:3000 scripts\carga-publica.k6.js`. No ejecutar contra producción sin autorización y coordinación; el límite de peticiones por IP puede afectar los resultados.
- `scripts/capturar-pantallas.mjs` y `scripts/capturar-web.mjs`: scripts locales de captura, dependientes de Chrome en una ruta específica de Windows y de un servidor Vite en el puerto 5173. Regeneran carpetas bajo `_mockups`; sus supuestos de sesión y rutas deben revisarse antes de usarlos.
- `scripts/install-postgres-portable.ps1` y `start_api.bat`: herramientas locales específicas de Windows. Sus rutas y puertos no son consistentes entre sí y el instalador usa configuración de prueba; revisarlos antes de ejecutarlos. No están preparados para producción.

## Pendiente antes de datos reales

1. Definir el acceso autorizado a la BD, el mapeo de datos y el despliegue de la API.
2. Conectar la APK y verificar que landing, panel y APK consumen la fuente prevista, respetando permisos y filtros de publicación.
3. Validar disponibilidad y refresco de cambios, incluyendo las políticas de caché y el comportamiento ante errores.
4. Probar con datos y tráfico representativos en un entorno de pruebas; revisar capacidad, monitoreo, respaldos y recuperación.
5. Documentar la operación y el traspaso con los datos definitivos del entorno, sin incluir secretos.
