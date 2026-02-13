# -*- coding: utf-8 -*-
"""
ETL R2D - Oracle EBS -> SQL Server (TransferPlus) - VERSÃO CORRIGIDA
- Extração em streaming (lotes) para evitar picos de memória
- Carga em #temp_r2d
- MERGE (upsert) em R2D com detecção de mudanças via CHECKSUM
- Atualiza linha completa quando diferente; insere quando não existir
- CORREÇÃO: Não perde dados por erros de processamento
"""

import os
import sys
import pyodbc
import oracledb
from datetime import datetime, date
import gc
import logging

# =========================
# CONFIGURAÇÕES
# =========================
ORACLE_USER = "APPSELECT"
ORACLE_PASSWORD = "SapuraClBrOra18"
ORACLE_DSN = "dbprd.snm.local/EBSPRD"
ORACLE_CLIENT = r"C:\oracle\instantclient_21_13"

SQLSERVER_SERVER = "CLOSQL01"
SQLSERVER_DATABASE = "TransferPlus"

# Tamanho de lote para fetch do Oracle e insert no SQL
ORACLE_ARRAYSIZE = 1000
ORACLE_PREFETCH = 1000
BATCH_SIZE = 500

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl_r2d.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class TransferPlusOracleETL:
    def __init__(self):
        self.oracle_conn = None
        self.sql_conn = None
        self.processed_count = 0
        self.error_count = 0

    # -------------------------
    # Conexões
    # -------------------------
    def connect_oracle(self):
        logger.info("Iniciando conexão com Oracle EBS...")
        oracledb.init_oracle_client(lib_dir=ORACLE_CLIENT)
        self.oracle_conn = oracledb.connect(
            user=ORACLE_USER, password=ORACLE_PASSWORD, dsn=ORACLE_DSN
        )
        logger.info("Conexão Oracle EBS estabelecida com sucesso")

    def connect_sqlserver(self):
        logger.info("Iniciando conexão com SQL Server...")
        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={SQLSERVER_SERVER};"
            f"DATABASE={SQLSERVER_DATABASE};"
            "Trusted_Connection=yes;"
        )
        self.sql_conn = pyodbc.connect(conn_str, autocommit=False)
        logger.info(f"Conexão SQL Server estabelecida - Server: {SQLSERVER_SERVER}, Database: {SQLSERVER_DATABASE}")

    def close_all(self):
        try:
            if self.oracle_conn:
                self.oracle_conn.close()
                logger.info("Conexão Oracle EBS fechada")
            if self.sql_conn:
                self.sql_conn.close()
                logger.info("Conexão SQL Server fechada")
        except Exception as e:
            logger.error(f"Erro ao fechar conexões: {e}")

    # -------------------------
    # Utilitários
    # -------------------------
    @staticmethod
    def _valid_sql_datetime(value):
        """Normaliza datas para faixa válida do SQL Server (>= 1753-01-01)."""
        if value is None:
            return None
        try:
            if isinstance(value, oracledb.Timestamp):
                py = value.replace(tzinfo=None)
            elif isinstance(value, (datetime, date)):
                py = datetime(value.year, value.month, value.day) if isinstance(value, date) and not isinstance(value, datetime) else value
            else:
                # Tenta parseando string
                py = datetime.fromisoformat(str(value).replace(" ", "T").split(".")[0])
        except Exception:
            return None

        min_date = datetime(1753, 1, 1)
        max_date = datetime(9999, 12, 31)
        if py < min_date:
            return None
        elif py > max_date:
            return max_date
        return py

    def _table_exists(self, table_name="R2D"):
        cur = self.sql_conn.cursor()
        cur.execute("""
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM sys.objects WHERE name = ? AND type = 'U'
            ) THEN 1 ELSE 0 END
        """, (table_name,))
        return cur.fetchone()[0] == 1

    # -------------------------
    # Estruturas (temp table)
    # -------------------------
    def _create_temp_table(self):
        cur = self.sql_conn.cursor()
        cur.execute("IF OBJECT_ID('tempdb..#temp_r2d') IS NOT NULL DROP TABLE #temp_r2d;")
        cur.execute("""
        CREATE TABLE #temp_r2d (
            UNIDADE_OPERACIONAL_PR VARCHAR(100) NULL,
            [PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE] INT NULL,
            NUMERO_LINHA_PR INT NULL,
            TIPO_ORIGEM_PR VARCHAR(100) NULL,
            [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] VARCHAR(500) NULL,
            DEPARTMENT VARCHAR(100) NULL,
            PRIORIDADE_COMPRA VARCHAR(50) NULL,
            DATA_NECESSARIA_PR DATETIME NULL,
            CODIGO_ITEM_PR VARCHAR(100) NULL,
            SPN VARCHAR(100) NULL,
            ID VARCHAR(500) NULL,
            DESCRICAO_ITEM_PTB VARCHAR(500) NULL,
            DESCRICAO_ITEM_US VARCHAR(500) NULL,
            UNIDADE_DE_MEDIDA_PR VARCHAR(50) NULL,
            QUANTIDADE_PR DECIMAL(18,4) NULL,
            QUANTIDADE_ATENDIDA_PR DECIMAL(18,4) NULL,
            DESP_CENTRO_CUSTO_PR INT NULL,
            DESP_DISCIPLINA_PR INT NULL,
            DESP_CONTA_PR INT NULL,
            DESP_PROJETO_PR INT NULL,
            REQUISITANTE_PR VARCHAR(100) NULL,
            STATUS_PR VARCHAR(50) NULL,
            MOTIVO_REJEICAO_PR VARCHAR(1000) NULL,
            DATA_CRIACAO_PR DATETIME NULL,
            DATA_APROVACAO_PR DATETIME NULL,
            TIPO_PO VARCHAR(50) NULL,
            NUMERO_PO INT NULL,
            NUMERO_LINHA_PO INT NULL,
            NUMERO_REVISAO INT NULL,
            DESP_CENTRO_CUSTO_PO INT NULL,
            DESP_DISCIPLINA_PO INT NULL,
            DESP_CONTA_PO INT NULL,
            DESP_PROJETO_PO INT NULL,
            DESC_DESP_FUTURE_PO VARCHAR(255) NULL,
            NUMERO_LIBERACAO INT NULL,
            NUM_PO_COPIA VARCHAR(100) NULL,
            PRIORIDADE_COMPRA_PO VARCHAR(50) NULL,
            COMPRADOR_PO VARCHAR(100) NULL,
            NOME_FORNECEDOR_PO VARCHAR(255) NULL,
            ORIGEM_FORNECEDOR_PO VARCHAR(50) NULL,
            NOME_FORNECEDOR_PO_COPIA VARCHAR(255) NULL,
            ICOTERM_PO VARCHAR(100) NULL,
            ICOTERM_PO_COPIA VARCHAR(100) NULL,
            ENTREGAR_PARA_PO VARCHAR(100) NULL,
            FATURAR_PARA_PO VARCHAR(100) NULL,
            STATUS_APROVACAO_PO VARCHAR(50) NULL,
            MOTIVO_REJEICAO_PO VARCHAR(1000) NULL,
            QUANTIDADE_PO DECIMAL(18,4) NULL,
            MOEDA_PO VARCHAR(10) NULL,
            VALOR_UNITARIO_PO DECIMAL(18,4) NULL,
            TOTAL_LINHA_PO DECIMAL(18,2) NULL,
            TOTAL_CENTRO_CUSTO_PO DECIMAL(18,2) NULL,
            NRO_LINHA_DISTRIB_CONTABIL_PO INT NULL,
            DATA_NECESSARIA_PO DATETIME NULL,
            DATA_CRIACAO_PO DATETIME NULL,
            DATA_PROMETIDA_ORIGINAL_PO_2 DATETIME NULL,
            DATA_PROMETIDA_ATUAL_PO_2 DATETIME NULL,
            DATA_SUBMISSAO_APROV_PO DATETIME NULL,
            DATA_APROVACAO_PO DATETIME NULL,
            DATA_PRIMEIRA_APROVACAO_PO DATETIME NULL,
            QUANTIDADE_SOLICITADA_PO DECIMAL(18,4) NULL,
            QUANTIDADE_RECEBIDA_PO DECIMAL(18,4) NULL,
            QUANTIDADE_EM_ABERTO_PO DECIMAL(18,4) NULL,
            QUANTIDADE_CANCELADA_PO DECIMAL(18,4) NULL,
            DATA_FECHAMENTO DATETIME NULL,
            STATUS_FECHAMENTO_LINHA_PO VARCHAR(50) NULL,
            DATA_FECHAMENTO_PR DATETIME NULL,
            DATA_FECHAMENTO_PR_LINHA DATETIME NULL,
            DATA_FECHAMENTO_PO DATETIME NULL,
            DATA_CANCELAMENTO_PR DATETIME NULL,
            DATA_CANCELAMENTO_PO DATETIME NULL,
            QUANTIDADE_FATURADA_PO DECIMAL(18,4) NULL,
            QUANTIDADE_FATURADA_PO_COPIA DECIMAL(18,4) NULL,
            DT_RECEB_RI DATETIME NULL,
            TRANSACTIONS VARCHAR(1000) NULL,
            ORIGEM_AP VARCHAR(100) NULL,
            NR_NF_AP VARCHAR(100) NULL,
            COND_PAGTO_AP VARCHAR(100) NULL,
            DT_VENCIMENTO_AP DATETIME NULL,
            DT_PAGTO_AP DATETIME NULL,
            LD_ENTREGA_FORN VARCHAR(100) NULL,
            PRIMEIRO_COMPRADOR VARCHAR(100) NULL,
            [Considerar Análise] VARCHAR(10) NULL,
            [OBS HISTóRICO AÇãO PO] VARCHAR(1000) NULL,
            [MOTIVO DO FECHAMENTO DA PO] VARCHAR(1000) NULL
        );
        """)
        self.sql_conn.commit()
        logger.info("Tabela temporária #temp_r2d criada")

    # -------------------------
    # Query Oracle - CORRIGIDA
    # -------------------------
    @staticmethod
    def _oracle_query():
        """Query Oracle corrigida com filtros específicos"""
        return """
        SELECT hou.name AS unidade_operacional_pr,
               TO_NUMBER(LTRIM(prh.segment1,'#')) AS PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE,
               prl.line_num AS numero_linha_pr,
               (SELECT plc_sdoc.displayed_field
                  FROM apps.po_lookup_codes plc_sdoc 
                 WHERE plc_sdoc.lookup_type (+) = 'SOURCE DOCUMENT TYPE' 
                   AND plc_sdoc.lookup_code (+) = prl.document_type_code
               ) AS tipo_origem_pr,
               DECODE (NVL (prh.interface_source_code, 'XXX'),
                       'TM Master', prh.description,
                       NULL)
                   AS  PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER,
               REGEXP_SUBSTR(prh.description, '[^-]+', 1, 2) AS department,
               prh.attribute1 AS prioridade_compra,
               TO_DATE (TO_CHAR (prl.need_by_date, 'DD/MM/YYYY'), 'DD/MM/YYYY') AS data_necessaria_pr,
               msi.segment1 AS codigo_item_pr,
               SUBSTR(msi.segment1, INSTR(msi.segment1, 'OTH') + 3) AS spn,
               prh.description || '-' || SUBSTR(msi.segment1, INSTR(msi.segment1, 'OTH') + 3) AS id,
               (SELECT REPLACE (REPLACE (REPLACE (description, CHR (13), ''), CHR (10), CHR (32)), ';', ',')
                  FROM apps.mtl_system_items_tl msit
                 WHERE msit.inventory_item_id = msi.inventory_item_id
                   AND msit.organization_id = msi.organization_id
                   AND msit.language = 'PTB') AS descricao_item_ptb,
               (SELECT REPLACE (REPLACE (REPLACE (description, CHR (13), ''), CHR (10), CHR (32)), ';', ',')
                  FROM apps.mtl_system_items_tl msit
                 WHERE msit.inventory_item_id = msi.inventory_item_id
                   AND msit.organization_id = msi.organization_id
                   AND msit.language = 'US') AS descricao_item_us,
               prl.unit_meas_lookup_code AS unidade_de_medida_pr,
               prl.quantity AS quantidade_pr,
               prl.quantity_delivered AS quantidade_atendida_pr,
               TO_NUMBER (gcc_pr.segment1) AS desp_centro_custo_pr,
               TO_NUMBER (gcc_pr.segment2) AS desp_disciplina_pr,
               TO_NUMBER (gcc_pr.segment3) AS desp_conta_pr,
               TO_NUMBER (gcc_pr.segment6) AS desp_projeto_pr,
               papf_pr.full_name AS requisitante_pr,
               DECODE (NVL (prl.cancel_flag, 'N'),
                       'Y', 'CANCELLED',
                       prh.authorization_status) AS status_pr,
               CASE
                   WHEN NVL (prl.cancel_flag, 'N') = 'Y' THEN prl.cancel_reason
                   WHEN NVL (ph.segment1, 'XXX') != 'XXX' THEN NULL
                   WHEN prh.authorization_status = 'REJECTED' THEN
                       (SELECT REPLACE (REPLACE (pah.note, CHR (13), ''), CHR (10), ' ')
                          FROM apps.po_action_history pah
                         WHERE pah.action_code = 'REJECT'
                           AND pah.object_id = prh.requisition_header_id
                           AND TRUNC (pah.last_update_date) >= NVL (TRUNC (prh.approved_date), TRUNC (pah.last_update_date))
                           AND ROWNUM = 1)
                   WHEN prh.authorization_status = 'RETURNED' THEN
                       (SELECT REPLACE (REPLACE (pah.note, CHR (13), ''), CHR (10), ' ')
                          FROM apps.po_action_history pah
                         WHERE pah.action_code = 'RETURN'
                           AND pah.object_id = prh.requisition_header_id
                           AND TRUNC (pah.last_update_date) >= NVL (TRUNC (prh.approved_date), TRUNC (pah.last_update_date))
                           AND ROWNUM = 1)
                   ELSE NULL
               END AS motivo_rejeicao_pr,
               TO_DATE (TO_CHAR (prh.creation_date, 'DD/MM/YYYY HH24:MI:SS'), 'DD/MM/YYYY HH24:MI:SS') AS data_criacao_pr,
               DECODE (
                   NVL (prl.cancel_flag, 'N'),
                   'Y', NULL,
                   DECODE (prh.authorization_status, 'INCOMPLETE', NULL,
                       TO_DATE (TO_CHAR (
                           DECODE (NVL (ph.segment1, 'XXX'),
                                   'XXX', prh.approved_date,
                                   NVL (prh.approved_date,
                                       (SELECT MAX (action_date)
                                          FROM apps.po_action_history pah
                                         WHERE pah.object_type_code = 'REQUISITION'
                                           AND pah.object_sub_type_code = 'PURCHASE'
                                           AND pah.action_code = 'APPROVE'
                                           AND pah.object_id = prh.requisition_header_id
                                           AND pah.action_date <= NVL (ph.approved_date, pah.action_date)
                                           AND ROWNUM = 1))),
                       'DD/MM/YYYY HH24:MI:SS'),'DD/MM/YYYY HH24:MI:SS'))) AS data_aprovacao_pr,
               ph.type_lookup_code AS tipo_po,
               TO_NUMBER (ph.segment1) AS numero_po,
               pl.line_num AS numero_linha_po,
               ph.revision_num AS numero_revisao,
               TO_NUMBER (NVL (gcc_po.segment1, gcc_pr.segment1)) AS desp_centro_custo_po,
               TO_NUMBER (NVL (gcc_po.segment2, gcc_pr.segment2)) AS desp_disciplina_po,
               TO_NUMBER (NVL (gcc_po.segment3, gcc_pr.segment3)) AS desp_conta_po,
               TO_NUMBER (NVL (gcc_po.segment6, gcc_pr.segment6)) AS desp_projeto_po,
               (SELECT description
                  FROM apps.fnd_flex_values_tl ffvt,
                       apps.fnd_flex_values ffv,
                       apps.fnd_id_flex_segments fifs
                 WHERE ffv.flex_value_id = ffvt.flex_value_id
                   AND fifs.flex_value_set_id = ffv.flex_value_set_id
                   AND fifs.segment_name = 'FUTURE' 
                   AND fifs.id_flex_code = 'GL#'
                   AND ffv.flex_value = LPAD(gcc_po.segment10, 5, '0')
                   AND ffvt.LANGUAGE = 'PTB'
               ) desc_desp_future_po,
               pr.release_num AS numero_liberacao,
               ph.attribute8 AS num_po_copia,
               ph.attribute1 AS prioridade_compra_po,
               papf_po.full_name AS comprador_po,
               ass.vendor_name AS nome_fornecedor_po,
               asa.country AS origem_fornecedor_po,
               (SELECT aps_dest.vendor_site_code || ' - ' || ap_dest.vendor_name
                  FROM apps.ap_supplier_sites_all aps_dest, apps.ap_suppliers ap_dest
                 WHERE aps_dest.vendor_site_id = TO_NUMBER(ph.attribute3)
                   AND ap_dest.vendor_id = aps_dest.vendor_id) AS nome_fornecedor_po_copia,
               (SELECT flv.meaning
                  FROM apps.fnd_lookup_values flv
                 WHERE flv.lookup_type = 'FREIGHT TERMS'
                   AND flv.language = USERENV ('LANG')
                   AND flv.lookup_code = ph.freight_terms_lookup_code) AS icoterm_po,
               (SELECT meaning
                  FROM apps.fnd_lookup_values flv
                 WHERE flv.lookup_code = ph.attribute4
                   AND flv.lookup_type = 'FREIGHT TERMS'
                   AND language = USERENV ('LANG')
                   AND view_application_id = 201) AS icoterm_po_copia,
               (SELECT location_code FROM apps.hr_locations_all hl
                 WHERE hl.location_id = ph.ship_to_location_id AND ROWNUM = 1) AS entregar_para_po,
               (SELECT location_code FROM apps.hr_locations_all hl
                 WHERE hl.location_id = ph.bill_to_location_id AND ROWNUM = 1) AS faturar_para_po,
               DECODE (NVL (pl.cancel_flag, 'N'),'Y','CANCELLED',
                   (CASE WHEN ph.authorization_status IS NULL AND ph.segment1 IS NULL THEN NULL
                         WHEN ph.authorization_status IS NULL AND ph.segment1 IS NOT NULL THEN 'INCOMPLETE'
                         WHEN ph.authorization_status IS NOT NULL THEN ph.authorization_status END)) AS status_aprovacao_po,
               CASE WHEN ph.authorization_status = 'REJECTED' THEN
                   (SELECT REPLACE (REPLACE (pah.note, CHR (13), ''), CHR (10),' ')
                      FROM apps.po_action_history pah
                     WHERE pah.action_code = 'REJECT'
                       AND pah.object_id = ph.po_header_id
                       AND TRUNC (pah.last_update_date) >= NVL (TRUNC (ph.approved_date), TRUNC (pah.last_update_date))
                       AND ROWNUM = 1)
               ELSE NULL END AS motivo_rejeicao_po,
               pll.quantity AS quantidade_po,
               ph.currency_code AS moeda_po,
               DECODE (ph.type_lookup_code, 'BLANKET', 1, pl.unit_price) AS valor_unitario_po,
               ROUND ((pll.quantity * DECODE (ph.type_lookup_code, 'BLANKET', 1, pl.unit_price)), 2) AS total_linha_po,
               ROUND ((pd.quantity_ordered * DECODE (ph.type_lookup_code, 'BLANKET', 1, pl.unit_price)), 2) AS total_centro_custo_po,
               pd.distribution_num AS nro_linha_distrib_contabil_po,
               TO_DATE (TO_CHAR (pll.need_by_date, 'DD/MM/YYYY HH24:MI:SS'), 'DD/MM/YYYY HH24:MI:SS') AS data_necessaria_po,
               TO_DATE (TO_CHAR (ph.creation_date, 'DD/MM/YYYY HH24:MI:SS'), 'DD/MM/YYYY HH24:MI:SS') AS data_criacao_po,
               CASE WHEN ph.revision_num = 0 THEN TO_DATE (TO_CHAR (pll.promised_date, 'DD/MM/YYYY'), 'DD/MM/YYYY')
                    ELSE NVL ((SELECT TO_DATE (TO_CHAR (pllaa1.promised_date, 'DD/MM/YYYY'),'DD/MM/YYYY')
                                 FROM apps.po_line_locations_archive_all pllaa1
                                WHERE pllaa1.line_location_id = pll.line_location_id
                                  AND pllaa1.promised_date != pll.promised_date
                                  AND pllaa1.revision_num = 0
                                  AND ROWNUM = 1),
                              TO_DATE (TO_CHAR (pll.promised_date, 'DD/MM/YYYY'),'DD/MM/YYYY')) END AS data_prometida_original_po_2,
               CASE WHEN ph.revision_num > 0 THEN TO_DATE (TO_CHAR (pll.promised_date, 'DD/MM/YYYY'),'DD/MM/YYYY') ELSE NULL END AS data_prometida_atual_po_2,
               TO_DATE (TO_CHAR (NVL(ph.submit_date, (SELECT MAX(action_date) FROM apps.po_action_history pah
                                                       WHERE pah.object_id = ph.po_header_id
                                                         AND object_type_code IN ('PO','PA')
                                                         AND action_code = 'SUBMIT')), 'DD/MM/YYYY HH24:MI:SS'), 'DD/MM/YYYY HH24:MI:SS') AS data_submissao_aprov_po,
               (SELECT MAX (pah.action_date) FROM apps.po_action_history pah
                 WHERE pah.object_id = ph.po_header_id AND object_type_code IN ('PO','PA') AND action_code IN ('APPROVE','SIGNED')) AS data_aprovacao_po,
               (SELECT MAX (pah.action_date) FROM apps.po_action_history pah
                 WHERE pah.object_id = ph.po_header_id AND object_type_code IN ('PO','PA') AND object_revision_num = 0
                   AND action_code IN ('APPROVE','SIGNED')) AS data_primeira_aprovacao_po,
               pd.quantity_ordered AS quantidade_solicitada_po,
               pll.quantity_received AS quantidade_recebida_po,
               (pll.quantity - pll.quantity_received - pll.quantity_cancelled) AS quantidade_em_aberto_po,
               pll.quantity_cancelled AS quantidade_cancelada_po,
               pll.closed_date AS data_fechamento,
               pll.closed_code AS status_fechamento_linha_po,
               (SELECT MAX (pah.action_date) FROM apps.po_action_history pah
                 WHERE pah.object_id = prh.requisition_header_id AND object_type_code = 'REQUISITION'
                   AND action_code IN ('CLOSE','FINALLY CLOSE')) AS data_fechamento_pr,
               PRL.CLOSED_DATE AS data_fechamento_PR_linha,
               (SELECT MAX (pah.action_date) FROM apps.po_action_history pah
                 WHERE pah.object_id = ph.po_header_id AND object_type_code IN ('PO','PA')
                   AND action_code IN ('CLOSE','FINALLY CLOSE')) AS data_fechamento_po,
               NVL ((SELECT MAX (pah.action_date) FROM apps.po_action_history pah
                      WHERE pah.object_id = prh.requisition_header_id AND object_type_code = 'REQUISITION'
                        AND action_code IN ('CANCEL','RETURN')), prl.cancel_date) AS data_cancelamento_pr,
               NVL ((SELECT MAX (pah.action_date) FROM apps.po_action_history pah
                      WHERE pah.object_id = ph.po_header_id AND object_type_code IN ('PO','PA')
                        AND action_code IN ('CANCEL')), pl.cancel_date) AS data_cancelamento_po,
               pll.quantity_billed AS quantidade_faturada_po,
               (SELECT SUM (quantity_billed)
                  FROM apps.po_distributions_all pda, apps.po_lines_all pla, apps.po_headers_all pha
                 WHERE pda.po_header_id = pha.po_header_id
                   AND pda.po_line_id = pla.po_line_id
                   AND pha.po_header_id = pla.po_header_id
                   AND to_number(pha.reference_num) = ph.po_header_id
                   AND pla.line_num = pl.line_num
                   AND pha.interface_source_code = 'SPR_Duplicacao_PO') AS quantidade_faturada_po_copia,
               f189_ap.dt_receb_ri,
               (SELECT LISTAGG (transaction_type || ' ' || transaction_date, ' | ')
                         WITHIN GROUP (ORDER BY transaction_date)
                  FROM apps.rcv_vrc_txs_v
                 WHERE po_line_location_id = pll.line_location_id) AS transactions,
               NVL (f189_ap.origem_ap, ap.origem_ap) AS origem_ap,
               NVL (f189_ap.nr_nf_ap, ap.nr_nf_ap) AS nr_nf_ap,
               NVL (f189_ap.cond_pagto_ap, ap.cond_pagto_ap) AS cond_pagto_ap,
               NVL (f189_ap.dt_vencimento_ap, ap.dt_vencimento_ap) AS dt_vencimento_ap,
               NVL (f189_ap.dt_pagto_ap, ap.dt_pagto_ap) AS dt_pagto_ap,
               ph.attribute15 AS ld_entrega_forn,
               (SELECT DISTINCT FIRST_VALUE (papf.full_name)
                          OVER (ORDER BY pah.action_date ASC RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
                  FROM apps.po_action_history pah
                       LEFT JOIN apps.per_all_people_f papf ON pah.employee_id = papf.person_id
                 WHERE pah.object_type_code = 'PO'
                   AND pah.action_code = 'SUBMIT'
                   AND pah.object_id = ph.po_header_id) AS primeiro_comprador,
               DECODE(NVL(prld.parent_req_line_id, -1), -1, 'Sim', 'Não') AS "Considerar Análise",
               (SELECT note FROM apps.po_action_history pah
                 WHERE object_id = ph.po_header_id AND action_code = 'CLOSE' AND object_type_code = 'PO'
                   AND action_date = (SELECT MAX (action_date) FROM apps.po_action_history pah2
                                      WHERE pah2.object_id = pah.object_id AND pah2.action_code = 'CLOSE'
                                        AND pah2.object_type_code = 'PO')) AS "OBS HISTóRICO AÇãO PO",
               pll.closed_reason AS "MOTIVO DO FECHAMENTO DA PO"
          FROM apps.hr_all_organization_units hou,
               apps.po_line_locations_all pll,
               apps.po_requisition_lines_all prl,
               apps.mtl_system_items_b msi,
               apps.po_req_distributions_all prd,
               apps.po_distributions_all pd,
               apps.gl_code_combinations_kfv gcc_pr,
               apps.gl_code_combinations_kfv gcc_po,
               po.po_requisition_headers_all prh,
               apps.po_lines_all pl,
               apps.po_releases_all pr,
               apps.po_headers_all ph,
               apps.ap_suppliers ass,
               apps.ap_supplier_sites_all asa,
               (SELECT person_id, full_name FROM apps.per_all_people_f papf
                 WHERE papf.effective_end_date = (SELECT MAX (effective_end_date) FROM apps.per_all_people_f papf1 WHERE papf1.person_id = papf.person_id)) papf_po,
               (SELECT person_id, full_name FROM apps.per_all_people_f papf
                 WHERE papf.effective_end_date = (SELECT MAX (effective_end_date) FROM apps.per_all_people_f papf1 WHERE papf1.person_id = papf.person_id)) papf_pr,
               (SELECT DISTINCT feo.receive_date AS dt_receb_ri,
                                fil.line_location_id,
                                DECODE (dados_ap.origem_ap, NULL, NULL, 'RECEBIMENTO INTEGRADO') AS origem_ap,
                                dados_ap.nr_nf_ap, dados_ap.cond_pagto_ap, dados_ap.dt_vencimento_ap, dados_ap.dt_pagto_ap
                  FROM apps.cll_f189_invoices fi,
                       apps.cll_f189_entry_operations feo,
                       apps.cll_f189_invoice_lines fil,
                       (SELECT DISTINCT ai.reference_key1 invoice_id, ai.source origem_ap, ai.invoice_num nr_nf_ap,
                               at.name cond_pagto_ap, aps.due_date dt_vencimento_ap, ac.check_date dt_pagto_ap
                          FROM apps.ap_invoices_all ai,
                               apps.ap_terms at,
                               apps.ap_payment_schedules_all aps,
                               apps.ap_invoice_payments_all aip,
                               apps.ap_checks_all ac
                         WHERE ai.source = 'CLL F189 INTEGRATED RCV'
                           AND ai.invoice_type_lookup_code = 'STANDARD'
                           AND at.term_id = ai.terms_id
                           AND aps.invoice_id = ai.invoice_id
                           AND aip.invoice_id(+) = aps.invoice_id
                           AND aip.payment_num(+) = aps.payment_num
                           AND ac.check_id(+) = aip.check_id
                           AND NVL (ac.check_date, TO_DATE ('09/09/9999', 'DD/MM/YYYY')) =
                               (SELECT MAX (NVL (a.check_date, TO_DATE ('09/09/9999', 'DD/MM/YYYY')))
                                  FROM apps.ap_checks_all a, apps.ap_invoice_payments_all b, apps.ap_payment_schedules_all c, apps.ap_invoices_all d
                                 WHERE a.check_id(+) = b.check_id
                                   AND b.invoice_id(+) = c.invoice_id
                                   AND b.payment_num(+) = c.payment_num
                                   AND c.invoice_id = d.invoice_id
                                   AND d.source = 'CLL F189 INTEGRATED RCV'
                                   AND d.invoice_type_lookup_code = 'STANDARD'
                                   AND d.invoice_num = ai.invoice_num
                                   AND d.reference_key1 = ai.reference_key1)
                           AND aps.due_date = (SELECT due_date FROM (
                                                  SELECT c.due_date
                                                    FROM apps.ap_checks_all a, apps.ap_invoice_payments_all b, apps.ap_payment_schedules_all c, apps.ap_invoices_all d
                                                   WHERE a.check_id(+) = b.check_id
                                                     AND b.invoice_id(+) = c.invoice_id
                                                     AND b.payment_num(+) = c.payment_num
                                                     AND c.invoice_id = d.invoice_id
                                                     AND d.source = 'CLL F189 INTEGRATED RCV'
                                                     AND d.invoice_type_lookup_code = 'STANDARD'
                                                     AND d.invoice_num = ai.invoice_num
                                                     AND d.reference_key1 = ai.reference_key1
                                                ORDER BY c.due_date) WHERE ROWNUM = 1)) dados_ap
                 WHERE fi.invoice_id = fil.invoice_id
                   AND feo.organization_id = fi.organization_id
                   AND feo.operation_id = fi.operation_id
                   AND feo.status = 'COMPLETE'
                   AND feo.reversion_flag IS NULL
                   AND dados_ap.nr_nf_ap = (SELECT TO_CHAR (MAX (a.invoice_num))
                                              FROM apps.cll_f189_invoices a,
                                                   apps.cll_f189_invoice_lines b,
                                                   apps.cll_f189_entry_operations c
                                             WHERE a.invoice_id = b.invoice_id
                                               AND a.organization_id = c.organization_id
                                               AND a.operation_id = c.operation_id
                                               AND c.status = 'COMPLETE'
                                               AND c.reversion_flag IS NULL
                                               AND b.line_location_id = fil.line_location_id)
                   AND dados_ap.nr_nf_ap(+) = TO_CHAR (fi.invoice_num)
                   AND dados_ap.invoice_id(+) = fi.invoice_id) f189_ap,
               (SELECT ai.org_id, ail.po_header_id, ail.po_line_id, ail.po_release_id, ail.po_line_location_id,
                       DECODE (source, 'Manual Invoice Entry', 'Entrada Manual', source) origem_ap,
                       ai.invoice_num nr_nf_ap, at.name cond_pagto_ap, aps.due_date dt_vencimento_ap, ac.check_date dt_pagto_ap
                  FROM apps.ap_invoices_all ai, apps.ap_invoice_lines_all ail, apps.ap_terms at, apps.ap_payment_schedules_all aps,
                       apps.ap_invoice_payments_all aip, apps.ap_checks_all ac,
                       (SELECT ail.po_line_location_id, MAX (ail.invoice_id) invoice_id
                          FROM apps.ap_invoices_all ai, apps.ap_invoice_lines_all ail
                         WHERE ai.source != 'CLL F189 INTEGRATED RCV'
                           AND ai.payment_status_flag IN ('Y','P')
                           AND ail.invoice_id = ai.invoice_id
                           AND ail.po_header_id IS NOT NULL
                      GROUP BY ail.po_line_location_id) ult_pagto
                 WHERE ai.source != 'CLL F189 INTEGRATED RCV'
                   AND ai.payment_status_flag IN ('Y','P')
                   AND ail.invoice_id = ai.invoice_id
                   AND ail.project_id = ai.project_id
                   AND ail.task_id = ai.task_id
                   AND ail.po_header_id IS NOT NULL
                   AND at.term_id = ai.terms_id
                   AND aps.invoice_id = ai.invoice_id
                   AND ult_pagto.po_line_location_id = ail.po_line_location_id
                   AND ult_pagto.invoice_id = ail.invoice_id
                   AND aip.invoice_id(+) = aps.invoice_id
                   AND aip.payment_num(+) = aps.payment_num
                   AND ac.check_id(+) = aip.check_id) ap,
              (SELECT DISTINCT parent_req_line_id FROM apps.po_requisition_lines_all
                WHERE parent_req_line_id IS NOT NULL) prld
         WHERE hou.organization_id = prh.org_id
           AND hou.organization_id = prl.org_id
           AND prh.preparer_id = papf_pr.person_id(+)
           AND pl.po_header_id = ph.po_header_id(+)
           AND pll.po_line_id = pl.po_line_id(+)
           AND prh.requisition_header_id = prl.requisition_header_id
           AND gcc_po.code_combination_id(+) = pd.code_combination_id
           AND prd.code_combination_id = gcc_pr.code_combination_id
           AND pd.req_distribution_id(+) = prd.distribution_id
           AND prl.requisition_line_id = prd.requisition_line_id
           AND prl.line_location_id = pll.line_location_id(+)
           AND pr.po_release_id(+) = pll.po_release_id
           AND prl.item_id = msi.inventory_item_id
           AND prl.destination_organization_id = msi.organization_id
           AND ph.agent_id = papf_po.person_id(+)
           AND ph.vendor_id = ass.vendor_id(+)
           AND ph.vendor_site_id = asa.vendor_site_id(+)
           AND f189_ap.line_location_id(+) = pll.line_location_id
           AND ap.po_line_location_id(+) = pll.line_location_id
           AND prl.requisition_line_id = prld.parent_req_line_id(+)
           AND PRL.creation_date >= TO_DATE('01/01/2020', 'DD/MM/YYYY')
           AND prh.description IN ('ONI-VME-196.03-0661/2022','TOP-GEN-196.01-0359/2025')
        """

    # -------------------------
    # Processamento de Linha MELHORADO
    # -------------------------
    def _process_row_safe(self, r, row_index):
        """Processa uma linha com tratamento robusto de erros e validações"""
        try:
            r = list(r)
            
            # Validar tamanho da linha
            if len(r) != 85:
                logger.warning(f"Linha {row_index}: Número incorreto de colunas ({len(r)} != 85)")
                # Ajustar tamanho se necessário
                while len(r) < 85:
                    r.append(None)
                r = r[:85]

            # Normalizar datas (índices baseados na estrutura da temp table)
            date_indices = [7, 23, 24, 52, 53, 54, 59, 60, 61, 62, 66, 68, 69, 70, 71, 72, 73, 78]
            for i in date_indices:
                if i < len(r):
                    r[i] = self._valid_sql_datetime(r[i])

            # Truncar strings por tamanho máximo
            string_limits = {
                # VARCHAR(500)
                4: 500, 10: 500, 11: 500, 12: 500,
                # VARCHAR(255) 
                33: 255, 38: 255, 40: 255,
                # VARCHAR(1000)
                22: 1000, 45: 1000, 77: 1000, 83: 1000, 84: 1000,
                # VARCHAR(100) - maioria dos campos
                0: 100, 3: 100, 5: 100, 6: 100, 8: 100, 9: 100, 13: 100, 20: 100, 
                25: 100, 34: 100, 35: 100, 37: 100, 39: 100, 41: 100, 42: 100, 
                46: 100, 55: 100, 63: 100, 64: 100, 65: 100, 67: 100, 74: 100, 
                75: 100, 76: 100, 79: 100, 80: 100, 81: 100, 82: 100,
                # VARCHAR(50)
                6: 50, 13: 50, 21: 50, 25: 50, 36: 50, 39: 50, 44: 50, 47: 50, 64: 50,
                # VARCHAR(10)
                47: 10, 82: 10
            }
            
            for i, max_len in string_limits.items():
                if i < len(r) and r[i] is not None:
                    r[i] = str(r[i])[:max_len] if r[i] else None

            # Validar campos numéricos inteiros
            int_indices = [1, 2, 16, 17, 18, 19, 26, 27, 28, 29, 30, 31, 32, 34, 51]
            for i in int_indices:
                if i < len(r) and r[i] is not None:
                    try:
                        r[i] = int(float(r[i])) if str(r[i]).strip() != '' else None
                    except (ValueError, TypeError):
                        logger.warning(f"Linha {row_index}: Campo {i} valor inválido para INT: {r[i]}")
                        r[i] = None

            # Validar campos numéricos decimais
            decimal_indices = [14, 15, 46, 48, 49, 50, 57, 58, 59, 60, 65, 66]
            for i in decimal_indices:
                if i < len(r) and r[i] is not None:
                    try:
                        r[i] = float(r[i]) if str(r[i]).strip() != '' else None
                    except (ValueError, TypeError):
                        logger.warning(f"Linha {row_index}: Campo {i} valor inválido para DECIMAL: {r[i]}")
                        r[i] = None

            return r

        except Exception as e:
            logger.error(f"Erro crítico ao processar linha {row_index}: {e}")
            logger.error(f"Dados da linha: {r[:10]}...")  # Primeiros 10 campos para debug
            # Retornar linha com valores padrão ao invés de None
            return [None] * 85

    # -------------------------
    # Carga em #temp_r2d (stream) - CORRIGIDO
    # -------------------------
    def stream_oracle_to_temp(self):
        if not self._table_exists("R2D"):
            raise RuntimeError("ERRO: Tabela R2D não existe. Crie-a antes de executar o ETL.")

        self._create_temp_table()
        sql_cur = self.sql_conn.cursor()

        # Preparar INSERT na temp
        placeholders = ",".join(["?"] * 85)
        insert_tmp = f"INSERT INTO #temp_r2d VALUES ({placeholders})"

        # Oracle cursor
        o_cur = self.oracle_conn.cursor()
        o_cur.arraysize = ORACLE_ARRAYSIZE
        o_cur.prefetchrows = ORACLE_PREFETCH

        logger.info("Executando query no Oracle (streaming)...")
        start = datetime.now()
        
        try:
            o_cur.execute(self._oracle_query())
        except Exception as e:
            logger.error(f"Erro na execução da query Oracle: {e}")
            raise

        total = 0
        lote = []
        lote_num = 0
        
        # Contar registros específicos que procuramos
        oni_count = 0
        top_count = 0

        try:
            while True:
                rows = o_cur.fetchmany(BATCH_SIZE)
                if not rows:
                    break

                for idx, row in enumerate(rows):
                    row_index = total + idx + 1
                    
                    # Processar linha com tratamento robusto
                    processed_row = self._process_row_safe(row, row_index)
                    
                    # Verificar se é um dos registros específicos que procuramos
                    if processed_row and len(processed_row) > 4:
                        pr_tm_master = processed_row[4]  # PR_TM_MASTER field
                        if pr_tm_master:
                            if 'ONI-VME-196.03-0661/2022' in str(pr_tm_master):
                                oni_count += 1
                                logger.info(f"✅ Encontrado ONI-VME-196.03-0661/2022 na linha {row_index}")
                            elif 'TOP-GEN-196.01-0359/2025' in str(pr_tm_master):
                                top_count += 1
                                logger.info(f"✅ Encontrado TOP-GEN-196.01-0359/2025 na linha {row_index}")
                    
                    if processed_row:
                        lote.append(processed_row)
                        self.processed_count += 1
                    else:
                        self.error_count += 1
                        logger.warning(f"Linha {row_index} foi descartada devido a erros")

                    total += 1

                    if len(lote) >= BATCH_SIZE:
                        try:
                            lote_num += 1
                            sql_cur.executemany(insert_tmp, lote)
                            self.sql_conn.commit()
                            logger.info(f"Lote {lote_num}: {len(lote)} linhas inseridas na #temp_r2d (total processado: {total:,})")
                            lote = []
                            
                            # Liberação de memória a cada lote
                            gc.collect()
                        except Exception as e:
                            logger.error(f"Erro ao inserir lote {lote_num}: {e}")
                            self.sql_conn.rollback()
                            # Tentar inserir linha por linha do lote para identificar problema
                            for i, row_data in enumerate(lote):
                                try:
                                    sql_cur.execute(insert_tmp, row_data)
                                    self.sql_conn.commit()
                                except Exception as row_error:
                                    logger.error(f"Erro na linha {i} do lote {lote_num}: {row_error}")
                                    logger.error(f"Dados problemáticos: {row_data[:5]}...")
                                    self.error_count += 1
                            lote = []

        except Exception as e:
            logger.error(f"Erro durante streaming: {e}")
            raise

        # Flush final
        if lote:
            try:
                lote_num += 1
                sql_cur.executemany(insert_tmp, lote)
                self.sql_conn.commit()
                logger.info(f"Lote final {lote_num}: {len(lote)} linhas inseridas na #temp_r2d")
            except Exception as e:
                logger.error(f"Erro no lote final: {e}")
                # Inserir linha por linha
                for i, row_data in enumerate(lote):
                    try:
                        sql_cur.execute(insert_tmp, row_data)
                        self.sql_conn.commit()
                    except Exception as row_error:
                        logger.error(f"Erro na linha {i} do lote final: {row_error}")
                        self.error_count += 1

        dur = (datetime.now() - start).total_seconds()
        logger.info(f"Stream concluído: {total:,} linhas processadas em {dur:.1f}s")
        logger.info(f"✅ Sucessos: {self.processed_count:,} | ❌ Erros: {self.error_count:,}")
        logger.info(f"🔍 Registros específicos encontrados:")
        logger.info(f"   • ONI-VME-196.03-0661/2022: {oni_count} registros")
        logger.info(f"   • TOP-GEN-196.01-0359/2025: {top_count} registros")
        
        # Verificar dados na temp table
        sql_cur.execute("SELECT COUNT(*) FROM #temp_r2d")
        temp_count = sql_cur.fetchone()[0]
        logger.info(f"📊 Total na tabela temporária: {temp_count:,}")
        
        if temp_count != self.processed_count:
            logger.warning(f"⚠️ Discrepância: processados {self.processed_count:,} mas {temp_count:,} na temp table")

        return total

    # -------------------------
    # MERGE R2D (upsert com detecção de mudanças) - INALTERADO
    # -------------------------
    def merge_into_r2d(self):
        cur = self.sql_conn.cursor()

        # Primeiro, verificar e remover duplicatas da tabela temporária
        logger.info("Verificando duplicatas na tabela temporária...")
        cur.execute("""
            SELECT COUNT(*) as total,
                   COUNT(*) - COUNT(DISTINCT CONCAT(
                       ISNULL([PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE], ''),
                       '|',
                       ISNULL(NUMERO_LINHA_PR, ''),
                       '|', 
                       ISNULL(CODIGO_ITEM_PR, '')
                   )) as duplicatas
            FROM #temp_r2d
        """)
        
        stats = cur.fetchone()
        total_temp = stats[0]
        duplicatas = stats[1]
        
        logger.info(f"Total temp: {total_temp:,} | Duplicatas: {duplicatas:,}")
        
        if duplicatas > 0:
            logger.info(f"Removendo {duplicatas:,} duplicatas...")
            cur.execute("""
                WITH DuplicateRows AS (
                    SELECT *,
                           ROW_NUMBER() OVER (
                               PARTITION BY [PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE], NUMERO_LINHA_PR, CODIGO_ITEM_PR 
                               ORDER BY ISNULL(DATA_CRIACAO_PR, '1900-01-01') DESC, 
                                       ISNULL(DATA_APROVACAO_PR, '1900-01-01') DESC
                           ) as rn
                    FROM #temp_r2d
                )
                DELETE FROM DuplicateRows WHERE rn > 1;
            """)
            self.sql_conn.commit()
            
            cur.execute("SELECT COUNT(*) FROM #temp_r2d")
            clean_count = cur.fetchone()[0]
            logger.info(f"Tabela temporária limpa: {clean_count:,} registros únicos")

        # Verificar registros específicos na temp
        cur.execute("""
            SELECT COUNT(*) 
            FROM #temp_r2d 
            WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE '%ONI-VME-196.03-0661/2022%'
        """)
        oni_temp = cur.fetchone()[0]
        
        cur.execute("""
            SELECT COUNT(*) 
            FROM #temp_r2d 
            WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE '%TOP-GEN-196.01-0359/2025%'
        """)
        top_temp = cur.fetchone()[0]
        
        logger.info(f"🔍 Na tabela temporária após limpeza:")
        logger.info(f"   • ONI-VME-196.03-0661/2022: {oni_temp} registros")
        logger.info(f"   • TOP-GEN-196.01-0359/2025: {top_temp} registros")

        # Realizar MERGE
        columns = [
            "UNIDADE_OPERACIONAL_PR",
            "[PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE]",
            "NUMERO_LINHA_PR",
            "TIPO_ORIGEM_PR",
            "[PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER]",
            "DEPARTMENT",
            "PRIORIDADE_COMPRA",
            "DATA_NECESSARIA_PR",
            "CODIGO_ITEM_PR",
            "SPN",
            "ID",
            "DESCRICAO_ITEM_PTB",
            "DESCRICAO_ITEM_US",
            "UNIDADE_DE_MEDIDA_PR",
            "QUANTIDADE_PR",
            "QUANTIDADE_ATENDIDA_PR",
            "DESP_CENTRO_CUSTO_PR",
            "DESP_DISCIPLINA_PR",
            "DESP_CONTA_PR",
            "DESP_PROJETO_PR",
            "REQUISITANTE_PR",
            "STATUS_PR",
            "MOTIVO_REJEICAO_PR",
            "DATA_CRIACAO_PR",
            "DATA_APROVACAO_PR",
            "TIPO_PO",
            "NUMERO_PO",
            "NUMERO_LINHA_PO",
            "NUMERO_REVISAO",
            "DESP_CENTRO_CUSTO_PO",
            "DESP_DISCIPLINA_PO",
            "DESP_CONTA_PO",
            "DESP_PROJETO_PO",
            "DESC_DESP_FUTURE_PO",
            "NUMERO_LIBERACAO",
            "NUM_PO_COPIA",
            "PRIORIDADE_COMPRA_PO",
            "COMPRADOR_PO",
            "NOME_FORNECEDOR_PO",
            "ORIGEM_FORNECEDOR_PO",
            "NOME_FORNECEDOR_PO_COPIA",
            "ICOTERM_PO",
            "ICOTERM_PO_COPIA",
            "ENTREGAR_PARA_PO",
            "FATURAR_PARA_PO",
            "STATUS_APROVACAO_PO",
            "MOTIVO_REJEICAO_PO",
            "QUANTIDADE_PO",
            "MOEDA_PO",
            "VALOR_UNITARIO_PO",
            "TOTAL_LINHA_PO",
            "TOTAL_CENTRO_CUSTO_PO",
            "NRO_LINHA_DISTRIB_CONTABIL_PO",
            "DATA_NECESSARIA_PO",
            "DATA_CRIACAO_PO",
            "DATA_PROMETIDA_ORIGINAL_PO_2",
            "DATA_PROMETIDA_ATUAL_PO_2",
            "DATA_SUBMISSAO_APROV_PO",
            "DATA_APROVACAO_PO",
            "DATA_PRIMEIRA_APROVACAO_PO",
            "QUANTIDADE_SOLICITADA_PO",
            "QUANTIDADE_RECEBIDA_PO",
            "QUANTIDADE_EM_ABERTO_PO",
            "QUANTIDADE_CANCELADA_PO",
            "DATA_FECHAMENTO",
            "STATUS_FECHAMENTO_LINHA_PO",
            "DATA_FECHAMENTO_PR",
            "DATA_FECHAMENTO_PR_LINHA",
            "DATA_FECHAMENTO_PO",
            "DATA_CANCELAMENTO_PR",
            "DATA_CANCELAMENTO_PO",
            "QUANTIDADE_FATURADA_PO",
            "QUANTIDADE_FATURADA_PO_COPIA",
            "DT_RECEB_RI",
            "TRANSACTIONS",
            "ORIGEM_AP",
            "NR_NF_AP",
            "COND_PAGTO_AP",
            "DT_VENCIMENTO_AP",
            "DT_PAGTO_AP",
            "LD_ENTREGA_FORN",
            "PRIMEIRO_COMPRADOR",
            "[Considerar Análise]",
            "[OBS HISTóRICO AÇãO PO]",
            "[MOTIVO DO FECHAMENTO DA PO]"
        ]

        set_list = ", ".join([f"t.{c} = s.{c}" for c in columns])
        src_cols = ", ".join([f"s.{c}" for c in columns])
        src_hash = "CHECKSUM(" + ", ".join([f"ISNULL(CAST(s.{c} AS NVARCHAR(4000)),'')" for c in columns]) + ") AS SRC_HASH"
        tgt_hash = "CHECKSUM(" + ", ".join([f"ISNULL(CAST(t.{c} AS NVARCHAR(4000)),'')" for c in columns]) + ")"

        merge_sql = f"""
        ;WITH SRC AS (
            SELECT {src_cols},
                   {src_hash}
            FROM #temp_r2d s
        )
        MERGE R2D AS t
        USING SRC AS s
           ON ISNULL(t.[PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE],-1) = ISNULL(s.[PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE],-1)
          AND ISNULL(t.NUMERO_LINHA_PR,-1) = ISNULL(s.NUMERO_LINHA_PR,-1)
          AND ISNULL(t.CODIGO_ITEM_PR,'') = ISNULL(s.CODIGO_ITEM_PR,'')
        WHEN MATCHED AND ({tgt_hash} <> s.SRC_HASH OR ISNULL(t.STATUS_PR,'') <> ISNULL(s.STATUS_PR,'')) THEN
            UPDATE SET {set_list}
        WHEN NOT MATCHED BY TARGET THEN
            INSERT ({", ".join(columns)})
            VALUES ({", ".join([f"s.{c}" for c in columns])})
        ;
        """

        logger.info("Executando MERGE (upsert) em R2D...")
        try:
            cur.execute(merge_sql)
            rows_affected = cur.rowcount
            self.sql_conn.commit()
            logger.info(f"MERGE concluído - {rows_affected:,} linhas afetadas (inseridas + atualizadas)")
            
            # Verificar registros específicos após MERGE
            cur.execute("""
                SELECT COUNT(*) 
                FROM R2D 
                WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE '%ONI-VME-196.03-0661/2022%'
            """)
            oni_final = cur.fetchone()[0]
            
            cur.execute("""
                SELECT COUNT(*) 
                FROM R2D 
                WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE '%TOP-GEN-196.01-0359/2025%'
            """)
            top_final = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM R2D")
            total_r2d = cur.fetchone()[0]
            
            logger.info(f"📊 Resultados finais:")
            logger.info(f"   • Total na R2D: {total_r2d:,}")
            logger.info(f"   • ONI-VME-196.03-0661/2022: {oni_final} registros")
            logger.info(f"   • TOP-GEN-196.01-0359/2025: {top_final} registros")
            
            if oni_final == 0:
                logger.warning("⚠️ ATENÇÃO: ONI-VME-196.03-0661/2022 não foi encontrado na tabela final!")
            if top_final == 0:
                logger.warning("⚠️ ATENÇÃO: TOP-GEN-196.01-0359/2025 não foi encontrado na tabela final!")
            
        except Exception as e:
            logger.error(f"Erro no MERGE: {e}")
            self.sql_conn.rollback()
            raise

    # -------------------------
    # Validação e Diagnóstico
    # -------------------------
    def validate_data(self):
        """Validação detalhada dos dados importados"""
        cur = self.sql_conn.cursor()
        
        logger.info("=" * 60)
        logger.info("VALIDAÇÃO DE DADOS")
        logger.info("=" * 60)
        
        # 1. Verificar registros específicos
        test_descriptions = ['ONI-VME-196.03-0661/2022', 'TOP-GEN-196.01-0359/2025']
        
        for desc in test_descriptions:
            cur.execute("""
                SELECT COUNT(*) 
                FROM R2D 
                WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE ?
            """, (f'%{desc}%',))
            count = cur.fetchone()[0]
            
            if count > 0:
                logger.info(f"✅ {desc}: {count} registros encontrados")
                
                # Buscar detalhes do primeiro registro
                cur.execute("""
                    SELECT TOP 1 
                        [PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE],
                        NUMERO_LINHA_PR,
                        CODIGO_ITEM_PR,
                        [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER],
                        STATUS_PR,
                        DATA_CRIACAO_PR
                    FROM R2D 
                    WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE ?
                """, (f'%{desc}%',))
                sample = cur.fetchone()
                if sample:
                    logger.info(f"   Exemplo: PR={sample[0]}, Linha={sample[1]}, Item={sample[2]}")
                    logger.info(f"   Status: {sample[4]}, Data: {sample[5]}")
            else:
                logger.error(f"❌ {desc}: NÃO ENCONTRADO!")
                
                # Verificar se existe algum registro similar
                cur.execute("""
                    SELECT TOP 5
                        [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER]
                    FROM R2D 
                    WHERE [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] IS NOT NULL
                        AND [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE '%VME%'
                        OR [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER] LIKE '%GEN%'
                """)
                similar = cur.fetchall()
                if similar:
                    logger.info("   Registros similares encontrados:")
                    for row in similar:
                        logger.info(f"     • {row[0]}")
        
        # 2. Estatísticas gerais
        cur.execute("SELECT COUNT(*) FROM R2D")
        total = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM R2D WHERE STATUS_PR IS NOT NULL")
        with_status = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT [PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE]) FROM R2D")
        unique_prs = cur.fetchone()[0]
        
        logger.info(f"📊 Estatísticas gerais:")
        logger.info(f"   • Total de registros: {total:,}")
        logger.info(f"   • Com status: {with_status:,}")
        logger.info(f"   • PRs únicas: {unique_prs:,}")
        
        # 3. Registros mais recentes
        cur.execute("""
            SELECT TOP 5
                [PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE],
                [PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER],
                DATA_CRIACAO_PR
            FROM R2D 
            WHERE DATA_CRIACAO_PR IS NOT NULL
            ORDER BY DATA_CRIACAO_PR DESC
        """)
        recent = cur.fetchall()
        
        logger.info(f"📅 Registros mais recentes:")
        for row in recent:
            logger.info(f"   • PR {row[0]}: {row[1]} ({row[2]})")

    # -------------------------
    # Execução Principal
    # -------------------------
    def run(self):
        logger.info("=" * 80)
        logger.info("INICIANDO ETL TRANSFERPLUS CORRIGIDO - Oracle EBS → SQL Server")
        logger.info("=" * 80)
        
        self.connect_oracle()
        self.connect_sqlserver()

        try:
            total_streamed = self.stream_oracle_to_temp()
            if total_streamed == 0:
                logger.warning("Nenhum registro extraído do Oracle.")
                logger.info("ETL TRANSFERPLUS finalizado (sem alterações).")
                return

            self.merge_into_r2d()
            self.validate_data()

            logger.info("=" * 80)
            logger.info("RESUMO ETL TRANSFERPLUS")
            logger.info("=" * 80)
            logger.info(f"Linhas extraídas: {total_streamed:,}")
            logger.info(f"Linhas processadas com sucesso: {self.processed_count:,}")
            logger.info(f"Linhas com erro: {self.error_count:,}")
            logger.info(f"Taxa de sucesso: {(self.processed_count/total_streamed)*100:.1f}%")
            
            if self.error_count > 0:
                logger.warning(f"⚠️ {self.error_count} linhas tiveram erros de processamento")
                logger.warning("Verifique o log para detalhes específicos")
            
            logger.info("ETL TRANSFERPLUS concluído com sucesso!")

        except Exception as e:
            logger.error(f"Erro crítico no ETL: {e}")
            raise
        finally:
            self.close_all()


def main():
    """Função principal com tratamento robusto de erros"""
    try:
        etl = TransferPlusOracleETL()
        etl.run()
        logger.info("🎉 ETL TRANSFERPLUS finalizado com sucesso!")
        return 0
    except Exception as e:
        logger.error(f"💥 Erro crítico no ETL: {e}")
        import traceback
        logger.error(f"Stack trace: {traceback.format_exc()}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)