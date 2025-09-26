import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del encabezado
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener el usuario del token y adjuntarlo al objeto de solicitud (req)
      req.user = await User.findById(decoded.id).select('-password');
      
      // Si el usuario no se encuentra, lanzar un error
      if (!req.user) {
        return res
          .status(401)
          .json({ message: 'No autorizado, token fallido. Usuario no encontrado.' });
      }

      next(); // Pasar al siguiente middleware
    } catch (error) {
      console.error('Error en el middleware de autenticación:', error.message);
      return res.status(401).json({ message: 'No autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'No autorizado, no se encuentra el token.' });
  }
};

export default authMiddleware;
