# Educa Lambayeque

Portal ciudadano y panel administrativo de la Gerencia Regional de Educación de Lambayeque.

## Experiencia ciudadana y Android

- La página web `/` es el portal ciudadano adaptable; se muestra como sitio web tanto en computadora como en teléfono.
- El botón «Descargar aplicación» lleva a `/descargar`, desde donde se descarga el APK real de demostración incluido en `apps/admin/public/downloads/`.
- En Android, abre el APK descargado y confirma la instalación si el teléfono lo solicita. No se requiere depuración USB.
- El APK es una demostración del panel administrativo con datos ficticios locales; no es la aplicación ciudadana conectada a servicios reales.
- El APK abre el panel administrativo: solicita inicio de sesión y, al ingresar, muestra el dashboard y los módulos administrativos. El portal ciudadano permanece en la web.
- En modo de demostración se pueden adjuntar fotos a las alertas y PDF de bases/ficha EDAN a las convocatorias y locales. Los archivos se guardan en el almacenamiento local del navegador o dispositivo, no se suben a un servidor y tienen un límite de 2 MB por registro.
- En modo conectado, la carga local de archivos queda deshabilitada hasta contar con almacenamiento en el servidor; se pueden seguir usando enlaces públicos.

La configuración de Capacitor está en `apps/admin/capacitor.config.json`; el proyecto nativo está en `apps/admin/android/`.

### Desplegar la API en Railway

El repositorio incluye `railway.json` y `apps/api/Dockerfile`. En Railway crea un proyecto con PostgreSQL y un servicio desde este repositorio usando el Dockerfile configurado. Define las variables del servicio de API en Railway:

- `DATABASE_URL`: referencia a la variable `DATABASE_URL` del servicio PostgreSQL de Railway.
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: dos valores secretos distintos, generados con `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.
- `CORS_ORIGINS`: `https://localhost` para las peticiones del APK.
- `NODE_ENV`: `production`.

Railway ejecutará las migraciones existentes antes del despliegue y comprobará `/health`. Configura estos valores directamente en el panel de Railway; no los guardes en el repositorio ni los compartas en el chat. El despliegue no carga automáticamente datos de demostración.

### Preparar un APK de demostración

La demostración permite iniciar sesión localmente con cualquier correo válido y una contraseña no vacía. Abre el panel administrativo con rol de Administrador GRED, datos ficticios y operaciones locales que se guardan en el dispositivo. No autentica usuarios ni se conecta a la API; sus registros no son oficiales ni deben usarse para tomar decisiones reales.

Instala Android SDK Platform 36, Android SDK Build-Tools 36.0.0 y Android SDK Platform-Tools desde el SDK Manager de Android Studio. El wrapper del proyecto usa Gradle 8.14.3, que no es compatible con el Java 25 incluido en esta versión de Android Studio; instala JDK 21 y selecciona esa instalación en **Settings > Build Tools > Gradle > Gradle JDK**.

Copia la configuración de demostración como archivo local:

```powershell
Copy-Item apps/admin/.env.mobile.demo.example apps/admin/.env.mobile.local
```

Sincroniza los recursos y compila el APK de depuración:

```powershell
npm run android:sync --workspace @educa/admin
Set-Location apps/admin/android
.\gradlew.bat assembleDebug
Set-Location ../../..
```

El APK de demostración se genera en `apps/admin/android/app/build/outputs/apk/debug/app-debug.apk`. Sus registros son ficticios, no funciona como servicio real y no se debe publicar como versión de producción.

### Preparar un APK conectado a la API

Para un APK funcional con autenticación y datos reales, primero publica la API en una URL HTTPS accesible desde el teléfono. Copia `apps/admin/.env.mobile.example` como `apps/admin/.env.mobile.local` y configura su dirección:

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

El APK conectado de depuración se genera en `apps/admin/android/app/build/outputs/apk/debug/app-debug.apk`. Para distribuir la aplicación se debe generar un APK de versión firmado; no se debe publicar el APK de depuración.

La página de descarga usa el archivo `apps/admin/public/downloads/educa-lambayeque-demo.apk`. Si se recompila el APK de demostración, copia el nuevo `app-debug.apk` a esa ruta antes de desplegar la web. El archivo se publica junto con la aplicación web y el botón lo descarga directamente.

Esta descarga permite comprobar el flujo de página, descarga e instalación antes de tener el servicio en la nube. El APK actual es de demostración y está firmado para depuración; para una distribución pública posterior deberá generarse una versión firmada de producción y sustituirse el archivo descargable.