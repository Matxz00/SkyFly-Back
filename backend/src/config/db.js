import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Conexión a MongoDB establecida: ${conn.connection.host}`);
  } catch (error) {
    console.error('ERROR: No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  }
};
