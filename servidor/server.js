require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');

const swaggerUI = require('swagger-ui-express');
const swaggerDocumentation = require( './swagger.json');


// Crear la aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Conexión a MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialgraphactivityfeed';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Manejo de eventos de MongoDB
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Error en la conexión de Mongoose:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});


// Ruta Swagger / Documentación API
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocumentation));

// Rutas principales
app.use('/', routes);


// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('💥 Error no manejado:', error);
  
  // Error de validación de MongoDB
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  // Error de cast de MongoDB (ObjectId inválido)
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
      details: error.message
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📜 Swagger Documentation: http://localhost:${PORT}/doc`);
      console.log('📝 Endpoints disponibles:');
      console.log('   - POST /api/user (crear usuario)');
      console.log('   - GET /api/user/:user_id (obtener usuario)');
      console.log('   - POST /api/follow (seguir usuario)');
      console.log('   - POST /api/unfollow (dejar de seguir)');
      console.log('   - GET /api/followed (obtener seguidos)');
      console.log('   - GET /api/followers (obtener seguidores)');
      console.log('   - GET /api/feed (obtener feed)');
      console.log('   - POST /api/publication (crear publicación)');
      console.log('   - POST /api/like (dar like)');
      console.log('   - POST /api/comment (comentar)');
    });
  } catch (error) {
    console.error('💥 Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT. Cerrando servidor...');
  
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM. Cerrando servidor...');
  
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
    process.exit(1);
  }
});

// Iniciar el servidor
startServer();

module.exports = app;
