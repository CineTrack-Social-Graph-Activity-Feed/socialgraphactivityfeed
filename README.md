# 🧪 Tests Automatizados – Social Graph & Activity Feed

Este módulo contiene los **tests automatizados** para el microservicio **Social Graph & Activity Feed** del proyecto Letterboxd UADE (Desarrollo II).

Incluye pruebas **end-to-end (E2E)** con Selenium, generación de reportes HTML y planilla de resultados en Excel.

---

## 📦 Instalación de dependencias

Antes de ejecutar los tests, asegurate de tener Python 3.10+ instalado. Luego corré:

```bash
pip install -r requirements.txt
```

## ▶️ Ejecución Tests
```bash
pytest selenium/test_e2e_full_flow.py -v --html=docs/report.html
```

## 📁 Estructura del proyecto

```
├── tests
│   ├── selenium
│   │   ├── conftest.py
│   │   ├── test_e2e_full_flow.py
│   │   ├── feed_flow.py
│   │   ├── network_flow.py
│   │   ├── utils
│   │   │   ├── checklist.py
│   │   ├── reports
│   ├── docs
│   │   ├── checklist.xlsx
│   └── requirements.txt
```
