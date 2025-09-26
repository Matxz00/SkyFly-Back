import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Verificar que las variables de entorno se están cargando
console.log('Nodemailer Config - EMAIL_USER:', process.env.EMAIL_USER);
console.log(
  'Nodemailer Config - EMAIL_PASS length:',
  process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'undefined'
); // No imprimas la contraseña completa

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Prueba la conexión del transportador
transporter.verify(function (error, success) {
  if (error) {
    console.error(
      'Nodemailer Config - Error al verificar la conexión del transportador:',
      error
    );
  } else {
    console.log(
      'Nodemailer Config - El servidor de correo está listo para enviar mensajes.'
    );
  }
});

export default transporter;
