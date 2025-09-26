import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './backend/src/config/db.js';
import userRoutes from './backend/src/routes/userRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

// Logs para verificar variables de entorno
console.log("✅ EMAIL_USER:", process.env.EMAIL_USER || "NO cargado ❌");
console.log("✅ MONGO_URI:", process.env.MONGO_URI ? "Cargado" : "NO cargado ❌");

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirnameBase = path.dirname(__filename);

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());

// Rutas API
app.use('/api/users', userRoutes);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirnameBase, 'frontend', 'public')));

// Enrutador para SPA (Single Page Application) o fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirnameBase, 'frontend', 'public', 'index.html'));
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`));
