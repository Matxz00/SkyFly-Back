import 'dotenv/config'; // Cargar variables de entorno al principio
import express from 'express';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(cors()); // Habilitar CORS para permitir peticiones desde el frontend

// Rutas
app.use('/api/users', userRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de gestión de usuarios funcionando!');
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`Base de datos: ${process.env.DB_NAME}`);
});