# tests/selenium/feed_flow.py
import os, time, pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def wait_vis(driver, locator, timeout=15):
    return WebDriverWait(driver, timeout).until(EC.visibility_of_element_located(locator))

@pytest.mark.smoke
@pytest.mark.e2e
def feed_like_comment_flow(driver, checklist):
    base_url = os.getenv("BASE_URL", "https://dj07hexl3m0a6.cloudfront.net")

    FEED_CARD       = (By.CLASS_NAME, "post")
    LIKE_BUTTON     = (By.CLASS_NAME, "like-post-btn")
    LIKE_COUNT      = (By.CSS_SELECTOR, ".action > span")
    COMMENT_INPUT   = (By.CLASS_NAME, "comment-post-input")
    COMMENT_SUBMIT  = (By.CLASS_NAME, "comment-post-btn")
    COMMENT_ITEM    = (By.CLASS_NAME, "comment")

    driver.get(f"{base_url}/feed")

    # 1) Feed cargado
    try:
        card = wait_vis(driver, FEED_CARD)
        checklist.check("Cargar Feed", card is not None)
    except Exception as e:
        checklist.check("Cargar Feed", False, f"{e}")
        pytest.fail("No se encontró ninguna card en el feed")

    # 2) Like
    try:
        like_btn = card.find_element(*LIKE_BUTTON)
        like_count_el = card.find_element(*LIKE_COUNT)
        before = like_count_el.text.strip()
        like_btn.click()
        WebDriverWait(driver, 10).until(lambda d: like_count_el.text.strip() != before)
        checklist.check("Dar Like a Publicación", True)
    except Exception as e:
        checklist.check("Dar Like a Publicación", False, f"{e}")

    # 3) Unlike
    try:
        like_btn = card.find_element(*LIKE_BUTTON)
        like_count_el = card.find_element(*LIKE_COUNT)
        before2 = like_count_el.text.strip()
        like_btn.click()
        WebDriverWait(driver, 10).until(lambda d: like_count_el.text.strip() != before2)
        checklist.check("Quitar Like a Publicación", True)
    except Exception as e:
        checklist.check("Quitar Like a Publicación", False, f"{e}")

    # 4) Comentar
    try:
        comment_text = "Comentario auto QA"
        comment_input = card.find_element(*COMMENT_INPUT)
        comment_submit = card.find_element(*COMMENT_SUBMIT)
        comment_input.clear()
        comment_input.send_keys(comment_text)
        comment_submit.click()
        time.sleep(2)
        new_comment = wait_vis(driver, COMMENT_ITEM)
        checklist.check("Crear Comentario", comment_text in new_comment.text)
    except Exception as e:
        checklist.check("Crear Comentario", False, f"{e}")
        new_comment = None

    # 5) Borrar comentario (si la UI lo permite)
    try:
        if new_comment:
            COMMENT_DELETE  = (By.CLASS_NAME, "delete-comment-btn")
            delete_btn = new_comment.find_element(*COMMENT_DELETE)
            delete_btn.click()
            time.sleep(1)
            checklist.check("Eliminar Comentario", True)
        else:
            checklist.check("Eliminar Comentario", False, "No se creó el comentario previamente")
    except Exception as e:
        checklist.check("Eliminar Comentario", False, f"{e}")

    # Al final (opcional): si querés que el test falle si algún paso falló:
    if checklist.passed != checklist.total:
        checklist.check("Feed flow completo", False, "Faltaron pasos")
    else:
        checklist.check("Feed flow completo", True)
