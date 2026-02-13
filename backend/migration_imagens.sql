-- ============================================
-- MIGRAÇÃO PARA TABELA CENTRALIZADA DE IMAGENS
-- ============================================
-- Data: 2026-02-04
-- Objetivo: Centralizar imagens em uma única tabela
-- ============================================

USE [TransferPlus]
GO

-- ============================================
-- ETAPA 1: CRIAR NOVA TABELA DE IMAGENS
-- ============================================
PRINT '🔨 Criando tabela [imagens]...'

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[imagens]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[imagens] (
        [id] NVARCHAR(500) NOT NULL PRIMARY KEY,  -- ID do registro (embarque/conferencia/desembarque)
        [image_bin] VARBINARY(MAX) NULL,          -- Dados binários da imagem
        [image_name] NVARCHAR(500) NULL,          -- Nome do arquivo original
        [content_type] NVARCHAR(100) NULL,        -- Tipo MIME (image/jpeg, image/png, etc)
        [file_size] INT NULL,                     -- Tamanho em bytes
        [uploaded_at] DATETIME DEFAULT GETDATE(), -- Data de upload
        [uploaded_by] NVARCHAR(100) NULL,         -- Usuário que fez upload
        [source_table] NVARCHAR(50) NULL          -- Tabela de origem (embarque/conferencia/desembarque)
    )
    PRINT '✅ Tabela [imagens] criada com sucesso!'
END
ELSE
BEGIN
    PRINT '⚠️ Tabela [imagens] já existe.'
END
GO

-- ============================================
-- ETAPA 2: MIGRAR DADOS DA TABELA EMBARQUE
-- ============================================
PRINT ''
PRINT '📦 Migrando imagens da tabela [embarque]...'

INSERT INTO [dbo].[imagens] ([id], [image_bin], [image_name], [source_table], [uploaded_at])
SELECT 
    [id],
    [image_bin],
    [image] AS [image_name],
    'embarque' AS [source_table],
    COALESCE([data_insercao], GETDATE()) AS [uploaded_at]
FROM [dbo].[embarque]
WHERE [image_bin] IS NOT NULL
  AND [id] NOT IN (SELECT [id] FROM [dbo].[imagens])  -- Evita duplicatas
GO

DECLARE @count_embarque INT
SELECT @count_embarque = COUNT(*) FROM [dbo].[imagens] WHERE [source_table] = 'embarque'
PRINT '✅ ' + CAST(@count_embarque AS VARCHAR(10)) + ' imagens migradas da tabela [embarque]'
GO

-- ============================================
-- ETAPA 3: MIGRAR DADOS DA TABELA CONFERENCIA
-- ============================================
PRINT ''
PRINT '📋 Verificando colunas de imagem na tabela [conferencia]...'

-- Verificar se conferencia tem coluna image_bin
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'image_bin')
BEGIN
    PRINT '   Coluna [image_bin] encontrada em [conferencia]'
    
    INSERT INTO [dbo].[imagens] ([id], [image_bin], [image_name], [source_table], [uploaded_at])
    SELECT 
        [id],
        [image_bin],
        COALESCE([imagem], [arquivo], [image]) AS [image_name],
        'conferencia' AS [source_table],
        GETDATE() AS [uploaded_at]
    FROM [dbo].[conferencia]
    WHERE [image_bin] IS NOT NULL
      AND [id] NOT IN (SELECT [id] FROM [dbo].[imagens])  -- Evita duplicatas
    
    DECLARE @count_conferencia INT
    SELECT @count_conferencia = COUNT(*) FROM [dbo].[imagens] WHERE [source_table] = 'conferencia'
    PRINT '✅ ' + CAST(@count_conferencia AS VARCHAR(10)) + ' imagens migradas da tabela [conferencia]'
END
ELSE
BEGIN
    PRINT '⚠️ Coluna [image_bin] não existe na tabela [conferencia]'
END
GO

-- ============================================
-- ETAPA 4: BACKUP DAS COLUNAS ANTIGAS (OPCIONAL)
-- ============================================
PRINT ''
PRINT '💾 Criando tabela de backup...'

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[imagens_backup]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[imagens_backup] (
        [backup_id] INT IDENTITY(1,1) PRIMARY KEY,
        [source_table] NVARCHAR(50),
        [record_id] NVARCHAR(500),
        [image_bin] VARBINARY(MAX),
        [image_name] NVARCHAR(500),
        [backup_date] DATETIME DEFAULT GETDATE()
    )
    
    -- Backup de embarque
    INSERT INTO [dbo].[imagens_backup] ([source_table], [record_id], [image_bin], [image_name])
    SELECT 'embarque', [id], [image_bin], [image]
    FROM [dbo].[embarque]
    WHERE [image_bin] IS NOT NULL
    
    -- Backup de conferencia (se existir image_bin)
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'image_bin')
    BEGIN
        INSERT INTO [dbo].[imagens_backup] ([source_table], [record_id], [image_bin], [image_name])
        SELECT 'conferencia', [id], [image_bin], COALESCE([imagem], [arquivo], [image])
        FROM [dbo].[conferencia]
        WHERE [image_bin] IS NOT NULL
    END
    
    DECLARE @backup_count INT
    SELECT @backup_count = COUNT(*) FROM [dbo].[imagens_backup]
    PRINT '✅ Backup criado com ' + CAST(@backup_count AS VARCHAR(10)) + ' registros'
