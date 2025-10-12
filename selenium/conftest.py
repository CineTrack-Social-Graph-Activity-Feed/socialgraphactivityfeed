# tests/selenium/conftest.py
"""
Selenium-specific pytest configuration and fixtures.

This module provides WebDriver setup, browser configuration,
and specialized fixtures for E2E testing with Selenium.
"""

import json
import os
import pathlib
import datetime
import pytest
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from tests.utils.checklist import TestChecklist as Checklist
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

@pytest.fixture(scope="function")
def driver(request):
    """
    WebDriver fixture that supports multiple browsers and configurations.
    
    Supports Chrome and Firefox browsers with configurable options.
    Automatically handles driver installation and cleanup.
    """
    browser = request.config.getoption("--browser") if hasattr(request.config, "getoption") else "chrome"
    headless = request.config.getoption("--headless") if hasattr(request.config, "getoption") else False
    
    if browser.lower() == "firefox":
        options = FirefoxOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--width=1920")
        options.add_argument("--height=1080")
        options.set_preference("dom.webnotifications.enabled", False)
        options.set_preference("media.volume_scale", "0.0")
        
        service = FirefoxService(GeckoDriverManager().install())
        driver_instance = webdriver.Firefox(service=service, options=options)
    else:  # Default to Chrome
        options = Options()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--start-maximized")
        options.add_argument("--force-device-scale-factor=0.9")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-notifications")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        options.add_experimental_option("excludeSwitches", ["enable-logging", "enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.add_experimental_option("prefs", {
            "profile.default_content_setting_values.notifications": 2,
            "profile.default_content_settings.popups": 0,
            "profile.managed_default_content_settings.images": 2  # Block images for faster loading
        })
        
        service = Service(ChromeDriverManager().install())
        driver_instance = webdriver.Chrome(service=service, options=options)
    
    # Set implicit wait and page load timeout
    driver_instance.implicitly_wait(10)
    driver_instance.set_page_load_timeout(30)
    
    yield driver_instance
    
    # Cleanup
    try:
        driver_instance.quit()
    except Exception:
        pass

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
    """Add custom command line options for Selenium tests."""
    parser.addoption(
        "--headless", 
        action="store_true", 
        default=False, 
        help="Run browser in headless mode"
    )
    parser.addoption(
        "--browser", 
        action="store", 
        default="chrome",
        choices=["chrome", "firefox"],
        help="Browser to use for testing (chrome or firefox)"
    )
    parser.addoption(
        "--base-url",
        action="store",
        default="https://dj07hexl3m0a6.cloudfront.net",
        help="Base URL for the application under test"
    )

def pytest_sessionfinish(session, exitstatus):
    # Cargamos resultados de la corrida actual desde el tmp
    results = _load_tmp()
    if not results:
        return

    # Labels de esta corrida
    test_labels = []
    for idx, r in enumerate(results, start=1):
        label = f"Test_{idx:02d}_{r['started_at']}"
        test_labels.append(label)

    # ---- Construcción de DataFrames de ESTA corrida ----
    all_steps_run = sorted({s["name"] for r in results for s in r["steps"]})

    # Matriz Resumen de esta corrida
    data_run = {"Funcionalidad": all_steps_run}
    for label, r in zip(test_labels, results):
        passed_map = {s["name"]: ("✅" if s["ok"] else "❌") for s in r["steps"]}
        data_run[label] = [passed_map.get(step, "") for step in all_steps_run]
    df_summary_run = pd.DataFrame(data_run)

    # Detalle de esta corrida
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
    df_detail_run = pd.DataFrame(
        rows,
        columns=["Test","Módulo","Función de test","Paso","OK","Mensaje"]
    )

    xlsx_path = REPORT_DIR / "checklist.xlsx"

    # ---- Si ya existe el Excel, leemos y MERGE/APPEND ----
    if xlsx_path.exists():
        try:
            df_summary_prev = pd.read_excel(xlsx_path, sheet_name="Resumen")
            df_detail_prev  = pd.read_excel(xlsx_path, sheet_name="Detalle")
        except Exception:
            # Si hubo algún problema leyendo, partimos de cero
            df_summary_prev = pd.DataFrame(columns=["Funcionalidad"])
            df_detail_prev  = pd.DataFrame(columns=["Test","Módulo","Función de test","Paso","OK","Mensaje"])
    else:
        df_summary_prev = pd.DataFrame(columns=["Funcionalidad"])
        df_detail_prev  = pd.DataFrame(columns=["Test","Módulo","Función de test","Paso","OK","Mensaje"])

    # --- MERGE de Resumen (llaves por 'Funcionalidad') ---
    # 1) Asegurar columna clave
    if "Funcionalidad" not in df_summary_prev.columns:
        df_summary_prev = pd.DataFrame(columns=["Funcionalidad"])

    # 2) Unimos por outer para no perder pasos nuevos ni anteriores
    df_summary_merged = pd.merge(
        df_summary_prev,
        df_summary_run,
        on="Funcionalidad",
        how="outer"
    )

    # 3) Ordenar: primero 'Funcionalidad' y luego todas las columnas Test_* en orden de aparición
    cols = ["Funcionalidad"] + [c for c in df_summary_merged.columns if c != "Funcionalidad"]
    df_summary_merged = df_summary_merged[cols]

    # --- APPEND de Detalle ---
    df_detail_merged = pd.concat([df_detail_prev, df_detail_run], ignore_index=True)

    # --- Escribimos TODO al mismo archivo (sobrescribe, pero conservando histórico ya mergeado) ---
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df_summary_merged.to_excel(writer, index=False, sheet_name="Resumen")
        df_detail_merged.to_excel(writer, index=False, sheet_name="Detalle")

    # Limpiamos el tmp de esta sesión
    if TMP_JSON.exists():
        TMP_JSON.unlink(missing_ok=True)
