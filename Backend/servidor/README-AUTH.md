# Autenticación JWT

Este backend utiliza tokens JWT firmados con RS256 emitidos por el servicio de usuarios.

- Login: delega en el endpoint externo `/api/v1/auth/login` y devuelve `access_token`, `refresh_token`.
- Refresh: delega en `/api/v1/auth/refresh` y devuelve un nuevo `access_token`.
- Validación: se verifica con la clave pública (JWK) provista y se expone el endpoint `GET /api/auth/me`.

## Endpoints

- POST `/api/auth/login` (body x-www-form-urlencoded)
  - grant_type: password
  - username
  - password
- POST `/api/auth/refresh` (JSON)
  - { "refresh_token": "..." }
- GET `/api/auth/me` (requiere Authorization: Bearer <access_token>)

Todas las rutas `/api` (seguir, like, comentarios, publicaciones, usuarios) quedan protegidas y requieren un token válido, excepto las rutas de `/api/auth/*` y `/health`.

## Configuración

Opcionalmente podés configurar la URL base del servicio de usuarios con:

- `USERS_BASE_URL` (default: http://users-prod-alb-1703954385.us-east-1.elb.amazonaws.com/api/v1)

## Notas

- El access token dura ~30 minutos.
- El refresh token dura ~7 días.
- La verificación de tokens usa RS256 con la JWK pública provista.
