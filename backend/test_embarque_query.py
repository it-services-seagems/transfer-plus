import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=CLOSQL01,1433;'
    'DATABASE=TransferPlus;'
    'Trusted_Connection=yes;'
    'TrustServerCertificate=yes;'
)

cursor = conn.cursor()

# Testar query de embarque
print("=" * 60)
print("TESTE: Query de Embarque")
print("=" * 60)

# 1. Contar total de registros na conferencia
cursor.execute("SELECT COUNT(Id) FROM conferencia")
total = cursor.fetchone()[0]
print(f"Total de registros na conferencia: {total}")

# 2. Contar registros com lom
cursor.execute("SELECT COUNT(Id) FROM conferencia WHERE lom IS NOT NULL")
com_lom = cursor.fetchone()[0]
print(f"Registros com lom: {com_lom}")

# 3. Contar registros com status != 'Embarque Finalizado'
cursor.execute("SELECT COUNT(Id) FROM conferencia WHERE status_final != 'Embarque Finalizado'")
nao_finalizado = cursor.fetchone()[0]
print(f"Registros com status != 'Embarque Finalizado': {nao_finalizado}")

# 4. Contar registros com status != 'Quarentena'
cursor.execute("SELECT COUNT(Id) FROM conferencia WHERE status_final != 'Quarentena'")
nao_quarentena = cursor.fetchone()[0]
print(f"Registros com status != 'Quarentena': {nao_quarentena}")

# 5. Contar registros que atendem TODOS os critérios
query_completa = """
SELECT COUNT(Id) 
FROM conferencia 
WHERE status_final != 'Embarque Finalizado' 
  AND lom IS NOT NULL 
  AND status_final != 'Quarentena'
"""
cursor.execute(query_completa)
atende_criterios = cursor.fetchone()[0]
print(f"Registros que atendem TODOS os critérios: {atende_criterios}")

# 6. Mostrar alguns registros
if atende_criterios > 0:
    print("\nPrimeiros 5 registros que atendem aos critérios:")
    cursor.execute("""
    SELECT TOP 5 
        Id, 
        status_final, 
        lom,
        FromVessel_NavioOrigem,
        ToVessel_NavioDestino
    FROM conferencia 
    WHERE status_final != 'Embarque Finalizado' 
      AND lom IS NOT NULL 
      AND status_final != 'Quarentena'
    """)
    for row in cursor.fetchall():
        print(f"  Id: {row[0]}")
        print(f"    Status: {row[1]}")
        print(f"    LOM: {row[2]}")
        print(f"    Origem: {row[3]} -> Destino: {row[4]}")
        print()
else:
    print("\n⚠️ NENHUM registro atende aos critérios!")
    print("\nVerificando status_final distintos:")
    cursor.execute("SELECT DISTINCT status_final FROM conferencia WHERE lom IS NOT NULL")
    status_list = [row[0] for row in cursor.fetchall()]
    for s in status_list:
        print(f"  - {s}")

cursor.close()
conn.close()
