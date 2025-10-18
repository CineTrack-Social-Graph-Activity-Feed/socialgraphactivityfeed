# 🎯 Consumer Service - Resumen del Proyecto

## ✅ Proyecto Creado Exitosamente

Se ha creado el servicio **consumer** completo para consumir eventos de RabbitMQ del Core.

## 📁 Estructura Completa

```
Backend/consumer/
├── config/
│   ├── database.js           # Configuración MongoDB con reconexión
│   └── rabbit.js             # Configuración RabbitMQ con reconexión automática
│
├── consumers/
│   └── coreConsumer.js       # Consumer principal que procesa eventos
│
├── handlers/
│   ├── userHandler.js        # Lógica para eventos de usuarios
│   └── reviewHandler.js      # Lógica para eventos de reseñas
│
├── models/
│   ├── User.js               # Modelo de Usuario con métodos estáticos
│   └── Publication.js        # Modelo de Publicación con métodos estáticos
│
├── utils/
│   └── logger.js             # Sistema de logs colorido
│
├── index.js                  # Punto de entrada del servicio
├── testPublisher.js          # Script para publicar eventos de prueba
├── checkEnvironment.js       # Script de verificación del entorno
├── docker-compose.yml        # Docker Compose para MongoDB y RabbitMQ
│
├── .env                      # Variables de entorno
├── .env.example              # Ejemplo de configuración
├── .gitignore                # Archivos ignorados por Git
├── package.json              # Dependencias y scripts
│
├── README.md                 # Documentación principal
├── CONEXION_CORE.md          # Guía de conexión al Core
└── EJEMPLOS.md               # Ejemplos de uso y casos comunes
```

## 🔧 Características Implementadas

### ✅ Conexión a RabbitMQ
- Conexión automática con reintentos configurables
- Manejo de desconexiones con reconexión automática
- Configuración de exchange tipo 'topic'
- Bindings para routing keys específicas

### ✅ Consumo de Eventos
- **Usuarios:**
  - `usuarios.usuario.creado` → Crear/actualizar usuario
  - `usuarios.sesion.iniciada` → Registrar inicio de sesión
  - `usuarios.sesion.finalizada` → Registrar cierre de sesión

- **Reseñas:**
  - `resenas.resena.creada` → Crear publicación
  - `resenas.resena.actualizada` → Actualizar publicación
  - `resenas.resena.eliminada` → Marcar como eliminada (soft delete)

### ✅ Base de Datos MongoDB
- Modelos optimizados con índices
- Métodos estáticos para operaciones comunes
- Timestamps automáticos
- Validación de datos

### ✅ Sistema de Logs
- Logs coloreados por nivel (INFO, SUCCESS, ERROR, WARN, EVENT)
- Timestamps en formato ISO
- Identificación de módulo
- Datos estructurados para debugging

### ✅ Health Check
- Endpoint HTTP en `/health`
- Estado de MongoDB y RabbitMQ
- Contador de mensajes procesados
- Tiempo de uptime

### ✅ Herramientas de Testing
- Script `testPublisher.js` para simular eventos
- Flujos de prueba predefinidos (usuario, reseña)
- Verificación del entorno (`checkEnvironment.js`)
- Docker Compose para setup rápido

## 🚀 Comandos Disponibles

```bash
# Instalación
npm install

# Verificar entorno
npm run check

# Iniciar servicio
npm run dev              # Modo desarrollo (auto-reload)
npm start                # Modo producción

# Testing
npm run test:publish user         # Publicar flujo de usuario
npm run test:publish review       # Publicar flujo de reseña
npm run test:publish all          # Publicar todos los eventos
npm run test:publish usuarioCreado # Publicar evento específico

# Docker (MongoDB + RabbitMQ)
docker-compose up -d     # Iniciar servicios
docker-compose down      # Detener servicios
docker-compose logs -f   # Ver logs
```

## 📝 Pasos Siguientes

### 1. Instalar Dependencias
```bash
cd Backend/consumer
npm install
```

