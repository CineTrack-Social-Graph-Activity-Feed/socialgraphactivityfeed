# 🐰 Consumer Service - Social Graph & Activity Feed

Servicio de mensajería que consume eventos de RabbitMQ desde el Core de CineTrack para sincronizar usuarios y reseñas con la base de datos del módulo Social Graph.

## 📋 Descripción

Este servicio actúa como consumer de eventos publicados por otros módulos (Usuarios y Reseñas) a través de RabbitMQ. Procesa automáticamente los eventos y actualiza la base de datos MongoDB del módulo Social Graph & Activity Feed.

## 🚀 Características

- ✅ Conexión automática a RabbitMQ con reconexión automática
- ✅ Consumo de eventos de usuarios (creación, inicio/fin de sesión)
- ✅ Consumo de eventos de reseñas (creación, actualización, eliminación)
- ✅ Sincronización automática con MongoDB
- ✅ Manejo robusto de errores y logs detallados
- ✅ Arquitectura modular y escalable
- ✅ Health check endpoint para monitoreo

## 📁 Estructura del Proyecto

```
consumer/
├── config/
│   ├── database.js      # Configuración de MongoDB
│   └── rabbit.js        # Configuración de RabbitMQ
├── consumers/
│   └── coreConsumer.js  # Consumer principal de eventos
├── models/
│   ├── User.js          # Modelo de Usuario
│   └── Publication.js   # Modelo de Publicación
├── handlers/
│   ├── userHandler.js   # Lógica para eventos de usuarios
│   └── reviewHandler.js # Lógica para eventos de reseñas
├── utils/
│   └── logger.js        # Sistema de logs
├── index.js             # Punto de entrada
├── .env                 # Variables de entorno
└── package.json
```

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Ejecutar en producción:
```bash
npm start
```

## 📡 Eventos Consumidos

### Eventos de Usuarios
- `usuarios.usuario.creado` - Nuevo usuario registrado
- `usuarios.sesion.iniciada` - Usuario inició sesión
- `usuarios.sesion.finalizada` - Usuario cerró sesión

### Eventos de Reseñas
- `resenas.resena.creada` - Nueva reseña creada
- `resenas.resena.actualizada` - Reseña modificada
- `resenas.resena.eliminada` - Reseña eliminada

## 🔌 Requisitos

- Node.js >= 14.x
- MongoDB >= 4.x
- RabbitMQ >= 3.x

## 📝 Variables de Entorno

Ver archivo `.env.example` para todas las configuraciones disponibles.

## 🐛 Logs

Los logs se muestran en consola con diferentes niveles:
- `[INFO]` - Información general
- `[SUCCESS]` - Operación exitosa
- `[ERROR]` - Error en el procesamiento
- `[WARN]` - Advertencia

## 🔄 Reconexión Automática

El servicio intenta reconectarse automáticamente a RabbitMQ si la conexión se pierde, con intervalos configurables.

## 📊 Health Check

Endpoint disponible en `http://localhost:3001/health` para verificar el estado del servicio.
