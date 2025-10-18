const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Configuración y conexión a MongoDB
 */
class Database {
  constructor() {
    this.connected = false;
  }

  /**
   * Conectar a MongoDB con manejo de errores
   */
  async connect() {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/socialgraph';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.connected = true;
      logger.success('MongoDB', 'Conectado exitosamente a la base de datos');

      // Eventos de conexión
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB', `Error en la conexión: ${err.message}`);
        this.connected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB', 'Desconectado de la base de datos');
        this.connected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.success('MongoDB', 'Reconectado a la base de datos');
        this.connected = true;
      });

    } catch (error) {
      logger.error('MongoDB', `Error al conectar: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desconectar de MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.connected = false;
      logger.info('MongoDB', 'Desconectado correctamente');
    } catch (error) {
      logger.error('MongoDB', `Error al desconectar: ${error.message}`);
    }
  }

  /**
   * Verificar estado de la conexión
   */
  isConnected() {
    return this.connected && mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
