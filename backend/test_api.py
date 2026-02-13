#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🧪 SCRIPT DE TESTE DA API TRANSFERPLUS
======================================
Script Python para testar requisições à API Flask
Testa múltiplos endpoints e valida respostas
======================================
"""

import requests
import json
from datetime import datetime
from colorama import init, Fore, Style

# Inicializar colorama para Windows
init(autoreset=True)

def print_header(text):
    """Imprime cabeçalho colorido"""
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}{text}")
    print(f"{Fore.CYAN}{'='*60}\n")

def print_success(text):
    """Imprime mensagem de sucesso"""
    print(f"{Fore.GREEN}✅ {text}")

def print_error(text):
    """Imprime mensagem de erro"""
    print(f"{Fore.RED}❌ {text}")

def print_info(text):
    """Imprime mensagem informativa"""
    print(f"{Fore.YELLOW}ℹ️  {text}")

def test_endpoint(url, method='GET', headers=None, json_data=None):
    """Testa um endpoint da API"""
    try:
        print_info(f"Testando: {method} {url}")
        
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=5)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=json_data, timeout=5)
        else:
            print_error(f"Método {method} não suportado")
            return False
        
        # Verificar status code
        if response.status_code == 200:
            print_success(f"Status Code: {response.status_code}")
            
            # Tentar parsear JSON
            try:
                json_response = response.json()
                print(f"{Fore.CYAN}📊 Resposta JSON:")
                print(f"{Fore.WHITE}{json.dumps(json_response, indent=2, ensure_ascii=False)}\n")
                return True
            except json.JSONDecodeError:
                print(f"{Fore.WHITE}Resposta (texto): {response.text[:200]}\n")
                return True
        else:
            print_error(f"Status Code: {response.status_code}")
            print(f"{Fore.WHITE}Resposta: {response.text[:200]}\n")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("Não foi possível conectar à API")
        print(f"{Fore.WHITE}Certifique-se de que a API está rodando em {url}\n")
        return False
    except requests.exceptions.Timeout:
        print_error("Timeout ao conectar à API")
        return False
    except Exception as e:
        print_error(f"Erro inesperado: {str(e)}")
        return False

def main():
    """Função principal de testes"""
    print_header("🧪 TESTE DA API TRANSFERPLUS")
    
    # URLs base para testar
    base_urls = [
        "http://127.0.0.1:9280",
        "http://10.15.3.30:9280",
        "http://127.0.0.1:9282",
        "http://10.15.3.30:9282"
    ]
    
    # Endpoints para testar
    endpoints = {
        "Health Check": "/health",
        "Test CORS": "/test-cors",
        "Test SQL": "/test-sql",
    }
    
    results = {}
    
    for base_url in base_urls:
        print_header(f"🔗 Testando servidor: {base_url}")
        results[base_url] = {}
        
        for name, endpoint in endpoints.items():
            full_url = f"{base_url}{endpoint}"
            print(f"\n{Fore.YELLOW}{'─'*60}")
            print(f"{Fore.YELLOW}📍 {name}")
            print(f"{Fore.YELLOW}{'─'*60}")
            
            success = test_endpoint(full_url)
            results[base_url][name] = success
    
    # Resumo final
    print_header("📊 RESUMO DOS TESTES")
    
    all_passed = True
    for base_url, endpoints_results in results.items():
        print(f"\n{Fore.CYAN}🌐 {base_url}")
        for endpoint_name, passed in endpoints_results.items():
            if passed:
                print_success(f"{endpoint_name}: PASSOU")
            else:
                print_error(f"{endpoint_name}: FALHOU")
                all_passed = False
    
    print(f"\n{Fore.CYAN}{'='*60}")
    if all_passed:
        print_success("TODOS OS TESTES PASSARAM! 🎉")
    else:
        print_error("ALGUNS TESTES FALHARAM")
        print(f"\n{Fore.YELLOW}🔧 Verificações sugeridas:")
        print(f"{Fore.WHITE}   1. Verifique se o servidor está rodando: python api.py")
        print(f"{Fore.WHITE}   2. Confirme se a porta 9281 está disponível")
        print(f"{Fore.WHITE}   3. Verifique firewall e configurações de rede")
    print(f"{Fore.CYAN}{'='*60}\n")

if __name__ == "__main__":
    main()
