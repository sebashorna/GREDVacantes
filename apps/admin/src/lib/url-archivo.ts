// Evita respuestas almacenadas antes de exigir la revalidación de los archivos.
export function urlArchivoParaMostrar(url: string): string {
  if (/^(?:https?:\/\/[^/]+)?\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp|avif|pdf)$/i.test(url)) {
    return `${url}?v=3`;
  }
  return url;
}
