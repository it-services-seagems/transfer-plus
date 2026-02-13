#!/usr/bin/env python3
"""
Script de teste para conexão SQL Server
Testa múltiplas configurações de conexão
"""

import pyodbc
import os
import sys
from datetime import datetime

# Configurações
DB_SERVER_HOSTNAME = 'CLOSQL01'
DB_SERVER_IP = '10.15.3.12'
DB_DATABASE = 'VendorFlowDB'
DRIVER = 'ODBC Driver 17 for SQL Server'

def print_header(title):
    """Imprime cabeçalho formatado"""
    print("\n" + "="*50)
    print(f" {title}")
    print("="*50)

def print_system_info():
    """Mostra informações do sistema"""
    print_header("INFORMAÇÕES DO SISTEMA")
    print(f"Data/Hora: {datetime.now()}")
    print(f"Usuário: {os.getenv('USERNAME', 'N/A')}")
    print(f"Domínio: {os.getenv('USERDOMAIN', 'N/A')}")
    print(f"Computador: {os.getenv('COMPUTERNAME', 'N/A')}")
    print(f"Python: {sys.version}")

def test_odbc_drivers():
    """Lista drivers ODBC disponíveis"""
    print_header("DRIVERS ODBC DISPONÍVEIS")
    try:
        drivers = [driver for driver in pyodbc.drivers() if 'SQL Server' in driver]
        if drivers:
            for driver in drivers:
                print(f"✅ {driver}")
        else:
            print("❌ Nenhum driver SQL Server encontrado")
        return drivers
    except Exception as e:
        print(f"❌ Erro ao listar drivers: {e}")
        return []

def test_connection(server, description, use_sql_auth=False, username=None, password=None):
    """Testa uma configuração específica de conexão"""
    print(f"\n--- {description} ---")
    
    try:
        if use_sql_auth:
            conn_str = (
                f"DRIVER={{{DRIVER}}};"
                f"SERVER={server};"
                f"DATABASE={DB_DATABASE};"
                f"UID={username};"
                f"PWD={password};"
                f"Connection Timeout=10;"
            )
            # Não mostrar senha no log
            log_str = conn_str.replace(f"PWD={password}", "PWD=***")
        else:
            conn_str = (
                f"DRIVER={{{DRIVER}}};"
                f"SERVER={server};"
                f"DATABASE={DB_DATABASE};"
                f"Trusted_Connection=yes;"
                f"Connection Timeout=10;"
            )
            log_str = conn_str
        
        print(f"String: {log_str}")
        
        # Tentar conexão
        conn = pyodbc.connect(conn_str)
        
        # Testar query simples
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION, GETDATE(), USER_NAME()")
        result = cursor.fetchone()
        
        print("✅ CONEXÃO BEM-SUCEDIDA!")
        print(f"   Versão SQL: {result[0][:50]}...")
        print(f"   Data Server: {result[1]}")
        print(f"   Usuário SQL: {result[2]}")
        
        # Testar query na database
        cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES")
        table_count = cursor.fetchone()[0]
        print(f"   Tabelas encontradas: {table_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ FALHA NA CONEXÃO: {e}")
        return False

def test_network_connectivity():
    """Testa conectividade de rede"""
    print_header("TESTE DE CONECTIVIDADE DE REDE")
    
    import socket
    
    # Teste ping/DNS
    servers = [
        (DB_SERVER_HOSTNAME, "Hostname SQL Server"),
        (DB_SERVER_IP, "IP SQL Server"),
        ("CLODC02", "Domain Controller"),
        ("10.15.3.40", "IP Domain Controller")
    ]
    
    for server, desc in servers:
        try:
            print(f"\n--- {desc}: {server} ---")
            # Teste DNS
            ip = socket.gethostbyname(server)
            print(f"✅ DNS OK: {server} -> {ip}")
            
            # Teste conectividade TCP (SQL Server)
            if server in [DB_SERVER_HOSTNAME, DB_SERVER_IP]:
                sock = socket.create_connection((ip, 1433), timeout=5)
                sock.close()
                print(f"✅ Porta 1433 acessível")
                
        except socket.gaierror:
            print(f"❌ Erro DNS: {server} não resolvido")
        except socket.timeout:
            print(f"❌ Timeout: {server}:1433")
        except Exception as e:
            print(f"❌ Erro: {e}")

def main():
    """Função principal"""
    print_header("TESTE DE CONEXÃO SQL SERVER")
    
    # Informações do sistema
    print_system_info()
    
    # Teste drivers
    drivers = test_odbc_drivers()
    if not drivers:
        print("\n❌ ERRO CRÍTICO: Nenhum driver SQL Server encontrado!")
        return
    
    # Teste conectividade
    test_network_connectivity()
    
    # Testes de conexão
    print_header("TESTES DE CONEXÃO")
    
    tests = [
        (DB_SERVER_HOSTNAME, "Windows Auth com Hostname"),
        (DB_SERVER_IP, "Windows Auth com IP"),
        (f"{DB_SERVER_HOSTNAME},1433", "Windows Auth com Hostname:Porta"),
        (f"{DB_SERVER_IP},1433", "Windows Auth com IP:Porta"),
    ]
    
    success_count = 0
    for server, description in tests:
        if test_connection(server, description):
            success_count += 1
    
    # Teste SQL Auth (se fornecido)
    print("\n" + "-"*30)
    sql_user = input("Testar SQL Auth? Digite usuário (ou Enter para pular): ").strip()
    if sql_user:
        sql_pass = input("Digite a senha: ").strip()
        if test_connection(DB_SERVER_IP, "SQL Authentication", True, sql_user, sql_pass):
            success_count += 1
    
    # Resumo
    print_header("RESUMO")
    total_tests = len(tests) + (1 if sql_user else 0)
    print(f"Testes realizados: {total_tests}")
    print(f"Sucessos: {success_count}")
    print(f"Falhas: {total_tests - success_count}")
    
    if success_count > 0:
        print("\n✅ Pelo menos uma configuração funcionou!")
    else:
        print("\n❌ Nenhuma configuração funcionou!")
        print("\nSugestões:")
        print("1. Verificar se SQL Server está rodando")
        print("2. Verificar permissões do usuário")
        print("3. Verificar se servidor está no domínio")
        print("4. Verificar configuração de firewall")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTeste interrompido pelo usuário.")
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
    finally:
        input("\nPressione Enter para sair...")