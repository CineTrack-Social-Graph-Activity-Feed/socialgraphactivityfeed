# tests/selenium/network_flow.py
import os, time, pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def wait_css(driver, selector, timeout=15):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, selector))
    )

@pytest.mark.smoke
@pytest.mark.e2e
def network_follow_unfollow_flow(driver, checklist):
    base_url = os.getenv("BASE_URL", "https://dj07hexl3m0a6.cloudfront.net")
    driver.get(f"{base_url}/follows")

    TAB_SEGUIDOS     = (By.XPATH, "//div[contains(@class,'tabs')]/button[contains(@class,'tab-button') and normalize-space()='SEGUIDOS']")
    TAB_SEGUIDORES   = (By.XPATH, "//div[contains(@class,'tabs')]/button[contains(@class,'tab-button') and normalize-space()='SEGUIDORES']")
    LISTA_USUARIOS   = (By.CSS_SELECTOR, ".user-list")
    ROWS             = (By.CSS_SELECTOR, ".user-list .user-row")
    FOLLOW_BTN       = (By.CSS_SELECTOR, ".follow-btn")

    # 1) Cargar Follows
    try:
        WebDriverWait(driver, 10).until(EC.visibility_of_element_located(TAB_SEGUIDOS))
        WebDriverWait(driver, 10).until(EC.visibility_of_element_located(TAB_SEGUIDORES))
        wait_css(driver, ".user-list")
        checklist.check("Cargar Follows", True)
    except Exception as e:
        checklist.check("Cargar Follows", False, f"{e}")

    # 2) Ir a SEGUIDORES
    try:
        seguidores_tab = driver.find_element(*TAB_SEGUIDORES)
        seguidores_tab.click()
        WebDriverWait(driver, 10).until(
            lambda d: "active" in d.find_element(*TAB_SEGUIDORES).get_attribute("class")
            or "active" not in d.find_element(*TAB_SEGUIDOS).get_attribute("class")
        )
        time.sleep(1)
        checklist.check("Cambiar a pestaña SEGUIDORES", True)
    except Exception as e:
        checklist.check("Cambiar a pestaña SEGUIDORES", False, f"{e}")

    # 3) Seguir usuario
    objetivo = None
    try:
        filas = WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located(ROWS))
        for row in filas:
            try:
                btn = row.find_element(*FOLLOW_BTN)
                if btn.text.strip().lower() == "seguir":
                    objetivo = (row, btn)
                    break
            except Exception:
                continue
        assert objetivo is not None, "No hay usuario con botón 'Seguir'"
        row, btn = objetivo
        btn.click()
        WebDriverWait(driver, 10).until(lambda d: btn.text.strip().lower() in ("siguiendo", "dejar de seguir"))
        time.sleep(1)
        checklist.check("Seguir Usuario", True)
    except Exception as e:
        checklist.check("Seguir Usuario", False, f"{e}")

    # 4) Dejar de seguir (con confirmación)
    try:
        row, btn = objetivo if objetivo else (None, None)
        assert btn is not None, "No se pudo reusar botón para unfollow"
        btn.click()
        time.sleep(0.5)
        confirm_btn = driver.find_element(By.CSS_SELECTOR, ".confirm-btn")
        confirm_btn.click()
        WebDriverWait(driver, 10).until(lambda d: btn.text.strip().lower() == "seguir")
        time.sleep(1)
        checklist.check("Dejar de Seguir Usuario", True)
    except Exception as e:
        checklist.check("Dejar de Seguir Usuario", False, f"{e}")

    if checklist.passed != checklist.total:
        checklist.check("Network flow completo", False, "Faltaron pasos")
    else:
        checklist.check("Network flow completo", True)