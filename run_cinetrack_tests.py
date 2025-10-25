#!/usr/bin/env python3
"""
🚀 CINETRACK TEST RUNNER - Ejecutor principal con salida visual
============================================================

Runner principal optimizado para ejecutar tests de CineTrack con
salida visual mejorada y opciones de coverage.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime


class Colors:
    """Códigos de colores para terminal."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    ENDC = '\033[0m'


class CineTrackTestRunner:
    """Runner principal para tests de CineTrack."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.reports_dir = self.base_dir / "reports"
        self.reports_dir.mkdir(exist_ok=True)
        
    def print_header(self, title):
        """Imprime header visual."""
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.WHITE}🎯 {title}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}")
        
    def print_section(self, title):
        """Imprime sección."""
        print(f"\n{Colors.BOLD}{Colors.YELLOW}📋 {title}{Colors.ENDC}")
        print(f"{Colors.YELLOW}{'-'*40}{Colors.ENDC}")
        
    def print_result(self, status, message):
        """Imprime resultado con color."""
        if status == "OK":
            print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")
        elif status == "FAIL":
            print(f"{Colors.RED}❌ {message}{Colors.ENDC}")
        elif status == "WARNING":
            print(f"{Colors.YELLOW}⚠️ {message}{Colors.ENDC}")
        else:
            print(f"{Colors.BLUE}ℹ️ {message}{Colors.ENDC}")
    
    def run_command(self, cmd, description):
        """Ejecuta comando y muestra resultado."""
        print(f"\n{Colors.BLUE}🔄 {description}...{Colors.ENDC}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.print_result("OK", f"{description} completado exitosamente")
                # Extraer y mostrar información de coverage si está disponible
                self.parse_and_show_coverage(result.stdout)
                return True
            else:
                self.print_result("FAIL", f"{description} falló")
                # Mostrar errores específicos y información de coverage
                self.parse_and_show_failures(result.stdout)
                self.parse_and_show_coverage(result.stdout)
                if result.stderr:
                    print(f"{Colors.RED}Error adicional: {result.stderr.strip()}{Colors.ENDC}")
                return False
                
        except Exception as e:
            self.print_result("FAIL", f"{description} - Error de ejecución: {e}")
            return False
    
    def parse_and_show_coverage(self, output):
        """Extrae y muestra información de coverage del output."""
        if "coverage:" not in output.lower():
            return
            
        print(f"\n{Colors.BOLD}{Colors.CYAN}📊 COVERAGE REPORT{Colors.ENDC}")
        print(f"{Colors.CYAN}{'='*50}{Colors.ENDC}")
        
        lines = output.split('\n')
        coverage_section = False
        total_coverage = None
        
        for line in lines:
            # Detectar sección de coverage
            if "Name" in line and "Stmts" in line and "Cover" in line:
                coverage_section = True
                print(f"{Colors.BOLD}Module Coverage Analysis:{Colors.ENDC}")
                continue
            elif "TOTAL" in line and coverage_section:
                # Línea de total
                parts = line.split()
                if len(parts) >= 4 and parts[-1].endswith('%'):
                    total_stmts = parts[-3]
                    total_miss = parts[-2] 
                    total_cover = parts[-1]
                    total_coverage = total_cover
                    print(f"{Colors.BOLD}{Colors.GREEN}TOTAL COVERAGE: {total_cover}{Colors.ENDC}")
                coverage_section = False
                break
            elif coverage_section and line.strip() and not line.startswith('-'):
                # Línea de módulo individual
                parts = line.split()
                if len(parts) >= 4 and parts[-1].endswith('%'):
                    module_name = parts[0]
                    stmts = parts[1]
                    miss = parts[2] 
                    cover_pct = parts[-1]
                    
                    # Mostrar todos los módulos relevantes
                    if not module_name.startswith('tests/'):  # Excluir archivos antiguos de tests/
                        pct_value = float(cover_pct.rstrip('%'))
                        color = Colors.GREEN if pct_value >= 80 else Colors.YELLOW
                        if pct_value < 50:
                            color = Colors.RED
                        
                        # Mostrar información detallada por módulo
                        print(f"  {color}📋 {module_name}:{Colors.ENDC}")
                        print(f"    {color}└─ Coverage: {cover_pct} ({stmts} líneas, {miss} sin cubrir){Colors.ENDC}")
        
        if total_coverage:
            pct = float(total_coverage.rstrip('%'))
            if pct >= 80:
                status_color = Colors.GREEN
                status_icon = "🟢"
            elif pct >= 60:
                status_color = Colors.YELLOW  
                status_icon = "🟡"
            else:
                status_color = Colors.RED
                status_icon = "🔴"
            
            print(f"\n{status_color}{status_icon} Coverage Status: {total_coverage} - ", end="")
            if pct >= 80:
                print(f"Excelente{Colors.ENDC}")
            elif pct >= 60:
                print(f"Aceptable{Colors.ENDC}")
            else:
                print(f"Necesita mejoras{Colors.ENDC}")
    
    def parse_and_show_failures(self, output):
        """Extrae y muestra información detallada de fallos."""
        if "FAILURES" not in output:
            return
            
        print(f"\n{Colors.BOLD}{Colors.RED}🚨 ANÁLISIS DE FALLOS{Colors.ENDC}")
        print(f"{Colors.RED}{'='*50}{Colors.ENDC}")
        
        lines = output.split('\n')
        in_failure_section = False
        current_test = None
        failure_details = []
        
        for line in lines:
            if line.startswith("FAILED"):
                # Extraer nombre del test que falló
                test_parts = line.split("::")
                if len(test_parts) >= 2:
                    test_class = test_parts[1].split("::")[0] if "::" in test_parts[1] else test_parts[1]
                    test_name = test_parts[-1].split(" - ")[0]
                    print(f"{Colors.RED}❌ {test_class}::{test_name}{Colors.ENDC}")
            elif "AssertionError:" in line:
                # Extraer detalles del error
                error_msg = line.split("AssertionError:")[-1].strip()
                if error_msg:
                    print(f"   {Colors.YELLOW}└─ Razón: {error_msg}{Colors.ENDC}")
            elif "Captured stdout call" in line:
                # Buscar output capturado con detalles
                in_failure_section = True
            elif in_failure_section and ("✅ OK" in line or "❌ FAIL" in line):
                # Mostrar pasos específicos que fallaron
                if "❌ FAIL" in line:
                    step = line.split("❌ FAIL")[0].strip()
                    print(f"   {Colors.RED}📍 Falló en: {step}{Colors.ENDC}")
                in_failure_section = False
        
        # Mostrar resumen de short test summary
        print(f"\n{Colors.BOLD}{Colors.YELLOW}📋 RESUMEN DE FALLOS:{Colors.ENDC}")
        for line in lines:
            if line.startswith("FAILED") and "AssertionError" in line:
                parts = line.split(" - ")
                if len(parts) >= 2:
                    test_path = parts[0].replace("FAILED ", "")
                    error_type = parts[1]
                    print(f"  {Colors.RED}• {test_path}{Colors.ENDC}")
                    print(f"    {Colors.YELLOW}Tipo: {error_type}{Colors.ENDC}")
    
    def run_smoke_tests(self):
        """Ejecuta tests de smoke críticos."""
        self.print_section("SMOKE TESTS - Verificación Rápida")
        
        cmd = [
            sys.executable, "-m", "pytest", 
            "cinetrack_tests.py::TestCineTrackSmoke",
            "-v", "-x"  # Stop on first failure
        ]
        
        return self.run_command(cmd, "Tests de smoke críticos")
    
    def run_unit_tests(self):
        """Ejecuta tests unitarios."""
        self.print_section("UNIT TESTS - Componentes Individuales")
        
        cmd = [
            sys.executable, "-m", "pytest", 
            "cinetrack_tests.py::TestCineTrackUnits",
            "-v"
        ]
        
        return self.run_command(cmd, "Tests unitarios")
    
    def run_integration_tests(self):
        """Ejecuta tests de integración."""
        self.print_section("INTEGRATION TESTS - Frontend ↔ Backend")
        
        cmd = [
            sys.executable, "-m", "pytest", 
            "cinetrack_tests.py::TestCineTrackIntegration",
            "-v"
        ]
        
        return self.run_command(cmd, "Tests de integración")
    
    def run_e2e_tests(self):
        """Ejecuta tests E2E."""
        self.print_section("E2E TESTS - Flujos Completos de Usuario")
        
        cmd = [
            sys.executable, "-m", "pytest", 
            "cinetrack_tests.py::TestCineTrackE2E",
            "-v"
        ]
        
        return self.run_command(cmd, "Tests End-to-End")
    
    def run_performance_tests(self):
        """Ejecuta tests de performance."""
        self.print_section("PERFORMANCE TESTS - Métricas de Rendimiento")
        
        cmd = [
            sys.executable, "-m", "pytest", 
            "cinetrack_tests.py::TestCineTrackPerformance",
            "-v"
        ]
        
        return self.run_command(cmd, "Tests de performance")
    
    def run_with_coverage(self):
        """Ejecuta todos los tests con coverage."""
        self.print_section("COVERAGE ANALYSIS - Análisis de Cobertura")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        cmd = [
            sys.executable, "-m", "pytest", 
            "cinetrack_tests.py",
            "--cov=cinetrack_tests",  # Solo medir coverage del archivo principal
            "--cov=run_cinetrack_tests", # Y del runner
            f"--cov-report=html:reports/coverage_{timestamp}",
            "--cov-report=term-missing",
            "--cov-report=annotate",  # Genera archivos anotados por módulo
            "--cov-report=xml",       # Genera reporte XML para análisis
            f"--html=reports/full_report_{timestamp}.html",
            "--self-contained-html",
            "-v",
            "--tb=short"  # Mostrar traceback más limpio
        ]
        
        success = self.run_command(cmd, "Tests con análisis de coverage")
        
        if success:
            print(f"\n{Colors.GREEN}📊 Reportes generados:{Colors.ENDC}")
            print(f"  • Coverage HTML: reports/coverage_{timestamp}/index.html")
            print(f"  • Full Report: reports/full_report_{timestamp}.html")
        else:
            print(f"\n{Colors.YELLOW}📊 Reportes generados (con fallos):{Colors.ENDC}")
            print(f"  • Coverage HTML: reports/coverage_{timestamp}/index.html") 
            print(f"  • Full Report: reports/full_report_{timestamp}.html")
            
        return success
    
    def run_all_tests(self):
        """Ejecuta suite completa de tests."""
        self.print_header("CINETRACK - SUITE COMPLETA DE TESTS")
        
        results = []
        
        # Tests en orden de importancia
        test_suites = [
            ("Smoke Tests", self.run_smoke_tests),
            ("Unit Tests", self.run_unit_tests), 
            ("Integration Tests", self.run_integration_tests),
            ("E2E Tests", self.run_e2e_tests),
            ("Performance Tests", self.run_performance_tests)
        ]
        
        for suite_name, test_func in test_suites:
            print(f"\n{Colors.PURPLE}{'▶'*3} Ejecutando {suite_name}...{Colors.ENDC}")
            results.append((suite_name, test_func()))
        
        # Resumen final
        self.print_section("RESUMEN DE RESULTADOS")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for suite_name, result in results:
            status = "OK" if result else "FAIL"
            self.print_result(status, f"{suite_name}")
        
        print(f"\n{Colors.BOLD}{'='*50}{Colors.ENDC}")
        
        if passed == total:
            self.print_result("OK", f"TODOS LOS TESTS PASARON ({passed}/{total})")
            print(f"{Colors.GREEN}{Colors.BOLD}🎉 CineTrack está funcionando perfectamente!{Colors.ENDC}")
        else:
            self.print_result("WARNING", f"ALGUNOS TESTS FALLARON ({passed}/{total})")
            print(f"{Colors.YELLOW}⚠️ Revisar tests fallidos arriba{Colors.ENDC}")
        
        return passed == total
    
    def run_quick_check(self):
        """Verificación rápida del sistema."""
        self.print_header("CINETRACK - VERIFICACIÓN RÁPIDA")
        
        # Solo smoke tests para verificación rápida
        success = self.run_smoke_tests()
        
        if success:
            print(f"{Colors.GREEN}{Colors.BOLD}🚀 Sistema operacional - Listo para usar!{Colors.ENDC}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}🚨 Problema crítico detectado{Colors.ENDC}")
        
        return success


def main():
    """Función principal con argumentos de línea de comandos."""
    parser = argparse.ArgumentParser(
        description="🎯 CineTrack Test Runner - Sistema de testing completo"
    )
    
    parser.add_argument(
        "--quick", "-q",
        action="store_true",
        help="🔥 Verificación rápida (solo smoke tests)"
    )
    
    parser.add_argument(
        "--coverage", "-c", 
        action="store_true",
        help="📊 Ejecutar todos los tests con análisis de coverage"
    )
    
    parser.add_argument(
        "--smoke", "-s",
        action="store_true", 
        help="🔥 Solo tests de smoke"
    )
    
    parser.add_argument(
        "--unit", "-u",
        action="store_true",
        help="🧪 Solo tests unitarios"
    )
    
    parser.add_argument(
        "--integration", "-i", 
        action="store_true",
        help="🔗 Solo tests de integración"
    )
    
    parser.add_argument(
        "--e2e", "-e",
        action="store_true",
        help="🎭 Solo tests E2E"
    )
    
    parser.add_argument(
        "--performance", "-p",
        action="store_true", 
        help="⚡ Solo tests de performance"
    )
    
    args = parser.parse_args()
    
    runner = CineTrackTestRunner()
    
    # Ejecutar según argumentos
    if args.quick:
        success = runner.run_quick_check()
    elif args.coverage:
        success = runner.run_with_coverage()
    elif args.smoke:
        success = runner.run_smoke_tests()
    elif args.unit:
        success = runner.run_unit_tests()
    elif args.integration:
        success = runner.run_integration_tests()
    elif args.e2e:
        success = runner.run_e2e_tests()
    elif args.performance:
        success = runner.run_performance_tests()
    else:
        # Default: ejecutar suite completa
        success = runner.run_all_tests()
    
    # Exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()