// Prueba de carga de los endpoints publicos (landing y APK).
// Uso: k6 run -e BASE_URL=https://<servidor-api> scripts/carga-publica.k6.js
// Ejecutar contra un entorno de pruebas con datos de volumen realista.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

const RUTAS = [
  '/api/public/vacantes',
  '/api/public/vacantes/listado',
  '/api/public/plazas?limite=50',
  '/api/public/convocatorias',
  '/api/public/comunicados?limite=6',
];

export default function () {
  for (const ruta of RUTAS) {
    const res = http.get(`${BASE_URL}${ruta}`);
    check(res, { 'status 200': (r) => r.status === 200 });
  }
  sleep(1);
}
