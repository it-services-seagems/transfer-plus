"""
Script de Diagnóstico Completo para VW_R2D
Verifica se há registros no banco de dados para a data range especificada
"""

import pyodbc
import json
from datetime import datetime, timedelta

# Configuração de conexão
SERVER = "CLOSQL01"
PORT = "1433"
DATABASE = "TransferPlus"
DRIVER = "ODBC Driver 17 for SQL Server"

def conectar():
    """Estabelece conexão com o SQL Server"""
    try:
        connection_string = f"Driver={DRIVER};SERVER={SERVER},{PORT};DATABASE={DATABASE};Trusted_Connection=yes;"
        conn = pyodbc.connect(connection_string)
        print("[OK] Conexão estabelecida com sucesso!")
        return conn
    except Exception as e:
        print(f"[ERRO] Falha na conexão: {e}")
        return None

def testar_view_existe(conn):
    """Testa se a view VW_R2D existe"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT OBJECT_ID('dbo.VW_R2D') AS object_id
        """)
        resultado = cursor.fetchone()
        if resultado[0]:
            print("[OK] View VW_R2D EXISTE no banco de dados")
            return True
        else:
            print("[ERRO] View VW_R2D NAO existe no banco de dados")
            return False
    except Exception as e:
        print(f"[ERRO] Erro ao verificar existência da view: {e}")
        return False

