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
    
    # Buscar informações sobre o campo Id
    cursor.execute("""
        SELECT 
            COLUMN_NAME, 
            DATA_TYPE, 
            CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Desembarque' AND COLUMN_NAME = 'Id'
    """)
    
    print("\nCampo Id na tabela DESEMBARQUE:")
    print("=" * 70)
    for row in cursor.fetchall():
        print(f"Campo: {row[0]}")
        print(f"Tipo: {row[1]}")
        print(f"Tamanho Máximo: {row[2]}")
        print(f"Nullable: {row[3]}")
    
    # Verificar o tamanho do valor que está causando erro
    valor_problema = "#DIAMANTE-458962-DIAMANTE-HSE-ESM-LEL-196.05-0480/"
    print(f"\nValor que está causando erro: {valor_problema}")
    print(f"Tamanho do valor: {len(valor_problema)} caracteres")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erro: {e}")
