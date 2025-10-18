/**
 * Script de verificación del entorno
 * Verifica que MongoDB y RabbitMQ estén accesibles antes de iniciar el consumer
 */

require('dotenv').config();
const mongoose = require('mongoose');
const amqp = require('amqplib');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * Verificar conexión a MongoDB
 */
async function checkMongoDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/socialgraph';
  
  logInfo('Verificando conexión a MongoDB...');
  logInfo(`URI: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logSuccess('MongoDB está accesible');
    
    // Verificar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    logInfo(`Colecciones encontradas: ${collections.length}`);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    logError(`MongoDB no accesible: ${error.message}`);
    return false;
  }
}

/**
 * Verificar conexión a RabbitMQ
 */
async function checkRabbitMQ() {
  const rabbitUrl = process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672';
  
  logInfo('Verificando conexión a RabbitMQ...');
  logInfo(`URL: ${rabbitUrl}`);

  let connection = null;
  let channel = null;

  try {
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    logSuccess('RabbitMQ está accesible');

    // Verificar exchange
    const exchangeName = process.env.EXCHANGE_NAME || 'core_events';
    try {
      await channel.checkExchange(exchangeName);
      logSuccess(`Exchange '${exchangeName}' existe`);
    } catch (error) {
      logWarning(`Exchange '${exchangeName}' no existe (se creará al iniciar)`);
    }

    await channel.close();
    await connection.close();
    return true;
  } catch (error) {
    logError(`RabbitMQ no accesible: ${error.message}`);
    return false;
  }
}

/**
 * Verificar variables de entorno
 */
function checkEnvVariables() {
  logInfo('Verificando variables de entorno...');

  const requiredVars = [
    'MONGO_URI',
    'RABBIT_URL',
    'EXCHANGE_NAME',
    'QUEUE_NAME',
    'ROUTING_KEYS'
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} configurada`);
    } else {
      logWarning(`${varName} no configurada (se usará valor por defecto)`);
      allPresent = false;
    }
  }

  return allPresent;
}

/**
 * Verificar dependencias instaladas
 */
function checkDependencies() {
  logInfo('Verificando dependencias...');

  const dependencies = [
    'amqplib',
    'mongoose',
    'express',
    'dotenv'
  ];

  let allInstalled = true;

  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      logSuccess(`${dep} instalado`);
    } catch (error) {
      logError(`${dep} NO instalado`);
      allInstalled = false;
    }
  }

  return allInstalled;
}

/**
 * Mostrar configuración actual
 */
function showConfiguration() {
  console.log(`\n${colors.cyan}=== Configuración Actual ===${colors.reset}`);
  console.log(`MongoDB URI:      ${process.env.MONGO_URI || 'Por defecto'}`);
  console.log(`RabbitMQ URL:     ${process.env.RABBIT_URL || 'Por defecto'}`);
  console.log(`Exchange:         ${process.env.EXCHANGE_NAME || 'core_events'}`);
  console.log(`Queue:            ${process.env.QUEUE_NAME || 'social_graph_queue'}`);
  console.log(`Port:             ${process.env.PORT || 3001}`);
  console.log(`Node Env:         ${process.env.NODE_ENV || 'development'}`);
  console.log('');
}

/**
 * Script principal
 */
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Verificación del Entorno - Consumer     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  showConfiguration();

  const results = {
    dependencies: false,
    envVars: false,
    mongodb: false,
    rabbitmq: false
  };

  // 1. Verificar dependencias
  console.log(`${colors.cyan}[1/4] Dependencias${colors.reset}`);
  results.dependencies = checkDependencies();
  console.log('');

  if (!results.dependencies) {
    logError('Instala las dependencias con: npm install');
    process.exit(1);
  }

  // 2. Verificar variables de entorno
  console.log(`${colors.cyan}[2/4] Variables de Entorno${colors.reset}`);
  results.envVars = checkEnvVariables();
  console.log('');

  // 3. Verificar MongoDB
  console.log(`${colors.cyan}[3/4] MongoDB${colors.reset}`);
  results.mongodb = await checkMongoDB();
  console.log('');

  // 4. Verificar RabbitMQ
  console.log(`${colors.cyan}[4/4] RabbitMQ${colors.reset}`);
  results.rabbitmq = await checkRabbitMQ();
  console.log('');

  // Resultado final
  console.log(`${colors.cyan}=== Resumen ===${colors.reset}`);
  if (results.mongodb && results.rabbitmq) {
    logSuccess('✅ Entorno configurado correctamente');
    logInfo('Puedes iniciar el consumer con: npm run dev');
    process.exit(0);
  } else {
    logError('❌ El entorno no está completamente configurado');
    
    if (!results.mongodb) {
      console.log('');
      logInfo('Para iniciar MongoDB:');
      console.log('  - Windows: net start MongoDB');
      console.log('  - Docker: docker-compose up -d mongodb');
    }
    
    if (!results.rabbitmq) {
      console.log('');
      logInfo('Para iniciar RabbitMQ:');
      console.log('  - Windows: net start RabbitMQ');
      console.log('  - Docker: docker-compose up -d rabbitmq');
    }

    process.exit(1);
  }
}

// Ejecutar
main().catch(error => {
  logError(`Error inesperado: ${error.message}`);
  process.exit(1);
});
