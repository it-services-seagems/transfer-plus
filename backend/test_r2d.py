#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para testar a query R2D diretamente
"""

import pyodbc
from datetime import datetime

# Configuração da conexão
connection_strings = [
    (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=CLOSQL01,1433;"
        "DATABASE=TransferPlus;"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=30;"
        "Command Timeout=300;"
    )
]

def test_r2d_query():
    """Teste direto da query R2D"""
    try:
        print("[*] Conectando ao SQL Server...")
        for conn_str in connection_strings:
            try:
                conn = pyodbc.connect(conn_str)
                cursor = conn.cursor()
                print("[OK] Conectado com sucesso!")
                break
            except Exception as e:
                print(f"[-] Falha na conexao: {str(e)[:100]}")
                continue
        
        if not conn:
            print("[-] Nao conseguiu conectar")
            return
        
        # Testar query R2D com filtro de data
        data_inicio = "2025-01-01"
        data_fim = "2026-01-01"
        
        query = f"""
        SELECT TOP 5
              [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER]
              ,[NUMERO_PO]
              ,[DATA_CRIACAO_PO]
        FROM [dbo].[VW_R2D]
        WHERE [DATA_CRIACAO_PO] BETWEEN ? AND ?
        ORDER BY [DATA_CRIACAO_PO] DESC
        """
        
        print(f"\n[*] Executando query com datas:")
        print(f"    Inicio: {data_inicio}")
        print(f"    Fim: {data_fim}")
        
        cursor.execute(query, (data_inicio, data_fim))
        rows = cursor.fetchall()
        
        print(f"[OK] Query executada com sucesso!")
        print(f"[*] Total de registros encontrados: {len(rows)}")
        
        if rows:
            print("\n[Primeiros 5 registros]:")
            for i, row in enumerate(rows, 1):
                print(f"  {i}. PR: {row[0]}, PO: {row[1]}, Data: {row[2]}")
        else:
            print("[-] Nenhum registro encontrado no intervalo de datas")
            
            # Testar sem filtro de data
            print("\n[*] Testando query SEM filtro de data...")
            query_no_filter = "SELECT TOP 5 [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER], [NUMERO_PO], [DATA_CRIACAO_PO] FROM [dbo].[VW_R2D] ORDER BY [DATA_CRIACAO_PO] DESC"
            cursor.execute(query_no_filter)
            rows = cursor.fetchall()
            print(f"[OK] Total de registros na view: {len(rows)}")
            if rows:
                print("Primeiros registros:")
                for i, row in enumerate(rows[:3], 1):
                    print(f"  {i}. PR: {row[0]}, PO: {row[1]}, Data: {row[2]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[-] ERRO: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_r2d_query()
