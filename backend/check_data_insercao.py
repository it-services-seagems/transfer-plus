import pyodbc

# Conectar ao banco de dados
conn_str = (
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=CLOSQL01;'
    'DATABASE=TransferPlus;'
    'Trusted_Connection=yes;'
)

conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Verificar se data_insercao existe e tem valores
query = """
SELECT TOP 10 
    Id, 
    data_insercao,
    FromVessel_NavioOrigem
FROM [dbo].[conferencia]
ORDER BY Id DESC
"""

cursor.execute(query)
rows = cursor.fetchall()

print("\n=== PRIMEIROS 10 REGISTROS (por Id DESC) ===")
for row in rows:
    print(f"Id: {row[0]}, data_insercao: {row[1]}, Navio: {row[2]}")

# Verificar ordenação por data_insercao
query2 = """
SELECT TOP 10 
    Id, 
    data_insercao,
    FromVessel_NavioOrigem
FROM [dbo].[conferencia]
WHERE data_insercao IS NOT NULL
ORDER BY data_insercao DESC
"""

cursor.execute(query2)
rows2 = cursor.fetchall()

print("\n=== PRIMEIROS 10 REGISTROS (por data_insercao DESC) ===")
for row in rows2:
    print(f"Id: {row[0]}, data_insercao: {row[1]}, Navio: {row[2]}")

# Contar quantos registros têm data_insercao NULL
query3 = """
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN data_insercao IS NULL THEN 1 ELSE 0 END) as nulls
FROM [dbo].[conferencia]
"""

cursor.execute(query3)
row3 = cursor.fetchone()
print(f"\n=== ESTATÍSTICAS ===")
print(f"Total de registros: {row3[0]}")
print(f"Registros com data_insercao NULL: {row3[1]}")

conn.close()
