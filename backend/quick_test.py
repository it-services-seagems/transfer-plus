import pyodbc
conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=CLOSQL01,1433;DATABASE=TransferPlus;Trusted_Connection=yes;TrustServerCertificate=yes;')
cursor = conn.cursor()
cursor.execute("SELECT COUNT(Id) FROM conferencia WHERE status_final != 'Embarque Finalizado' AND lom IS NOT NULL AND status_final != 'Quarentena'")
print(cursor.fetchone()[0])
cursor.execute("SELECT TOP 3 Id, status_final FROM conferencia WHERE lom IS NOT NULL")
for r in cursor.fetchall():
    print(r[0], r[1])
conn.close()
