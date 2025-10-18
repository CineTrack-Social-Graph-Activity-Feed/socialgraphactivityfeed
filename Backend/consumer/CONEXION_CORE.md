# 🔌 Guía de Conexión al Core - RabbitMQ

## 📋 Requisitos Previos

Antes de ejecutar el servicio consumer, asegúrate de tener:

1. **RabbitMQ instalado y ejecutándose**
   - Windows: [RabbitMQ Windows Installer](https://www.rabbitmq.com/install-windows.html)
   - O usa Docker: `docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management`

2. **MongoDB instalado y ejecutándose**
   - Windows: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - O usa Docker: `docker run -d --name mongodb -p 27017:27017 mongo:latest`

## 🔧 Configuración

### 1. Variables de Entorno

Edita el archivo `.env` con la configuración de tu Core:

```env
# MongoDB - Misma base de datos que tu backend principal
MONGO_URI=mongodb://localhost:27017/socialgraph

# RabbitMQ - URL proporcionada por el equipo del Core
RABBIT_URL=amqp://guest:guest@localhost:5672

# Exchange del Core (confirmar con el equipo)
EXCHANGE_NAME=core_events

# Nombre de tu cola (único para tu módulo)
QUEUE_NAME=social_graph_queue

# Routing Keys que escucharás
ROUTING_KEYS=usuarios.usuario.creado,usuarios.sesion.iniciada,usuarios.sesion.finalizada,resenas.resena.creada,resenas.resena.actualizada,resenas.resena.eliminada
```

### 2. Verificar Conexión a RabbitMQ

Puedes verificar que RabbitMQ está corriendo:

```bash
# Acceder a la interfaz web de RabbitMQ
http://localhost:15672
# Usuario por defecto: guest
# Contraseña por defecto: guest
```

### 3. Formato de los Eventos

#### Eventos de Usuarios

**usuarios.usuario.creado**
```json
{
  "evento": "usuario_creado",
  "idUsuario": "u123",
  "nombre": "Juan Pérez",
  "pais": "AR",
  "fechaRegistro": "2025-08-20"
}
```

**usuarios.sesion.iniciada**
```json
{
  "evento": "sesion_iniciada",
  "idUsuario": "u123",
  "timestamp": "2025-08-20T10:30:00Z"
}
```

**usuarios.sesion.finalizada**
```json
{
  "evento": "sesion_finalizada",
  "idUsuario": "u123",
  "timestamp": "2025-08-20T12:45:00Z"
}
```

#### Eventos de Reseñas

**resenas.resena.creada**
```json
{
  "event": "resena_creada",
  "id": 101,
  "movie_id": 25,
  "user_id": 7,
  "title": "Una obra maestra del suspenso",
  "body": "La película mantiene la tensión de principio a fin.",
  "rating": 4,
  "has_spoilers": false,
  "tags": ["suspenso", "thriller"],
  "created_at": "2025-09-27T14:32:00Z"
}
```

**resenas.resena.actualizada**
```json
{
  "event": "resena_actualizada",
  "id": 101,
  "title": "Actualizado: Una obra maestra",
  "body": "Texto actualizado de la reseña",
  "rating": 5,
  "has_spoilers": true,
  "tags": ["suspenso", "thriller", "cine-noir"]
}
```

**resenas.resena.eliminada**
```json
{
  "event": "resena_eliminada",
  "id": 101
}
```

## 🚀 Ejecución

### Desarrollo
```bash
cd Backend/consumer
npm run dev
```

### Producción
```bash
cd Backend/consumer
npm start
```

## 📊 Verificación

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "service": "consumer-service",
  "database": "connected",
  "rabbitmq": "connected",
  "consumer": "consuming",
  "messagesProcessed": 0
}
```

### 2. Logs
El servicio mostrará logs coloreados en consola:

```
[INFO] 2025-10-18T10:00:00.000Z [MongoDB] Conectado exitosamente a la base de datos
[SUCCESS] 2025-10-18T10:00:01.000Z [RabbitMQ] Conectado exitosamente al broker
[INFO] 2025-10-18T10:00:02.000Z [RabbitMQ] Exchange 'core_events' declarado
[INFO] 2025-10-18T10:00:02.000Z [RabbitMQ] Queue 'social_graph_queue' declarada
[SUCCESS] 2025-10-18T10:00:03.000Z [CoreConsumer] 🚀 Consumer iniciado y listo para procesar eventos
```

## 🧪 Pruebas Manuales

### Publicar Evento de Prueba (usando RabbitMQ Management UI)

1. Accede a http://localhost:15672
2. Ve a la pestaña "Exchanges"
3. Click en `core_events`
4. En "Publish message":
   - **Routing key**: `usuarios.usuario.creado`
   - **Payload**:
   ```json
   {
     "evento": "usuario_creado",
     "idUsuario": "test123",
     "nombre": "Usuario de Prueba",
     "pais": "AR",
     "fechaRegistro": "2025-10-18"
   }
   ```
5. Click en "Publish message"

Deberías ver en los logs:
```
[EVENT] usuarios.usuario.creado Mensaje recibido (#1)
[SUCCESS] UserHandler Usuario creado/actualizado: test123
```

## 🔍 Troubleshooting

### Error: "Connection refused" al conectar RabbitMQ
- Verifica que RabbitMQ esté corriendo: `rabbitmqctl status`
- Revisa la URL en `.env`: `RABBIT_URL`

### Error: "MongoNetworkError"
- Verifica que MongoDB esté corriendo
- Revisa la URI en `.env`: `MONGO_URI`

### No se procesan mensajes
- Verifica que el exchange existe en RabbitMQ
- Verifica que las routing keys están correctamente configuradas
- Revisa los bindings en RabbitMQ Management UI

## 📞 Coordinación con el Core

Debes coordinar con el equipo del Core:

1. **Exchange name**: Nombre del exchange que publica eventos
2. **Routing keys**: Confirmar las routing keys exactas
3. **Formato de mensajes**: Validar estructura de los JSONs
4. **Credenciales**: Usuario y contraseña de RabbitMQ (si es producción)
5. **URL del broker**: Si está en un servidor remoto

## 🔐 Seguridad en Producción

Para producción, cambia las credenciales:

```env
RABBIT_URL=amqp://usuario:password@rabbitmq-server.com:5672
```

Y asegúrate de que `.env` esté en `.gitignore`.
