import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener el token de la cabecera
            token = req.headers.authorization.split(' ')[1];

            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Obtener el usuario del token y adjuntarlo a la petición
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            next(); // Continuar con la siguiente función del middleware/ruta
        } catch (error) {
            console.error('Error de autenticación:', error);
            res.status(401).json({ message: 'No autorizado, token inválido o expirado' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no se proporcionó token' });
    }
};

export { protect };