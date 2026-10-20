/**
 * Parser de CSV minimo, sin dependencias externas.
 *
 * Cubre el formato que genera la plantilla de importacion:
 *  - separador coma
 *  - comillas dobles para valores que contienen comas o saltos de linea
 *  - comillas dobles escapadas duplicandolas ("")
 *
 * No cubre CSV con punto y coma ni separadores TAB; si el archivo usa otro
 * formato, el importador debe fallar con un mensaje claro.
 */
export function parsearCSV(contenido: string): Record<string, string>[] {
  const limpio = contenido.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lineas = separarLineas(limpio);

  const primera = lineas[0];
  if (primera === undefined) return [];

  const encabezados = parsearLinea(primera).map((h) => h.trim());
  if (!encabezados.length || encabezados[0] === '') {
    throw new Error('El archivo CSV no tiene encabezados');
  }

  const filas: Record<string, string>[] = [];
  for (let i = 1; i < lineas.length; i += 1) {
    const linea = lineas[i];
    if (linea === undefined || !linea.trim()) continue; // ignora lineas vacias
    const valores = parsearLinea(linea);
    const fila: Record<string, string> = {};
    encabezados.forEach((encabezado, indice) => {
      fila[encabezado] = (valores[indice] ?? '').trim();
    });
    filas.push(fila);
  }
  return filas;
}

/** Separa el contenido en lineas respetando las comillas. */
function separarLineas(contenido: string): string[] {
  const lineas: string[] = [];
  let actual = '';
  let enComillas = false;

  for (let i = 0; i < contenido.length; i += 1) {
    const caracter = contenido[i];
    if (caracter === '"') {
      if (enComillas && contenido[i + 1] === '"') {
        actual += '""';
        i += 1;
        continue;
      }
      enComillas = !enComillas;
      actual += caracter;
      continue;
    }
    if (caracter === '\n' && !enComillas) {
      lineas.push(actual);
      actual = '';
      continue;
    }
    actual += caracter;
  }
  if (actual.length) lineas.push(actual);
  return lineas;
}

/** Parsea una linea CSV en sus valores. */
function parsearLinea(linea: string): string[] {
  const valores: string[] = [];
  let actual = '';
  let enComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];
    if (caracter === '"') {
      if (enComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
        continue;
      }
      enComillas = !enComillas;
      continue;
    }
    if (caracter === ',' && !enComillas) {
      valores.push(actual);
      actual = '';
      continue;
    }
    actual += caracter;
  }
  valores.push(actual);
  return valores;
}

/** Convierte una matriz de filas a objetos usando la primera fila como encabezado. */
export function filasAMatriz(matriz: unknown[][]): Record<string, unknown>[] {
  const primeraFila = matriz[0];
  if (!primeraFila) return [];
  const encabezados = primeraFila.map((h) => String(h ?? '').trim());
  return matriz.slice(1).map((fila) => {
    const objeto: Record<string, unknown> = {};
    encabezados.forEach((encabezado, indice) => {
      objeto[encabezado] = fila[indice];
    });
    return objeto;
  });
}
