# 📖 Ejemplos de Uso - Consumer Service

## 🚀 Inicio Rápido

### 1. Instalación
```bash
cd Backend/consumer
npm install
```

### 2. Configuración
```bash
# Copiar el archivo de configuración de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
```

### 3. Ejecutar
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

## 🧪 Testing

### Publicar Eventos de Prueba

El servicio incluye un script `testPublisher.js` para simular eventos del Core sin necesidad de tener el Core real corriendo.

#### Publicar Evento de Usuario Creado
```bash
npm run test:publish usuarioCreado
```

#### Publicar Flujo Completo de Usuario
```bash
npm run test:publish:user
```
Esto publica en secuencia:
1. Usuario creado
2. Sesión iniciada
3. Sesión finalizada

#### Publicar Flujo Completo de Reseña
```bash
npm run test:publish:review
```
Esto publica en secuencia:
1. Reseña creada
2. Reseña actualizada
3. Reseña eliminada

#### Publicar Todos los Eventos
```bash
npm run test:publish:all
```

### Verificar Datos en MongoDB

Después de publicar eventos, puedes verificar que se guardaron en MongoDB:

```bash
# Conectar a MongoDB
mongo mongodb://localhost:27017/socialgraph

# Ver usuarios
db.users.find().pretty()

# Ver publicaciones
db.publications.find().pretty()

# Contar documentos
db.users.countDocuments()
db.publications.countDocuments()

# Ver último usuario creado
db.users.find().sort({createdAt: -1}).limit(1).pretty()

# Ver reseñas de un usuario específico
db.publications.find({user_id: "u123"}).pretty()
```

## 🔍 Monitoreo

### Health Check
```bash
curl http://localhost:3001/health
```

Respuesta:
```json
{
  "status": "ok",
  "service": "consumer-service",
  "timestamp": "2025-10-18T10:30:00.000Z",
  "database": "connected",
  "rabbitmq": "connected",
  "consumer": "consuming",
  "messagesProcessed": 15,
  "uptime": 120.5
}
```

### Logs en Tiempo Real

El servicio muestra logs coloreados por tipo:

```
[INFO]    - Información general
[SUCCESS] - Operación exitosa
[ERROR]   - Error crítico
[WARN]    - Advertencia
[EVENT]   - Evento recibido
```

## 📊 Casos de Uso Comunes

### Caso 1: Nuevo Usuario Registrado

**Evento recibido:**
```json
{
  "evento": "usuario_creado",
  "idUsuario": "u456",
  "nombre": "María García",
  "pais": "ES",
  "fechaRegistro": "2025-10-18"
}
```

**Acción del consumer:**
- Crea documento en colección `users` con los datos del usuario
- Si el usuario ya existe, actualiza sus datos

**Resultado en MongoDB:**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "u456",
  "nombre": "María García",
  "pais": "ES",
  "fechaRegistro": ISODate("2025-10-18T00:00:00.000Z"),
  "lastLogin": null,
  "lastLogout": null,
  "syncedAt": ISODate("2025-10-18T10:30:00.000Z"),
  "createdAt": ISODate("2025-10-18T10:30:00.000Z"),
  "updatedAt": ISODate("2025-10-18T10:30:00.000Z")
}
```

### Caso 2: Usuario Inicia Sesión

**Evento recibido:**
```json
{
  "evento": "sesion_iniciada",
  "idUsuario": "u456",
  "timestamp": "2025-10-18T10:35:00Z"
}
```

**Acción del consumer:**
- Actualiza campo `lastLogin` del usuario
- Si el usuario no existe, lo crea

**Resultado en MongoDB:**
```javascript
{
  "user_id": "u456",
  "nombre": "María García",
  "lastLogin": ISODate("2025-10-18T10:35:00.000Z"),
  "syncedAt": ISODate("2025-10-18T10:35:00.000Z")
}
```

### Caso 3: Nueva Reseña Creada

**Evento recibido:**
```json
{
  "event": "resena_creada",
  "id": 201,
  "movie_id": 550,
  "user_id": "u456",
  "title": "Increíble película",
  "body": "Una de las mejores películas que he visto.",
  "rating": 5,
  "has_spoilers": false,
  "tags": ["drama", "accion"],
  "created_at": "2025-10-18T11:00:00Z"
}
```

**Acción del consumer:**
- Crea documento en colección `publications`

**Resultado en MongoDB:**
```javascript
{
  "_id": ObjectId("..."),
  "review_id": 201,
  "movie_id": 550,
  "user_id": "u456",
  "title": "Increíble película",
  "body": "Una de las mejores películas que he visto.",
  "rating": 5,
  "has_spoilers": false,
  "tags": ["drama", "accion"],
  "created_at": ISODate("2025-10-18T11:00:00.000Z"),
  "updated_at": ISODate("2025-10-18T11:00:00.000Z"),
  "isDeleted": false,
  "deletedAt": null,
  "syncedAt": ISODate("2025-10-18T11:00:00.000Z")
}
```

### Caso 4: Reseña Actualizada

**Evento recibido:**
```json
{
  "event": "resena_actualizada",
  "id": 201,
  "title": "Título actualizado",
  "rating": 4,
  "has_spoilers": true
}
```

**Acción del consumer:**
- Actualiza los campos modificados
- Mantiene campos no incluidos en el evento

**Resultado en MongoDB:**
```javascript
{
  "review_id": 201,
  "title": "Título actualizado",  // ✅ Actualizado
  "rating": 4,                     // ✅ Actualizado
  "has_spoilers": true,            // ✅ Actualizado
  "body": "...",                   // ⏸️ Sin cambios
  "tags": [...],                   // ⏸️ Sin cambios
  "updated_at": ISODate("2025-10-18T11:30:00.000Z"),
  "syncedAt": ISODate("2025-10-18T11:30:00.000Z")
}
```

### Caso 5: Reseña Eliminada

**Evento recibido:**
```json
{
  "event": "resena_eliminada",
  "id": 201
}
```

**Acción del consumer:**
- Marca la reseña como eliminada (soft delete)
- Se puede configurar para borrado permanente si se desea

**Resultado en MongoDB:**
```javascript
{
  "review_id": 201,
  "isDeleted": true,
  "deletedAt": ISODate("2025-10-18T12:00:00.000Z"),
  "syncedAt": ISODate("2025-10-18T12:00:00.000Z")
}
```

## 🔧 Configuración Avanzada

### Cambiar Estrategia de Eliminación

Por defecto, las reseñas eliminadas se marcan con `isDeleted: true` (soft delete).

Para hacer borrado permanente (hard delete), edita `handlers/reviewHandler.js`:

```javascript
// En el método handleReviewDeleted
// Comentar esta línea:
// const publication = await Publication.markAsDeleted(reviewId);

