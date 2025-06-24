import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // o simplemente dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para parsear JSON
app.use(bodyParser.json());

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cargar y exponer todos los handlers de la carpeta /api
const apiDir = path.dirname(new URL(import.meta.url).pathname);
fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.js') && file !== 'server.js' && file !== 'login.js') {
    const route = '/api/' + file.replace('.js', '');
    import(path.join(apiDir, file)).then(handlerModule => {
      app.all(route, (req, res) => handlerModule.default(req, res));
      console.log(`API route loaded: ${route}`);
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend API running!');
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
