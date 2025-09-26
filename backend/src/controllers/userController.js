import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import transporter from '../config/nodemailerconfig.js';
import crypto from 'crypto';

// Función para generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  console.log('Intentando registrar usuario. Datos recibidos:', req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Por favor, ingresa todos los campos.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      twoFactorEnabled: true, // Habilitado por defecto
    });

    await newUser.save();

    res.status(201).json({
      message: 'Registro exitoso. Tu cuenta tiene la verificación en dos pasos habilitada por defecto. Por favor, inicia sesión.',
      userId: newUser._id
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, ingresa correo y contraseña.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    if (user.twoFactorEnabled) {
      console.log(`Login - 2FA habilitado para ${user.email}. Generando código...`);
      const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const codeExpires = new Date(Date.now() + 600000); // 10 min

      user.twoFactorSecret = verificationCode;
      user.twoFactorSecretExpires = codeExpires;
      await user.save();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Código de Verificación de Dos Pasos para SkyFly Bikes',
        html: `
            <p>Hola ${user.username},</p>
            <p>Para completar tu inicio de sesión, usa el siguiente código de verificación:</p>
            <h2 style="font-size: 2em; color: #007bff; text-align: center;">${verificationCode}</h2>
            <p>Este código es válido por 10 minutos.</p>
            <p>Si no intentaste iniciar sesión, ignora este correo.</p>
            <p>Gracias,<br>El equipo de SkyFly Bikes</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Login 2FA - Correo de verificación enviado exitosamente!');
      } catch (mailError) {
        console.error('Login 2FA - ERROR al enviar correo de verificación:', mailError);
        return res.status(500).json({ message: 'Error al enviar el código de verificación por correo.' });
      }

      return res.status(200).json({
        message: 'Verificación en dos pasos requerida. Se ha enviado un código a tu correo electrónico.',
        requiresTwoFactor: true,
        userId: user._id
      });

    } else {
      const token = generateToken(user._id);
      res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        token,
        username: user.username,
        twoFactorEnabled: user.twoFactorEnabled
      });
    }

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// @desc    Solicitar restablecimiento de contraseña
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Por favor, introduce tu correo electrónico.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1h

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Restablecimiento de Contraseña',
      html: `
        <p>Has solicitado el restablecimiento de tu contraseña.</p>
        <p><a href="${resetUrl}">Haz clic aquí para restablecerla</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, ignora este correo.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Forgot Password - Correo enviado exitosamente!');
    } catch (mailError) {
      console.error('Forgot Password - ERROR al enviar correo con Nodemailer:', mailError);
    }

    res.status(200).json({ message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' });

  } catch (error) {
    console.error('Forgot Password - Error GENERAL:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// @desc    Restablecer contraseña
// @route   PUT /api/users/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'Por favor, introduce tu nueva contraseña.' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token de restablecimiento inválido o expirado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  res.status(200).json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    twoFactorEnabled: req.user.twoFactorEnabled,
  });
};

// --- Verificación en Dos Pasos (2FA) por Correo ---
const enableTwoFactor = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });
    res.status(200).json({ message: 'Verificación en dos pasos habilitada.' });
  } catch (error) {
    console.error('Error al habilitar 2FA:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const disableTwoFactor = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: false });
    res.status(200).json({ message: 'Verificación en dos pasos deshabilitada exitosamente.' });
  } catch (error) {
    console.error('Error al deshabilitar 2FA:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const verifyTwoFactorEmail = async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ message: 'ID de usuario y código de verificación son requeridos.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (
      user.twoFactorSecret &&
      user.twoFactorSecret === code.toUpperCase() &&
      user.twoFactorSecretExpires &&
      new Date() < new Date(user.twoFactorSecretExpires)
    ) {
      user.twoFactorSecret = undefined;
      user.twoFactorSecretExpires = undefined;
      await user.save();
      const token = generateToken(user._id);

      return res.status(200).json({
        message: 'Verificación de dos pasos exitosa. Accediendo...',
        token,
        username: user.username,
        twoFactorEnabled: user.twoFactorEnabled
      });
    } else {
      return res.status(401).json({ message: 'Código de verificación inválido o expirado.' });
    }

  } catch (error) {
    console.error('Error al verificar código 2FA:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

export {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorEmail
};