### 2. Configurar Variables de Entorno
Edita `.env` con tus credenciales:
```env
MONGO_URI=mongodb://localhost:27017/socialgraph
RABBIT_URL=amqp://guest:guest@localhost:5672
EXCHANGE_NAME=core_events
QUEUE_NAME=social_graph_queue
```

### 3. Iniciar Infraestructura (Opcional)
Si no tienes MongoDB y RabbitMQ instalados:
```bash
docker-compose up -d
```

Espera 10 segundos para que los servicios estén listos.

### 4. Verificar Entorno
```bash
npm run check
```

Deberías ver:
```
✓ MongoDB está accesible
✓ RabbitMQ está accesible
✓ Entorno configurado correctamente
```

### 5. Iniciar Consumer
```bash
npm run dev
```

Verás:
```
[SUCCESS] MongoDB Conectado exitosamente
[SUCCESS] RabbitMQ Conectado exitosamente
[SUCCESS] CoreConsumer 🚀 Consumer iniciado y listo
```

### 6. Probar con Eventos de Test
En otra terminal:
```bash
npm run test:publish:user
```

Verás en el consumer:
```
[EVENT] usuarios.usuario.creado Mensaje recibido (#1)
[SUCCESS] UserHandler Usuario creado/actualizado: u123
[SUCCESS] CoreConsumer Mensaje procesado y confirmado (#1)
```

### 7. Verificar en MongoDB
```bash
mongo mongodb://localhost:27017/socialgraph

> db.users.find().pretty()
{
  "_id": ObjectId("..."),
  "user_id": "u123",
  "nombre": "Juan Pérez",
  "pais": "AR",
  ...
}
```

## 🔗 Integración con el Core Real

Cuando tengas acceso al Core de CineTrack:

1. **Obtener credenciales** del equipo del Core:
   - URL de RabbitMQ
   - Usuario y contraseña
   - Nombre del exchange
   - Routing keys exactas

2. **Actualizar `.env`**:
```env
RABBIT_URL=amqp://usuario:password@core-rabbitmq.com:5672
EXCHANGE_NAME=nombre_exchange_real
```

3. **Reiniciar el consumer**:
```bash
npm run dev
```

4. **Monitorear logs** para verificar que se reciben eventos reales.

## 📊 Monitoreo en Producción

### Health Check
```bash
curl http://localhost:3001/health
```

### RabbitMQ Management UI
```
http://localhost:15672
Usuario: guest
Contraseña: guest
```

### Logs
Los logs se muestran en consola. Para producción, considera:
- Redirigir a archivo: `npm start > logs/consumer.log 2>&1`
- Usar PM2: `pm2 start index.js --name consumer`
- Integrar con servicios de logging (CloudWatch, Datadog, etc.)

## 🐛 Troubleshooting

### "Connection refused" RabbitMQ
```bash
# Verificar que RabbitMQ esté corriendo
docker-compose ps
# o
net start RabbitMQ  # Windows
```

### "MongoNetworkError"
```bash
# Verificar que MongoDB esté corriendo
docker-compose ps
# o
net start MongoDB  # Windows
```

### No se procesan mensajes
1. Verifica que el exchange existe en RabbitMQ Management UI
2. Verifica los bindings de la queue
3. Revisa las routing keys en `.env`
4. Publica un evento de prueba con `npm run test:publish:user`

## 📚 Documentación

- **README.md** - Documentación principal del proyecto
- **CONEXION_CORE.md** - Guía detallada de conexión al Core
- **EJEMPLOS.md** - Casos de uso y ejemplos prácticos

## 🎉 ¡Listo para Usar!

El servicio consumer está completamente funcional y listo para:
- ✅ Consumir eventos del Core
- ✅ Sincronizar usuarios y reseñas
- ✅ Actualizar tu base de datos automáticamente
- ✅ Integrarse con tu backend principal
- ✅ Escalar a producción

## 🆘 Soporte

Si tienes problemas:
1. Ejecuta `npm run check` para verificar el entorno
2. Revisa los logs del consumer
3. Verifica RabbitMQ Management UI
4. Consulta la documentación en los archivos `.md`

---

**Proyecto creado por GitHub Copilot**
Fecha: 18 de octubre de 2025
