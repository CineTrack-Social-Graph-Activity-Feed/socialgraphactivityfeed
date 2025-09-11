require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Crear la aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Logging de variables de entorno (sin mostrar valores sensibles)
console.log('🔧 Configuración:', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: PORT,
  MONGODB_URI: process.env.MONGODB_URI ? '******' : undefined,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
});

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint de health check para Elastic Beanstalk
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodbConnected: mongoose.connection.readyState === 1
  };
  res.status(200).json(healthCheck);
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Conexión a MongoDB
const connectDB = async (retryCount = 0, maxRetries = 10) => {
  try {
    console.log('📝 Intentando conectar a MongoDB...');
    
    let mongoURI;
    // Intentar obtener la URI de MongoDB desde AWS Secrets Manager
    if (process.env.NODE_ENV === 'production') {
      try {
        const client = new SecretsManagerClient({
          region: process.env.AWS_REGION || 'us-east-2'
        });
        
        const response = await client.send(
          new GetSecretValueCommand({
            SecretId: 'social-graph-app/mongodb',
            VersionStage: 'AWSCURRENT',
          })
        );
        
        mongoURI = response.SecretString;
        console.log('✅ URI de MongoDB recuperada de Secrets Manager');
      } catch (error) {
        console.error('❌ Error al obtener el secreto de AWS:', error.message);
        // Si falla Secrets Manager, intentar usar la variable de entorno
        mongoURI = process.env.MONGODB_URI;
      }
    } else {
      // En desarrollo, usar la variable de entorno o la URI local
      mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialgraphactivityfeed';
    }
    
    console.log('💡 Variables de entorno disponibles:', Object.keys(process.env).sort());
    
    // Verificar y corregir el formato de la URI si es necesario
    if (mongoURI && !mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      console.log('⚠️ MONGODB_URI no tiene el prefijo correcto, intentando corregir...');
      // Asumimos mongodb+srv:// si no tiene prefijo
      mongoURI = `mongodb+srv://${mongoURI}`;
    }
    
    console.log('🔍 MONGODB_URI está definido:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('✅ Conectado a MongoDB');
    return true;
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB (intento ${retryCount + 1}/${maxRetries}):`, error.message);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Reintentando conexión en 5 segundos...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      console.error('❌ Se agotaron los reintentos de conexión a MongoDB');
      return false;
    }
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

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Social Graph Activity Feed',
    status: 'running',
    endpoints: {
      health: '/health',
      users: '/api/user',
      follow: '/api/follow',
      unfollow: '/api/unfollow',
      feed: '/api/feed',
      publications: '/api/publication',
      likes: '/api/like',
      comments: '/api/comment'
    }
  });
});

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
  // Variable para tracking del servidor HTTP
  let server;
  
  try {
    // Iniciar el servidor primero para que el health check responda
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    });

    // Manejo de errores del servidor HTTP
    server.on('error', (error) => {
      console.error('💥 Error en el servidor HTTP:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} está en uso`);
      }
    });

    // Intentar conectar a la base de datos
    const isConnected = await connectDB();
    if (!isConnected) {
      console.warn('⚠️ Servidor iniciado sin conexión a MongoDB - Algunos endpoints no funcionarán');
      return; // El servidor sigue corriendo pero sin MongoDB
    }
    
    // Solo mostrar los endpoints si MongoDB está conectado
    console.log('📝 Endpoints disponibles:');
    console.log('   - POST /api/user (crear usuario)');
    console.log('   - GET /api/user/:user_id (obtener usuario)');
    console.log('   - POST /api/follow (seguir usuario)');
    console.log('   - POST /api/unfollow (dejar de seguir)');
    console.log('   - GET /api/feed (obtener feed)');
    console.log('   - POST /api/publication (crear publicación)');
    console.log('   - POST /api/like (dar like)');
    console.log('   - POST /api/comment (comentar)');
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
