import pyodbc

# Conexão com o banco
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
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'embarque'
        ORDER BY ORDINAL_POSITION
    """)
    
    print("Colunas da tabela embarque:")
    print("-" * 50)
    for row in cursor.fetchall():
        print(f"{row[0]:<40} {row[1]}")
    
    print("\n" + "=" * 50)
    print("\nColunas de data na tabela embarque:")
    print("-" * 50)
    
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'embarque' 
        AND DATA_TYPE IN ('datetime', 'date', 'datetime2', 'smalldatetime')
        ORDER BY ORDINAL_POSITION
    """)
    
    for row in cursor.fetchall():
        print(f"{row[0]:<40} {row[1]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erro: {e}")
