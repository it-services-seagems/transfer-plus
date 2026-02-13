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
    
    # Buscar triggers na tabela embarque
    cursor.execute("""
        SELECT 
            t.name AS trigger_name,
            OBJECT_NAME(t.parent_id) AS table_name,
            t.is_disabled
        FROM sys.triggers t
        WHERE OBJECT_NAME(t.parent_id) IN ('embarque', 'conferencia')
        ORDER BY table_name, trigger_name
    """)
    
    print("Triggers nas tabelas embarque e conferencia:")
    print("=" * 60)
    for row in cursor.fetchall():
        status = "DISABLED" if row[2] else "ENABLED"
        print(f"Tabela: {row[1]:<15} Trigger: {row[0]:<30} Status: {status}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erro: {e}")
