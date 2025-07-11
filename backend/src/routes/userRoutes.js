import express from 'express';
import {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getProfile,
    enableTwoFactor,   // Nueva/Ajustada función para habilitar 2FA
    disableTwoFactor,  // Nueva/Ajustada función para deshabilitar 2FA
    verifyTwoFactorEmail // Nueva función para verificar 2FA por correo
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas de recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Ruta protegida de perfil
router.get('/profile', protect, getProfile);

// Rutas de Verificación en Dos Pasos (2FA) por Correo
// Estas rutas son para que el usuario pueda habilitar/deshabilitar 2FA desde su perfil
router.post('/2fa/enable', protect, enableTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

// Esta ruta es para verificar el código 2FA durante el flujo de inicio de sesión
router.post('/2fa/verify-email', verifyTwoFactorEmail);

export default router;