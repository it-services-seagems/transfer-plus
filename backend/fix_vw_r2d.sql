-- Script para diagnose e possível recriação da view VW_R2D
-- Este script ajuda a identificar o problema com a view

-- 1. Ver a definição atual da view (pode falhar se a view estiver corrompida)
-- EXEC sp_helptext 'dbo.VW_R2D';

-- 2. Verificar dependências da view
SELECT OBJECT_NAME(referencing_id) AS ReferencingObject,
       o.type_desc AS ObjectType,
       OBJECT_NAME(referenced_id) AS ReferencedObject
FROM sys.sql_dependencies
INNER JOIN sys.objects o ON sys.sql_dependencies.referencing_id = o.object_id
WHERE referenced_id = OBJECT_ID('dbo.VW_R2D')
ORDER BY OBJECT_NAME(referencing_id);

-- 3. Verificar se a view existe e seu estado
SELECT 
    OBJECT_NAME(id) AS ViewName,
    type,
    crdate AS CreatedDate
FROM sys.sysobjects
WHERE type = 'V' AND name = 'VW_R2D';

-- 4. Listar todas as tabelas e views que podem estar envolvidas na R2D
SELECT 
    OBJECT_NAME(id) AS ObjectName,
    type,
    type_desc
FROM sys.sysobjects
WHERE type IN ('U', 'V') 
  AND (name LIKE '%R2D%' OR name LIKE '%requisicao%' OR name LIKE '%PR%' OR name LIKE '%PO%')
ORDER BY type, name;

-- 5. Tentar droppar e recriar a view com apenas as colunas necessárias
-- IMPORTANTE: Este é um comando de recriação. Comentado até confirmação.
/*
DROP VIEW IF EXISTS [dbo].[VW_R2D];

CREATE VIEW [dbo].[VW_R2D] AS
SELECT 
    -- Adicione aqui as colunas reais que existem nas tabelas base
    -- Este é apenas um template que precisa ser ajustado
    NULL AS UNIDADE_OPERACIONAL_PR,
    NULL AS PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE,
    NULL AS NUMERO_LINHA_PR,
    NULL AS PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER,
    NULL AS DEPARTMENT,
    NULL AS PRIORIDADE_COMPRA,
    NULL AS DATA_NECESSARIA_PR,
    NULL AS CODIGO_ITEM_PR,
    NULL AS SPN,
    NULL AS ID,
    NULL AS DESCRICAO_ITEM_PTB,
    NULL AS DESCRICAO_ITEM_US,
    NULL AS UNIDADE_DE_MEDIDA_PR,
    NULL AS QUANTIDADE_PR,
    NULL AS QUANTIDADE_ATENDIDA_PR,
    NULL AS DESP_CENTRO_CUSTO_PR,
    NULL AS DESP_DISCIPLINA_PR,
    NULL AS DESP_CONTA_PR,
    NULL AS STATUS_PR,
    NULL AS DATA_CRIACAO_PR,
    NULL AS NUMERO_PO,
    NULL AS NUM_PO_COPIA,
    NULL AS COMPRADOR_PO,
    NULL AS NOME_FORNECEDOR_PO,
    NULL AS ORIGEM_FORNECEDOR_PO,
    NULL AS STATUS_APROVACAO_PO,
    NULL AS MOTIVO_REJEICAO_PO,
    NULL AS QUANTIDADE_PO,
    NULL AS MOEDA_PO,
    NULL AS VALOR_UNITARIO_PO,
    NULL AS TOTAL_LINHA_PO,
    NULL AS TOTAL_CENTRO_CUSTO_PO,
    NULL AS NRO_LINHA_DISTRIB_CONTABIL_PO,
    NULL AS DATA_NECESSARIA_PO,
    NULL AS DATA_CRIACAO_PO,
    NULL AS DATA_PROMETIDA_ORIGINAL_PO_2,
    NULL AS QUANTIDADE_RECEBIDA_PO,
    NULL AS QUANTIDADE_EM_ABERTO_PO,
    NULL AS QUANTIDADE_CANCELADA_PO,
    NULL AS DATA_FECHAMENTO,
    NULL AS STATUS_FECHAMENTO_LINHA_PO
FROM (
    -- Template base - substitua com JOIN das tabelas reais
    SELECT TOP 0 * FROM sys.objects
) AS temp;
*/