// Descomentar esta línea:
const publication = await Publication.deleteFromEvent(reviewId);
```

### Ajustar Prefetch (Mensajes Procesados en Paralelo)

En `consumers/coreConsumer.js`, línea:
```javascript
await channel.prefetch(1); // Cambia el número según tu capacidad
```

- `1`: Procesa un mensaje a la vez (más seguro)
- `5`: Procesa hasta 5 mensajes en paralelo (más rápido)

### Configurar Reintentos

En `.env`:
```env
MAX_RECONNECT_ATTEMPTS=10    # Número de reintentos
RECONNECT_INTERVAL=5000      # Milisegundos entre reintentos
```

## 🐛 Debugging

### Ver Todos los Logs
Los logs incluyen timestamps y módulos para facilitar el debugging:

```
[INFO] 2025-10-18T10:00:00.000Z [MongoDB] Conectado exitosamente
[EVENT] usuarios.usuario.creado Mensaje recibido (#1)
→ Data: { idUsuario: 'u123', nombre: 'Juan Pérez' }
[SUCCESS] UserHandler Usuario creado/actualizado: u123
```

### Simular Error de Conexión

Para probar la reconexión automática, detén RabbitMQ:

```bash
# Windows
net stop RabbitMQ

# Verás en los logs:
[ERROR] RabbitMQ Error en la conexión
[INFO] RabbitMQ Intentando reconectar (1/10)...
```

### Ver Estado de la Cola

Accede a RabbitMQ Management UI:
```
http://localhost:15672
Usuario: guest
Password: guest
```

En la pestaña "Queues":
- Verás `social_graph_queue`
- Mensajes en cola
- Mensajes procesados
- Bindings configurados

## 📈 Performance

### Estadísticas del Consumer

```bash
curl http://localhost:3001/health | json_pp
```

```json
{
  "messagesProcessed": 150,
  "uptime": 3600
}
```

### Optimización de Índices

Los modelos ya incluyen índices optimizados:

```javascript
// User
userSchema.index({ user_id: 1 });
userSchema.index({ fechaRegistro: -1 });

// Publication
publicationSchema.index({ user_id: 1, created_at: -1 });
publicationSchema.index({ movie_id: 1, created_at: -1 });
publicationSchema.index({ isDeleted: 1, created_at: -1 });
```

## 🔒 Seguridad

### Producción

1. **Cambiar credenciales de RabbitMQ:**
```env
RABBIT_URL=amqp://usuario_seguro:password_fuerte@rabbitmq.produccion.com:5672
```

2. **Usar TLS/SSL:**
```env
RABBIT_URL=amqps://usuario:password@rabbitmq.produccion.com:5671
```

3. **Variables de entorno seguras:**
- Nunca commitear `.env` al repositorio
- Usar servicios de gestión de secretos (AWS Secrets Manager, etc.)

## 📞 Integración con el Backend Principal

El consumer puede trabajar en paralelo con tu backend principal:

```
Backend Principal (puerto 3000)
    ↓
MongoDB (socialgraph)
    ↑
Consumer Service (puerto 3001)
    ↑
RabbitMQ
    ↑
Core (Usuarios + Reseñas)
```

Ambos servicios comparten la misma base de datos, permitiendo:
- Backend principal: API REST para el frontend
- Consumer: Sincronización automática con otros módulos
