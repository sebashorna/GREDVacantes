# Educa Lambayeque

Portal ciudadano y panel administrativo de la Gerencia Regional de Educación de Lambayeque.

## Experiencia ciudadana y Android

- La página web `/` es el portal ciudadano adaptable; se muestra como sitio web tanto en computadora como en teléfono.
- El botón «Descargar aplicación» lleva a `/descargar`, donde se simula la descarga para la presentación.
- Al completar la simulación aparece «Abrir aplicación», que lleva a `/app` y muestra la vista de la app.
- El flujo de presentación no descarga ni instala un APK real.
- El APK muestra directamente el portal ciudadano; el panel administrativo permanece en `/login`.

La configuración de Capacitor está en `apps/admin/capacitor.config.json`; el proyecto nativo está en `apps/admin/android/`.

### Desplegar la API en Railway

El repositorio incluye `railway.json` y `apps/api/Dockerfile`. En Railway crea un proyecto con PostgreSQL y un servicio desde este repositorio usando el Dockerfile configurado. Define las variables del servicio de API en Railway:

- `DATABASE_URL`: referencia a la variable `DATABASE_URL` del servicio PostgreSQL de Railway.
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: dos valores secretos distintos, generados con `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.
- `CORS_ORIGINS`: `https://localhost` para las peticiones del APK.
- `NODE_ENV`: `production`.

Railway ejecutará las migraciones existentes antes del despliegue y comprobará `/health`. Configura estos valores directamente en el panel de Railway; no los guardes en el repositorio ni los compartas en el chat. El despliegue no carga automáticamente datos de demostración.

### Preparar y probar el APK

Antes de compilar, instala Android Studio con un JDK y Android SDK compatibles. Copia `apps/admin/.env.mobile.example` como `apps/admin/.env.mobile.local` y reemplaza el dominio de ejemplo por la URL HTTPS de la API que sea accesible desde el teléfono:

```dotenv
VITE_API_URL=https://<servidor-api>/api
VITE_APP_MOBILE=true
```

La API debe permitir el origen `https://localhost` en `CORS_ORIGINS`. No uses `localhost` como host de la API: dentro de Android apunta al propio teléfono, no a la computadora.

Compila y sincroniza los recursos Android:

```powershell
npm run android:sync --workspace @educa/admin
```

Con Android Studio instalado, genera un APK de depuración desde la carpeta `apps/admin/android/`, o desde PowerShell:

```powershell
Set-Location apps/admin/android
.\gradlew.bat assembleDebug
Set-Location ../../..
```

El APK de depuración se genera en `apps/admin/android/app/build/outputs/apk/debug/app-debug.apk`. Para distribuir la aplicación se debe generar un APK de versión firmado; no se debe publicar el APK de depuración.

Cuando se autorice y publique un APK firmado, el botón «Descargar aplicación» podrá conectarse a su URL HTTPS; hasta entonces, `/descargar` mantiene la simulación de presentación.