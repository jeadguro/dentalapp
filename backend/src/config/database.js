// src/config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 ya no necesita estas opciones, pero las dejamos por compatibilidad
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Manejo de eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado');
    });

    // Cerrar conexión cuando la app termine
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB desconectado por cierre de aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
