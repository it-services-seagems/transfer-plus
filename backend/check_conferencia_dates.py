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
    
    # Buscar campos de data na tabela conferencia
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'conferencia' 
        AND (DATA_TYPE IN ('datetime', 'datetime2', 'date', 'smalldatetime') 
             OR COLUMN_NAME LIKE '%data%' 
             OR COLUMN_NAME LIKE '%created%'
             OR COLUMN_NAME LIKE '%inserted%'
             OR COLUMN_NAME LIKE '%insercao%')
        ORDER BY ORDINAL_POSITION
    """)
    
    print("\nCampos de data na tabela CONFERENCIA:")
    print("=" * 60)
    for row in cursor.fetchall():
        print(f"{row[0]:<40} {row[1]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erro: {e}")
