# SocialGraphActivityFeed Backend

Backend para módulo de feed de actividad social estilo Letterboxd, desarrollado con Node.js, Express y MongoDB.

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB (local o remoto)
- npm o yarn

### Instalación
```bash
# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar variables de entorno
nano .env
```

### Variables de Entorno
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/socialgraphactivityfeed
NODE_ENV=development
```

### Ejecutar
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## 📡 API Endpoints

### SWAGGER Documentation
- `GET /doc` - Despliega documentacion Swagger

### Health Check
- `GET /health` - Verificar estado del servidor

### Usuarios
- `POST /api/user` - Crear usuario
- `GET /api/user/:user_id` - Obtener usuario por ID
- `GET /api/user/search?q=username` - Buscar usuarios
- `PUT /api/user/:user_id` - Actualizar usuario

### Seguimientos
- `POST /api/follow` - Seguir usuario
- `POST /api/unfollow` - Dejar de seguir usuario
- `GET /api/feed?user_id=...` - Obtener feed de actividad
- `GET /api/followed?user_id=...` - Obtener usuarios que sigues (seguidos)
- `GET /api/followers?user_id=...` - Obtener usuarios que te siguen (seguidores)

### Publicaciones
- `POST /api/publication` - Crear publicación
- `GET /api/publication/:publication_id` - Obtener publicación
- `GET /api/publication/user/:user_id` - Obtener publicaciones de usuario
- `DELETE /api/publication/:publication_id` - Eliminar publicación

### Likes
- `POST /api/like` - Dar like a publicación
- `DELETE /api/like/:like_id` - Quitar like
- `GET /api/like/publication/:publication_id` - Obtener likes de publicación

### Comentarios
- `POST /api/comment` - Agregar comentario
- `DELETE /api/comment/:comment_id` - Eliminar comentario
- `GET /api/comment/publication/:publication_id` - Obtener comentarios de publicación

## 📋 Ejemplos de Uso

### 1. Crear Usuario
```bash
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg"
  }'
```

### 2. Seguir Usuario
```bash
curl -X POST http://localhost:3000/api/follow \
  -H "Content-Type: application/json" \
  -d '{
    "follower_user_id": "USER_ID_1",
    "followed_user_id": "USER_ID_2"
  }'
```

### 3. Crear Publicación (Review)
```bash
curl -X POST http://localhost:3000/api/publication \
  -H "Content-Type: application/json" \
  -d '{
    "author_id": "USER_ID",
    "type": "review",
    "target_id": "movie_123",
    "content": "Excelente película, muy recomendada!"
  }'
```

### 4. Crear Publicación (Rating)
```bash
curl -X POST http://localhost:3000/api/publication \
  -H "Content-Type: application/json" \
  -d '{
    "author_id": "USER_ID",
    "type": "rating",
    "target_id": "movie_123",
    "content": "Una obra maestra del cine",
    "rating": 5
  }'
```

### 5. Dar Like
```bash
curl -X POST http://localhost:3000/api/like \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "target_id": "PUBLICATION_ID",
    "target_type": "review"
  }'
```

### 6. Agregar Comentario
```bash
curl -X POST http://localhost:3000/api/comment \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "target_id": "PUBLICATION_ID",
    "target_type": "review",
    "comment": "Totalmente de acuerdo con tu review!"
  }'
```

### 7. Obtener Feed
```bash
curl "http://localhost:3000/api/feed?user_id=USER_ID&page=1&limit=10"
```

## 🏗️ Arquitectura

### Modelos
- **User**: Usuarios del sistema
- **Follow**: Relaciones de seguimiento entre usuarios
- **Publication**: Publicaciones (reviews, ratings, listas)
- **Comment**: Comentarios en publicaciones
- **Like**: Likes en publicaciones

### Controladores
- **userController**: Gestión de usuarios
- **followController**: Seguimientos y feed
- **publicationController**: Gestión de publicaciones
- **likeController**: Gestión de likes
- **commentController**: Gestión de comentarios

### Eventos
El sistema emite eventos para cada acción importante:
- `FOLLOW` / `UNFOLLOW`
- `LIKE` / `UNLIKE`
- `COMMENT` / `DELETE_COMMENT`
- `NEW_PUBLICATION` / `DELETE_PUBLICATION`

Actualmente los eventos se imprimen en consola, pero están preparados para integración con sistemas de mensajería.

## 🔧 Estructura del Proyecto

```
servidor/
├── models/           # Esquemas Mongoose
│   ├── User.js
│   ├── Follow.js
│   ├── Publication.js
│   ├── Comment.js
│   └── Like.js
├── controllers/      # Lógica de negocio
│   ├── userController.js
│   ├── followController.js
│   ├── publicationController.js
│   ├── likeController.js
│   └── commentController.js
├── routes/          # Definición de endpoints
│   ├── index.js
│   ├── userRoutes.js
│   ├── followRoutes.js
│   ├── publicationRoutes.js
│   ├── likeRoutes.js
│   └── commentRoutes.js
├── utils/           # Utilidades
│   └── events.js
├── .env             # Variables de entorno
├── package.json     # Dependencias
└── server.js        # Punto de entrada
```

## 🧪 Testing con Postman

Puedes importar los ejemplos de la documentación en Postman o usar los comandos curl proporcionados.

## 🚀 Próximos Pasos

1. Implementar autenticación JWT
2. Agregar middleware de validación más robusto
3. Implementar rate limiting
4. Agregar tests unitarios
5. Integrar con sistema de mensajería real (Redis/RabbitMQ)
6. Implementar búsqueda avanzada
7. Agregar métricas y monitoring

## 📝 Licencia

ISC