import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorEmail
} from '../controllers/userController.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de usuario
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas de restablecimiento de contraseña
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Rutas de 2FA
router.post('/2fa/enable', authMiddleware, enableTwoFactor);
router.post('/2fa/disable', authMiddleware, disableTwoFactor);
router.post('/2fa/verify-email', verifyTwoFactorEmail);

// Ruta de perfil (privada)
router.get('/profile', authMiddleware, getProfile);

export default router;
