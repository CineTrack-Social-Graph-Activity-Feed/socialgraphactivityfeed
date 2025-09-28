Instalar Dependencias: pip install -r requirements.txt

Ejecutar: pytest selenium/test_e2e_full_flow.py -v --html=docs/report.html


Estructura del Proyecto:
tests/
├── selenium/
│ ├── conftest.py # Setup global de Selenium + reporter
│ ├── test_e2e_full_flow.py # Test principal (flujo completo)
│ ├── feed_flow.py # Funciones auxiliares (dar like, comentar)
│ ├── network_flow.py # Funciones auxiliares (seguir, dejar de seguir)
│ ├── utils/
│ │ └── checklist.py # Helper para registrar pasos del test
│ └── reports/ # (Depreciado, no se usa)
├── docs/
│ └── checklist.xlsx # 📊 Resultado de pruebas en Excel