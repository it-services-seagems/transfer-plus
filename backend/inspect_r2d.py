"""
Inspecionar a tabela R2D em detalhes
"""

import pyodbc

SERVER = "CLOSQL01"
PORT = "1433"
DATABASE = "TransferPlus"
DRIVER = "ODBC Driver 17 for SQL Server"

def conectar():
    try:
        connection_string = f"Driver={DRIVER};SERVER={SERVER},{PORT};DATABASE={DATABASE};Trusted_Connection=yes;"
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"Erro: {e}")
        return None

def inspecionar_tabela_r2d(conn):
    """Inspecciona a tabela R2D"""
    try:
        cursor = conn.cursor()
        
        # Listar todas as colunas
        cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'R2D'
        ORDER BY ORDINAL_POSITION
        """)
        
        colunas = [(row[0], row[1], row[2]) for row in cursor.fetchall()]
        
        print("\n" + "="*100)
        print(f"TABELA R2D - {len(colunas)} COLUNAS")
        print("="*100 + "\n")
        
        for col_name, col_type, is_nullable in colunas:
            print(f"{col_name:50} | {col_type:15} | {'NULL' if is_nullable == 'YES' else 'NOT NULL'}")
        
        # Verificar datas disponíveis
        print("\n" + "="*100)
        print("VERIFICAÇÃO DE DATAS")
        print("="*100 + "\n")
        
        # Procurar por colunas de data
        date_columns = [col for col in colunas if 'date' in col[1].lower() or 'DATA' in col[0].upper()]
        
        if date_columns:
            print(f"Colunas de data encontradas: {[col[0] for col in date_columns]}\n")
            
            for col_name, col_type, _ in date_columns:
                try:
                    cursor.execute(f"""
                    SELECT MIN([{col_name}]) as min_date, MAX([{col_name}]) as max_date, COUNT(*) as total
                    FROM [R2D]
                    """)
                    min_d, max_d, total = cursor.fetchone()
                    print(f"[{col_name}]")
                    print(f"  Min: {min_d}")
                    print(f"  Max: {max_d}")
                    print(f"  Total: {total}\n")
                except Exception as e:
                    print(f"[{col_name}] - Erro: {str(e)[:50]}\n")
        
        # Contar registros por data range
        print("="*100)
        print("REGISTROS POR DATA RANGE")
        print("="*100 + "\n")
        
        # Tentar com a primeira coluna de data encontrada
        if date_columns:
            col_name = date_columns[0][0]
            print(f"Usando coluna: {col_name}\n")
            
            ranges = [
                ("2025-01-01", "2026-01-01", "2025 (1 ano)"),
                ("2025-01-01", "2025-12-31", "2025 (apenas 2025)"),
                ("2024-01-01", "2025-12-31", "2024-2025"),
            ]
            
            for data_inicio, data_fim, desc in ranges:
                try:
                    cursor.execute(f"""
                    SELECT COUNT(*) FROM [R2D]
                    WHERE [{col_name}] BETWEEN '{data_inicio}' AND '{data_fim}'
                    """)
                    total = cursor.fetchone()[0]
                    print(f"[{desc}] {data_inicio} a {data_fim}: {total} registros")
                except Exception as e:
                    print(f"[{desc}] Erro: {str(e)[:50]}")
        
        return colunas
        
    except Exception as e:
        print(f"Erro: {e}")
        return []

def main():
    conn = conectar()
    if not conn:
        return
    
    try:
        inspecionar_tabela_r2d(conn)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
