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
    
    # Buscar as colunas da tabela embarque
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'embarque'
        ORDER BY ORDINAL_POSITION
    """)
    
    print("\nColunas da tabela EMBARQUE:")
    print("=" * 70)
    print(f"{'COLUMN_NAME':<40} {'DATA_TYPE':<20} {'NULLABLE'}")
    print("-" * 70)
    for row in cursor.fetchall():
        print(f"{row[0]:<40} {row[1]:<20} {row[2]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erro: {e}")
