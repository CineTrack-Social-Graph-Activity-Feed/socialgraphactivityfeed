# Tests E2E/Integration - Social Graph Activity Feed

## 📋 Descripción

Tests simplificados enfocados **exclusivamente en funcionalidad social** del módulo:
- Feed de actividad social (publicaciones de usuarios seguidos)
- Red social (follows/followers)
- Likes y comentarios
- Performance y accesibilidad

## ✅ Tests Útiles (Mantener)

### Smoke Tests (`tests/e2e/test_social_smoke.py`)
**4 tests críticos** que validan funcionalidad básica:
- ✅ Aplicación social es accesible
- ✅ Feed de actividad muestra publicaciones  
- ✅ Página de red social (follows) es accesible
- ✅ Performance: carga en < 15 segundos

### API Tests (`tests/integration/test_social_api.py`)
**6 tests de integración** para endpoints sociales:
- ✅ API está accesible
- ✅ GET `/api/publications` - Feed de publicaciones
- ✅ GET `/api/follows` - Datos de red social
- ✅ POST `/api/likes` - Endpoint de likes existe
- ✅ POST `/api/comments` - Endpoint de comentarios existe

### Unit Tests (ya existen)
- ✅ `tests/unit/test_selenium_helpers.py` - 100% coverage
- ✅ `tests/unit/test_utils.py` - 99% coverage

## ❌ Tests NO Útiles (Eliminar o Ignorar)

Archivos que contienen tests de funcionalidad del **Core** (no de este módulo):
- ❌ `test_cinetrack_full_flow.py` - Flujos E2E completos con login/registro
- ❌ `test_cinetrack_smoke_regression.py` - Tests duplicados y de funcionalidad del Core
- ❌ `test_complete_flows.py` - Creación de reviews (eso es del Core)
- ❌ `test_cinetrack_api.py` - Tests de APIs del Core
- ❌ `test_frontend_backend_integration.py` - Tests de integración con Core

## 🚀 Ejecución

### Local (desarrollo)
```bash
# Smoke tests sociales
pytest tests/e2e/test_social_smoke.py -v

# API tests sociales  
pytest tests/integration/test_social_api.py -v

# Unit tests
pytest tests/unit/ -v
```

### CI/CD (pipeline)
El pipeline debe configurar estas variables de entorno:
```yaml
env:
  CI: "true"  # Activa modo CI
  FRONTEND_URL: "https://dj07hexl3m0a6.cloudfront.net"
  BACKEND_URL: "https://socialgraphbe.cine-track.com.ar"
```

Comando en pipeline:
```bash
pytest tests/e2e/test_social_smoke.py tests/integration/test_social_api.py tests/unit/ --cov --cov-report=html
```

## 📊 Coverage Esperado

- **Frontend (app)**: ~89.81% ✅ (207 tests)
- **Backend (app)**: ~83.25% ✅ (198 tests)
- **Test utilities**: 95-100% ✅
- **E2E/Integration**: ~30% ⚠️ (solo mide código de tests, no la app)

> **Nota**: El coverage de 30% en tests E2E es normal y correcto porque mide el código de los tests mismos, no la aplicación.

## 🎯 Scope del Módulo Social

Este módulo **NO** incluye:
- ❌ Autenticación de usuarios (viene del Core)
- ❌ Creación/edición de reviews (viene del Core)
- ❌ Búsqueda de películas (viene del Core)
- ❌ Ratings de películas (viene del Core)

Este módulo **SÍ** incluye:
- ✅ Feed de actividad social (publicaciones de seguidos)
- ✅ Seguir/Dejar de seguir usuarios
- ✅ Likes en publicaciones
- ✅ Comentarios en publicaciones  
- ✅ Ver red social (followers/following)

## 📝 Próximos Pasos

1. **Eliminar archivos obsoletos**:
   ```bash
   rm tests/e2e/test_cinetrack_full_flow.py
   rm tests/e2e/test_complete_flows.py
   rm tests/integration/test_cinetrack_api.py
   rm tests/integration/test_frontend_backend_integration.py
   ```

2. **Mantener solo**:
   - `tests/e2e/test_social_smoke.py` (4 smoke tests)
   - `tests/integration/test_social_api.py` (6 API tests)
   - `tests/unit/*` (tests unitarios)

3. **Configurar pipeline** para usar las URLs desplegadas

## 🔧 Configuración

Variables de entorno soportadas:
- `CI`: "true" para modo CI/CD, "false" para local
- `FRONTEND_URL`: URL del frontend desplegado (solo CI)
- `BACKEND_URL`: URL del backend desplegado (solo CI)
- `BASE_URL`: URL local frontend (solo desarrollo)
- `API_URL`: URL local backend (solo desarrollo)
- `HEADLESS`: "true" para headless mode (automático en CI)
- `TEST_TIMEOUT`: Timeout en segundos (default: 30)
