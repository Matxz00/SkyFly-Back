import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import transporter from '../config/nodemailerconfig.js';
import crypto from 'crypto'; // Módulo nativo de Node.js para generar tokens
// REMOVIDOS: import speakeasy from 'speakeasy';
// REMOVIDOS: import qrcode from 'qrcode';
import nodemailer from 'nodemailer'; // Necesario para nodemailer.getTestMessageUrl

// Función para generar JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expira en 1 hora
    });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, ingresa todos los campos.' });
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el nuevo usuario con twoFactorEnabled en TRUE por defecto
        const userId = await User.create(username, email, hashedPassword);

        if (userId) {
            res.status(201).json({
                message: 'Registro exitoso. Tu cuenta tiene la verificación en dos pasos habilitada por defecto. Por favor, inicia sesión.',
                userId: userId
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos.' });
        }

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
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // ¡CAMBIO CLAVE AQUÍ! Acceder a user.two_factor_enabled (snake_case de la DB)
        if (user.two_factor_enabled) {
            console.log(`Login - 2FA habilitado para ${user.email}. Generando código...`);
            const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres hex
            const codeExpires = new Date(Date.now() + 600000); // 10 minutos de expiración para el código 2FA

            // Almacenar el código temporal en la base de datos
            await User.updateTwoFactorCode(user.id, verificationCode, codeExpires);
            console.log(`Login - Código 2FA (${verificationCode}) guardado para usuario ${user.id}.`);

            // Enviar el correo electrónico con el código
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Código de Verificación de Dos Pasos para SkyFly Bikes',
                html: `
                    <p>Hola ${user.username},</p>
                    <p>Hemos detectado un intento de inicio de sesión en tu cuenta de SkyFly Bikes.</p>
                    <p>Para completar tu inicio de sesión, usa el siguiente código de verificación:</p>
                    <h2 style="font-size: 2em; color: #007bff; text-align: center;">${verificationCode}</h2>
                    <p>Este código es válido por 10 minutos.</p>
                    <p>Si no intentaste iniciar sesión, ignora este correo.</p>
                    <p>Gracias,<br>El equipo de SkyFly Bikes</p>
                `,
            };

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log('Login 2FA - Correo de verificación enviado exitosamente!', info.messageId);
            } catch (mailError) {
                console.error('Login 2FA - ERROR al enviar correo de verificación:', mailError);
                return res.status(500).json({ message: 'Error al enviar el código de verificación por correo.' });
            }

            // Responder al frontend que requiere 2FA y enviamos el userId temporalmente
            return res.status(200).json({
                message: 'Verificación en dos pasos requerida. Se ha enviado un código a tu correo electrónico.',
                requiresTwoFactor: true,
                userId: user.id // Necesitamos el ID del usuario para la verificación posterior
            });

        } else {
            // Si 2FA no está habilitado, generamos y enviamos el token JWT directamente
            const token = generateToken(user.id);
            res.status(200).json({
                message: 'Inicio de sesión exitoso.',
                token: token,
                username: user.username,
                twoFactorEnabled: user.two_factor_enabled // También usar snake_case aquí
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
        console.log('Forgot Password - Error: Correo no proporcionado.');
        return res.status(400).json({ message: 'Por favor, introduce tu correo electrónico.' });
    }

    try {
        const user = await User.findByEmail(email);

        if (!user) {
            console.log(`Forgot Password - Usuario no encontrado para el email: ${email}. Respondiendo éxito para evitar enumeración.`);
            return res.status(200).json({ message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hora de expiración

        console.log(`Forgot Password - Usuario encontrado: ${user.email}. Generando token.`);
        await User.updateResetToken(user.id, resetToken, resetExpires);
        console.log(`Forgot Password - Token de restablecimiento guardado para el usuario ${user.id}.`);

        const resetUrl = `http://localhost:5500/frontend/public/reset-password.html?token=${resetToken}`;
        console.log(`Forgot Password - URL de restablecimiento generada: ${resetUrl}`);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Restablecimiento de Contraseña',
            html: `
                <p>Has solicitado el restablecimiento de tu contraseña.</p>
                <p>Haz clic en el siguiente enlace para restablecerla:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste esto, ignora este correo.</p>
            `,
        };

        console.log(`Forgot Password - Intentando enviar correo a: ${user.email}`);
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Forgot Password - Correo enviado exitosamente!');
            console.log('Forgot Password - Info de respuesta del correo:', info);
            console.log('Forgot Password - Mensaje ID:', info.messageId);
            // console.log('Forgot Password - URL de vista previa (si aplica):', nodemailer.getTestMessageUrl(info)); // Comentado, ya que no siempre aplica y puede causar ReferenceError si nodemailer no está importado directamente
        } catch (mailError) {
            console.error('Forgot Password - ERROR al enviar correo con Nodemailer:', mailError);
            if (mailError.responseCode) console.error('Nodemailer Response Code:', mailError.responseCode);
            if (mailError.response) console.error('Nodemailer Response:', mailError.response);
            if (mailError.command) console.error('Nodemailer Command:', mailError.command);
        }

        res.status(200).json({ message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' });

    } catch (error) {
        console.error('Forgot Password - Error GENERAL en la ruta de restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Error del servidor al procesar la solicitud.' });
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
        const user = await User.findByResetToken(token);

        if (!user) {
            return res.status(400).json({ message: 'Token de restablecimiento inválido o expirado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updatePassword(user.id, hashedPassword);

        res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ message: 'Error del servidor al restablecer la contraseña.' });
    }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    // req.user viene del middleware de autenticación
    // ¡CAMBIO CLAVE AQUÍ! Acceder a req.user.two_factor_enabled (snake_case de la DB)
    res.status(200).json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        twoFactorEnabled: req.user.two_factor_enabled, // Usar snake_case
    });
};

// --- Verificación en Dos Pasos (2FA) por Correo ---

// @desc    Habilitar 2FA por correo para un usuario
// @route   POST /api/users/2fa/enable
// @access  Private (requiere autenticación)
const enableTwoFactor = async (req, res) => {
    const userId = req.user.id;
    try {
        await User.updateTwoFactorStatus(userId, true);
        res.status(200).json({ message: 'Verificación en dos pasos habilitada.' });
    } catch (error) {
        console.error('Error al habilitar 2FA:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

// @desc    Deshabilitar 2FA por correo para un usuario
// @route   POST /api/users/2fa/disable
// @access  Private (requiere autenticación)
const disableTwoFactor = async (req, res) => {
    const userId = req.user.id;
    try {
        // También limpia el secreto y la expiración si se deshabilita 2FA
        await User.updateTwoFactorCode(userId, null, null);
        await User.updateTwoFactorStatus(userId, false);
        res.status(200).json({ message: 'Verificación en dos pasos deshabilitada exitosamente.' });
    } catch (error) {
        console.error('Error al deshabilitar 2FA:', error);
        res.status(500).json({ message: 'Error del servidor al deshabilitar 2FA.' });
    }
};

// @desc    Verificar código 2FA enviado por correo
// @route   POST /api/users/2fa/verify-email
// @access  Public (temporalmente, ya que no hay token JWT aún)
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

        // Verificar el código 2FA
        // Asegúrate de que user.two_factor_secret y user.two_factor_secret_expires se accedan correctamente
        if (user.two_factor_secret && user.two_factor_secret === code.toUpperCase() &&
            user.two_factor_secret_expires && new Date() < new Date(user.two_factor_secret_expires)) { // Convertir a Date si es necesario
            // Código válido, limpiar el código temporal y su expiración
            await User.updateTwoFactorCode(user.id, null, null); // Limpiar código y expiración
            const token = generateToken(user.id); // Generar el token JWT final

            res.status(200).json({
                message: 'Verificación de dos pasos exitosa. Accediendo...',
                token: token,
                username: user.username,
                twoFactorEnabled: user.two_factor_enabled // Usar snake_case
            });
        } else {
            return res.status(401).json({ message: 'Código de verificación inválido o expirado.' });
        }

    } catch (error) {
        console.error('Error al verificar código 2FA por correo:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

export {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getProfile,
    enableTwoFactor,   // Renombrado y ajustado para 2FA por correo
    disableTwoFactor,  // Renombrado y ajustado para 2FA por correo
    verifyTwoFactorEmail
};