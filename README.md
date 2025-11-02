# 🎯 CineTrack Testing Framework

![Tests](https://github.com/TU_USUARIO/socialgraphactivityfeed/actions/workflows/cinetrack-tests.yml/badge.svg)
![Coverage](https://img.shields.io/codecov/c/github/TU_USUARIO/socialgraphactivityfeed)
![Python](https://img.shields.io/badge/python-3.8%20%7C%203.9%20%7C%203.10%20%7C%203.11-blue)


Framework de testing profesional para la aplicación CineTrack (SocialGraphActivityFeed), con cobertura completa, reportes HTML y salida visual optimizada.

## 📋 ¿Qué es este framework?

Sistema de testing automatizado que valida la funcionalidad completa de CineTrack mediante:
- **Tests Unitarios**: Validan componentes individuales (API, respuestas, elementos básicos)
- **Tests de Integración**: Verifican la comunicación Frontend ↔ Backend
- **Tests E2E**: Simulan flujos completos de usuario
- **Tests de Performance**: Miden tiempos de carga y optimización
- **Smoke Tests**: Verificación rápida del estado crítico del sistema

## 🚀 Uso Rápido

### Instalación
```bash
# Instalar dependencias mínimas (sin Selenium)
pip install pytest pytest-cov pytest-html pytest-asyncio pytest-mock pytest-faker requests Faker python-dotenv

# O con todas las dependencias (incluye Selenium para E2E)
pip install -r tests/requirements.txt
```

### Comandos Principales

```bash
# Tests unitarios (funcionan sin Selenium)
python run_cinetrack_tests.py --unit

# Con análisis de cobertura
python run_cinetrack_tests.py --unit --coverage

# Usando pytest directamente
pytest tests/unit -v
pytest tests/unit --cov=tests --cov-report=html
```

### Tests que requieren Selenium (E2E/Smoke)

```bash
# Instalar dependencias de Selenium primero
pip install selenium webdriver-manager

# Ejecutar smoke tests (requiere ChromeDriver)
python run_cinetrack_tests.py --quick

# Ejecutar E2E tests
python run_cinetrack_tests.py --e2e
```

## 🧪 Tipos de Tests

| Tipo | Descripción | Tiempo | Qué Valida |
|------|-------------|--------|------------|
| **🧪 Unit** | Componentes aislados | ~30s | Conexión API, respuestas, elementos básicos |
| **🔗 Integration** | Comunicación entre capas | ~2min | Frontend ↔ Backend, carga de datos, JS execution |
| **🎭 E2E** | Flujos de usuario completos | ~5min | Navegación, interacciones, experiencia real |
| **⚡ Performance** | Tiempos y optimización | ~1min | Velocidad de carga, métricas de rendimiento |
| **🔥 Smoke** | Verificación crítica rápida | ~30s | Funcionalidades esenciales del sistema |

### Ejemplos de lo que hace cada tipo:

**Unit Tests:**
- ✅ API responde correctamente
- ✅ Contenido HTML se carga
- ✅ Elementos de branding están presentes

**Integration Tests:**
- ✅ Frontend recibe datos del Backend
- ✅ JavaScript se ejecuta sin errores
- ✅ Contenido dinámico se actualiza

**E2E Tests:**
- ✅ Usuario puede navegar la homepage
- ✅ Búsqueda de películas funciona
- ✅ Flujos completos sin interrupciones

**Performance Tests:**
- ✅ Página carga en <3 segundos
- ✅ Respuesta API en <1 segundo
- ✅ Recursos optimizados

**Smoke Tests:**
- ✅ Sistema está operacional
- ✅ Funcionalidades críticas disponibles

## 📊 Interpretación de Resultados

### Salida en Terminal

```bash
🧪 UNIT TESTS - API Connection
  api_connection: ✅ OK (0.52s)
  response_content: ✅ OK  
  cinetrack_branding: ✅ OK

🔗 INTEGRATION TESTS - Frontend ↔ Backend
  page_load_performance: ✅ OK (1.25s)
  frontend_js_execution: ✅ OK
  backend_data_delivery: ❌ FAIL
    └─ Movie data not loaded after 10 seconds
```

### Estados

- ✅ **OK**: Test pasó correctamente
- ❌ **FAIL**: Test falló - requiere atención inmediata
- ⚠️ **WARNING**: Funcionó pero hay issues a revisar
- ℹ️ **INFO**: Información adicional

### Reportes Generados

Después de ejecutar con `--coverage`, se generan:

1. **Coverage HTML**: `reports/coverage_YYYYMMDD_HHMMSS/index.html`
   - Análisis línea por línea del código
   - Indica qué partes están/no están cubiertas

2. **Test Report**: `reports/full_report_YYYYMMDD_HHMMSS.html`
   - Resultados detallados de cada test
   - Screenshots de fallos (si aplica)

3. **Terminal Output**: Resumen inmediato con colores y emojis

### Niveles de Cobertura

- 🟢 **80-100%**: Excelente cobertura
- 🟡 **60-79%**: Cobertura aceptable  
- 🔴 **<60%**: Necesita mejoras

## 📁 Estructura del Proyecto

```
socialgraphactivityfeed/
├── cinetrack_tests.py              # Todos los tests
├── run_cinetrack_tests.py          # Runner principal
├── pytest.ini                      # Configuración
├── tests/
│   ├── unit/                       # Tests unitarios
│   ├── integration/                # Tests de integración
│   ├── e2e/                        # Tests E2E
│   ├── pages/                      # Page Object Model
│   └── reports/                    # Reportes generados
└── reports/                        # Reportes de coverage
```

## 🔄 Flujo de Trabajo Recomendado

### Desarrollo Diario
```bash
python run_cinetrack_tests.py --quick    # 30 segundos
```

### Pre-Commit
```bash
python run_cinetrack_tests.py --unit     # 2 minutos
```

### Pre-Deploy
```bash
python run_cinetrack_tests.py            # Suite completa
```

### Análisis de Calidad
```bash
python run_cinetrack_tests.py --coverage # Con reportes detallados
```

## 🛠️ Configuración Avanzada

### Variables de Entorno

```bash
BASE_URL="https://dj07hexl3m0a6.cloudfront.net"
API_URL="http://localhost:3000/api"
TEST_ENV="staging"
BROWSER="chrome"
HEADLESS="false"
TEST_TIMEOUT="30"
```

### Opciones Adicionales

```bash
# Ejecución paralela (más rápido)
python run_tests.py --parallel --workers 4

# Diferentes navegadores
python run_tests.py --e2e --browser firefox
python run_tests.py --e2e --browser chrome

# Modo headless (sin interfaz gráfica)
python run_tests.py --all --headless

# Limpiar reportes antiguos
python run_tests.py --clean
```

## ✅ Estado del Framework

### ✅ Funcionando Correctamente:
- 🟢 **Unit Tests**: 36 tests pasando (100% éxito)
- 🟢 **Framework de testing**: Completamente configurado
- 🟢 **Sistema de reportes**: HTML y coverage funcionando
- 🟢 **GitHub Actions**: Pipeline CI/CD configurado en `.github/workflows/cinetrack-tests.yml`
- 🟢 **Pytest configurado**: Todos los markers definidos correctamente

### ⚠️ Tests que requieren WebDriver (no ejecutables sin navegador):
- E2E Tests (requieren Selenium + ChromeDriver)
- Smoke Tests con UI (requieren navegador)
- Integration Tests con frontend (requieren Selenium)

### � Para CI/CD:
El pipeline de GitHub Actions está configurado para ejecutar automáticamente:
- **Unit tests** en cada push/PR
- **Integration tests** en branches principales
- **Reportes de coverage** subidos como artifacts

**✅ LISTO PARA INTEGRACIÓN CI/CD**

## 📝 Próximos Pasos

1. Push de los cambios a GitHub
2. El workflow se activará automáticamente
3. Los reportes estarán disponibles en la pestaña "Actions"
4. Los artifacts de coverage se guardarán por 30 días
