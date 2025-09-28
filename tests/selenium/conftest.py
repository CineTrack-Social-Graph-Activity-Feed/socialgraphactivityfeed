# tests/selenium/conftest.py
import json
import pathlib
import datetime
import pytest
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from utils.checklist import Checklist
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT_DIR / "docs"
REPORT_DIR.mkdir(parents=True, exist_ok=True)
TMP_JSON = REPORT_DIR / "_tmp_checklist.json"

def _load_tmp():
    if TMP_JSON.exists():
        return json.loads(TMP_JSON.read_text(encoding="utf-8"))
    return []

def _save_tmp(data):
    TMP_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

@pytest.fixture
def driver(request):
    headless = request.config.getoption("--headless") if hasattr(request.config, "getoption") else False
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--start-maximized")
    # Zoom: 90% => 0.9 ; si querés 100% dejá 1
    opts.add_argument("--force-device-scale-factor=0.9")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-notifications")
    opts.add_experimental_option("excludeSwitches", ["enable-logging", "enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_experimental_option("prefs", {"profile.default_content_setting_values.notifications": 2})

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=opts)
    yield drv
    drv.quit()

@pytest.fixture
def checklist(request):
    started_at = datetime.datetime.now()
    cl = Checklist(test_name=request.node.name,
                   module_name=request.node.fspath.purebasename,
                   started_at=started_at)
    yield cl
    payload = _load_tmp()
    payload.append(cl.summary_dict())
    _save_tmp(payload)

def pytest_addoption(parser):
    parser.addoption("--headless", action="store_true", default=False, help="Run browser headless")

def pytest_sessionfinish(session, exitstatus):
    # Al terminar TODO el run: generamos Excel con matriz ✅/❌ y detalle
    results = _load_tmp()
    if not results:
        return

    # Columnas: Test_01_YYYYMMDD_HH:MM ...
    test_labels = []
    for idx, r in enumerate(results, start=1):
        label = f"Test_{idx:02d}_{r['started_at']}"
        test_labels.append(label)

    # Filas (todas las funcionalidades/steps únicos)
    all_steps = sorted({s["name"] for r in results for s in r["steps"]})

    # Matriz Resumen
    data = {"Funcionalidad": all_steps}
    for label, r in zip(test_labels, results):
        passed_map = {s["name"]: ("✅" if s["ok"] else "❌") for s in r["steps"]}
        data[label] = [passed_map.get(step, "") for step in all_steps]

    df_summary = pd.DataFrame(data)

    # Hoja Detalle
    rows = []
    for label, r in zip(test_labels, results):
        for s in r["steps"]:
            rows.append({
                "Test": label,
                "Módulo": r["module"],
                "Función de test": r["test"],
                "Paso": s["name"],
                "OK": "✅" if s["ok"] else "❌",
                "Mensaje": s.get("message", "")
            })
    df_detail = pd.DataFrame(rows, columns=["Test","Módulo","Función de test","Paso","OK","Mensaje"])

    xlsx_path = REPORT_DIR / "checklist.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df_summary.to_excel(writer, index=False, sheet_name="Resumen")
        df_detail.to_excel(writer, index=False, sheet_name="Detalle")

    if TMP_JSON.exists():
        TMP_JSON.unlink(missing_ok=True)
