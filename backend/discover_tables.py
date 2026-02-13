"""
Descobrir as tabelas reais da base de dados TransferPlus
e criar uma query alternativa que não use a view quebrada
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

def listar_todas_tabelas(conn):
    """Lista TODAS as tabelas do banco"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
        """)
        tabelas = [row[0] for row in cursor.fetchall()]
        return tabelas
    except Exception as e:
        print(f"Erro: {e}")
        return []

def listar_colunas(conn, tabela):
    """Lista colunas de uma tabela"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '{tabela}'
        ORDER BY ORDINAL_POSITION
        """)
        return [(row[0], row[1]) for row in cursor.fetchall()]
    except Exception as e:
        return []

def contar_registros(conn, tabela):
    """Conta registros em uma tabela"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM [{tabela}]")
        return cursor.fetchone()[0]
    except:
        return -1

def main():
    conn = conectar()
    if not conn:
        return
    
    try:
        # Listar todas as tabelas
        tabelas = listar_todas_tabelas(conn)
        
        print("\n" + "="*80)
        print(f"TODAS AS TABELAS DO BANCO ({len(tabelas)})")
        print("="*80 + "\n")
        
        for tabela in tabelas:
            total = contar_registros(conn, tabela)
            status = "OK" if total >= 0 else "ERRO"
            print(f"{status:5} | {tabela:40} | {total:>10} registros")
        
        # Mostrar colunas de tabelas importantes
        print("\n" + "="*80)
        print("COLUNAS DE TABELAS IMPORTANTES")
        print("="*80 + "\n")
        
        tabelas_importante = [
            tab for tab in tabelas 
            if any(keyword in tab.lower() for keyword in ['pr', 'po', 'requisic', 'compra', 'embarque', 'desembarg'])
        ]
        
        for tabela in tabelas_importante:
            colunas = listar_colunas(conn, tabela)
            if colunas:
                print(f"\n[{tabela}] - {len(colunas)} colunas:")
                for col_name, col_type in colunas[:30]:  # Primeiras 30 colunas
                    print(f"  - {col_name:45} ({col_type})")
                if len(colunas) > 30:
                    print(f"  ... e mais {len(colunas) - 30} colunas")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()
