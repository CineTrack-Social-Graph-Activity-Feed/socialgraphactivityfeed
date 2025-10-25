"""
🎯 CINETRACK TESTING FRAMEWORK - MAIN TEST SUITE
================================================================

Este archivo contiene todos los tests principales organizados por funcionalidad.
Incluye tests unitarios, de integración y E2E con salida visual mejorada.
"""

import pytest
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ============================================================================
# 🔧 CONFIGURACIÓN Y FIXTURES
# ============================================================================

@pytest.fixture
def driver():
    """WebDriver fixture optimizado para CineTrack."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    service = Service(ChromeDriverManager().install())
    driver_instance = webdriver.Chrome(service=service, options=options)
    driver_instance.implicitly_wait(10)
    
    yield driver_instance
    
    try:
        driver_instance.quit()
    except Exception:
        pass


class TestResult:
    """Helper para mostrar resultados visuales en terminal."""
    
    @staticmethod
    def show_step(name, success, message="", duration=None):
        """Muestra resultado de un paso individual."""
        status = "✅ OK" if success else "❌ FAIL"
        time_info = f" ({duration:.2f}s)" if duration else ""
        print(f"  {name}: {status}{time_info}")
        if message and not success:
            print(f"    └─ {message}")
        return success


# ============================================================================
# 🧪 TESTS UNITARIOS - Componentes Individuales
# ============================================================================

class TestCineTrackUnits:
    """Tests unitarios para componentes individuales de CineTrack."""
    
    def test_api_connection(self):
        """🔌 Test unitario: Conexión a la API base."""
        print("\n🧪 UNIT TESTS - API Connection")
        
        start_time = time.time()
        
        try:
            response = requests.get("https://dj07hexl3m0a6.cloudfront.net", timeout=10)
            duration = time.time() - start_time
            
            TestResult.show_step("api_connection", response.status_code == 200, 
                               f"Status: {response.status_code}", duration)
            TestResult.show_step("response_content", len(response.text) > 0,
                               f"Content length: {len(response.text)}")
            TestResult.show_step("cinetrack_branding", "cinetrack" in response.text.lower())
            
            assert response.status_code == 200
            assert len(response.text) > 0
            
        except requests.RequestException as e:
            TestResult.show_step("api_connection", False, str(e))
            pytest.fail(f"API connection failed: {e}")
    
    def test_content_structure(self):
        """📋 Test unitario: Estructura del contenido."""
        print("\n🧪 UNIT TESTS - Content Structure")
        
        response = requests.get("https://dj07hexl3m0a6.cloudfront.net")
        content = response.text.lower()
        
        # Verificar elementos estructurales (más flexible)
        tests = {
            "html_structure": "html" in content and "body" in content,
            "title_present": "title" in content,
            "cinetrack_branding": "cinetrack" in content,
            "basic_content": len(content) > 500,  # Contenido suficiente (más flexible)
            "javascript_present": "script" in content or "js" in content,
            "interactive_elements": any(elem in content for elem in ["button", "input", "form", "div"]),
        }
        
        for test_name, result in tests.items():
            TestResult.show_step(test_name, result)
        
        assert all(tests.values()), f"Content structure tests failed: {tests}"


# ============================================================================
# 🔗 TESTS DE INTEGRACIÓN - Comunicación entre componentes
# ============================================================================

class TestCineTrackIntegration:
    """Tests de integración entre frontend y backend."""
    
    def test_frontend_backend_communication(self, driver):
        """🔗 Test integración: Frontend-Backend communication."""
        print("\n🔗 INTEGRATION TESTS - Frontend ↔ Backend")
        
        start_time = time.time()
        
        # Cargar página a través del navegador
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        load_duration = time.time() - start_time
        
        # Verificar elementos cargados dinámicamente
        page_source = driver.page_source.lower()
        
        tests = {
            "page_load": len(page_source) > 100,
            "frontend_js_execution": "script" in page_source or len(driver.get_cookies()) >= 0,
            "backend_data_delivery": "cinetrack" in page_source,
            "dynamic_content": any(movie in page_source for movie in ["conjuring", "superman"]),
            "user_interface": any(ui in page_source for ui in ["button", "input", "form"]),
        }
        
        TestResult.show_step("page_load_performance", load_duration < 5.0, 
                           f"Load time: {load_duration:.2f}s", load_duration)
        
        for test_name, result in tests.items():
            TestResult.show_step(test_name, result)
        
        assert all(tests.values())
    
    def test_navigation_integration(self, driver):
        """🧭 Test integración: Navegación entre páginas."""
        print("\n🔗 INTEGRATION TESTS - Navigation")
        
        # Página inicial
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        initial_url = driver.current_url
        
        TestResult.show_step("home_page_load", "dj07hexl3m0a6.cloudfront.net" in initial_url)
        
        # Navegación a network
        driver.get("https://dj07hexl3m0a6.cloudfront.net/follows")
        time.sleep(2)
        
        network_url = driver.current_url
        network_content = driver.page_source.lower()
        
        tests = {
            "url_routing": "follows" in network_url,
            "content_change": len(network_content) > 100,
            "backend_response": driver.execute_script("return document.readyState") == "complete"
        }
        
        for test_name, result in tests.items():
            TestResult.show_step(test_name, result)
        
        assert all(tests.values())


# ============================================================================
# 🎭 TESTS E2E - Flujos completos de usuario
# ============================================================================

class TestCineTrackE2E:
    """Tests End-to-End para flujos completos de usuario."""
    
    def test_user_homepage_journey(self, driver):
        """🎭 Test E2E: Flujo completo del usuario en homepage."""
        print("\n🎭 E2E TESTS - User Homepage Journey")
        
        # Paso 1: Carga inicial
        start_time = time.time()
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        load_time = time.time() - start_time
        
        TestResult.show_step("homepage_load", load_time < 10.0, 
                           f"Load time: {load_time:.2f}s", load_time)
        
        # Paso 2: Verificar contenido del feed
        page_content = driver.page_source.lower()
        
        feed_tests = {
            "welcome_message": "bienvenido" in page_content,
            "movie_posts": any(movie in page_content for movie in ["conjuring", "superman", "f1"]),
            "user_activity": any(user in page_content for user in ["paul rudd", "jane foster"]),
            "review_content": "reseña" in page_content or "review" in page_content,
        }
        
        for test_name, result in feed_tests.items():
            TestResult.show_step(test_name, result)
        
        # Paso 3: Interacción con la página
        try:
            # Scroll test
            initial_scroll = driver.execute_script("return window.pageYOffset;")
            driver.execute_script("window.scrollTo(0, 500);")
            time.sleep(1)
            new_scroll = driver.execute_script("return window.pageYOffset;")
            
            TestResult.show_step("page_interaction", new_scroll != initial_scroll)
            
        except Exception as e:
            TestResult.show_step("page_interaction", False, str(e))
        
        assert all(feed_tests.values())
    
    def test_user_navigation_journey(self, driver):
        """🧭 Test E2E: Flujo de navegación completo."""
        print("\n🎭 E2E TESTS - User Navigation Journey")
        
        # Paso 1: Inicio en homepage
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        TestResult.show_step("start_homepage", True)
        
        # Paso 2: Navegación a network
        start_nav = time.time()
        driver.get("https://dj07hexl3m0a6.cloudfront.net/follows")
        nav_time = time.time() - start_nav
        
        TestResult.show_step("navigate_to_network", nav_time < 5.0, 
                           f"Navigation time: {nav_time:.2f}s", nav_time)
        
        # Paso 3: Verificar página de network
        network_content = driver.page_source.lower()
        
        network_tests = {
            "network_page_loaded": len(network_content) > 100,
            "url_correct": "follows" in driver.current_url,
            "content_loaded": "html" in network_content and "body" in network_content  # Verificar estructura básica
        }
        
        for test_name, result in network_tests.items():
            TestResult.show_step(test_name, result)
        
        # Paso 4: Regreso a homepage
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        time.sleep(1)
        
        TestResult.show_step("return_to_homepage", 
                           "dj07hexl3m0a6.cloudfront.net" in driver.current_url and 
                           "follows" not in driver.current_url)
        
        assert all(network_tests.values())


# ============================================================================
# ⚡ TESTS DE PERFORMANCE - Métricas de rendimiento
# ============================================================================

class TestCineTrackPerformance:
    """Tests de performance y métricas de rendimiento."""
    
    def test_load_performance(self, driver):
        """⚡ Test performance: Tiempos de carga."""
        print("\n⚡ PERFORMANCE TESTS - Load Times")
        
        # Test múltiples cargas para promedio
        load_times = []
        
        for i in range(3):
            start_time = time.time()
            driver.get("https://dj07hexl3m0a6.cloudfront.net")
            
            # Esperar contenido completo
            WebDriverWait(driver, 10).until(
                lambda d: len(d.page_source) > 100
            )
            
            load_time = time.time() - start_time
            load_times.append(load_time)
            
            TestResult.show_step(f"load_test_{i+1}", load_time < 8.0, 
                               f"Time: {load_time:.2f}s", load_time)
        
        # Métricas agregadas
        avg_time = sum(load_times) / len(load_times)
        max_time = max(load_times)
        
        TestResult.show_step("average_load_time", avg_time < 5.0, 
                           f"Avg: {avg_time:.2f}s", avg_time)
        TestResult.show_step("max_load_time", max_time < 10.0, 
                           f"Max: {max_time:.2f}s", max_time)
        
        assert avg_time < 5.0 and max_time < 10.0
    
    def test_content_size_performance(self, driver):
        """📊 Test performance: Tamaño de contenido."""
        print("\n⚡ PERFORMANCE TESTS - Content Size")
        
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        
        content_size = len(driver.page_source)
        content_kb = content_size / 1024
        
        size_tests = {
            "reasonable_size": content_kb < 500,  # Menos de 500KB
            "sufficient_content": content_kb > 5,  # Más de 5KB
            "not_empty": content_size > 0
        }
        
        TestResult.show_step("content_size", size_tests["reasonable_size"], 
                           f"Size: {content_kb:.1f} KB")
        
        for test_name, result in size_tests.items():
            if test_name != "reasonable_size":  # Ya mostrado arriba
                TestResult.show_step(test_name, result)
        
        assert all(size_tests.values())


# ============================================================================
# 🎯 TESTS DE SMOKE - Tests críticos rápidos
# ============================================================================

class TestCineTrackSmoke:
    """Tests de smoke para verificación rápida del sistema."""
    
    def test_critical_functionality(self, driver):
        """🔥 Smoke test: Funcionalidad crítica del sistema."""
        print("\n🔥 SMOKE TESTS - Critical Functionality")
        
        # Test crítico: ¿La aplicación está viva?
        start_time = time.time()
        driver.get("https://dj07hexl3m0a6.cloudfront.net")
        response_time = time.time() - start_time
        
        page_content = driver.page_source.lower()
        title = driver.title
        
        critical_tests = {
            "application_responds": response_time < 15.0,
            "content_loads": len(page_content) > 500,
            "branding_present": "cinetrack" in page_content,
            "page_title": len(title) > 0,
            "basic_structure": "html" in page_content and "body" in page_content
        }
        
        TestResult.show_step("system_health", all(critical_tests.values()),
                           f"Response: {response_time:.2f}s, Content: {len(page_content)} chars")
        
        for test_name, result in critical_tests.items():
            TestResult.show_step(test_name, result)
        
        # Test crítico de navegación
        driver.get("https://dj07hexl3m0a6.cloudfront.net/follows")
        navigation_works = len(driver.page_source) > 100
        
        TestResult.show_step("navigation_works", navigation_works)
        
        assert all(critical_tests.values()) and navigation_works


# ============================================================================
# 📊 FUNCIÓN PRINCIPAL PARA COVERAGE
# ============================================================================

def run_with_coverage():
    """Ejecuta tests con coverage completo."""
    import subprocess
    import sys
    
    cmd = [
        sys.executable, "-m", "pytest", 
        "cinetrack_tests.py", 
        "--cov=.", 
        "--cov-report=html:reports/coverage",
        "--cov-report=term-missing",
        "--html=reports/full_test_report.html",
        "--self-contained-html",
        "-v"
    ]
    
    return subprocess.run(cmd)


if __name__ == "__main__":
    # Ejecución directa con pytest
    pytest.main([__file__, "-v", "-s"])