def testar_view_queryavel(conn):
    """Testa se a view VW_R2D pode ser consultada (sem erros de binding)"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT TOP 1 * FROM VW_R2D")
        resultado = cursor.fetchone()
        print("[OK] View VW_R2D é consultável (sem erros de binding)")
        if resultado:
            print(f"    Primeiro registro tem {len(resultado)} colunas")
            cursor.description
            print(f"    Colunas: {[desc[0] for desc in cursor.description]}")
        return True
    except Exception as e:
        print(f"[ERRO] View VW_R2D NÃO é consultável: {e}")
        return False

def contar_registros_view(conn, data_inicio=None, data_fim=None):
    """Conta quantos registros existem na view para o período"""
    try:
        cursor = conn.cursor()
        
        if data_inicio and data_fim:
            query = f"""
            SELECT COUNT(*) as total
            FROM VW_R2D
            WHERE DATA_CRIACAO_PO BETWEEN '{data_inicio}' AND '{data_fim}'
            """
        else:
            query = "SELECT COUNT(*) as total FROM VW_R2D"
        
        cursor.execute(query)
        resultado = cursor.fetchone()
        total = resultado[0] if resultado else 0
        
        if data_inicio and data_fim:
            print(f"[INFO] Total de registros em VW_R2D de {data_inicio} a {data_fim}: {total}")
        else:
            print(f"[INFO] Total de registros em VW_R2D (todos): {total}")
        
        return total
    except Exception as e:
        print(f"[ERRO] Erro ao contar registros: {e}")
        return 0

def listar_tabelas_pr_po(conn):
    """Lista todas as tabelas que contêm PR ou PO"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
          AND (TABLE_NAME LIKE '%PR%' OR TABLE_NAME LIKE '%PO%' OR TABLE_NAME LIKE '%requisicao%')
        ORDER BY TABLE_NAME
        """)
        tabelas = [row[0] for row in cursor.fetchall()]
        
        if tabelas:
            print(f"\n[INFO] Tabelas encontradas com PR/PO: {len(tabelas)}")
            for tabela in tabelas:
                print(f"      - {tabela}")
        else:
            print("[AVISO] Nenhuma tabela PR/PO encontrada")
        
        return tabelas
    except Exception as e:
        print(f"[ERRO] Erro ao listar tabelas: {e}")
        return []

def testar_tabelas_base(conn, data_inicio="2025-01-01", data_fim="2026-01-01"):
    """Testa registros nas tabelas bases que devem alimentar a view"""
    try:
        cursor = conn.cursor()
        
        # Tentar encontrar tabelas com nomes comuns
        tabelas_candidatas = [
            "PR", "PO", "Requisicao", "PurchaseOrder",
            "PR_Master", "PO_Detail", 
            "requisicao_compra", "ordem_compra"
        ]
        
        print("\n[TESTE] Consultando tabelas candidatas:")
        
        for tabela in tabelas_candidatas:
            try:
                # Tenta contar registros
                cursor.execute(f"SELECT COUNT(*) FROM [{tabela}]")
                total = cursor.fetchone()[0]
                
                # Tenta com filtro de data
                try:
                    cursor.execute(f"""
                    SELECT COUNT(*) FROM [{tabela}] 
                    WHERE DATA_CRIACAO >= '{data_inicio}' AND DATA_CRIACAO <= '{data_fim}'
                    """)
                    total_periodo = cursor.fetchone()[0]
                    print(f"[OK] {tabela}: {total} registros (período: {total_periodo})")
                except:
                    print(f"[OK] {tabela}: {total} registros (sem filtro de data)")
                    
            except:
                pass  # Tabela não existe, continua
        
    except Exception as e:
        print(f"[ERRO] Erro ao testar tabelas: {e}")

def exibir_amostra_dados(conn, data_inicio="2025-01-01", data_fim="2026-01-01"):
    """Exibe uma amostra dos dados que deveriam ser retornados"""
    try:
        cursor = conn.cursor()
        
        # Tenta várias queries para encontrar os dados
        queries = [
            f"""SELECT TOP 5 * FROM VW_R2D WHERE DATA_CRIACAO_PO BETWEEN '{data_inicio}' AND '{data_fim}'""",
            f"""SELECT TOP 5 * FROM VW_R2D ORDER BY DATA_CRIACAO_PO DESC""",
            f"""SELECT TOP 5 * FROM VW_R2D""",
        ]
        
        for i, query in enumerate(queries):
            try:
                print(f"\n[TESTE {i+1}] Executando query de amostra...")
                cursor.execute(query)
                
                rows = cursor.fetchall()
                if rows:
                    colunas = [desc[0] for desc in cursor.description]
                    print(f"[OK] {len(rows)} registros encontrados!")
                    print(f"Colunas: {colunas}")
                    
                    # Exibe primeiros 2 registros
                    for idx, row in enumerate(rows[:2]):
                        print(f"\nRegistro {idx+1}:")
                        for col_name, valor in zip(colunas, row):
                            print(f"  {col_name}: {valor}")
                    return True
                else:
                    print(f"[NENHUM] Nenhum registro encontrado nesta query")
            except Exception as e:
                print(f"[ERRO] Query {i+1} falhou: {str(e)[:100]}")
                continue
        
        return False
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar amostra: {e}")
        return False

def main():
    """Executa todos os testes"""
    print("=" * 80)
    print("DIAGNÓSTICO COMPLETO - VW_R2D")
    print("=" * 80)
    
    conn = conectar()
    if not conn:
        return
    
    try:
        # Teste 1: View existe?
        print("\n[TESTE 1] Verificando se VW_R2D existe...")
        if not testar_view_existe(conn):
            print("[ABORTE] View não existe. Abortando.")
            return
        
        # Teste 2: View é consultável?
        print("\n[TESTE 2] Verificando se VW_R2D é consultável (sem binding errors)...")
        if not testar_view_queryavel(conn):
            print("[ABORTE] View tem binding errors. Abortando.")
            return
        
        # Teste 3: Contar registros totais
        print("\n[TESTE 3] Contando registros totais na view...")
        total_geral = contar_registros_view(conn)
        
        # Teste 4: Contar registros no período 2025-01-01 a 2026-01-01
        print("\n[TESTE 4] Contando registros no período 2025-01-01 a 2026-01-01...")
        data_inicio = "2025-01-01"
        data_fim = "2026-01-01"
        total_periodo = contar_registros_view(conn, data_inicio, data_fim)
        
        if total_periodo == 0:
            print("\n[ALERTA] ZERO registros no período especificado!")
            print("Investigando tabelas bases...")
            
            # Teste 5: Listar tabelas disponíveis
            print("\n[TESTE 5] Listando tabelas PR/PO...")
            listar_tabelas_pr_po(conn)
            
            # Teste 6: Testar tabelas candidatas
            print("\n[TESTE 6] Testando tabelas candidatas...")
            testar_tabelas_base(conn, data_inicio, data_fim)
        
        else:
            print(f"\n[SUCESSO] Encontrados {total_periodo} registros no período!")
            
        # Teste 7: Exibir amostra
        print("\n[TESTE 7] Buscando amostra de dados...")
        exibir_amostra_dados(conn, data_inicio, data_fim)
        
        print("\n" + "=" * 80)
        print("FIM DO DIAGNÓSTICO")
        print("=" * 80)
        
    finally:
        conn.close()
        print("\nConexão fechada.")

if __name__ == "__main__":
    main()
