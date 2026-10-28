package pe.gob.regionlambayeque.educa;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Convierte un PDF empaquetado en la app en imágenes PNG, porque el WebView no muestra PDF. */
@CapacitorPlugin(name = "PdfRender")
public class PdfRenderPlugin extends Plugin {
    private static final int ANCHO_PX = 1000;
    private static final int MAX_PAGINAS = 20;
    private static final int MAX_PDF_BYTES = 10 * 1024 * 1024;

    @PluginMethod
    public void renderizar(PluginCall call) {
        String url = call.getString("url");
        if (!esUrlPdfPermitida(url)) {
            call.reject("La dirección del PDF no es válida");
            return;
        }
        new Thread(() -> {
            File temporal = null;
            try {
                temporal = File.createTempFile("pdf", ".pdf", getContext().getCacheDir());
                try (InputStream entrada = abrirPdf(url);
                     FileOutputStream salida = new FileOutputStream(temporal)) {
                    byte[] buffer = new byte[8192];
                    int leido;
                    int total = 0;
                    while ((leido = entrada.read(buffer)) > 0) {
                        total += leido;
                        if (total > MAX_PDF_BYTES) throw new IllegalArgumentException("El PDF supera 10 MB");
                        salida.write(buffer, 0, leido);
                    }
                }
                JSArray paginas = new JSArray();
                try (ParcelFileDescriptor pfd = ParcelFileDescriptor.open(temporal, ParcelFileDescriptor.MODE_READ_ONLY);
                     PdfRenderer renderer = new PdfRenderer(pfd)) {
                    int total = Math.min(renderer.getPageCount(), MAX_PAGINAS);
                    for (int i = 0; i < total; i++) {
                        try (PdfRenderer.Page pagina = renderer.openPage(i)) {
                            int alto = Math.max(1, ANCHO_PX * pagina.getHeight() / pagina.getWidth());
                            Bitmap bitmap = Bitmap.createBitmap(ANCHO_PX, alto, Bitmap.Config.ARGB_8888);
                            new Canvas(bitmap).drawColor(Color.WHITE);
                            pagina.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, bytes);
                            bitmap.recycle();
                            paginas.put("data:image/jpeg;base64," + Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP));
                        }
                    }
                    JSObject resultado = new JSObject();
                    resultado.put("paginas", paginas);
                    resultado.put("total", renderer.getPageCount());
                    call.resolve(resultado);
                }
            } catch (Exception e) {
                call.reject("No se pudo abrir el PDF: " + e.getMessage());
            } finally {
                if (temporal != null) temporal.delete();
            }
        }).start();
    }

    private boolean esUrlPdfPermitida(String valor) {
        if (valor == null || !valor.toLowerCase().endsWith(".pdf")) return false;
        if (valor.startsWith("/") && !valor.startsWith("//") && !valor.contains("..")) return true;
        try {
            URL url = new URL(valor);
            return ("https".equals(url.getProtocol()) || "http".equals(url.getProtocol()))
                && url.getPath().startsWith("/uploads/");
        } catch (Exception e) {
            return false;
        }
    }

    private InputStream abrirPdf(String valor) throws Exception {
        if (valor.startsWith("/")) return getContext().getAssets().open("public" + valor);

        HttpURLConnection conexion = (HttpURLConnection) new URL(valor).openConnection();
        conexion.setConnectTimeout(15000);
        conexion.setReadTimeout(30000);
        conexion.setRequestMethod("GET");
        int estado = conexion.getResponseCode();
        if (estado < 200 || estado >= 300) {
            conexion.disconnect();
            throw new IllegalStateException("El servidor respondió con HTTP " + estado);
        }
        int longitud = conexion.getContentLength();
        if (longitud > MAX_PDF_BYTES) {
            conexion.disconnect();
            throw new IllegalArgumentException("El PDF supera 10 MB");
        }
        return new java.io.FilterInputStream(conexion.getInputStream()) {
            @Override
            public void close() throws java.io.IOException {
                super.close();
                conexion.disconnect();
            }
        };
    }
}
