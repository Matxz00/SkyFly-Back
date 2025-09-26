import mongoose from 'mongoose';

// Definir el esquema del usuario
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Limpia espacios extra
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Normaliza email
    match: [/^\S+@\S+\.\S+$/, "Correo electrónico inválido"], // Validación básica
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Un mínimo razonable
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // Para verificación 2FA por correo
  twoFactorSecret: {
    type: String,
    default: null,
  },
  twoFactorSecretExpires: {
    type: Date,
    default: null,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Si ya existe el modelo 'User', úsalo. Si no, créalo.
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