END
ELSE
BEGIN
    PRINT '⚠️ Tabela de backup já existe.'
END
GO

-- ============================================
-- ETAPA 5: REMOVER COLUNAS ANTIGAS
-- ============================================
PRINT ''
PRINT '🗑️ Removendo colunas antigas...'
PRINT '⚠️ ATENÇÃO: Esta etapa é IRREVERSÍVEL!'
PRINT '⚠️ Certifique-se de que o backup foi criado e o sistema está funcionando!'
PRINT ''
PRINT '-- Para executar a remoção, descomente as linhas abaixo:'
PRINT ''

/*
-- DESCOMENTE PARA EXECUTAR A REMOÇÃO

-- Remover coluna image_bin da tabela embarque
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'embarque' AND COLUMN_NAME = 'image_bin')
BEGIN
    ALTER TABLE [dbo].[embarque] DROP COLUMN [image_bin]
    PRINT '✅ Coluna [image_bin] removida da tabela [embarque]'
END

-- Remover coluna image da tabela embarque
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'embarque' AND COLUMN_NAME = 'image')
BEGIN
    ALTER TABLE [dbo].[embarque] DROP COLUMN [image]
    PRINT '✅ Coluna [image] removida da tabela [embarque]'
END

-- Remover coluna data_insercao da tabela embarque (se não for usada para outros fins)
-- IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
--            WHERE TABLE_NAME = 'embarque' AND COLUMN_NAME = 'data_insercao')
-- BEGIN
--     ALTER TABLE [dbo].[embarque] DROP COLUMN [data_insercao]
--     PRINT '✅ Coluna [data_insercao] removida da tabela [embarque]'
-- END

-- Remover colunas de imagem da tabela conferencia
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'image_bin')
BEGIN
    ALTER TABLE [dbo].[conferencia] DROP COLUMN [image_bin]
    PRINT '✅ Coluna [image_bin] removida da tabela [conferencia]'
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'imagem')
BEGIN
    ALTER TABLE [dbo].[conferencia] DROP COLUMN [imagem]
    PRINT '✅ Coluna [imagem] removida da tabela [conferencia]'
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'arquivo')
BEGIN
    ALTER TABLE [dbo].[conferencia] DROP COLUMN [arquivo]
    PRINT '✅ Coluna [arquivo] removida da tabela [conferencia]'
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'image')
BEGIN
    ALTER TABLE [dbo].[conferencia] DROP COLUMN [image]
    PRINT '✅ Coluna [image] removida da tabela [conferencia]'
END

-- Remover coluna file da tabela conferencia (se existir)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'conferencia' AND COLUMN_NAME = 'file')
BEGIN
    ALTER TABLE [dbo].[conferencia] DROP COLUMN [file]
    PRINT '✅ Coluna [file] removida da tabela [conferencia]'
END

PRINT ''
PRINT '✅ Colunas antigas removidas com sucesso!'
*/

-- ============================================
-- ETAPA 6: VERIFICAÇÃO FINAL
-- ============================================
PRINT ''
PRINT '✅ MIGRAÇÃO CONCLUÍDA!'
PRINT ''
PRINT '📊 Estatísticas:'

SELECT 
    [source_table] AS 'Tabela',
    COUNT(*) AS 'Total de Imagens',
    SUM(DATALENGTH([image_bin])) / 1024 / 1024 AS 'Tamanho Total (MB)'
FROM [dbo].[imagens]
GROUP BY [source_table]

PRINT ''
PRINT '📋 Resumo da tabela [imagens]:'
SELECT 
    COUNT(*) AS 'Total Geral',
    MIN([uploaded_at]) AS 'Primeira Imagem',
    MAX([uploaded_at]) AS 'Última Imagem'
FROM [dbo].[imagens]

PRINT ''
PRINT '⚠️ PRÓXIMOS PASSOS:'
PRINT '1. Testar a aplicação para garantir que as imagens estão sendo carregadas corretamente'
PRINT '2. Verificar logs do backend Python'
PRINT '3. Após confirmar que tudo está funcionando, descomente a ETAPA 5 para remover as colunas antigas'
PRINT '4. A tabela [imagens_backup] pode ser mantida por segurança ou removida após confirmação'

GO
