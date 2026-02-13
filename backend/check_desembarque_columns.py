import pyodbc

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=CLOSQL01;"
    "DATABASE=TransferPlus;"
    "Trusted_Connection=yes;"
)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Buscar as colunas da tabela Desembarque
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Desembarque'
        ORDER BY ORDINAL_POSITION
    """)
    
    print("\nColunas da tabela DESEMBARQUE:")
    print("=" * 90)
    print(f"{'COLUMN_NAME':<40} {'DATA_TYPE':<20} {'NULLABLE':<10} {'MAX_LENGTH'}")
    print("-" * 90)
    for row in cursor.fetchall():
        max_len = row[3] if row[3] else '-'
        print(f"{row[0]:<40} {row[1]:<20} {row[2]:<10} {max_len}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erro: {e}")
