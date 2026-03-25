#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🚀 TRANSFERPLUS API SERVER - VERSÃO COM DEBUG DETALHADO
===============================================
API Flask para o sistema TransferPlus com funcionalidades de:
    pass
- ✅ Upload de arquivos Excel (.xlsx, .xlsb, .xls)
- ✅ CORS configurado corretamente
- ✅ Autenticação via headers
- ✅ Integração com SQL Server
- ✅ Debug detalhado para inserção SQL
- ✅ Endpoints RESTful para frontend React

Autor: Agente de Programação Claude
Data: Junho 2025
"""
import re
from ldap3 import Server, Connection, ALL, SUBTREE
import os
import sys
import tempfile
import traceback
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import pyodbc
from flask import Flask, request, jsonify, render_template_string, make_response, send_from_directory, send_file
import io
import mimetypes
from flask_cors import CORS
from werkzeug.utils import secure_filename
import secrets
import time

app = Flask(__name__)

# ========================================
# 🔧 CONFIGURAÇÃO CORS EXPLÍCITA
# ========================================

# Configuração CORS mais simples para desenvolvimento
CORS(app, resources={
    r"/*": {
        "origins": ["http://10.15.3.30:9282", "http://localhost:9282", "http://127.0.0.1:5173", "http://localhost:5173", "http://transferplus.snm.local", "http://transferplus.snm.local:9282"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "x-user-name", "x-user-type"],
        "supports_credentials": False
    }
})

# Lista de origens permitidas (manter em sincronia com o CORS acima)
ALLOWED_ORIGINS = [
    "http://10.15.3.30:9282",
    "http://localhost:9282",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://transferplus.snm.local",
    "http://transferplus.snm.local:9282",
    "*"
]

# Headers explícitos para todas as responses
@app.after_request
def after_request(response):
    # Headers CORS explícitos
    origin = request.headers.get('Origin')
    # Se a origem estiver na lista permitida, repassa como allowed-origin
    if origin and origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
    
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-name, x-user-type'
    response.headers['Access-Control-Max-Age'] = '3600'
    
    # Headers de segurança
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    return response

@app.before_request
def handle_preflight():
    """Tratar requests OPTIONS (preflight) de forma explícita"""
    if request.method == "OPTIONS":
        pass
        
        # Criar response para preflight
        response = make_response()
        response.status_code = 200
        
        # Headers CORS para preflight
        origin = request.headers.get('Origin')
        if origin in ['http://localhost:5173', 'http://127.0.0.1:5173']:
            response.headers['Access-Control-Allow-Origin'] = origin
        
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-name, x-user-type'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Content-Length'] = '0'
        
        return response
    else:
        # Para requests que não são OPTIONS, continuar normalmente
        pass

@app.before_request
def log_request_info():
    pass
    
    if request.method == 'POST':
        pass
    
    # Log especial para upload
    if 'upload' in request.url:
        pass
        if request.files:
            pass
        
        # Se é POST mas não tem arquivos, pode ser problema
        if request.method == 'POST' and not request.files:
            pass
    
    # Log especial para depois do preflight
    if request.method == 'POST' and 'upload' in request.url:
        pass

# ========================================
# 🔧 SISTEMA DE SESSÕES
# ========================================

# Dicionário para armazenar sessões ativas (em produção, use Redis ou banco)
active_sessions = {}

def generate_session_token():
    """Gera um token de sessão único"""
    return secrets.token_urlsafe(32)

def is_session_valid(token):
    """Verifica se a sessão é válida"""
    if not token or token not in active_sessions:
        return False
    
    session = active_sessions[token]
    # Verificar se a sessão não expirou (24 horas)
    if datetime.now() > session['expires_at']:
        del active_sessions[token]
        return False
    
    # Renovar a sessão a cada uso (sliding expiration)
    session['expires_at'] = datetime.now() + timedelta(hours=24)
    return True

def get_user_from_session(token):
    """Retorna dados do usuário da sessão"""
    if is_session_valid(token):
        return active_sessions[token]['user']
    return None

def verify_authentication():
    """Verifica autenticação via token ou headers (compatibilidade)"""
    # Primeiro, tentar token de sessão
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.replace('Bearer ', '')
        user = get_user_from_session(token)
        if user:
            return True, None
    
    # Fallback: verificar headers antigos (compatibilidade)
    username = request.headers.get('x-user-name')
    user_type = request.headers.get('x-user-type')
    
    if not username or not user_type:
        return False, "Token de sessão ou headers de autenticação obrigatórios"
    
    if user_type == 'NO_ACCESS':
        return False, "Usuário sem permissões"
    
    return True, None

# ========================================
# 🚀 ENDPOINTS DA API
# ========================================

# Endpoint de health check
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "cors": "enabled",
        "server": "Flask",
        "timestamp": datetime.now().isoformat()
    }), 200

# Endpoint de teste para CORS
@app.route('/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    return jsonify({
        "message": "CORS test successful", 
        "method": request.method,
        "headers": dict(request.headers),
        "timestamp": datetime.now().isoformat()
    }), 200

# Endpoint de teste específico para POST
@app.route('/test-post', methods=['POST', 'OPTIONS'])
def test_post():
    pass
    if request.method == 'POST':
        return jsonify({
            "message": "POST test successful!",
            "headers": dict(request.headers),
            "json_data": request.get_json() if request.is_json else None,
            "form_data": dict(request.form) if request.form else None,
            "files": list(request.files.keys()) if request.files else None
        }), 200

# Endpoint de teste para conexão SQL Server
@app.route('/test-sql', methods=['GET', 'OPTIONS'])
def test_sql():
    """Testar conexão com SQL Server"""
    
    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({
                "status": "error",
                "message": "Falha na conexão com SQL Server",
                "timestamp": datetime.now().isoformat()
            }), 500
        
        cursor = conn.cursor()
        
        # Teste 1: Verificar versão
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        
        # Teste 2: Verificar se tabela existe
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Desembarque'
        """)
        table_exists = cursor.fetchone()[0] > 0
        
        # Teste 3: Contar registros na tabela
        registros = 0
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM [dbo].[Desembarque]")
            registros = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Conexão SQL Server OK!",
            "sql_version": version[:100],
            "table_exists": table_exists,
            "total_records": registros,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        pass
        return jsonify({
            "status": "error", 
            "message": f"Erro: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500

# ========================================
# 🔐 AUTENTICAÇÃO E LDAP
# ========================================

# Configurações do servidor LDAP
LDAP_SERVER = 'ldap://CLODC02.snm.local'
LDAP_SEARCH_BASE = 'OU=USERS,OU=SHQ,DC=snm,DC=local'
LDAP_GROUP = 'OU=GROUPS,OU=SHQ,DC=snm,DC=local'
LDAP_USER_DN = "SNM\\adm.itservices"
LDAP_PASSWORD = "xmZ7P@5vkKzg"

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    """Endpoint de login que sempre redireciona para /menu"""

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Dados de login não fornecidos"}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({"status": "error", "message": "Username e password são obrigatórios"}), 400


        # Autenticar no Active Directory
        auth_result = authenticate_user_in_ad(username, password)

        if auth_result.get("status") != "success":
            pass
            return jsonify({
                "status": "error", 
                "message": auth_result.get("message", "Credenciais inválidas")
            }), 401

        # Gerar token de sessão
        session_token = generate_session_token()

        # Dados do usuário para a sessão
        user_data = {
            "username": auth_result["username"],
            "email": auth_result["email"], 
            "user_type": auth_result["user_type"],
            "success": True,
            "groups": auth_result.get("groups", []),
            "access_level": auth_result.get("access_level"),
            "allowed_paths": auth_result.get("allowed_paths", []),
            "ou": auth_result.get("ou")
        }

        # Armazenar sessão
        active_sessions[session_token] = {
            "user": user_data,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(hours=24),
            "last_used": datetime.now()
        }


        # SEMPRE retornar sucesso e deixar o frontend decidir onde ir
        return jsonify({
            "status": "success",
            "message": "Login realizado com sucesso",
            "user": user_data,
            "session_token": session_token
        }), 200

    except Exception as e:
        pass
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Erro interno no servidor: {str(e)}"
        }), 500

def authenticate_user_in_ad(login, password):
    try:
        pass

        # 🔌 Conectar ao servidor LDAP
        server = Server(LDAP_SERVER, get_info=ALL)

        # 🔐 Conexão administrativa para busca de DN
        try:
            admin_conn = Connection(server, user=LDAP_USER_DN, password=LDAP_PASSWORD, auto_bind=True)
        except Exception as e:
            pass
            return {"status": "error", "message": "Erro interno na conexão LDAP admin."}

        # 🧠 Gera variações possíveis para localizar o usuário
        username_variants = [
            login,
            login.lower(),
            login.split('@')[0],
        ]

        user_dn = None
        user_entry = None
        search_bases = [
            'OU=USERS,OU=SHQ,DC=snm,DC=local',
            'OU=SHQ,DC=snm,DC=local',
            'DC=snm,DC=local'
        ]

        # 🔍 Tenta localizar o DN do usuário
        for base in search_bases:
            for variant in username_variants:
                filter_str = f"(sAMAccountName={variant})"
                try:
                    admin_conn.search(base, filter_str, search_scope=SUBTREE,
                                      attributes=["distinguishedName", "memberOf", "mail", "sAMAccountName", "cn"])
                    if admin_conn.entries:
                        user_entry = admin_conn.entries[0]
                        user_dn = user_entry.distinguishedName.value
                        break
                except Exception as e:
                    pass
            if user_dn:
                break

        if not user_dn:
            return {"status": "error", "message": "Usuário não encontrado no AD."}

        # 🔐 Tenta autenticar com o DN localizado
        auth_success = False
        try:
            Connection(server, user=user_dn, password=password, auto_bind=True)
            auth_success = True
        except Exception as e1:
            try:
                Connection(server, user=f"SNM\\{login.split('@')[0]}", password=password, auto_bind=True)
                auth_success = True
            except Exception as e2:
                pass
                return {"status": "error", "message": "Credenciais inválidas."}

        # 🧾 Coleta atributos do usuário
        user_groups = user_entry.memberOf.values if hasattr(user_entry, 'memberOf') else []
        user_email = user_entry.mail.value if hasattr(user_entry, 'mail') else f"{login}"
        sam_account = user_entry.sAMAccountName.value if hasattr(user_entry, 'sAMAccountName') else login
        ous = extract_ou_from_dn(user_dn)
        groups_cn = extract_cn_from_memberof(user_groups)

        # 🧠 Mapeia permissões com base em grupo
        config = determine_form_type(user_dn, groups_cn)


        return {
            "status": "success",
            "message": "Authenticated successfully",
            "username": sam_account,
            "email": user_email,
            "groups": groups_cn,
            "user_type": config["user_type"],
            "redirect_page": config["redirect_page"],
            "access_level": config["access_level"],
            "allowed_paths": config["allowed_paths"],
            "ou": ous[0] if ous else None
        }

    except Exception as e:
        pass
        traceback.print_exc()
        return {"status": "error", "message": f"Erro interno: {e}"}

def extract_ou_from_dn(dn):
    """Extrai OUs do Distinguished Name"""
    if not dn:
        return []
    
    ou_pattern = r'OU=([^,]+)'
    ous = re.findall(ou_pattern, dn, re.IGNORECASE)
    return ous

def extract_cn_from_memberof(member_of_list):
    """Extrai CNs dos grupos do memberOf"""
    if not member_of_list:
        return []
    
    groups = []
    for group_dn in member_of_list:
        cn_match = re.search(r'CN=([^,]+)', str(group_dn), re.IGNORECASE)
        if cn_match:
            groups.append(cn_match.group(1))
    return groups

def determine_form_type(user_dn, groups_cn):
    """Determina o tipo de usuário baseado no DN e grupos"""
    user_dn_lower = user_dn.lower() if user_dn else ""
    groups_lower = [g.lower() for g in groups_cn] if groups_cn else []
    
    # Verificações de admin primeiro
    admin_indicators = ['admin', 'administrator', 'ti', 'it', 'transferplus_admin']
    if any(indicator in user_dn_lower for indicator in admin_indicators) or \
       any(indicator in ' '.join(groups_lower) for indicator in admin_indicators):
        return {
            "user_type": "ADMIN",
            "redirect_page": "/menu",
            "access_level": "FULL",
            "allowed_paths": "ALL"
        }
    
    # Verificações específicas por grupo
    if any('desembarque' in group for group in groups_lower):
        return {
            "user_type": "DESEMBARQUE",
            "redirect_page": "/menu",
            "access_level": "LIMITED",
            "allowed_paths": ["desembarque", "desembarque_consulta", "desembarque_transfer"]
        }
    
    if any('conferente' in group or 'conferencia' in group for group in groups_lower):
        return {
            "user_type": "CONFERENTE",
            "redirect_page": "/menu",
            "access_level": "LIMITED",
            "allowed_paths": ["conferencia", "conferencia_consulta", "conferencia_transfer", "quarentena", "lom"]
        }
    
    if any('embarque' in group for group in groups_lower):
        return {
            "user_type": "EMBARQUE",
            "redirect_page": "/menu",
            "access_level": "LIMITED",
            "allowed_paths": ["embarque", "embarque_consulta", "embarque_transfer"]
        }
    
    # Usuário sem permissões específicas
    return {
        "user_type": "NO_ACCESS",
        "redirect_page": "/login",
        "access_level": "NONE",
        "allowed_paths": []
    }



# Endpoint para logout
@app.route('/api/logout', methods=['POST'])
def logout():
    """Endpoint para logout - remove a sessão"""
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            if token in active_sessions:
                username = active_sessions[token]['user']['username']
                del active_sessions[token]
                return jsonify({"status": "success", "message": "Logout realizado com sucesso"})
        
        return jsonify({"status": "error", "message": "Token inválido"}), 401
        
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": "Erro interno do servidor"}), 500

# Endpoint para verificar se a sessão está válida
@app.route('/api/verify-session', methods=['GET'])
def verify_session():
    """Verifica se a sessão atual é válida"""
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            user = get_user_from_session(token)
            if user:
                return jsonify({
                    "status": "success", 
                    "valid": True,
                    "user": user
                })
        
        return jsonify({"status": "error", "valid": False}), 401
        
    except Exception as e:
        pass
        return jsonify({"status": "error", "valid": False}), 500
# ========================================
# 🔐 CONFIGURAÇÃO DE AUTENTICAÇÃO
# ========================================

def verificar_admin():
    """Verificar se o usuário é administrador"""
    user_type = request.headers.get('x-user-type')
    username = request.headers.get('x-user-name')
    
    if not username:
        return False, "Username não fornecido"
    
    if user_type != 'ADMIN':
        return False, f"Usuário {username} não é administrador"
    
    return True, f"Admin {username} autenticado"

def verificar_usuario():
    """Verificar se o usuário está autenticado (qualquer tipo)"""
    username = request.headers.get('x-user-name')
    
    if not username:
        return False, "Username não fornecido"
    
    return True, f"Usuário {username} autenticado"

# ========================================
# 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS
# ========================================

def get_sql_connection():
    """Conectar ao SQL Server com múltiplas estratégias"""
    
    # Lista de strings de conexão para tentar
    connection_strings = [
        # Estratégia 1: TCP/IP com porta padrão (CLOSQL01 - funcionando)
        (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=CLOSQL01,1433;"
            "DATABASE=TransferPlus;"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
            "Connection Timeout=30;"
            "Command Timeout=300;"
        )
        
    ]
    
    for i, conn_str in enumerate(connection_strings, 1):
        try:
            pass
            
            conn = pyodbc.connect(conn_str)
            conn.autocommit = False  # Controle manual de transações
            
            # Testar a conexão
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION")
            version = cursor.fetchone()[0]
            cursor.close()
            
            return conn
            
        except Exception as e:
            pass
            continue
    
    return None

# ========================================
# 📊 PROCESSAMENTO DE ARQUIVOS EXCEL
# ========================================

def obter_dataframe_do_upload(caminho_arquivo):
    """Função para ler o arquivo Excel enviado via upload"""
    try:
        pass
        
        # Determinar engine baseado na extensão do arquivo
        extensao = caminho_arquivo.lower()
        if extensao.endswith('.xlsb'):
            engine = 'pyxlsb'
        elif extensao.endswith('.xlsx'):
            engine = 'openpyxl'
        elif extensao.endswith('.xls'):
            engine = 'xlrd'
        else:
            engine = 'openpyxl'  # Fallback
        
        # Tentar ler o arquivo com diferentes estratégias
        df = None
        
        # Estratégia 1: Tentar com o engine específico
        try:
            pass
            df = pd.read_excel(caminho_arquivo, sheet_name=0, header=0, engine=engine)
        except Exception as e1:
            pass
            
            # Estratégia 2: Tentar com openpyxl se não foi o primeiro
            if engine != 'openpyxl':
                try:
                    pass
                    df = pd.read_excel(caminho_arquivo, sheet_name=0, header=0, engine='openpyxl')
                except Exception as e2:
                    pass
            
            # Estratégia 3: Se .xlsb falhou, tentar sem especificar engine
            if df is None and extensao.endswith('.xlsb'):
                try:
                    pass
                    df = pd.read_excel(caminho_arquivo, sheet_name=0, header=0)
                except Exception as e3:
                    pass
        
        if df is None:
            pass
            return None
        
        
        # Mostrar preview das primeiras linhas
        
        return df
        
    except Exception as e:
        pass
        import traceback
        traceback.print_exc()
        return None

def processar_dados_excel(df, autor):
    """Função para processar e mapear dados do Excel para SQL Server"""
    try:
        if df is None or df.empty:
            return None, "DataFrame vazio"
        
        
        # DE/PARA: Mapeamento das colunas do Excel para a tabela SQL Server (CORRIGIDO)
        mapeamento_colunas = {
            'FROM': 'FromVessel_NavioOrigem',
            'TO': 'ToVessel_NavioDestino', 
            'Departamento': 'FromDepartment_DepartamentoOrigem',  # Corrigido
            'Departamente': 'FromDepartment_DepartamentoOrigem',  # Fallback para erro de digitação
            'SPN': 'SPN',
            'Local Alocado': 'OriginAllocatedPosition_PosicaoAlocadaOrigem',
            'Descrição do Item:': 'ItemDescription_DescricaoItem',
            'PR': 'PRNumberTMMaster_NumeroPRTMMaster',
            'Quantidade solicitada': 'QuantityToBeTransferred_QuantidadeATransferir',
            'valor': 'TotalAmount_USD_ValorTotal_USD'
        }
        
        # Criar novo DataFrame com colunas mapeadas
        df_mapeado = pd.DataFrame()
        
        # Aplicar mapeamento
        for coluna_excel, coluna_sql in mapeamento_colunas.items():
            if coluna_excel in df.columns:
                pass
                df_mapeado[coluna_sql] = df[coluna_excel]
            else:
                pass
        
        if df_mapeado.empty:
            return None, "Nenhuma coluna válida foi mapeada"
        
        # Limpeza e conversão de tipos
        
        # Campos inteiros
        campos_inteiros = ['QuantityToBeTransferred_QuantidadeATransferir']
        for campo in campos_inteiros:
            if campo in df_mapeado.columns:
                pass
                df_mapeado[campo] = pd.to_numeric(df_mapeado[campo], errors='coerce').fillna(0).astype(int)
        
        # Campos decimais
        campos_decimais = ['TotalAmount_USD_ValorTotal_USD']
        for campo in campos_decimais:
            if campo in df_mapeado.columns:
                pass
                df_mapeado[campo] = pd.to_numeric(df_mapeado[campo], errors='coerce').fillna(0.0)
        
        # Campos de texto
        campos_texto = [
            'SPN',  # Manter como string para preservar zeros à esquerda
            'FromVessel_NavioOrigem', 'ToVessel_NavioDestino', 
            'ItemDescription_DescricaoItem', 'OriginAllocatedPosition_PosicaoAlocadaOrigem',
            'PRNumberTMMaster_NumeroPRTMMaster'
        ]
        for campo in campos_texto:
            if campo in df_mapeado.columns:
                pass
                df_mapeado[campo] = df_mapeado[campo].astype(str).str.strip()
        
        # Adicionar campos de auditoria
        agora = datetime.now()
        df_mapeado['Created'] = agora
        df_mapeado['Modified'] = agora
        df_mapeado['AuthorId'] = autor if autor else 'UPLOAD_SYSTEM'
        
        # Remover linhas vazias
        df_final = df_mapeado.dropna(how='all')
        
        
        return df_final, "Processamento concluído com sucesso"
        
    except Exception as e:
        pass
        traceback.print_exc()
        return None, f"Erro no processamento: {str(e)}"

def verificar_estrutura_tabela(cursor):
    """Função para verificar detalhadamente a estrutura da tabela"""
    
    try:
        # Verificar se a tabela existe
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Desembarque' AND TABLE_SCHEMA = 'dbo'
        """)
        table_exists = cursor.fetchone()[0] > 0
        
        if not table_exists:
            return False, "Tabela 'Desembarque' não encontrada"
        
        # Obter estrutura completa da tabela
        cursor.execute("""
            SELECT 
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.NUMERIC_PRECISION,
                c.NUMERIC_SCALE,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT,
                CASE 
                    WHEN COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') = 1 
                    THEN 'YES' 
                    ELSE 'NO' 
                END as IS_IDENTITY,
                c.ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.COLUMNS c
            WHERE c.TABLE_NAME = 'Desembarque' AND c.TABLE_SCHEMA = 'dbo'
            ORDER BY c.ORDINAL_POSITION
        """)
        
        colunas = cursor.fetchall()
        
        
        colunas_identity = []
        for i, col in enumerate(colunas, 1):
            nome, tipo, tamanho, precisao, escala, nullable, default, identity, posicao = col
            
            # Formatar tamanho
            if tamanho:
                tamanho_str = str(tamanho)
            elif precisao and escala:
                tamanho_str = f"{precisao},{escala}"
            elif precisao:
                tamanho_str = str(precisao)
            else:
                tamanho_str = "-"
            
            default_str = str(default)[:14] if default else "-"
            
            
            if identity == 'YES':
                colunas_identity.append(nome)
        
        
        return True, colunas_identity
        
    except Exception as e:
        pass
        return False, f"Erro: {str(e)}"
    
def processar_valores_decimais(serie):
    """
    🧮 Corrigir valores decimais para formato DECIMAL(19,2) com truncamento e sem arredondamento.
    - Ex: 7.1899 → 7.18
    - Ex: 7 → 7.00
    - Ex: 7.1 → 7.10
    """
    import numpy as np
    import pandas as pd

    def truncar_para_duas_casas(valor):
        try:
            if pd.isna(valor):
                return 0.00
            valor = float(valor)
            return float(f"{valor:.3f}") if round(valor, 2) == valor else int(valor * 100) / 100.0
        except:
            return 0.00

    return serie.apply(truncar_para_duas_casas)

def validar_tipos_dados(df, colunas_sql):
    """Validar e converter tipos de dados antes da inserção"""
    
    problemas = []
    df_validado = df.copy()
    
    for i, col in enumerate(colunas_sql):
        if col in df_validado.columns:
            pass
            
            # Estatísticas básicas da coluna
            serie = df_validado[col]
            total = len(serie)
            nulos = serie.isna().sum()
            nao_nulos = total - nulos
            
            
            if nao_nulos > 0:
                # Tipos únicos encontrados
                tipos_unicos = serie.dropna().apply(type).unique()
                
                # Amostras de valores
                amostras = serie.dropna().head(5).tolist()
                
                # Verificações específicas por tipo esperado
                if col in ['QuantityToBeTransferred_QuantidadeATransferir']:
                    # Campos inteiros
                    try:
                        # Tentar converter para int
                        convertidos = pd.to_numeric(serie, errors='coerce')
                        problemas_conversao = serie[~serie.isna() & convertidos.isna()]
                        
                        if len(problemas_conversao) > 0:
                            pass
                            problemas.append(f"Coluna {col}: {len(problemas_conversao)} valores não conversíveis para INT")
                        
                        # Aplicar conversão limpa
                        df_validado[col] = convertidos.fillna(0).astype('int64')
                        
                    except Exception as e:
                        problemas.append(f"Coluna {col}: Erro na conversão INT - {str(e)}")
                
                elif col in ['TotalAmount_USD_ValorTotal_USD']:
                    # Campo DECIMAL(19,2) - já processado pela função processar_valores_decimais
                    try:
                        # Verificar se já foi processado corretamente
                        convertidos = pd.to_numeric(serie, errors='coerce')
                        problemas_conversao = serie[~serie.isna() & convertidos.isna()]
                        
                        if len(problemas_conversao) > 0:
                            pass
                            problemas.append(f"Coluna {col}: {len(problemas_conversao)} valores não conversíveis para DECIMAL")
                        
                        # Garantir que valores estão como float com 2 casas decimais
                        df_validado[col] = convertidos.fillna(0.0).round(2).astype('float64')
                        
                    except Exception as e:
                        problemas.append(f"Coluna {col}: Erro na conversão DECIMAL - {str(e)}")
                
                elif col in ['Created', 'Modified']:
                    # Campos datetime
                    if not pd.api.types.is_datetime64_any_dtype(serie):
                        try:
                            df_validado[col] = pd.to_datetime(serie)
                        except Exception as e:
                            problemas.append(f"Coluna {col}: Erro na conversão DATETIME - {str(e)}")
                    else:
                        pass
                
                else:
                    # Campos de texto
                    try:
                        # Converter para string e verificar tamanhos
                        df_validado[col] = serie.astype(str)
                        tamanhos = df_validado[col].str.len()
                        max_tamanho = tamanhos.max()
                        
                        
                        # Verificar se há strings muito longas (>500 chars como warning)
                        strings_longas = df_validado[col][tamanhos > 500]
                        if len(strings_longas) > 0:
                            pass
                            for j, string_longa in enumerate(strings_longas.head(3)):
                                pass
                        
                        
                    except Exception as e:
                        problemas.append(f"Coluna {col}: Erro na conversão STRING - {str(e)}")
    
    if problemas:
        pass
        for i, problema in enumerate(problemas, 1):
            pass
    else:
        pass
    
    return df_validado, problemas

def importar_para_sqlserver(df, autor):
    """📥 Importa todos os registros do DataFrame para SQL Server, com tratamento decimal e logs"""
    import pandas as pd
    import numpy as np
    from datetime import datetime
    import traceback

    if df is None or df.empty:
        return {"sucesso": False, "mensagem": "DataFrame vazio, nada para importar"}

    try:
        conn = get_sql_connection()
        if not conn:
            return {"sucesso": False, "mensagem": "🚫 Erro de conexão com SQL Server."}

        cursor = conn.cursor()

        # 🔍 Verificar estrutura da tabela
        estrutura_ok, colunas_identity_ou_erro = verificar_estrutura_tabela(cursor)
        if not estrutura_ok:
            cursor.close()
            conn.close()
            return {"sucesso": False, "mensagem": f"Erro de estrutura: {colunas_identity_ou_erro}"}

        colunas_identity = colunas_identity_ou_erro if isinstance(colunas_identity_ou_erro, list) else []
        if 'Id' not in colunas_identity:
            colunas_identity.append('Id')

        # 🧱 Obter colunas da tabela
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Desembarque' AND TABLE_SCHEMA = 'dbo'
            ORDER BY ORDINAL_POSITION
        """)
        todas_colunas = [row[0] for row in cursor.fetchall()]
        colunas_disponiveis = [col for col in todas_colunas if col not in colunas_identity]
        colunas_validas = [col for col in df.columns if col in colunas_disponiveis]

        if 'Id' in colunas_validas:
            colunas_validas.remove('Id')

        if not colunas_validas:
            cursor.close()
            conn.close()
            return {"sucesso": False, "mensagem": "Nenhuma coluna válida para importação."}

        # 🛠️ Ajustar dados para inserção
        df_filtrado = df[colunas_validas].copy()

        if 'TotalAmount_USD_ValorTotal_USD' in df_filtrado.columns:
            pass
            df_filtrado['TotalAmount_USD_ValorTotal_USD'] = processar_valores_decimais(df_filtrado['TotalAmount_USD_ValorTotal_USD'])

        # 🧪 Validar tipos
        df_validado, problemas_validacao = validar_tipos_dados(df_filtrado, colunas_validas)
        if problemas_validacao:
            pass
            for problema in problemas_validacao:
                pass

        # 🧾 Montar query de INSERT
        colunas_str = ", ".join([f"[{col}]" for col in colunas_validas])
        placeholders = ", ".join(["?" for _ in colunas_validas])
        insert_query = f"INSERT INTO [dbo].[Desembarque] ({colunas_str}) VALUES ({placeholders})"

        total_inseridos = 0
        erros = []

        for index, row in df_validado.iterrows():
            try:
                valores = []
                for col in colunas_validas:
                    valor = row[col]
                    if pd.isna(valor):
                        valores.append(None)
                    elif isinstance(valor, (np.int64, np.int32, int)):
                        valores.append(int(valor))
                    elif isinstance(valor, (np.float64, np.float32, float)):
                        valores.append(float(valor))
                    elif isinstance(valor, (pd.Timestamp, datetime)):
                        valores.append(valor.to_pydatetime() if isinstance(valor, pd.Timestamp) else valor)
                    else:
                        valores.append(str(valor) if valor is not None else None)

                cursor.execute(insert_query, valores)
                total_inseridos += 1

                if total_inseridos % 100 == 0:
                    pass

            except Exception as err:
                pass
                erros.append({
                    "registro": index + 1,
                    "erro": str(err),
                    "valores": {col: row[col] for col in colunas_validas}
                })
                continue

        conn.commit()
        cursor.close()
        conn.close()


        return {
            "sucesso": True,
            "mensagem": f"{total_inseridos} registros inseridos com sucesso. {len(erros)} falharam.",
            "total_inseridos": total_inseridos,
            "registros_com_erro": erros
        }

    except Exception as e:
        pass
        traceback.print_exc()
        return {"sucesso": False, "mensagem": f"Erro durante a importação: {str(e)}"}




    
def extract_cn_from_memberof(memberof_list):
    cn_pattern = re.compile(r'CN=([^,]+)')
    extracted = [cn_pattern.search(group).group(1) for group in memberof_list if cn_pattern.search(group)]
    return extracted

def extract_ou_from_dn(dn):
    ou_pattern = re.compile(r'OU=([^,]+)')
    matches = ou_pattern.findall(dn)
    return matches if matches else []


@app.route("/authenticate", methods=["POST", "OPTIONS"])
def authenticate_user():
    if request.method == "OPTIONS":
        return '', 200

    try:
        pass

        if not request.is_json:
            return jsonify({"status": "error", "message": "Content-Type deve ser application/json"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Dados JSON inválidos"}), 400

        username = data.get("username") or data.get("email")  # Aceita email ou username
        password = data.get("password")

        if not username or not password:
            return jsonify({"status": "error", "message": "Username e password são obrigatórios"}), 400


        resultado = authenticate_user_in_ad(username, password)

        status_code = 200 if resultado["status"] == "success" else 401
        return jsonify(resultado), status_code

    except Exception as e:
        pass
        traceback.print_exc()
        return jsonify({"status": "error", "message": "Erro interno"}), 500
    
@app.route("/api/desembarque/filtros", methods=["GET"])
def obter_filtros_desembarque():
    """
    Retorna valores únicos de cada campo usado como filtro para a tela de Desembarque,
    considerando apenas registros onde transfer_status IS NULL.
    Remove valores nulos, vazios, 'NULL' e entradas apenas com espaços.
    Agora suporta busca inteligente para SPN, ItemDescription_DescricaoItem, PRNumberTMMaster_NumeroPRTMMaster e OraclePRNumber_NumeroPROracle.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Debug: Verificar colunas existentes na tabela
        try:
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Desembarque' 
                ORDER BY COLUMN_NAME
            """)
            colunas_existentes = [row[0] for row in cursor.fetchall()]
        except Exception as col_error:
            pass

        # Campos que usam dropdown simples - usando nomes corretos da tabela
        campos_dropdown = [
            "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino", 
            "FromDepartment_DepartamentoOrigem",
            "ToDepartment_DepartamentoDestino",
            "OriginAllocatedPosition",
            "transfer_status"
        ]

        # Campos que usam busca inteligente - usando nomes corretos da tabela
        campos_busca_inteligente_todos = [
            "SPN",  # 📦 SPARE PART NUMBER NO TM MASTER
            "ItemDescription_Descricao",  # 📦 DESCRIÇÃO DO ITEM
            "PRNumberTMMaster_Nome",  # 📋 PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)
            "OraclePRNumber_Numero"  # PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)
        ]
        
        # Filtrar apenas campos que existem na tabela  
        campos_busca_inteligente = [campo for campo in campos_busca_inteligente_todos if campo in colunas_existentes]

        resultado = {}

        # Processar campos com dropdown simples
        for campo in campos_dropdown:
            try:
                pass
                cursor.execute(
                    f"""
                    SELECT DISTINCT {campo}
                    FROM Desembarque
                    WHERE {campo} IS NOT NULL
                      AND transfer_status IS NULL
                    ORDER BY {campo}
                    """
                )
                valores = [
                    v for (v,) in cursor.fetchall()
                    if v and str(v).strip() not in ("", "NULL")
                ]
                resultado[campo] = sorted(valores, key=lambda x: str(x).upper())
            except Exception as campo_erro:
                pass
                # Se der erro em um campo, continuar com os outros
                resultado[campo] = []

        # Processar campos com busca inteligente (retornar todos os valores para filtrar no frontend)
        for campo in campos_busca_inteligente:
            try:
                pass
                cursor.execute(
                    f"""
                    SELECT DISTINCT {campo}
                    FROM Desembarque
                    WHERE {campo} IS NOT NULL
                      AND transfer_status IS NULL
                    ORDER BY {campo}
                    """
                )
                valores = [
                    v for (v,) in cursor.fetchall()
                    if v and str(v).strip() not in ("", "NULL")
                ]
                resultado[campo] = sorted(valores, key=lambda x: str(x).upper())
            except Exception as campo_erro:
                pass
                # Se der erro em um campo, continuar com os outros
                resultado[campo] = []

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "filtros": resultado}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/desembarque', methods=['GET'])
def buscar_desembarques():
    """🔍 Retorna registros da tabela Desembarque com filtros opcionais via query params"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    

    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Mapear filtros - usando nomes corretos da tabela
        filtros = {
            "FromVessel_NavioOrigem": request.args.get("FromVessel_NavioOrigem"),
            "ToVessel_NavioDestino": request.args.get("ToVessel_NavioDestino"),
            "FromDepartment_DepartamentoOrigem": request.args.get("FromDepartment_DepartamentoOrigem"),
            "ToDepartment_DepartamentoDestino": request.args.get("ToDepartment_DepartamentoDestino"),
            "SPN": request.args.get("SPN"),
            "ItemDescription_Descricao": request.args.get("ItemDescription_Descricao"),
            "OriginAllocatedPosition": request.args.get("OriginAllocatedPosition"),
            "PRNumberTMMaster_Nome": request.args.get("PRNumberTMMaster_Nome"),
            "OraclePRNumber_Numero": request.args.get("OraclePRNumber_Numero"),
            "transfer_status": request.args.get("transfer_status"),
        }

        arquivo_referencia = request.args.get("arquivo_referencia")
        created = request.args.get("Created")
        where_clauses = []
        parametros = []


        # Filtro por arquivo_referencia
        if arquivo_referencia:
            where_clauses.append("arquivo_referencia = ?")
            parametros.append(arquivo_referencia)

        # Filtro por Created (data de criação)
        if created:
            # Aceita busca por data (YYYY-MM-DD) ou data e hora (YYYY-MM-DD HH:MM:SS)
            created_sql = created.replace('+', ' ')
            if len(created_sql) > 10:
                # Busca por data e hora
                where_clauses.append("CONVERT(VARCHAR, Created, 120) LIKE ?")
                parametros.append(f"%{created_sql}%")
            else:
                # Busca apenas por data
                where_clauses.append("CONVERT(VARCHAR, Created, 23) LIKE ?")
                parametros.append(f"%{created_sql}%")

        # Adicionar demais filtros opcionais
        for campo, valor in filtros.items():
            if valor:
                where_clauses.append(f"{campo} LIKE ?")
                parametros.append(f"%{valor}%")

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # 🆕 Adicionar filtro para transfer_status APENAS se não houver arquivo_referencia especificado
        # Quando busca por arquivo específico, deve trazer TODOS os registros daquele arquivo
        if not arquivo_referencia:
            if not where_clauses:
                where_sql = "WHERE transfer_status IS NULL OR transfer_status = '' OR transfer_status = 'PENDENTE'"
            else:
                # Se já tem filtros, adicionar condição de status se não foi especificado
                if not filtros.get("transfer_status"):
                    where_sql += " AND (transfer_status IS NULL OR transfer_status = '' OR transfer_status = 'PENDENTE')"

        query = f"""
        SELECT 
            Id AS id,
            FromVessel_NavioOrigem,
            ToVessel_NavioDestino,
            FromDepartment_DepartamentoOrigem,
            ToDepartment_DepartamentoDestino,
            SPN,
            ItemDescription_Descricao,
            OriginAllocatedPosition,
            PRNumberTMMaster_Nome,
            OraclePRNumber_Numero,
            QuantityToBeTransferred,
            CASE 
                WHEN QuantityToBeTransferred IS NOT NULL 
                     AND QuantityToBeTransferred != 0 
                     AND TotalAmount_USD_Valor IS NOT NULL
                THEN TotalAmount_USD_Valor / QuantityToBeTransferred
                ELSE NULL
            END AS UnitValue_USD_ValorUnitario_USD,
            TotalAmount_USD_Valor,
            transfer_status,
            arquivo_referencia,
            Created
        FROM [dbo].[Desembarque]
        {where_sql}
        ORDER BY Created DESC
        """

        
        cursor.execute(query, parametros)
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        data = [dict(zip(col_names, row)) for row in rows]
        
        if len(data) > 0:
            pass
        
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "data": data}), 200
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})

    except Exception as e:
        pass
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/desembarque/consulta', methods=['GET'])
def consultar_desembarques():
   """Retorna registros da view VW_RD2_MOV_CONSULTA com filtros"""
   
   # Verificar autenticação
   is_auth, error_msg = verify_authentication()
   if not is_auth:
       return jsonify({"status": "error", "message": error_msg}), 401
   
   conn = None
   cursor = None
   
   try:
       conn = get_sql_connection()
       cursor = conn.cursor()


       # Mapear filtros do frontend para nomes corretos da tabela conferencia
       filtros_frontend_para_db = {
           "FromVessel_NavioOrigem": "FromVessel_NavioOrigem",
           "ToVessel_NavioDestino": "ToVessel_NavioDestino",
           "FromDepartment_DepartamentoOrigem": "FromDepartment_DepartamentoOrigem",
           "ToDepartment_DepartamentoDestino": "ToDepartment_DepartamentoDestino",
           "SPN": "SPN",
           "ItemDescription_Descricao": "ItemDescription_Descricao",
           "OriginAllocatedPosition": "OriginAllocatedPosition",
           "PRNumberTMMaster_Nome": "PRNumberTMMaster_Nome",
           "status_movimentacao": "status_final",
       }

       where_clauses = []
       parametros = []

       # Processar filtros recebidos
       for campo_frontend, campo_db in filtros_frontend_para_db.items():
           valor = request.args.get(campo_frontend)
           if valor:
               where_clauses.append(f"[{campo_db}] LIKE ?")
               parametros.append(f"%{valor}%")

       where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""


       query = f"""
       SELECT 
             [Id] AS id,
             [FromVessel_NavioOrigem],
             [ToVessel_NavioDestino],
             [FromDepartment_DepartamentoOrigem],
             [ToDepartment_DepartamentoDestino],
             [PRNumberTMMaster_Nome] AS PRNumberTMMaster_NumeroPRTMMaster,
             [OraclePRNumber_Numero] AS OraclePRNumber_NumeroPROracle,
             [SPN],
             [ItemDescription_Descricao] AS ItemDescription_DescricaoItem,
             [OriginAllocatedPosition] AS OriginAllocatedPosition_PosicaoAlocadaOrigem,
             [QuantityToBeTransferred] AS QuantityToBeTransferred_QuantidadeATransferir,
             [lom] AS LOM,
             [desembarque_quantidade] AS conferencia_quantidade_conferida,
             [conferencia_responsavel],
             [conferencia_quantidade] AS embarque_quantidade_conferida,
             CASE 
                 WHEN QuantityToBeTransferred IS NOT NULL 
                      AND QuantityToBeTransferred != 0 
                      AND TotalAmount_USD_Valor IS NOT NULL
                 THEN TotalAmount_USD_Valor / QuantityToBeTransferred
                 ELSE NULL
             END AS UnitValue_USD_ValorUnitario_USD,
             [TotalAmount_USD_Valor] AS TotalAmount_USD_ValorTotal_USD,
             [observacao] AS observacao_movimentacao,
             [status_final] AS status_movimentacao
       FROM [dbo].[conferencia]
       {where_sql}
       ORDER BY [Id] DESC
       """

       cursor.execute(query, parametros)
       rows = cursor.fetchall()
       columns = [desc[0] for desc in cursor.description]
       data = [dict(zip(columns, row)) for row in rows]

       if len(data) > 0:
           pass

       return jsonify({"status": "success", "data": data})

   except Exception as e:
       pass
       traceback.print_exc()
       return jsonify({"status": "error", "message": str(e)}), 500

   finally:
       if cursor:
           cursor.close()
       if conn:
           conn.close()


@app.route("/api/desembarque/filtros_consulta", methods=["GET"])
def obter_filtros_consulta_desembarque():
    """
    Retorna valores únicos de cada campo usado como filtro para a tela de Consulta de Desembarque.
    Usa a view VW_RD2_MOV_CONSULTA para garantir consistência com a consulta.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Campos que usam dropdown simples
        # Campos que usam dropdown simples - NOMES CORRETOS DA TABELA CONFERENCIA
        campos_dropdown = {
            "FromVessel_NavioOrigem": "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino": "ToVessel_NavioDestino",
            "FromDepartment_DepartamentoOrigem": "FromDepartment_DepartamentoOrigem",
            "ToDepartment_DepartamentoDestino": "ToDepartment_DepartamentoDestino",
            "OriginAllocatedPosition": "OriginAllocatedPosition",
            "status_final": "status_movimentacao"  # status_final no DB, mas frontend espera status_movimentacao
        }

        # Campos que usam busca inteligente - NOMES CORRETOS DA TABELA CONFERENCIA
        campos_busca_inteligente = {
            "SPN": "SPN",
            "ItemDescription_Descricao": "ItemDescription_DescricaoItem",
            "PRNumberTMMaster_Nome": "PRNumberTMMaster_NumeroPRTMMaster"
        }

        resultado = {}

        # Processar campos com dropdown simples
        for campo_db, campo_frontend in campos_dropdown.items():
            try:
                cursor.execute(
                    f"""
                    SELECT DISTINCT [{campo_db}]
                    FROM [dbo].[conferencia]
                    WHERE [{campo_db}] IS NOT NULL AND [{campo_db}] != ''
                    ORDER BY [{campo_db}]
                    """
                )
                valores = [
                    v for (v,) in cursor.fetchall()
                    if v and str(v).strip() not in ("", "NULL")
                ]
                resultado[campo_frontend] = sorted(valores, key=lambda x: str(x).upper())
            except Exception as e:
                pass
                resultado[campo_frontend] = []

        # Processar campos com busca inteligente
        for campo_db, campo_frontend in campos_busca_inteligente.items():
            try:
                cursor.execute(
                    f"""
                    SELECT DISTINCT [{campo_db}]
                    FROM [dbo].[conferencia]
                    WHERE [{campo_db}] IS NOT NULL AND [{campo_db}] != ''
                    ORDER BY [{campo_db}]
                    """
                )
                valores = [
                    v for (v,) in cursor.fetchall()
                    if v and str(v).strip() not in ("", "NULL")
                ]
                resultado[campo_frontend] = sorted(valores, key=lambda x: str(x).upper())
            except Exception as e:
                pass
                resultado[campo_frontend] = []

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "filtros": resultado}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/R2D/consulta', methods=['GET'])
def consultar_r2d():
    """Retorna registros da tabela R2D com filtros"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    conn = None
    cursor = None
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()


        # Mapear filtros para campos da tabela
        filtros = {
            "PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER": request.args.get("PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER"),
            "NUMERO_PO": request.args.get("NUMERO_PO"),
            "DESCRICAO_ITEM_PTB": request.args.get("DESCRICAO_ITEM_PTB"),
            "DESCRICAO_ITEM_US": request.args.get("DESCRICAO_ITEM_US"),
            "ID": request.args.get("ID"),
            "SPN": request.args.get("SPN"),
            "STATUS_PR": request.args.get("STATUS_PR"),
            "STATUS_APROVACAO_PO": request.args.get("STATUS_APROVACAO_PO"),
            "data_inicio": request.args.get("data_inicio"),
            "data_fim": request.args.get("data_fim"),
        }


        where_clauses = []
        parametros = []

        # Adicionar filtros opcionais se presentes
        for campo, valor in filtros.items():
            if valor and campo not in ["data_inicio", "data_fim"]:
                where_clauses.append(f"{campo} LIKE ?")
                parametros.append(f"%{valor}%")

        # Tratamento especial para filtros de data
        data_inicio = filtros.get("data_inicio")
        data_fim = filtros.get("data_fim")
        
        # Converter datas do formato MM/DD/YYYY para YYYY-MM-DD
        def converter_data_para_iso(data_str):
            """Converte MM/DD/YYYY para YYYY-MM-DD"""
            if not data_str:
                return None
            try:
                # Se já está em formato YYYY-MM-DD, retorna como está
                if len(data_str) == 10 and data_str[4] == '-':
                    return data_str
                # Se está em formato MM/DD/YYYY, converte
                if len(data_str) == 10 and data_str[2] == '/':
                    partes = data_str.split('/')
                    return f"{partes[2]}-{partes[0]}-{partes[1]}"
            except:
                pass
            return data_str
        
        data_inicio = converter_data_para_iso(data_inicio)
        data_fim = converter_data_para_iso(data_fim)
        
        # DEBUG: Mostrar o que foi recebido
        
        if data_inicio and data_fim:
            where_clauses.append("DATA_CRIACAO_PO BETWEEN ? AND ?")
            parametros.extend([data_inicio, data_fim])
        elif data_inicio:
            where_clauses.append("DATA_CRIACAO_PO >= ?")
            parametros.append(data_inicio)
        elif data_fim:
            where_clauses.append("DATA_CRIACAO_PO <= ?")
            parametros.append(data_fim)

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # SELECT da tabela R2D (não da view quebrada VW_R2D)
        query = f"""
        SELECT TOP 1000
              UNIDADE_OPERACIONAL_PR
              ,PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE
              ,NUMERO_LINHA_PR
              ,PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER
              ,DEPARTMENT
              ,PRIORIDADE_COMPRA
              ,DATA_NECESSARIA_PR
              ,CODIGO_ITEM_PR
              ,SPN
              ,ID
              ,DESCRICAO_ITEM_PTB
              ,DESCRICAO_ITEM_US
              ,UNIDADE_DE_MEDIDA_PR
              ,QUANTIDADE_PR
              ,QUANTIDADE_ATENDIDA_PR
              ,DESP_CENTRO_CUSTO_PR
              ,DESP_DISCIPLINA_PR
              ,DESP_CONTA_PR
              ,STATUS_PR
              ,DATA_CRIACAO_PR
              ,NUMERO_PO
              ,NUM_PO_COPIA
              ,COMPRADOR_PO
              ,NOME_FORNECEDOR_PO
              ,ORIGEM_FORNECEDOR_PO
              ,STATUS_APROVACAO_PO
              ,MOTIVO_REJEICAO_PO
              ,QUANTIDADE_PO
              ,MOEDA_PO
              ,VALOR_UNITARIO_PO
              ,TOTAL_LINHA_PO
              ,TOTAL_CENTRO_CUSTO_PO
              ,NRO_LINHA_DISTRIB_CONTABIL_PO
              ,DATA_NECESSARIA_PO
              ,DATA_CRIACAO_PO
              ,DATA_PROMETIDA_ORIGINAL_PO_2
              ,QUANTIDADE_RECEBIDA_PO
              ,QUANTIDADE_EM_ABERTO_PO
              ,QUANTIDADE_CANCELADA_PO
              ,DATA_FECHAMENTO
              ,STATUS_FECHAMENTO_LINHA_PO
        FROM R2D
        {where_sql}
        ORDER BY DATA_CRIACAO_PO DESC
        """

        cursor.execute(query, parametros)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]
        
        if len(data) == 0:
            pass

        return jsonify({"status": "success", "data": data})

    except Exception as e:
        pass
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"{type(e).__name__}: {str(e)}"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()    

@app.route("/api/R2D/filtros_consulta", methods=["GET"])
def obter_filtros_consulta_r2d():
    """
    Retorna valores únicos de cada campo usado como filtro para a tela de Consulta R2D.
    Usa a view VW_R2D para garantir consistência com a consulta.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Campos que usam dropdown simples
        campos_dropdown = [
            "STATUS_PR",
            "STATUS_APROVACAO_PO"
        ]

        # Campos que usam busca inteligente
        campos_busca_inteligente = [
            "PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER",
            "NUMERO_PO",
            "DESCRICAO_ITEM_PTB",
            "DESCRICAO_ITEM_US",
            "ID",
            "SPN"
        ]

        resultado = {}

        # Processar campos com dropdown simples
        # Usando tabela R2D diretamente (a view VW_R2D tem binding errors)
        for campo in campos_dropdown:
            cursor.execute(
                f"""
                SELECT DISTINCT {campo}
                FROM R2D
                WHERE {campo} IS NOT NULL
                ORDER BY {campo}
                """
            )
            valores = [
                v for (v,) in cursor.fetchall()
                if v and str(v).strip() not in ("", "NULL")
            ]
            resultado[campo] = sorted(valores, key=lambda x: str(x).upper())

        # Processar campos com busca inteligente
        # Usando tabela R2D diretamente (a view VW_R2D tem binding errors)
        for campo in campos_busca_inteligente:
            cursor.execute(
                f"""
                SELECT DISTINCT {campo}
                FROM R2D
                WHERE {campo} IS NOT NULL
                ORDER BY {campo}
                """
            )
            valores = [
                v for (v,) in cursor.fetchall()
                if v and str(v).strip() not in ("", "NULL")
            ]
            resultado[campo] = sorted(valores, key=lambda x: str(x).upper())

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "filtros": resultado}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/desembarque/status", methods=["GET", "OPTIONS"])
def status_importacao():
    """API endpoint para verificar status da última importação"""
    
    # Verificar autenticação para GET
    if request.method == "GET":
        is_auth, error_msg = verify_authentication()
        if not is_auth:
            return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Se o frontend não informou um arquivo de referência, retornamos 0
        # conforme solicitado: só devemos mostrar contagem quando houver
        # um arquivo de referência selecionado.
        arquivo_referencia = request.args.get('arquivo_referencia')

        if not arquivo_referencia:
            status = {
                "total_registros": 0,
                "ultima_importacao": None,
                "total_autores": 0
            }
        else:
            # Buscar informações apenas para o arquivo de referência solicitado
            try:
                query = """
                    SELECT 
                        COUNT(*) as total_registros,
                        MAX([Created]) as ultima_importacao,
                        COUNT(DISTINCT [AuthorId]) as total_autores
                    FROM [dbo].[Desembarque]
                    WHERE [arquivo_referencia] = ?
                """
                cursor.execute(query, (arquivo_referencia,))
                result = cursor.fetchone()
                if result:
                    total_registros, ultima_importacao, total_autores = result
                    status = {
                        "total_registros": total_registros,
                        "ultima_importacao": ultima_importacao.isoformat() if ultima_importacao else None,
                        "total_autores": total_autores
                    }
                else:
                    status = {"total_registros": 0, "ultima_importacao": None, "total_autores": 0}
            except Exception as qe:
                pass
                status = {"total_registros": 0, "ultima_importacao": None, "total_autores": 0}
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "data": status
        }), 200
        
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": "Erro interno do servidor"}), 500


@app.route('/api/desembarque/origens', methods=['GET'])
def listar_origens_desembarque():
    """
    Retorna lista única de todas as origens (FromVessel_NavioOrigem) da tabela Desembarque
    que estejam ativas (transfer_status IS NULL).
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        query = """
            SELECT DISTINCT FromVessel_NavioOrigem
            FROM [dbo].[Desembarque]
            WHERE FromVessel_NavioOrigem IS NOT NULL
              AND transfer_status IS NULL
            ORDER BY FromVessel_NavioOrigem
        """
        cursor.execute(query)
        origens = [row[0] for row in cursor.fetchall() if row[0]]
        return jsonify({"status": "success", "origens": origens})
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/desembarque/destinos', methods=['GET'])
def listar_destinos_desembarque():
    """
    Retorna lista única de todos os destinos (ToVessel_NavioDestino) da tabela Desembarque
    que estejam ativas (transfer_status IS NULL).
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        query = """
            SELECT DISTINCT ToVessel_NavioDestino
            FROM [dbo].[Desembarque]
            WHERE ToVessel_NavioDestino IS NOT NULL
              AND transfer_status IS NULL
            ORDER BY ToVessel_NavioDestino
        """
        cursor.execute(query)
        destinos = [row[0] for row in cursor.fetchall() if row[0]]
        return jsonify({"status": "success", "destinos": destinos})
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/desembarque/files", methods=["GET", "OPTIONS"])
def get_available_files():
    """API endpoint para buscar arquivos de referência disponíveis via AJAX."""
    
    # Verificar autenticação para GET
    if request.method == "GET":
        is_auth, error_msg = verify_authentication()
        if not is_auth:
            return jsonify({"status": "error", "message": error_msg}), 401

    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        # 🆕 Debug: Verificar total de registros na tabela Desembarque
        cursor.execute("SELECT COUNT(*) FROM [dbo].[Desembarque]")
        total_registros = cursor.fetchone()[0]

        # 🆕 Debug: Verificar registros com arquivo_referencia
        cursor.execute("SELECT COUNT(*) FROM [dbo].[Desembarque] WHERE [arquivo_referencia] IS NOT NULL")
        total_com_arquivo = cursor.fetchone()[0]

        # 🆕 REMOVER FILTRO DE transfer_status - buscar TODOS os arquivos
        cursor.execute("""
            SELECT
                [arquivo_referencia],
                MAX([Created]) as ultima_importacao,
                COUNT(*) as total,
                MAX([PRNumberTMMaster_Nome]) as pr_tm_master
            FROM [dbo].[Desembarque]
            WHERE [arquivo_referencia] IS NOT NULL
            GROUP BY [arquivo_referencia]
            ORDER BY MAX([Created]) DESC
        """)
        rows_files = cursor.fetchall()
        available_files = []
        
        for row in rows_files:
            if not row[0]:
                continue
            file_name = row[0]
            ultima_importacao = row[1] if len(row) > 1 else None
            total_count = row[2] if len(row) > 2 else None
            pr_tm_master = row[3] if len(row) > 3 else None

            # Montar display amigável
            display_name = str(file_name)
            try:
                # Se começa com "INDIVIDUAL-", é um registro manual
                if str(file_name).startswith("INDIVIDUAL-"):
                    if pr_tm_master:
                        display_name = f"📋 PR TM MASTER: {pr_tm_master}"
                    else:
                        display_name = "📋 PR TM MASTER: (não informado)"
                
                # Se contém "||", é upload de Excel com timestamp
                elif '||' in str(file_name):
                    parts = str(file_name).split('||')
                    fname = parts[0]
                    ts = parts[1] if len(parts) > 1 else None
                    if ts:
                        try:
                            from datetime import datetime as _dt
                            dt = _dt.fromisoformat(ts)
                            display_ts = dt.strftime('%d/%m/%Y %H:%M:%S')
                        except Exception:
                            display_ts = ts
                        display_name = f"📄 {fname} ({display_ts})"
                    else:
                        display_name = f"📄 {fname}"
                else:
                    display_name = f"📄 {str(file_name)}"
            except Exception:
                display_name = str(file_name)

            entry = {
                "type": "arquivo_referencia",
                "value": file_name,
                "display": display_name
            }
            if ultima_importacao:
                try:
                    entry["ultima_importacao"] = (ultima_importacao.isoformat()
                                                   if hasattr(ultima_importacao, 'isoformat')
                                                   else str(ultima_importacao))
                except Exception:
                    entry["ultima_importacao"] = str(ultima_importacao)
            if total_count is not None:
                entry["total"] = int(total_count)

            available_files.append(entry)

        cursor.close()
        conn.close()

        for f in available_files:
            pass

        return jsonify({
            "status": "success",
            "files": available_files,
            "dates": []  # Removido pois agora tudo vem como arquivo_referencia
        }), 200

    except Exception as e:
        pass
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": "Erro interno do servidor"}), 500

@app.route("/api/desembarque/upload", methods=["POST", "OPTIONS"])
def upload_excel():
   """Upload de arquivo Excel - APENAS PARA ADMINS"""
   # Verificar autenticação apenas para POST
   if request.method == 'POST':
       try:
           is_auth, error_msg = verify_authentication()
           if not is_auth:
               pass
               return jsonify({"status": "error", "message": error_msg}), 401

           # Obter dados do usuário da sessão ou headers
           username = None
           user_type = None

           # Tentar obter via token primeiro
           auth_header = request.headers.get('Authorization')
           if auth_header and auth_header.startswith('Bearer '):
               token = auth_header.replace('Bearer ', '')
               user = get_user_from_session(token)
               if user:
                   username = user.get('username')
                   user_type = user.get('user_type')

           # Fallback para headers antigos se token não funcionou
           if not username:
               username = request.headers.get('x-user-name')
               user_type = request.headers.get('x-user-type')
               if username:
                   pass

           # Verificar se conseguiu obter dados do usuário
           if not username or not user_type:
               pass
               return jsonify({"status": "error", "message": "Dados de usuário não encontrados"}), 401

           # Verificar se é admin
           if user_type != 'ADMIN':
               pass
               return jsonify({"status": "error", "message": "Admin access required"}), 403


       except Exception as e:
           pass
           traceback.print_exc()
           return jsonify({"status": "error", "message": "Erro na verificação de autenticação"}), 500

   # Variáveis de controle para cleanup
   tmp_file_path = None
   dup_path = None
   conn = None
   cursor = None

   try:
       pass

       # Verificar se existe arquivo no request
       if 'arquivo_excel' not in request.files:
           return jsonify({"status": "error", "message": "Nenhum arquivo enviado"}), 400

       arquivo = request.files['arquivo_excel']

       # Verificar se arquivo foi selecionado
       if not arquivo or arquivo.filename == '':
           return jsonify({"status": "error", "message": "Nenhum arquivo selecionado"}), 400


       # Preparar nome do arquivo em lowercase para validações
       nome_arquivo = arquivo.filename.lower()

       # Validar extensão do arquivo
       extensoes_validas = ['.xlsx', '.xlsb', '.xls']
       if not any(nome_arquivo.endswith(ext) for ext in extensoes_validas):
           return jsonify({
               "status": "error",
               "message": f"Arquivo deve ter uma das extensões: {', '.join(extensoes_validas)}"
           }), 400


       # Salvar arquivo temporariamente com extensão original
       try:
           file_extension = os.path.splitext(arquivo.filename)[1]
           with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
               arquivo.save(tmp_file.name)
               tmp_file_path = tmp_file.name
       except Exception as e:
           pass
           traceback.print_exc()
           return jsonify({"status": "error", "message": f"Erro ao salvar arquivo temporário: {str(e)}"}), 500

       # Ler arquivo Excel
       df = ler_arquivo_excel(tmp_file_path)
       if df is None or df.empty:
           return jsonify({"status": "error", "message": "Falha ao carregar o arquivo Excel ou arquivo vazio."}), 400

       # Processar e mapear dados com validação (incluindo nome do arquivo)
       resultado_processamento = processar_excel_desembarque(df, username, arquivo.filename)
       if not resultado_processamento.get("sucesso", False):
           return jsonify({
               "status": "error",
               "message": resultado_processamento.get("mensagem", "Erro no processamento"),
               "divergencias": resultado_processamento.get("divergencias", []),
               "colunas_faltantes": resultado_processamento.get("colunas_faltantes", []),
               "linha_exemplo": resultado_processamento.get("linha_exemplo")
           }), 400

       df_processado = resultado_processamento["dataframe"]
       # Gerar referência única para este upload: filename + '||' + ISO timestamp
       try:
           import datetime as _dt
           import_timestamp = _dt.datetime.now()
           arquivo_referencia_full = f"{arquivo.filename}||{import_timestamp.isoformat()}"
           # Sobrescrever a coluna arquivo_referencia para todas as linhas com o valor único
           df_processado['arquivo_referencia'] = arquivo_referencia_full
           # Também ajustar a coluna Created para manter o timestamp de importação
           if 'Created' in df_processado.columns:
               df_processado['Created'] = import_timestamp
       except Exception as e:
           pass
           arquivo_referencia_full = arquivo.filename
       divergencias = resultado_processamento.get("divergencias", [])

       # Debug final: verificar valores do SPN após processamento
       if 'SPN' in df_processado.columns and len(df_processado) > 0:
           spn_samples = df_processado['SPN'].head(3).tolist()
           for i, spn in enumerate(spn_samples):
               pass

       try:
           pass
       except Exception:
           pass

       # Importar para SQL Server - inserção por linha com verificação de PR duplicada
       conn = get_sql_connection()
       if not conn:
           return jsonify({"status": "error", "message": "Falha ao conectar ao banco de dados"}), 500
       cursor = conn.cursor()

       cols = list(df_processado.columns)
       insert_sql = f"INSERT INTO Desembarque ({', '.join(cols)}) VALUES ({', '.join(['?'] * len(cols))})"

       total_inseridos = 0
       total_duplicados = 0
       duplicados_set = set()

       # Índice da coluna de ID na lista de colunas: preferir 'Id', senão 'IdBusinessIntelligence'
       id_col = None
       if 'Id' in cols:
           id_col = 'Id'
       elif 'IdBusinessIntelligence' in cols:
           id_col = 'IdBusinessIntelligence'
       id_idx = cols.index(id_col) if id_col in cols else None

       # Iterar linhas e inserir quando ID não existir (validação exclusiva por ID)
       for tup in df_processado.itertuples(index=False, name=None):
           id_val = ''
           try:
               if id_idx is not None:
                   id_raw = tup[id_idx]
                   if pd.isna(id_raw):
                       id_val = ''
                   else:
                       id_val = str(id_raw).strip()
                       # Truncar Id para 50 caracteres (limite do campo no banco)
                       if len(id_val) > 50:
                           pass
                           id_val = id_val[:50]

               if id_val:
                   # Verifica existência no banco pelo campo de ID selecionado
                   cursor.execute(
                       f"""
                       SELECT TOP 1 1 FROM [dbo].[Desembarque]
                       WHERE LTRIM(RTRIM(ISNULL([{id_col}], ''))) = LTRIM(RTRIM(?))
                       """,
                       (id_val,)
                   )
                   if cursor.fetchone():
                       total_duplicados += 1
                       duplicados_set.add(id_val)
                       continue

               # Converter tupla em lista para poder modificar se necessário
               tup_list = list(tup)
               
               # Se o Id foi truncado, atualizar na lista
               if id_idx is not None and id_val:
                   tup_list[id_idx] = id_val
               
               # Inserir a linha
               cursor.execute(insert_sql, tuple(tup_list))
               total_inseridos += 1
           except Exception as row_e:
               pass
               traceback.print_exc()
               # continuar processando as próximas linhas
               continue

       # Commitar todas inserções
       try:
           conn.commit()
       except Exception as commit_e:
           pass
           traceback.print_exc()

       # Se houver duplicados, gerar um excel com a lista de PRs não importadas
       duplicates_file_name = None
       if duplicados_set:
           try:
               # Gerar DataFrame de duplicados usando o nome da coluna de ID detectada
               dup_col_name = id_col if id_col else 'Id'
               dup_df = pd.DataFrame({dup_col_name: sorted(duplicados_set)})
               with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as dup_tmp:
                   dup_path = dup_tmp.name
               dup_df.to_excel(dup_path, index=False)
               duplicates_file_name = os.path.basename(dup_path)
           except Exception as dup_e:
               pass
               traceback.print_exc()

       # Resposta de sucesso com informações de importação
       response_data = {
           "status": "success",
           "message": f"Importação finalizada: {total_inseridos} inseridos, {total_duplicados} duplicados.",
           "total_registros": total_inseridos,
           "total_duplicados": total_duplicados,
           "duplicates_file": duplicates_file_name,
           "arquivo": arquivo.filename,
           "arquivo_referencia": arquivo_referencia_full
       }

       # Adicionar informações de divergências se houver
       if divergencias:
           response_data["divergencias"] = divergencias
           response_data["total_divergencias"] = len(divergencias)
           response_data["warning"] = f"Arquivo processado com sucesso, mas foram encontradas {len(divergencias)} divergências. Verifique os dados."

       return jsonify(response_data), 200

   except Exception as e:
       pass
       traceback.print_exc()
       return jsonify({"status": "error", "message": f"Erro no processamento: {str(e)}"}), 500

   finally:
       # fechar cursor/conn se existirem
       try:
           if cursor:
               cursor.close()
       except Exception:
           pass
       try:
           if conn:
               conn.close()
       except Exception:
           pass

       # limpar arquivo temporário (upload)
       try:
           if tmp_file_path and os.path.exists(tmp_file_path):
               os.unlink(tmp_file_path)
       except Exception as e:
           pass
        


@app.route('/api/desembarque/duplicates/<filename>', methods=['GET'])
def download_duplicates_file(filename):
    """Serve um arquivo de duplicados gerado no diretório temporário."""
    try:
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        if not os.path.exists(file_path):
            return jsonify({'status': 'error', 'message': 'Arquivo não encontrado'}), 404
        # Usar send_from_directory para servir o arquivo
        return send_from_directory(temp_dir, filename, as_attachment=True)
    except Exception as e:
        pass
        return jsonify({'status': 'error', 'message': str(e)}), 500


def ler_arquivo_excel(caminho_arquivo):
   """Lê arquivo Excel e retorna DataFrame"""
   try:
       # Estratégia específica para preservar zeros à esquerda na coluna F (SPN)
       # Usar converters para forçar coluna específica como string
       
       # Converter a coluna F (índice 5, base 0) especificamente para string
       converters = {5: str}  # Coluna F = SPN como string
       
       if caminho_arquivo.lower().endswith('.xlsb'):
           import pyxlsb
           # Para .xlsb com converters específicos
           df = pd.read_excel(caminho_arquivo, engine='pyxlsb', converters=converters)
       else:
           # Para .xlsx/.xls com converters específicos
           df = pd.read_excel(caminho_arquivo, converters=converters)
       
       # Debug: mostrar primeiros valores da coluna SPN (coluna F = índice 5)
       if len(df.columns) > 5:
           spn_values = df.iloc[:5, 5].tolist()
           for i, val in enumerate(spn_values):
               pass
       
       
       return df
   except Exception as e:
       pass
       return None


def processar_excel_desembarque(df, username, nome_arquivo):
   """Processa DataFrame do Excel e mapeia para colunas da tabela Desembarque por posição (A-L)"""
   try:
       # Mapeamento de colunas por posição do Excel (A-L)
       # A: IdBusinessIntelligence
       # B: FromVessel_NavioOrigem
       # C: ToVessel_NavioDestino
       # D: FromDepartment_DepartamentoOrigem
       # E: ToDepartment_DepartamentoDestino
       # F: SPN
       # G: OriginAllocatedPosition
       # H: ItemDescription_Descricao
       # I: OraclePRNumber_Numero
       # J: PRNumberTMMaster_Nome
       # K: QuantityToBeTransferred
       # L: TotalAmount_USD_Valor
       
       colunas_por_posicao = [
           'Id',                                    # A (0) - Coluna Id da tabela
           'FromVessel_NavioOrigem',                # B (1)
           'ToVessel_NavioDestino',                 # C (2)
           'FromDepartment_DepartamentoOrigem',     # D (3)
           'ToDepartment_DepartamentoDestino',      # E (4)
           'SPN',                                   # F (5)
           'OriginAllocatedPosition',               # G (6)
           'ItemDescription_Descricao',             # H (7)
           'OraclePRNumber_Numero',                 # I (8)
           'PRNumberTMMaster_Nome',                 # J (9)
           'QuantityToBeTransferred',               # K (10)
           'TotalAmount_USD_Valor'                  # L (11)
       ]
       
       
       # Ignorar a primeira linha (headers), processar a partir da linha 2
       df_sem_header = df.iloc[1:].reset_index(drop=True)
       
       # Criar DataFrame processado
       df_processado = pd.DataFrame()
       
       # Mapear cada coluna pela posição
       for idx, col_nome in enumerate(colunas_por_posicao):
           if idx < df_sem_header.shape[1]:
               df_processado[col_nome] = df_sem_header.iloc[:, idx]
           else:
               df_processado[col_nome] = None
       
       # Garantir que SPN seja mantido como string (preservar zeros à esquerda)
       if 'SPN' in df_processado.columns:
           # Processar cada valor individualmente para garantir preservação dos zeros
           def processar_spn(valor):
               if pd.isna(valor) or valor == '':
                   return ''
               
               # Se for um número (float/int), converter mantendo zeros à esquerda
               if isinstance(valor, (int, float)):
                   # Converter para string mantendo formato original
                   if valor == int(valor):  # Se for inteiro
                       return f"{int(valor):06d}"  # Pad com zeros até 6 dígitos
                   else:
                       return str(valor)
               
               # Se já é string, limpar e manter
               valor_str = str(valor).strip()
               if valor_str.lower() in ['nan', 'none', '<na>', 'null']:
                   return ''
               
               return valor_str
           
           # Aplicar processamento personalizado
           df_processado['SPN'] = df_processado['SPN'].apply(processar_spn)
           
           # Debug detalhado: mostrar alguns valores de SPN processados
           spn_samples = df_processado['SPN'].head(5).tolist()
           for i, spn in enumerate(spn_samples):
               pass
           
           # Verificação adicional para zeros à esquerda
           spn_with_zeros = df_processado[df_processado['SPN'].str.startswith('0', na=False)]['SPN'].head(5).tolist()
           if spn_with_zeros:
               pass
           else:
               pass
       
       # Calcular valor unitário automaticamente
       df_processado['UnitValue_USD_ValorUnitario'] = None
       for i, row in df_processado.iterrows():
           try:
               qtd = row['QuantityToBeTransferred']
               total = row['TotalAmount_USD_Valor']
               if qtd and total and float(qtd) != 0:
                   df_processado.at[i, 'UnitValue_USD_ValorUnitario'] = float(total) / float(qtd)
               else:
                   df_processado.at[i, 'UnitValue_USD_ValorUnitario'] = 0.0
           except Exception:
               df_processado.at[i, 'UnitValue_USD_ValorUnitario'] = 0.0
       
       # Lista para armazenar divergências
       divergencias = []
       
       # Campos obrigatórios para validação
       campos_obrigatorios = [
           'FromVessel_NavioOrigem',
           'ToVessel_NavioDestino',
           'SPN',
           'ItemDescription_Descricao',
           'PRNumberTMMaster_Nome'
       ]
       
       # Validações específicas por tipo de campo
       for idx, row in df_processado.iterrows():
           linha_excel = idx + 2  # +2 porque Excel começa na linha 2
           
           # Validar campos obrigatórios
           for col_nome in campos_obrigatorios:
               valor = row[col_nome]
               
               if pd.isna(valor) or str(valor).strip() == '':
                   divergencias.append({
                       "linha": linha_excel,
                       "coluna": col_nome,
                       "valor": valor,
                       "erro": f"Campo obrigatório '{col_nome}' está vazio",
                       "tipo": "campo_obrigatorio"
                   })
           
           # Validar campo numérico - Quantidade
           if row['QuantityToBeTransferred'] is not None:
               qtd_convertida, erro_qtd = converter_para_int_com_validacao(
                   row['QuantityToBeTransferred'], 'QuantityToBeTransferred', linha_excel
               )
               if erro_qtd:
                   divergencias.append(erro_qtd)
               else:
                   df_processado.loc[idx, 'QuantityToBeTransferred'] = qtd_convertida
           
           # Validar campo numérico - Valor Total
           if row['TotalAmount_USD_Valor'] is not None:
               valor_convertido, erro_valor = converter_para_float_com_validacao(
                   row['TotalAmount_USD_Valor'], 'TotalAmount_USD_Valor', linha_excel
               )
               if erro_valor:
                   divergencias.append(erro_valor)
               else:
                   df_processado.loc[idx, 'TotalAmount_USD_Valor'] = valor_convertido
           
           # Validar campo numérico - Valor Unitário (se presente)
           if row['UnitValue_USD_ValorUnitario'] is not None:
               valor_unit_convertido, erro_valor_unit = converter_para_float_com_validacao(
                   row['UnitValue_USD_ValorUnitario'], 'UnitValue_USD_ValorUnitario', linha_excel
               )
               if erro_valor_unit:
                   divergencias.append(erro_valor_unit)
               else:
                   df_processado.loc[idx, 'UnitValue_USD_ValorUnitario'] = valor_unit_convertido
       
       # Adicionar colunas de controle
       df_processado['AuthorId'] = username
       df_processado['Created'] = datetime.now()
       df_processado['Modified'] = None
       df_processado['transfer_status'] = None
       df_processado['sugestao_minima'] = None
       df_processado['sugestao_maxima'] = None
       df_processado['justificativa'] = None
       df_processado['arquivo_referencia'] = nome_arquivo
       
       # Remover linhas completamente vazias
       df_processado = df_processado.dropna(how='all')
       
       if divergencias:
           pass
       
       return {
           "sucesso": True,
           "dataframe": df_processado,
           "divergencias": divergencias,
           "mensagem": f"Processamento concluído com {len(df_processado)} registros"
       }
       
   except Exception as e:
       pass
       import traceback
       traceback.print_exc()
       return {
           "sucesso": False,
           "mensagem": f"Erro no processamento: {str(e)}"
       }


def processar_valor(valor, nome_coluna, linha):
   """Processa um valor individual e retorna valor limpo e possível erro"""
   try:
       if pd.isna(valor) or str(valor).strip() == '' or str(valor).lower() in ['nan', 'null', 'none']:
           return None, None
       
       valor_limpo = str(valor).strip()
       
       # Validações específicas por coluna
       if nome_coluna in ['FROM', 'TO'] and len(valor_limpo) > 50:
           return valor_limpo, {
               "linha": linha,
               "coluna": nome_coluna,
               "valor": valor_limpo,
               "erro": f"Valor muito longo (máximo 50 caracteres): {len(valor_limpo)} caracteres",
               "tipo": "tamanho_excedido"
           }
       
       return valor_limpo, None
       
   except Exception as e:
       return None, {
           "linha": linha,
           "coluna": nome_coluna,
           "valor": valor,
           "erro": f"Erro ao processar valor: {str(e)}",
           "tipo": "erro_processamento"
       }


def converter_para_int_com_validacao(valor, nome_coluna, linha):
   """Converte valor para int com validação e retorna erro se inválido"""
   try:
       if valor is None or str(valor).strip() == '':
           return None, None
       
       valor_convertido = int(float(str(valor).replace(',', '.')))
       
       if valor_convertido < 0:
           return valor_convertido, {
               "linha": linha,
               "coluna": nome_coluna,
               "valor": valor,
               "erro": f"Quantidade não pode ser negativa: {valor_convertido}",
               "tipo": "valor_invalido"
           }
       
       return valor_convertido, None
       
   except (ValueError, TypeError):
       return None, {
           "linha": linha,
           "coluna": nome_coluna,
           "valor": valor,
           "erro": f"Valor não é um número válido: '{valor}'",
           "tipo": "tipo_invalido"
       }


def converter_para_float_com_validacao(valor, nome_coluna, linha):
   """Converte valor para float com validação e retorna erro se inválido"""
   try:
       if valor is None or str(valor).strip() == '':
           return None, None
       
       valor_convertido = float(str(valor).replace(',', '.'))
       
       if valor_convertido < 0:
           return valor_convertido, {
               "linha": linha,
               "coluna": nome_coluna,
               "valor": valor,
               "erro": f"Valor não pode ser negativo: {valor_convertido}",
               "tipo": "valor_invalido"
           }
       
       return valor_convertido, None
       
   except (ValueError, TypeError):
       return None, {
           "linha": linha,
           "coluna": nome_coluna,
           "valor": valor,
           "erro": f"Valor não é um número válido: '{valor}'",
           "tipo": "tipo_invalido"
       }


def importar_para_sqlserver_desembarque(df, username):
   """Importa DataFrame para tabela Desembarque no SQL Server com novos nomes de colunas"""
   try:
       conn = get_sql_connection()
       if not conn:
           return {"sucesso": False, "mensagem": "Falha na conexão com o banco de dados"}
       
       cursor = conn.cursor()
       
       # Query de inserção com novos nomes de colunas
       insert_query = """
       INSERT INTO [dbo].[Desembarque] (
           [IdBusinessIntelligence],
           [FromVessel_NavioOrigem],
           [ToVessel_NavioDestino], 
           [FromDepartment_DepartamentoOrigem],
           [ToDepartment_DepartamentoDestino],
           [SPN],
           [OriginAllocatedPosition],
           [ItemDescription_Descricao],
           [OraclePRNumber_Numero],
           [PRNumberTMMaster_Nome],
           [QuantityToBeTransferred],
           [TotalAmount_USD_Valor],
           [UnitValue_USD_ValorUnitario],
           [AuthorId],
           [Created],
           [Modified],
           [transfer_status],
           [Desembarque_quantidade],
           [Desembarque_responsavel],
           [sugestao_minima],
           [sugestao_maxima],
           [justificativa],
           [arquivo_referencia]
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       """
       
       registros_inseridos = 0
       erros_insercao = []
       
       for index, row in df.iterrows():
           try:
               # Calcular valor unitário se não estiver presente
               valor_unitario = row.get('UnitValue_USD_ValorUnitario')
               if valor_unitario is None or valor_unitario == 0:
                   quantidade = row.get('QuantityToBeTransferred', 0)
                   valor_total = row.get('TotalAmount_USD_Valor', 0)
                   if quantidade and quantidade > 0:
                       valor_unitario = valor_total / quantidade
                   else:
                       valor_unitario = 0.0
               
               # Debug específico para SPN
               spn_value = row['SPN']
               if registros_inseridos < 3:  # Debug apenas nos primeiros registros
                   pass
               
               valores = [
                   row.get('IdBusinessIntelligence', ''),
                   row['FromVessel_NavioOrigem'],
                   row['ToVessel_NavioDestino'],
                   row['FromDepartment_DepartamentoOrigem'],
                   row['ToDepartment_DepartamentoDestino'],
                   spn_value,  # Usar variável para debug
                   row['OriginAllocatedPosition'],
                   row['ItemDescription_Descricao'],
                   row['OraclePRNumber_Numero'],
                   row['PRNumberTMMaster_Nome'],
                   row['QuantityToBeTransferred'],
                   row['TotalAmount_USD_Valor'],
                   valor_unitario,
                   row['AuthorId'],
                   row['Created'],
                   row['Modified'],
                   row['transfer_status'],
                   row.get('Desembarque_quantidade', None),
                   row.get('Desembarque_responsavel', None),
                   row.get('sugestao_minima', None),
                   row.get('sugestao_maxima', None),
                   row.get('justificativa', None),
                   row['arquivo_referencia']
               ]
               
               cursor.execute(insert_query, valores)
               registros_inseridos += 1
               
           except Exception as e:
               erro_msg = f"Erro ao inserir registro da linha {index + 2}: {str(e)}"
               erros_insercao.append(erro_msg)
               continue
       
       conn.commit()
       cursor.close()
       conn.close()
       
       
       mensagem = f"Importação realizada com sucesso! {registros_inseridos} registros inseridos."
       if erros_insercao:
           mensagem += f" {len(erros_insercao)} registros falharam na inserção."
       
       return {
           "sucesso": True,
           "mensagem": mensagem,
           "total_inseridos": registros_inseridos,
           "erros_insercao": erros_insercao
       }
       
   except Exception as e:
       pass
       traceback.print_exc()
       return {"sucesso": False, "mensagem": f"Erro na importação: {str(e)}"}
   

@app.route('/api/vessels', methods=['GET'])
def get_vessels():
    """Buscar lista de navios da tabela Vessel_Navio"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        
        query = "SELECT Vessel_Navio FROM [dbo].[Vessel_Navio] ORDER BY Vessel_Navio"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        vessels = [row[0] for row in rows]
        
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "data": vessels})
        
    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/departments', methods=['GET'])
def get_departments():
    """Buscar lista de departamentos da tabela Department_Departamento"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        
        query = "SELECT Department_Departamento FROM [dbo].[Department_Departamento] ORDER BY Department_Departamento"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        departments = [row[0] for row in rows]
        
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "data": departments})
        
    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/desembarque/inserir', methods=['POST'])
def inserir_desembarque_individual():
    """Inserir registro individual de desembarque com novos campos da tabela"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    try:
        # Aceita tanto array quanto objeto
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'Nenhum dado recebido.'}), 400

        # Ordem dos campos esperados (conforme estrutura da tabela Desembarque)
        campos = [
            "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino",
            "FromDepartment_DepartamentoOrigem",
            "ToDepartment_DepartamentoDestino",
            "SPN",
            "ItemDescription_Descricao",
            "OriginAllocatedPosition",
            "OraclePRNumber_Numero",
            "PRNumberTMMaster_Nome",
            "QuantityToBeTransferred",
            "TotalAmount_USD_Valor",
            "UnitValue_USD_ValorUnitario",
            "Created",
            "arquivo_referencia"
        ]

        # Se for objeto (dict), converter para array na ordem correta
        if isinstance(data, dict):
            pass
            
            # Mapeamento de nomes alternativos
            mapeamento = {
                "FromVessel_NavioOrigem": ["FromVessel_NavioOrigem", "FromVesselNavioOrigem", "navio_origem", "navioOrigem"],
                "ToVessel_NavioDestino": ["ToVessel_NavioDestino", "ToVesselNavioDestino", "navio_destino", "navioDestino"],
                "FromDepartment_DepartamentoOrigem": ["FromDepartment_DepartamentoOrigem", "FromDepartmentDepartamentoOrigem", "departamento_origem", "departamentoOrigem"],
                "ToDepartment_DepartamentoDestino": ["ToDepartment_DepartamentoDestino", "ToDepartmentDepartamentoDestino", "departamento_destino", "departamentoDestino"],
                "SPN": ["SPN", "spn"],
                "ItemDescription_Descricao": ["ItemDescription_Descricao", "ItemDescriptionDescricao", "descricao_item", "descricaoItem", "descricao"],
                "OriginAllocatedPosition": ["OriginAllocatedPosition", "posicao_alocada", "posicaoAlocada"],
                "OraclePRNumber_Numero": ["OraclePRNumber_Numero", "OraclePRNumberNumero", "pr_oracle", "prOracle", "oracle_pr"],
                "PRNumberTMMaster_Nome": ["PRNumberTMMaster_Nome", "PRNumberTMMasterNome", "pr_tm_master", "prTmMaster", "pr_tm"],
                "QuantityToBeTransferred": ["QuantityToBeTransferred", "quantidade", "quantidade_transferida", "quantidadeTransferida"],
                "TotalAmount_USD_Valor": ["TotalAmount_USD_Valor", "TotalAmountUSDValor", "valor_total", "valorTotal", "valor"],
                "UnitValue_USD_ValorUnitario": ["UnitValue_USD_ValorUnitario", "UnitValueUSDValorUnitario", "valor_unitario", "valorUnitario"],
                "Created": ["Created", "created", "data_criacao", "dataCriacao"],
                "arquivo_referencia": ["arquivo_referencia", "arquivoReferencia", "arquivo"]
            }
            
            valores = []
            for campo in campos:
                valor = None
                # Tentar encontrar o valor usando nomes alternativos
                for nome_alt in mapeamento.get(campo, [campo]):
                    if nome_alt in data:
                        valor = data[nome_alt]
                        break
                valores.append(valor)
            
        elif isinstance(data, list):
            pass
            valores = list(data) + [None] * (len(campos) - len(data))  # Garante tamanho
        else:
            return jsonify({'status': 'error', 'message': 'Formato inválido. Envie um objeto ou array.'}), 400


        # Validação de campos obrigatórios (UnitValue_USD_ValorUnitario, Created e arquivo_referencia são calculados/gerados automaticamente)
        campos_opcionais = ["UnitValue_USD_ValorUnitario", "Created", "arquivo_referencia"]
        obrigatorios_idx = [i for i, c in enumerate(campos) if c not in campos_opcionais]
        
        for idx in obrigatorios_idx:
            val = valores[idx] if idx < len(valores) else None
            if val is None or (isinstance(val, str) and not str(val).strip()):
                return jsonify({'status': 'error', 'message': f'Campo obrigatório na posição {idx+1} ({campos[idx]}) não informado.'}), 400

        # Ajustar/converter tipos
        # Índices após adicionar UnitValue_USD_ValorUnitario:
        # 0: FromVessel_NavioOrigem
        # 1: ToVessel_NavioDestino
        # 2: FromDepartment_DepartamentoOrigem
        # 3: ToDepartment_DepartamentoDestino
        # 4: SPN
        # 5: ItemDescription_Descricao
        # 6: OriginAllocatedPosition
        # 7: OraclePRNumber_Numero
        # 8: PRNumberTMMaster_Nome
        # 9: QuantityToBeTransferred
        # 10: TotalAmount_USD_Valor
        # 11: Created
        
        try:
            if valores[4] is not None and str(valores[4]).strip() != '':
                valores[4] = int(valores[4])  # SPN
            else:
                return jsonify({'status': 'error', 'message': 'SPN é obrigatório!'}), 400
        except (ValueError, TypeError):
            return jsonify({'status': 'error', 'message': 'SPN inválido! Deve ser um número inteiro.'}), 400
        
        try:
            if valores[7] is not None and str(valores[7]).strip() != '':
                valores[7] = int(valores[7])  # OraclePRNumber_Numero
            else:
                valores[7] = None  # Opcional
        except (ValueError, TypeError):
            return jsonify({'status': 'error', 'message': 'Oracle PR Number inválido! Deve ser um número inteiro.'}), 400
        
        try:
            if valores[9] is not None and str(valores[9]).strip() != '':
                valores[9] = int(valores[9])  # QuantityToBeTransferred
            else:
                return jsonify({'status': 'error', 'message': 'Quantidade é obrigatória!'}), 400
        except (ValueError, TypeError):
            return jsonify({'status': 'error', 'message': 'Quantidade inválida! Deve ser um número inteiro.'}), 400
        
        try:
            if valores[10] is not None and str(valores[10]).strip() != '':
                valores[10] = float(str(valores[10]).replace(',', '.'))  # TotalAmount_USD_Valor
            else:
                return jsonify({'status': 'error', 'message': 'Valor Total (USD) é obrigatório!'}), 400
        except (ValueError, TypeError):
            return jsonify({'status': 'error', 'message': 'Valor Total (USD) inválido!'}), 400

        # Calcular valor unitário (Total / Quantidade)
        try:
            if valores[9] and valores[9] > 0 and valores[10]:
                valores[11] = round(valores[10] / valores[9], 2)  # UnitValue_USD_ValorUnitario
            else:
                valores[11] = 0.0
        except Exception as e:
            pass
            valores[11] = 0.0

        # Sempre gera o timestamp Created no backend (UTC-3)
        from datetime import datetime, timedelta
        br_time = datetime.utcnow() - timedelta(hours=3)
        valores[12] = br_time

        # 🆕 GERAR arquivo_referencia ÚNICO (formato: INDIVIDUAL-{timestamp})
        arquivo_ref = f"INDIVIDUAL-{br_time.strftime('%Y%m%d-%H%M%S')}"
        valores[13] = arquivo_ref

        # Gerar ID único no formato: #NavioDestino-SPN-NavioOrigem-Depto-PRTM/Ano
        try:
            navio_destino = str(valores[1]).strip() if valores[1] else ""
            spn = str(valores[4]).strip() if valores[4] else ""
            navio_origem = str(valores[0]).strip() if valores[0] else ""
            depto = str(valores[2]).strip()[:3].upper() if valores[2] else "XXX"
            pr_tm = str(valores[8]).strip() if valores[8] else "0000"
            ano = br_time.year
            
            id_gerado = f"#{navio_destino}-{spn}-{navio_origem}-{depto}-{pr_tm}/{ano}"
        except Exception as e:
            pass
            id_gerado = f"#AUTO-{br_time.strftime('%Y%m%d%H%M%S')}"

        # Inserir ID no início da lista
        valores.insert(0, id_gerado)
        campos.insert(0, "Id")

        conn = get_sql_connection()
        if not conn:
            return jsonify({'status': 'error', 'message': 'Erro ao conectar ao banco de dados'}), 500
        cursor = conn.cursor()

        # Verificação pré-inserção: bloquear se PR TM Master já existir E estiver ATIVO
        try:
            pr_value = valores[8]  # PRNumberTMMaster_Nome agora está no índice 8
            if pr_value is not None and str(pr_value).strip() != '':
                pr_norm = str(pr_value).strip()
                cursor.execute("""
                    SELECT TOP 1 Id, transfer_status FROM [dbo].[Desembarque]
                    WHERE LTRIM(RTRIM(ISNULL(PRNumberTMMaster_Nome, ''))) = LTRIM(RTRIM(?))
                      AND transfer_status IS NULL
                """, (pr_norm,))
                existing = cursor.fetchone()
                if existing:
                    pass
                    cursor.close()
                    conn.close()
                    return jsonify({'status': 'error', 'message': f'PR TM Master {pr_norm} já existe na base (ID: {existing[0]}). Registro não importado.'}), 409
                else:
                    pass
        except Exception as e:
            pass
            traceback.print_exc()

        # Montar query de INSERT com os campos corretos
        colunas_str = ", ".join([f"[{col}]" for col in campos])
        placeholders = ", ".join(["?" for _ in campos])
        insert_sql = f"INSERT INTO [dbo].[Desembarque] ({colunas_str}) VALUES ({placeholders})"


        cursor.execute(insert_sql, valores)
        
        # Também inserir na tabela embarque para que apareça na lista de embarque
        # A tabela embarque não tem: UnitValue_USD_ValorUnitario, Created e arquivo_referencia
        campos_embarque = [c for c in campos if c not in ['UnitValue_USD_ValorUnitario', 'Created', 'arquivo_referencia']]
        valores_embarque = []
        for i, campo in enumerate(campos):
            if campo not in ['UnitValue_USD_ValorUnitario', 'Created', 'arquivo_referencia']:
                valores_embarque.append(valores[i])
        
        colunas_embarque_str = ", ".join([f"[{col}]" for col in campos_embarque])
        placeholders_embarque = ", ".join(["?" for _ in campos_embarque])
        insert_embarque_sql = f"INSERT INTO [dbo].[embarque] ({colunas_embarque_str}, [status_final]) VALUES ({placeholders_embarque}, ?)"
        valores_embarque.append("Pendente")
        
        
        cursor.execute(insert_embarque_sql, valores_embarque)
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'status': 'success', 'message': 'Registro inserido com sucesso em Desembarque e Embarque.'}), 200

    except Exception as e:
        pass
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route("/api/desembarque/filtros_consulta", methods=["GET"])
def obter_filtros_desembarque_consulta():
   """
   Retorna valores únicos de cada campo usado como filtro 
   para a tela de Desembarque Consulta.
   Remove valores nulos, vazios, 'NULL' e entradas apenas com espaços.
   Usa a view VW_RD2_MOV_CONSULTA.
   """
   
   # Verificar autenticação
   is_auth, error_msg = verify_authentication()
   if not is_auth:
       return jsonify({"status": "error", "message": error_msg}), 401
   
   try:
       conn = get_sql_connection()
       cursor = conn.cursor()

       # Query usando a view
       query = """
       SELECT [id]
             ,[RD2_UNIDADE_OPERACIONAL_PR]
             ,[RD2_REQUISITANTE_PR]
             ,[RD2_PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER]
             ,[RD2_NUMERO_LINHA_PR]
             ,[RD2_STATUS_PR]
             ,[RD2_VALOR_UNITARIO_PO]
             ,[RD2_TOTAL_LINHA_PO]
             ,[FromVessel_NavioOrigem]
             ,[ToVessel_NavioDestino]
             ,[FromDepartment_DepartamentoOrigem]
             ,[ToDepartment_DepartamentoDestino]
             ,[PRNumberTMMaster_NumeroPRTMMaster]
             ,[PR_MT_MASTER_MIGRACAO_ORACLE]
             ,[OraclePRNumber_NumeroPROracle]
             ,[SPN]
             ,[ItemDescription_DescricaoItem]
             ,[OriginAllocatedPosition_PosicaoAlocadaOrigem]
             ,[QuantityToBeTransferred_QuantidadeATransferir]
             ,[LOM]
             ,[UnitValue_USD_ValorUnitario_USD]
             ,[TotalAmount_USD_ValorTotal_USD]
             ,[arquivo_referencia]
             ,[observacao_movimentacao]
             ,[status_movimentacao]
       FROM [dbo].[VW_RD2_MOV_CONSULTA]
       """

       cursor.execute(query)
       dados = cursor.fetchall()

       # Campos filtráveis com seus índices na view
       campos_filtro = {
           'FromVessel_NavioOrigem': 8,
           'ToVessel_NavioDestino': 9,
           'FromDepartment_DepartamentoOrigem': 10,
           'ToDepartment_DepartamentoDestino': 11,
           'OriginAllocatedPosition_PosicaoAlocadaOrigem': 17,
           'SPN': 15,
           'ItemDescription_DescricaoItem': 16,
           'PRNumberTMMaster_NumeroPRTMMaster': 12,
           'status_movimentacao': 28  # status_movimentacao
       }

       resultado = {}

       # Processar cada campo filtrável
       for campo, indice in campos_filtro.items():
           valores = set()
           
           for linha in dados:
               valor = linha[indice]
               if valor and str(valor).strip() not in ("", "NULL"):
                   valores.add(valor)
           
           resultado[campo] = sorted(list(valores), key=lambda x: str(x).upper())

       cursor.close()
       conn.close()

       return jsonify({"status": "success", "filtros": resultado}), 200

   except Exception as e:
       import traceback
       return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/desembarque/confirmar", methods=["POST"])
def inserir_conferencia():
    """Confirmar/transferir registro de desembarque para conferência"""
    
    for key, value in request.headers:
        pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        pass
        return jsonify({"status": "error", "message": error_msg}), 401
    
    
    try:
        pass
        data = request.get_json()
        
        if not data:
            pass
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400


        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Falha ao conectar com o banco de dados"}), 500

        cursor = conn.cursor()

        qtd_conf = (
            data.get("desembarque_quantidade_conferida")
            or data.get("conf_QuantidadeConferida")
            or data.get("Desembarque_quantidade_conferida")
            or 0
        )
        try:
            qtd_conf = int(qtd_conf)
        except Exception:
            qtd_conf = 0

        # Captura status_final conforme a lógica de motivo
        motivo_padrao = data.get("motivo_padrao") or ""
        
        motivos_validos = [
            "Estoque mínimo a bordo requerido",
            "Não operacional",
            "Ajuste de Inventário",
            "Material de Contrato",
            "Material de Projeto",
            "Material em uso (WIP)",
            "Outros"
        ]
        if motivo_padrao and motivo_padrao not in motivos_validos:
            status_final = "Desembarque realizado"
        else:
            status_final = motivo_padrao or data.get("status_final") or "Aguardando Conferência Base"


        # ================================
        # QUANTIDADE = 0: só atualiza Desembarque, não faz nada em conferencia
        # ================================
        if qtd_conf == 0:
            update_desembarque_query = """
                UPDATE Desembarque
                SET transfer_status = ?,
                    Desembarque_quantidade = ?,
                    Desembarque_responsavel = ?,
                    sugestao_minima = ?,
                    sugestao_maxima = ?,
                    justificativa = ?,
                    motivo_padrao = ?
                WHERE Id = ?
            """
            
            params = (
                data.get("transfer_status") or "Finalizado",
                0,
                data.get("Desembarque_responsavel") or data.get("responsavel_conf"),
                data.get("sugestao_minima") or data.get("Sugestao_Minima"),
                data.get("sugestao_maxima") or data.get("Sugestao_Maxima"),
                data.get("justificativa") or data.get("observacao"),
                data.get("motivo_padrao"),
                data.get("id"),
            )
            
            
            cursor.execute(update_desembarque_query, params)
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Conferência finalizada (sem lançamento em conferencia pois Qtd=0)."}), 200

        # ================================
        # QUANTIDADE > 0: fluxo padrão
        # ================================
        # Função para processar datas com preservação de hora
        from datetime import datetime
        def parse_datetime(dt_str):
            pass
            if not dt_str:
                pass
                return None
            try:
                if isinstance(dt_str, str):
                    # Remove timezone e milissegundos, e converte T para espaço
                    dt_str_clean = dt_str.replace('T', ' ').split('.')[0].split('+')[0].strip()
                    
                    # Tenta primeiro com segundos (YYYY-MM-DD HH:MM:SS)
                    try:
                        parsed = datetime.strptime(dt_str_clean, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        # Se falhar, tenta sem segundos (YYYY-MM-DD HH:MM) - formato datetime-local
                        parsed = datetime.strptime(dt_str_clean, "%Y-%m-%d %H:%M")
                    
                    return parsed
                return dt_str
            except Exception as e:
                pass
                return None
        
        # Verifica se já existe conferência com o mesmo id
        cursor.execute("SELECT COUNT(1) FROM conferencia WHERE Id = ?", (data.get("id"),))
        exists = cursor.fetchone()[0]

        if exists:
            # UPDATE se já existe — NOMES EXATOS DA TABELA CONFERENCIA
            update_query = """
            UPDATE conferencia SET
                FromVessel_NavioOrigem = ?,
                ToVessel_NavioDestino = ?,
                FromDepartment_DepartamentoOrigem = ?,
                ToDepartment_DepartamentoDestino = ?,
                PRNumberTMMaster_Nome = ?,
                OraclePRNumber_Numero = ?,
                SPN = ?,
                ItemDescription_Descricao = ?,
                OriginAllocatedPosition = ?,
                QuantityToBeTransferred = ?,
                status_final = ?,
                observacao = ?,
                conferencia_responsavel = ?,
                data_inicio_quarentena = ?,
                data_fim_quarentena = ?,
                TotalAmount_USD_Valor = ?,
                lom = ?,
                desembarque_quantidade = ?
            WHERE Id = ?
            """
            cursor.execute(update_query, (
                data.get("FromVessel_NavioOrigem"),
                data.get("ToVessel_NavioDestino"),
                data.get("FromDepartment_DepartamentoOrigem"),
                data.get("ToDepartment_DepartamentoDestino"),
                data.get("PRNumberTMMaster_NumeroPRTMMaster") or data.get("PRNumberTMMaster_Nome"),
                data.get("OraclePRNumber_NumeroPROracle") or data.get("OraclePRNumber_Numero"),
                data.get("SPN"),
                data.get("ItemDescription_DescricaoItem") or data.get("ItemDescription_Descricao"),
                data.get("OriginAllocatedPosition_PosicaoAlocadaOrigem") or data.get("OriginAllocatedPosition"),
                data.get("QuantityToBeTransferred_QuantidadeATransferir") or data.get("QuantityToBeTransferred"),
                status_final,
                data.get("observacao"),
                data.get("conferencia_responsavel"),
                parse_datetime(data.get("data_inicio_quarentena")),
                parse_datetime(data.get("data_fim_quarentena")),
                data.get("TotalAmount_USD_ValorTotal_USD") or data.get("TotalAmount_USD_Valor"),
                data.get("lom"),
                qtd_conf,
                data.get("id")
            ))
        else:
            # INSERT se não existe — NOMES EXATOS DA TABELA CONFERENCIA
            insert_query = """
            INSERT INTO conferencia (
                Id,
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                FromDepartment_DepartamentoOrigem,
                ToDepartment_DepartamentoDestino,
                PRNumberTMMaster_Nome,
                OraclePRNumber_Numero,
                SPN,
                ItemDescription_Descricao,
                OriginAllocatedPosition,
                QuantityToBeTransferred,
                status_final,
                observacao,
                conferencia_responsavel,
                data_inicio_quarentena,
                data_fim_quarentena,
                TotalAmount_USD_Valor,
                lom,
                desembarque_quantidade
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            data_inicio = parse_datetime(data.get("data_inicio_quarentena"))
            data_fim = parse_datetime(data.get("data_fim_quarentena"))
            
            cursor.execute(insert_query, (
                data.get("id"),
                data.get("FromVessel_NavioOrigem"),
                data.get("ToVessel_NavioDestino"),
                data.get("FromDepartment_DepartamentoOrigem"),
                data.get("ToDepartment_DepartamentoDestino"),
                data.get("PRNumberTMMaster_NumeroPRTMMaster") or data.get("PRNumberTMMaster_Nome"),
                data.get("OraclePRNumber_NumeroPROracle") or data.get("OraclePRNumber_Numero"),
                data.get("SPN"),
                data.get("ItemDescription_DescricaoItem") or data.get("ItemDescription_Descricao"),
                data.get("OriginAllocatedPosition_PosicaoAlocadaOrigem") or data.get("OriginAllocatedPosition"),
                data.get("QuantityToBeTransferred_QuantidadeATransferir") or data.get("QuantityToBeTransferred"),
                status_final,
                data.get("observacao"),
                data.get("conferencia_responsavel"),
                data_inicio,
                data_fim,
                data.get("TotalAmount_USD_ValorTotal_USD") or data.get("TotalAmount_USD_Valor"),
                data.get("lom"),
                qtd_conf,
            ))

        # UPDATE tabela Desembarque - AGORA INCLUI motivo_padrao
        update_desembarque_query = """
        UPDATE Desembarque
        SET transfer_status = ?,
            Desembarque_quantidade = ?,
            Desembarque_responsavel = ?,
            sugestao_minima = ?,
            sugestao_maxima = ?,
            justificativa = ?,
            motivo_padrao = ?
        WHERE Id = ?
        """
        
        params_desembarque = (
            status_final,
            qtd_conf,
            data.get("responsavel_conf"),
            data.get("Sugestao_Minima"),
            data.get("Sugestao_Maxima"),
            data.get("observacao") or data.get("justificativa"),
            motivo_padrao,
            data.get("id")
        )
        
        
        cursor.execute(update_desembarque_query, params_desembarque)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Conferência registrada/atualizada e desembarque atualizado."}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/conferencia', methods=['GET'])
def buscar_conferencia():
    """🔍 Consulta a tabela 'conferencia' com filtros opcionais via query params"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        
        # 🎯 Filtros - USAR NOMES CORRETOS DA TABELA CONFERENCIA
        filtros = {
            "FromVessel_NavioOrigem": request.args.get("FromVessel_NavioOrigem"),
            "ToVessel_NavioDestino": request.args.get("ToVessel_NavioDestino"),
            "SPN": request.args.get("SPN"),
            "PRNumberTMMaster_Nome": request.args.get("PRNumberTMMaster_NumeroPRTMMaster") or request.args.get("PRNumberTMMaster_Nome"),
            "ItemDescription_Descricao": request.args.get("ItemDescription_DescricaoItem") or request.args.get("ItemDescription_Descricao"),
        }
        
        where_clauses = []
        parametros = []
        
        for campo, valor in filtros.items():
            if valor:
                where_clauses.append(f"{campo} LIKE ?")
                parametros.append(f"%{valor}%")
        
        # Filtra status_final para não trazer "Enviado para Embarque" nem "Quarentena"
        where_clauses.append("status_final NOT IN (?, ?)")
        parametros.extend(["Enviado para Embarque", "Quarentena"])
        
        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = f"""
            SELECT 
                Id AS id,
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                FromDepartment_DepartamentoOrigem,
                ToDepartment_DepartamentoDestino,
                SPN,
                ItemDescription_Descricao AS ItemDescription_DescricaoItem,
                OraclePRNumber_Numero AS OraclePRNumber_NumeroPROracle,
                OriginAllocatedPosition AS OriginAllocatedPosition_PosicaoAlocadaOrigem,
                PRNumberTMMaster_Nome AS PRNumberTMMaster_NumeroPRTMMaster,
                QuantityToBeTransferred AS QuantityToBeTransferred_QuantidadeATransferir,
                CASE 
                    WHEN QuantityToBeTransferred IS NOT NULL 
                         AND QuantityToBeTransferred != 0 
                         AND TotalAmount_USD_Valor IS NOT NULL
                    THEN TotalAmount_USD_Valor / QuantityToBeTransferred
                    ELSE NULL
                END AS UnitValue_USD_ValorUnitario_USD,
                TotalAmount_USD_Valor AS TotalAmount_USD_ValorTotal_USD,
                status_final,
                desembarque_quantidade AS desembarque_quantidade_conferida,
                CONVERT(VARCHAR(23), data_inicio_quarentena, 121) AS data_inicio_quarentena,
                CONVERT(VARCHAR(23), data_fim_quarentena, 121) AS data_fim_quarentena,
                data_insercao
            FROM [dbo].[conferencia] 
            {where_sql} 
            ORDER BY 
                CASE WHEN data_insercao IS NULL THEN 1 ELSE 0 END,
                data_insercao DESC,
                Id DESC
        """
        
        cursor.execute(query, parametros)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]
        
        return jsonify({"status": "success", "data": data})
        
    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/conferencia/dropdowns", methods=["GET"])
def conferencia_dropdowns():
    """
    Retorna os valores distintos para os campos de filtro da tabela conferencia (dropdowns).
    Oculta "Enviado para Embarque" do status_final.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        # USAR NOMES CORRETOS DA TABELA CONFERENCIA
        campos = [
            "FromVessel_NavioOrigem", "ToVessel_NavioDestino",
            "FromDepartment_DepartamentoOrigem", "ToDepartment_DepartamentoDestino",
            "PRNumberTMMaster_Nome", "OraclePRNumber_Numero",
            "SPN", "ItemDescription_Descricao", "status_final"
        ]
        result = {}
        for campo in campos:
            query = f"SELECT DISTINCT {campo} FROM conferencia WHERE {campo} IS NOT NULL AND {campo} != '' ORDER BY {campo}"
            cursor.execute(query)
            values = [str(row[0]) for row in cursor.fetchall() if row[0] is not None and str(row[0]).strip() != ""]
            # Filtra "Enviado para Embarque" apenas para status_final
            if campo == "status_final":
                values = [v for v in values if v.strip() != "Enviado para Embarque"]
            result[campo] = values
        cursor.close()
        conn.close()
        return jsonify(result), 200
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/conferencia/consulta", methods=["GET"])
def consulta_conferencia():
    """
    Realiza a consulta na tabela conferencia com base nos filtros fornecidos.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    try:
        params = request.args.to_dict()
        conn = get_sql_connection()
        cursor = conn.cursor()

        # USAR NOMES CORRETOS DA TABELA CONFERENCIA
        campos_filtro = [
            "FromVessel_NavioOrigem", "ToVessel_NavioDestino",
            "FromDepartment_DepartamentoOrigem", "ToDepartment_DepartamentoDestino",
            "PRNumberTMMaster_Nome", "OraclePRNumber_Numero",
            "SPN", "ItemDescription_Descricao", "status_final"
        ]
        
        # SELECT com aliases para compatibilidade com frontend
        query = """
            SELECT 
                Id AS id,
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                FromDepartment_DepartamentoOrigem,
                ToDepartment_DepartamentoDestino,
                PRNumberTMMaster_Nome AS PRNumberTMMaster_NumeroPRTMMaster,
                OraclePRNumber_Numero AS OraclePRNumber_NumeroPROracle,
                SPN,
                ItemDescription_Descricao AS ItemDescription_DescricaoItem,
                status_final,
                observacao,
                data_inicio_quarentena,
                data_fim_quarentena,
                TotalAmount_USD_Valor AS TotalAmount_USD_ValorTotal_USD,
                desembarque_quantidade
            FROM conferencia 
            WHERE 1=1
        """
        values = []
        for campo in campos_filtro:
            if campo in params and params[campo]:
                query += f" AND {campo} = ?"
                values.append(params[campo])

        cursor.execute(query, tuple(values))
        col_names = [desc[0] for desc in cursor.description]
        data = [dict(zip(col_names, row)) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/conferencia/confirmar", methods=["POST"])
def inserir_embarque():
    """Confirmar/transferir registro de conferência para embarque"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400


        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Falha na conexão com o banco"}), 500

        cursor = conn.cursor()

        def to_int(v):
            try:
                return int(v) if v not in (None, "", "null", "None") else None
            except Exception:
                return None

        def to_sql_date(dt):
            """Converte para DATE (YYYY-MM-DD), SEM HORA"""
            if not dt:
                return None
            try:
                if isinstance(dt, str) and "T" in dt:
                    return dt.split("T")[0]
                if isinstance(dt, str) and len(dt) == 10:
                    return dt
                return None
            except Exception:
                return None

        def to_sql_datetime(dt):
            """Converte para DATETIME (YYYY-MM-DD HH:MM:SS), PRESERVA HORA"""
            if not dt:
                return None
            try:
                from datetime import datetime
                if isinstance(dt, str):
                    # Se já tem T, substituir por espaço
                    if "T" in dt:
                        dt = dt.replace("T", " ")
                    # Remover milissegundos e timezone se houver
                    if "." in dt:
                        dt = dt.split(".")[0]
                    if "+" in dt:
                        dt = dt.split("+")[0]
                    # Tentar parsear
                    parsed = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")
                    return parsed
                elif isinstance(dt, datetime):
                    return dt
                return None
            except Exception as e:
                pass
                return None

        def to_nullable_str(v):
            """Retorna None para valores nulos/vazios/espacos"""
            if v is None:
                return None
            if isinstance(v, str) and not v.strip():
                return None
            if str(v).lower() in ("none", "null", ""):
                return None
            return str(v).strip()

        # ID é string, não converter para int!
        id_ = data.get("id")
        conferencia_qtd = to_int(data.get("conferencia_quantidade_conferida"))
        embarque_qtd = to_int(data.get("embarque_quantidade_conferida"))
        data_inicio_quarentena = to_sql_datetime(data.get("data_inicio_quarentena"))
        data_inicio_quarentena = to_sql_datetime(data.get("data_inicio_quarentena"))
        lom_valor = to_nullable_str(data.get("lom"))
        
        # Log para debug

        # -- Checa se ID existe na embarque
        cursor.execute("SELECT COUNT(1) FROM embarque WHERE id = ?", (id_,))
        exists_embarque = cursor.fetchone()[0]

        # -- Checa se ID existe na conferencia
        cursor.execute("SELECT COUNT(1) FROM conferencia WHERE id = ?", (id_,))
        exists_conferencia = cursor.fetchone()[0]

        update_insert_values = [
            data.get("FromVessel_NavioOrigem"),
            data.get("ToVessel_NavioDestino"),
            data.get("FromDepartment_DepartamentoOrigem"),
            data.get("ToDepartment_DepartamentoDestino"),
            data.get("PRNumberTMMaster_NumeroPRTMMaster"),
            data.get("OraclePRNumber_NumeroPROracle"),
            data.get("SPN"),
            data.get("ItemDescription_DescricaoItem"),
            data.get("OriginAllocatedPosition_PosicaoAlocadaOrigem"),
            data.get("QuantityToBeTransferred_QuantidadeATransferir"),
            conferencia_qtd,
            embarque_qtd,
            data.get("motivo_padrao") or data.get("status_final"),
            data.get("observacao"),
            data.get("responsavel_conf"),
            data_inicio_quarentena or None,
            data.get("TotalAmount_USD_ValorTotal_USD"),
            lom_valor,  # <- Sempre normalizado para None se vazio!
        ]

        if exists_embarque:
            # UPDATE - USAR NOMES CORRETOS DA TABELA EMBARQUE
            update_embarque_query = """
            UPDATE embarque SET
                FromVessel_NavioOrigem = ?,
                ToVessel_NavioDestino = ?,
                FromDepartment_DepartamentoOrigem = ?,
                ToDepartment_DepartamentoDestino = ?,
                PRNumberTMMaster_Nome = ?,
                OraclePRNumber_Numero = ?,
                SPN = ?,
                ItemDescription_Descricao = ?,
                OriginAllocatedPosition = ?,
                QuantityToBeTransferred = ?,
                conferencia_quantidade = ?,
                embarque_quantidade_conf = ?,
                status_final = ?,
                observacao = ?,
                responsavel_conf = ?,
                data_inicio_quarentena = ?,
                TotalAmount_USD_Valor = ?,
                lom = ?
            WHERE id = ?
            """
            cursor.execute(update_embarque_query, update_insert_values + [id_])
        else:
            # INSERT - USAR NOMES CORRETOS DA TABELA EMBARQUE
            insert_embarque_query = """
            INSERT INTO embarque (
                id,
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                FromDepartment_DepartamentoOrigem,
                ToDepartment_DepartamentoDestino,
                PRNumberTMMaster_Nome,
                OraclePRNumber_Numero,
                SPN,
                ItemDescription_Descricao,
                OriginAllocatedPosition,
                QuantityToBeTransferred,
                conferencia_quantidade,
                embarque_quantidade_conf,
                status_final,
                observacao,
                responsavel_conf,
                data_inicio_quarentena,
                TotalAmount_USD_Valor,
                lom
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(insert_embarque_query, [id_] + update_insert_values)

        if exists_conferencia:
            # UPDATE - USAR NOMES CORRETOS DA TABELA CONFERENCIA
            update_conferencia_query = """
            UPDATE conferencia
            SET 
                conf_QuantidadeConferencia = ?,
                ToDepartment_DepartamentoDestino = ?,
                status_final = ?,
                observacao = ?,
                data_inicio_quarentena = ?,
                lom = ?,
                conferencia_responsavel = ?
            WHERE Id = ?
            """
            cursor.execute(update_conferencia_query, (
                conferencia_qtd,
                data.get("ToDepartment_DepartamentoDestino"),
                data.get("motivo_padrao") or data.get("status_final"),
                data.get("observacao"),
                data_inicio_quarentena,
                lom_valor,
                data.get("responsavel_conf"),  # <- aqui entra o username/responsável
                id_
            ))
        
            # Se for quarentena, reseta data_fim_quarentena para NULL
            if (data.get("motivo_padrao") or data.get("status_final")) == "Quarentena":
                cursor.execute(
                    "UPDATE conferencia SET data_fim_quarentena = NULL WHERE id = ?", (id_,)
                )

        else:
            pass

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Registro de embarque inserido/atualizado e conferencia sincronizada."}), 200

    except Exception as e:
        pass
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"status": "error", "message": str(e)}), 500


        # ---------------------------


# ---------------------------
# Upload de imagem
# ---------------------------


@app.route("/api/conferencia/upload", methods=["POST"])
def upload_imagem_embarque():
    """Upload de imagem para conferencia/embarque.
    - Armazena blob na tabela `conferencia` (se existir) e grava metadados únicos por registro.
    - Espelha metadados na tabela `embarque` apenas para o mesmo Id (não sobrescreve outras linhas).
    """

    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401

    try:
        id_embarque = request.form.get("id_embarque") or request.form.get("id")
        arquivo = request.files.get("arquivo") or request.files.get("image")

        if not id_embarque:
            return jsonify({"status": "error", "message": "ID do embarque não foi fornecido."}), 400
        if not arquivo or not arquivo.filename:
            return jsonify({"status": "error", "message": "Nenhum arquivo recebido"}), 400

        original_basename = secure_filename(os.path.splitext(arquivo.filename)[0])
        _, ext = os.path.splitext(arquivo.filename)
        ext = ext.lower() or ".jpg"

        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]:
            return jsonify({"status": "error", "message": "Extensão não permitida"}), 400

        # Ler bytes da imagem
        imagem_bytes = arquivo.read()
        now = datetime.now()

        # Gerar nome de arquivo único por registro para evitar colisões entre registros diferentes
        unique_filename = f"{original_basename}__{str(id_embarque)}__{int(time.time())}{ext}"

        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Falha na conexão com o banco"}), 500
        cursor = conn.cursor()

        # Função utilitária para checar existência de coluna
        def column_exists(table, column_name):
            try:
                cursor.execute(
                    "SELECT COUNT(1) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?",
                    (table, column_name)
                )
                return cursor.fetchone()[0] > 0
            except Exception:
                return False

        # Verifica existência do Id em conferencia
        cursor.execute("SELECT COUNT(1) FROM conferencia WHERE Id = ?", (id_embarque,))
        exists_conf = cursor.fetchone()[0]

        if exists_conf:
            # Monta UPDATE dinâmico para conferencia, gravando blob e nome único
            target_cols = []
            params = []
            if column_exists('conferencia', 'image_bin'):
                target_cols.append('image_bin = ?')
                params.append(imagem_bytes)
            # Preferir colunas de nome comuns, sempre gravar o unique_filename nelas
            if column_exists('conferencia', 'imagem'):
                target_cols.append('imagem = ?')
                params.append(unique_filename)
            if column_exists('conferencia', 'arquivo') and 'arquivo' not in [c.split(' = ')[0] for c in target_cols]:
                target_cols.append('arquivo = ?')
                params.append(unique_filename)
            if column_exists('conferencia', 'image') and 'image' not in [c.split(' = ')[0] for c in target_cols]:
                target_cols.append('image = ?')
                params.append(unique_filename)
            if column_exists('conferencia', 'data_insercao'):
                target_cols.append('data_insercao = ?')
                params.append(now)

            if target_cols:
                update_stmt = f"UPDATE conferencia SET {', '.join(target_cols)} WHERE Id = ?"
                params.append(id_embarque)
                cursor.execute(update_stmt, params)
                conn.commit()
            else:
                pass

        # Verifica existência do Id em embarque e atualiza somente o registro correspondente
        cursor.execute("SELECT COUNT(1) FROM embarque WHERE id = ?", (id_embarque,))
        exists_emb = cursor.fetchone()[0]

        if not exists_conf and not exists_emb:
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "ID não encontrado em conferencia ou embarque."}), 404

        # Atualizar apenas o registro correspondente em embarque (espelhamento de metadados)
        emb_update_cols = []
        emb_params = []
        if column_exists('embarque', 'image_bin'):
            emb_update_cols.append('image_bin = ?')
            emb_params.append(imagem_bytes)
        if column_exists('embarque', 'image'):
            emb_update_cols.append('image = ?')
            emb_params.append(unique_filename)
        if column_exists('embarque', 'arquivo'):
            emb_update_cols.append('arquivo = ?')
            emb_params.append(unique_filename)
        if column_exists('embarque', 'data_insercao'):
            emb_update_cols.append('data_insercao = ?')
            emb_params.append(now)

        if emb_update_cols:
            emb_update_stmt = f"UPDATE dbo.embarque SET {', '.join(emb_update_cols)} WHERE id = ?"
            emb_params.append(id_embarque)
            cursor.execute(emb_update_stmt, emb_params)
            conn.commit()
        else:
            pass

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Imagem salva com sucesso (conferencia e espelhada em embarque quando aplicável).",
            "filename": unique_filename,
            "id": id_embarque
        }), 200

    except Exception as e:
        pass
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

# ========================================
# 🏠 TELA DE QUERENTENA
# ========================================
from flask import request, jsonify
from flask_cors import cross_origin

@app.route("/api/quarentena", methods=["GET", "OPTIONS"])
@cross_origin(
    origins="*",
    allow_headers=["x-user-name", "x-user-type", "Content-Type", "Authorization"],
    supports_credentials=True  # só se usar cookies/autenticação extra
)
def listar_quarentena():
    """Listar registros em quarentena"""

    # Log dos headers recebidos (debug fundamental)

    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401

    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Erro na conexão com o banco de dados"}), 500

        cursor = conn.cursor()

        filtros = {
            "FromVessel_NavioOrigem": request.args.get("FromVessel_NavioOrigem"),
            "ToVessel_NavioDestino": request.args.get("ToVessel_NavioDestino"),
            "OraclePRNumber_NumeroPROracle": request.args.get("OraclePRNumber_NumeroPROracle"),
            "PRNumberTMMaster_NumeroPRTMMaster": request.args.get("PRNumberTMMaster_NumeroPRTMMaster"),
            "ItemDescription_DescricaoItem": request.args.get("ItemDescription_DescricaoItem"),
            "SPN": request.args.get("SPN"),
        }

        # Mapeamento: query string -> nome real da coluna na tabela
        column_mapping = {
            "FromVessel_NavioOrigem": "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino": "ToVessel_NavioDestino",
            "OraclePRNumber_NumeroPROracle": "OraclePRNumber_Numero",
            "PRNumberTMMaster_NumeroPRTMMaster": "PRNumberTMMaster_Nome",
            "ItemDescription_DescricaoItem": "ItemDescription_Descricao",
            "SPN": "SPN",
        }

        sql = """
        SELECT
            id,
            FromVessel_NavioOrigem,
            ToVessel_NavioDestino,
            FromDepartment_DepartamentoOrigem,
            ToDepartment_DepartamentoDestino,
            PRNumberTMMaster_Nome AS PRNumberTMMaster_NumeroPRTMMaster,
            OraclePRNumber_Numero AS OraclePRNumber_NumeroPROracle,
            SPN,
            ItemDescription_Descricao AS ItemDescription_DescricaoItem,
            OriginAllocatedPosition AS OriginAllocatedPosition_PosicaoAlocadaOrigem,
            QuantityToBeTransferred AS QuantityToBeTransferred_QuantidadeATransferir,
            status_final,
            observacao,
            conferencia_responsavel,
            desembarque_quantidade AS desembarque_quantidade_conferida,
            conferencia_quantidade AS conferencia_quantidade_conferida,
            CONVERT(VARCHAR(23), data_inicio_quarentena, 121) AS data_inicio_quarentena,
            CONVERT(VARCHAR(23), data_fim_quarentena, 121) AS data_fim_quarentena,
            TotalAmount_USD_Valor AS TotalAmount_USD_ValorTotal_USD,
            lom
        FROM conferencia
        WHERE data_inicio_quarentena IS NOT NULL
          AND status_final = 'Quarentena'
        """

        params = []
        for key, value in filtros.items():
            if value:
                # Usar o nome real da coluna no WHERE
                real_column = column_mapping.get(key, key)
                sql += f" AND {real_column} LIKE ?"
                params.append(f"%{value}%")

        cursor.execute(sql, params)
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        
        # Debug: Ver o que está vindo do banco
        if rows:
            pass
            first_row = rows[0]
            for i, col in enumerate(columns):
                pass
        
        data = [dict(zip(columns, row)) for row in rows]

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": data}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route("/api/quarentena/debug", methods=["GET"])
def debug_quarentena():
    """Endpoint de debug para verificar formato de datas"""
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        
        # Teste 1: Ver tipo da coluna
        cursor.execute("""
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'conferencia' 
            AND COLUMN_NAME IN ('data_inicio_quarentena', 'data_fim_quarentena')
        """)
        colunas = cursor.fetchall()
        
        # Teste 2: Ver dados reais sem conversão
        cursor.execute("""
            SELECT TOP 5
                Id,
                data_inicio_quarentena,
                data_fim_quarentena,
                status_final
            FROM [dbo].[conferencia]
            WHERE status_final = 'Quarentena'
            ORDER BY data_inicio_quarentena DESC
        """)
        registros_raw = cursor.fetchall()
        
        # Teste 3: Ver dados com conversão
        cursor.execute("""
            SELECT TOP 5
                Id,
                CONVERT(VARCHAR(23), data_inicio_quarentena, 121) as inicio_convertido,
                CONVERT(VARCHAR(23), data_fim_quarentena, 121) as fim_convertido,
                status_final
            FROM [dbo].[conferencia]
            WHERE status_final = 'Quarentena'
            ORDER BY data_inicio_quarentena DESC
        """)
        registros_convertidos = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        resultado = {
            "info_colunas": [
                {
                    "nome": col[0],
                    "tipo": col[1],
                    "tamanho": col[2]
                } for col in colunas
            ],
            "registros_raw": [
                {
                    "id": r[0],
                    "inicio": str(r[1]) if r[1] else None,
                    "inicio_tipo": str(type(r[1])),
                    "fim": str(r[2]) if r[2] else None,
                    "status": r[3]
                } for r in registros_raw
            ],
            "registros_convertidos": [
                {
                    "id": r[0],
                    "inicio": r[1],
                    "fim": r[2],
                    "status": r[3]
                } for r in registros_convertidos
            ]
        }
        
        return jsonify(resultado), 200
        
    except Exception as e:
        import traceback
        return jsonify({
            "erro": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route("/api/quarentena/atualizar", methods=["POST"])
def atualizar_quarentena():
    """
    Atualiza informações de quarentena e faz o upsert do registro na tabela 'embarque' caso status_final == 'Enviado para Embarque'.
    Garante envio dos campos conferencia_quantidade_conferida e TotalAmount_USD_ValorTotal_USD.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    
    def to_int(v):
        """Converte valor para int, retorna None se inválido"""
        try:
            if v is None or v == "" or v == "null" or v == "None":
                return None
            return int(float(v))  # Converte via float primeiro para lidar com "10.00"
        except (ValueError, TypeError):
            return None
    
    def to_float(v):
        """Converte valor para float, retorna None se inválido"""
        try:
            if v is None or v == "" or v == "null" or v == "None":
                return None
            return float(v)
        except (ValueError, TypeError):
            return None
    
    def to_sql_datetime(dt):
        """Converte data para formato SQL (YYYY-MM-DD HH:MM:SS), PRESERVA HORA"""
        if not dt or dt == "" or dt == "null" or dt == "None":
            return None
        try:
            from datetime import datetime
            if isinstance(dt, str):
                # Substituir T por espaço
                if "T" in dt:
                    dt = dt.replace("T", " ")
                # Remover milissegundos e timezone
                if "." in dt:
                    dt = dt.split(".")[0]
                if "+" in dt:
                    dt = dt.split("+")[0]
                # Parsear datetime completo
                parsed = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")
                return parsed
            return None
        except Exception:
            return None
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400


        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Falha na conexão com o banco"}), 500
        cursor = conn.cursor()

        id_ = data.get("id")
        status_final = data.get("status_final")
        quarentena_responsavel = data.get("responsavel_conf") or data.get("quarentena_responsavel")
        quarentena_observacao = data.get("observacao") or data.get("quarentena_observacao")
        data_fim_quarentena = to_sql_datetime(data.get("data_fim_quarentena"))
        

        # Upsert em embarque se for Enviado para Embarque
        if status_final == "Enviado para Embarque":
            # Nomes corretos das colunas na tabela embarque
            campos = [
                "id",
                "FromVessel_NavioOrigem",
                "ToVessel_NavioDestino",
                "FromDepartment_DepartamentoOrigem",
                "ToDepartment_DepartamentoDestino",
                "PRNumberTMMaster_Nome",
                "OraclePRNumber_Numero",
                "SPN",
                "ItemDescription_Descricao",
                "OriginAllocatedPosition",
                "QuantityToBeTransferred",
                "conferencia_quantidade",
                "embarque_quantidade_conf",
                "status_final",
                "observacao",
                "responsavel_conf",
                "data_inicio_quarentena",
                "data_fim_quarentena",
                "TotalAmount_USD_Valor",
                "lom"
            ]

            # Mapear campos do payload (nomes longos) para valores
            field_mapping = {
                "id": data.get("id"),
                "FromVessel_NavioOrigem": data.get("FromVessel_NavioOrigem"),
                "ToVessel_NavioDestino": data.get("ToVessel_NavioDestino"),
                "FromDepartment_DepartamentoOrigem": data.get("FromDepartment_DepartamentoOrigem"),
                "ToDepartment_DepartamentoDestino": data.get("ToDepartment_DepartamentoDestino"),
                "PRNumberTMMaster_Nome": data.get("PRNumberTMMaster_NumeroPRTMMaster"),
                "OraclePRNumber_Numero": data.get("OraclePRNumber_NumeroPROracle"),
                "SPN": data.get("SPN"),
                "ItemDescription_Descricao": data.get("ItemDescription_DescricaoItem"),
                "OriginAllocatedPosition": data.get("OriginAllocatedPosition_PosicaoAlocadaOrigem"),
                "QuantityToBeTransferred": to_int(data.get("QuantityToBeTransferred_QuantidadeATransferir")),
                "conferencia_quantidade": to_int(data.get("conferencia_quantidade_conferida")),
                "embarque_quantidade_conf": to_int(data.get("embarque_quantidade_conferida")),
                "status_final": status_final,
                "observacao": quarentena_observacao,
                "responsavel_conf": quarentena_responsavel,
                "data_inicio_quarentena": to_sql_datetime(data.get("data_inicio_quarentena")),
                "data_fim_quarentena": data_fim_quarentena,
                "TotalAmount_USD_Valor": to_float(data.get("TotalAmount_USD_ValorTotal_USD")),
                "lom": data.get("lom")
            }

            # Garantir que campos vazios vão como None
            valores = [
                field_mapping[c] if field_mapping[c] != "" else None
                for c in campos
            ]

            cursor.execute("SELECT COUNT(1) FROM embarque WHERE id = ?", (id_,))
            existe_embarque = cursor.fetchone()[0]
            if existe_embarque:
                set_fields = ", ".join([f"{c} = ?" for c in campos[1:]])  # ignora o id
                update_query = f"UPDATE embarque SET {set_fields} WHERE id = ?"
                cursor.execute(update_query, valores[1:] + [id_])
            else:
                insert_query = f"INSERT INTO embarque ({', '.join(campos)}) VALUES ({', '.join(['?'] * len(campos))})"
                cursor.execute(insert_query, valores)

        # Atualiza todos os campos relevantes de quarentena na conferencia
        update_campos_conf = [
            "quarentena_responsavel", "quarentena_observacao", "status_final", "data_fim_quarentena"
        ]
        update_values = [
            quarentena_responsavel,
            quarentena_observacao,
            status_final,
            data_fim_quarentena,
            id_
        ]
        
        
        update_query = (
            "UPDATE conferencia SET "
            + ", ".join([f"{c} = ?" for c in update_campos_conf])
            + " WHERE id = ?"
        )
        cursor.execute(update_query, update_values)

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": "Atualizado com sucesso."}), 200

    except Exception as e:
        import traceback
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/embarque", methods=["GET"])
def consultar_embarque():
    """Consultar registros de embarque"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Falha na conexão com o banco"}), 500

        cursor = conn.cursor()

        # Buscar da tabela conferencia (onde estão os valores corretos de quantidade conferida)
        filtros = {
            "FromVessel_NavioOrigem": request.args.get("FromVessel_NavioOrigem"),
            "ToVessel_NavioDestino": request.args.get("ToVessel_NavioDestino"),
            "PRNumberTMMaster_Nome": request.args.get("PRNumberTMMaster_NumeroPRTMMaster"),
            "ItemDescription_Descricao": request.args.get("ItemDescription_DescricaoItem"),
            "SPN": request.args.get("SPN"),
        }

        where_clauses = ["status_final != ?", "lom IS NOT NULL","status_final != 'Quarentena'"]
        params = ["Embarque Finalizado"]

        for campo, valor in filtros.items():
            if valor:
                where_clauses.append(f"{campo} LIKE ?")
                params.append(f"%{valor}%")

        # SELECT da tabela conferencia (valores corretos de quantidade conferida)
        query = f"""
        SELECT 
            [Id] AS id,
            [FromVessel_NavioOrigem],
            [ToVessel_NavioDestino],
            [FromDepartment_DepartamentoOrigem],
            [ToDepartment_DepartamentoDestino],
            [PRNumberTMMaster_Nome] AS PRNumberTMMaster_NumeroPRTMMaster,
            [OraclePRNumber_Numero] AS OraclePRNumber_NumeroPROracle,
            [SPN],
            [ItemDescription_Descricao] AS ItemDescription_DescricaoItem,
            [OriginAllocatedPosition] AS OriginAllocatedPosition_PosicaoAlocadaOrigem,
            [QuantityToBeTransferred] AS QuantityToBeTransferred_QuantidadeATransferir,
            [desembarque_quantidade] AS conferencia_quantidade_conferida,
            [conferencia_quantidade] AS embarque_quantidade_conferida,
            [status_final],
            [observacao],
            [conferencia_responsavel] AS responsavel_conf,
            [data_inicio_quarentena],
            [data_fim_quarentena],
            [image],
            [data_insercao],
            CASE 
                WHEN QuantityToBeTransferred IS NOT NULL 
                     AND QuantityToBeTransferred != 0 
                     AND TotalAmount_USD_Valor IS NOT NULL
                THEN TotalAmount_USD_Valor / QuantityToBeTransferred
                ELSE NULL
            END AS UnitValue_USD_ValorUnitario_USD,
            [TotalAmount_USD_Valor] AS TotalAmount_USD_ValorTotal_USD,
            [lom]
        FROM conferencia
        WHERE {" AND ".join(where_clauses)}
        """

        cursor.execute(query, params)
        rows = cursor.fetchall()
        colunas = [desc[0] for desc in cursor.description]
        data = [dict(zip(colunas, row)) for row in rows]

        return jsonify({"status": "success", "data": data}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/embarque/imagem/<path:id>", methods=["GET", "OPTIONS"])
@cross_origin(
    origins="*",
    allow_headers=["x-user-name", "x-user-type", "Content-Type", "Authorization"],
    supports_credentials=True
)
def visualizar_imagem_embarque(id):
    """Visualizar imagem de embarque: busca APENAS no banco de dados (image_bin).
    
    Lógica:
        pass
    1. Busca image_bin na tabela embarque (blob) - PRIORIDADE
    2. Se não encontrar, busca image_bin na tabela conferencia (blob)
    3. Retorna 404 se não encontrar em nenhuma das tabelas
    
    NÃO busca em filesystem - apenas dados armazenados no banco.
    """


    # Verificar autenticação
    try:
        auth_res = verify_authentication()
    except Exception as e:
        pass
        auth_res = None

    if not auth_res:
        pass
        return jsonify({"status": "error", "message": "Unauthorized"}), 401


    try:
        import traceback

        # PRIORIDADE 1: Buscar image_bin na tabela embarque
        try:
            conn = get_sql_connection()
            if conn:
                cursor = conn.cursor()
                
                # Buscar em embarque
                try:
                    cursor.execute("SELECT image_bin, image FROM embarque WHERE id = ?", (id,))
                    row = cursor.fetchone()
                    if row and row[0]:  # Se encontrou blob
                        image_bin = row[0]
                        image_name = row[1]
                        
                        
                        bio = io.BytesIO(image_bin)
                        
                        # Deduzir mime type a partir do nome do arquivo
                        mime = None
                        if image_name:
                            mime, _ = mimetypes.guess_type(image_name)
                        if not mime:
                            mime = 'image/jpeg'
                        

                        resp = make_response(send_file(bio, mimetype=mime))
                        origin = request.headers.get('Origin')
                        if origin and origin in ALLOWED_ORIGINS:
                            resp.headers['Access-Control-Allow-Origin'] = origin
                        else:
                            resp.headers['Access-Control-Allow-Origin'] = '*'
                        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-name, x-user-type'
                        resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'

                        try:
                            cursor.close()
                            conn.close()
                        except Exception:
                            pass

                        return resp
                    else:
                        pass
                except Exception as e_db1:
                    pass
                    traceback.print_exc()

                # PRIORIDADE 2: Se não encontrou em embarque, buscar em conferencia
                try:
                    cursor.execute("SELECT TOP 1 image_bin, imagem, arquivo, image, file FROM conferencia WHERE id = ?", (id,))
                    row2 = cursor.fetchone()
                    if row2 and row2[0]:  # Se encontrou blob
                        conf_image_bin = row2[0]
                        conf_image_name = row2[1] or row2[2] or row2[3] or row2[4]
                        
                        
                        bio2 = io.BytesIO(conf_image_bin)
                        
                        mime2 = None
                        if conf_image_name:
                            mime2, _ = mimetypes.guess_type(conf_image_name)
                        if not mime2:
                            mime2 = 'image/jpeg'


                        resp2 = make_response(send_file(bio2, mimetype=mime2))
                        origin = request.headers.get('Origin')
                        if origin and origin in ALLOWED_ORIGINS:
                            resp2.headers['Access-Control-Allow-Origin'] = origin
                        else:
                            resp2.headers['Access-Control-Allow-Origin'] = '*'
                        resp2.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-name, x-user-type'
                        resp2.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'

                        try:
                            cursor.close()
                            conn.close()
                        except Exception:
                            pass

                        return resp2
                    else:
                        pass
                except Exception as e_db2:
                    pass
                    traceback.print_exc()

                try:
                    cursor.close()
                    conn.close()
                except Exception:
                    pass
        except Exception as e_conn:
            pass
            traceback.print_exc()

        # Se chegou aqui, não encontrou em nenhuma tabela
        return jsonify({"status": "error", "message": "Imagem não encontrada no banco de dados"}), 404

    except Exception as e:
        pass
        traceback.print_exc()
        return jsonify({"status": "error", "message": "Erro interno"}), 500



@app.route("/api/embarque/imagem/", methods=["GET", "OPTIONS"])
@cross_origin(
    origins="*",
    allow_headers=["x-user-name", "x-user-type", "Content-Type", "Authorization"],
    supports_credentials=True
)
def visualizar_imagem_embarque_query():
    pass
    """Compatibilidade: permite chamar /api/embarque/imagem?id=123 ou sem id para mensagem clara.

    Se 'id' estiver presente como query param, delega para o handler principal. Caso contrário
    retorna 400 com mensagem amigável (evita 404 genérico).
    """
    # Priorizar query param 'id'
    id_qs = request.args.get('id') or request.args.get('imageId') or request.args.get('arquivo') or request.args.get('filename')

    if not id_qs:
        pass

        # 1) tentar extrair id do Referer (?id=123 ou /.../123)
        referer = request.headers.get('Referer') or request.headers.get('referer')
        if referer:
            try:
                import re
                m = re.search(r'[?&]id=(\d+)', referer)
                if m:
                    id_qs = m.group(1)
                else:
                    m2 = re.search(r'/([^/]+)/(\d+)(?:$|[?/#])', referer)
                    if m2:
                        id_qs = m2.group(2)
            except Exception as e:
                pass

    # 2) Se ainda não encontrou id, tentar buscar último upload/conferência do usuário (priorizar 'embarque')
    if not id_qs:
        try:
            username = request.headers.get('x-user-name') or request.headers.get('X-User-Name')
            conn = get_sql_connection()
            if conn:
                cur = conn.cursor()

                # Tentar na tabela 'embarque' primeiro
                if username:
                    cur.execute("SELECT TOP 1 id FROM embarque WHERE (image_bin IS NOT NULL OR (image IS NOT NULL AND image <> '')) AND responsavel_conf = ? ORDER BY data_insercao DESC", (username,))
                else:
                    cur.execute("SELECT TOP 1 id FROM embarque WHERE (image_bin IS NOT NULL OR (image IS NOT NULL AND image <> '')) ORDER BY data_insercao DESC")

                row = cur.fetchone()
                if row and row[0]:
                    id_qs = str(row[0])
                else:
                    # fallback para 'conferencia'
                    if username:
                        cur.execute("SELECT TOP 1 id FROM conferencia WHERE (image_bin IS NOT NULL OR imagem IS NOT NULL OR arquivo IS NOT NULL OR image IS NOT NULL OR file IS NOT NULL) AND (conferencia_responsavel = ? OR responsavel_conf = ?) ORDER BY data_insercao DESC", (username, username))
                    else:
                        cur.execute("SELECT TOP 1 id FROM conferencia WHERE (image_bin IS NOT NULL OR imagem IS NOT NULL OR arquivo IS NOT NULL OR image IS NOT NULL OR file IS NOT NULL) ORDER BY data_insercao DESC")
                    row2 = cur.fetchone()
                    if row2 and row2[0]:
                        id_qs = str(row2[0])

                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass

        except Exception as e:
            pass

    if not id_qs:
        pass
        return jsonify({"status": "error", "message": "ID da imagem obrigatório. Use /api/embarque/imagem/<id> ou /api/embarque/imagem?id=<id>"}), 400

    # Delegar para a função existente que aceita id por path
    return visualizar_imagem_embarque(id_qs)


@app.route('/api/embarque/metadata/<path:id>', methods=['GET'])
def embarque_image_metadata(id):
    """Retorna o nome do arquivo de imagem associado ao registro de embarque/conferencia.

    Uso: frontend pode chamar este endpoint para saber o nome exato do arquivo salvo no FS.
    """
    try:
        pass
        # Autenticação compatível
        auth_res = verify_authentication()
        if not auth_res:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "DB connection failed"}), 500
        cursor = conn.cursor()

        # Tentar embarque.image
        try:
            cursor.execute("SELECT image FROM embarque WHERE id = ?", (id,))
            row = cursor.fetchone()
            if row and row[0]:
                fname = str(row[0])
                cursor.close()
                conn.close()
                return jsonify({"status": "success", "file": fname}), 200
        except Exception as e:
            pass

        # Tentar na tabela conferencia (colunas comuns)
        try:
            cursor.execute("SELECT TOP 1 imagem, arquivo, image, file FROM conferencia WHERE id = ?", (id,))
            row2 = cursor.fetchone()
            if row2:
                for candidate in row2:
                    if candidate:
                        fname = str(candidate)
                        cursor.close()
                        conn.close()
                        return jsonify({"status": "success", "file": fname}), 200
        except Exception as e:
            pass

        cursor.close()
        conn.close()
        return jsonify({"status": "error", "message": "Metadata not found"}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": "Erro interno"}), 500
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/embarque/consulta", methods=["GET"])
def consulta_embarque():
    """
    Realiza a consulta na tabela conferencia com base nos filtros fornecidos.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    try:
        params = request.args.to_dict()
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Mapeamento de campos do frontend para a tabela conferencia
        filtros_map = {
            "FromVessel_NavioOrigem": "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino": "ToVessel_NavioDestino",
            "FromDepartment_DepartamentoOrigem": "FromDepartment_DepartamentoOrigem",
            "ToDepartment_DepartamentoDestino": "ToDepartment_DepartamentoDestino",
            "PRNumberTMMaster_NumeroPRTMMaster": "PRNumberTMMaster_Nome",
            "OraclePRNumber_NumeroPROracle": "OraclePRNumber_Numero",
            "SPN": "SPN",
            "ItemDescription_DescricaoItem": "ItemDescription_Descricao",
            "status_final": "status_final"
        }
        
        # Query com aliases corretos
        query = """
        SELECT 
            Id AS id,
            FromVessel_NavioOrigem,
            ToVessel_NavioDestino,
            FromDepartment_DepartamentoOrigem,
            ToDepartment_DepartamentoDestino,
            PRNumberTMMaster_Nome AS PRNumberTMMaster_NumeroPRTMMaster,
            OraclePRNumber_Numero AS OraclePRNumber_NumeroPROracle,
            SPN,
            ItemDescription_Descricao AS ItemDescription_DescricaoItem,
            status_final,
            desembarque_quantidade AS conferencia_quantidade_conferida,
            conferencia_quantidade AS embarque_quantidade_conferida,
            conferencia_responsavel AS responsavel_conf,
            data_inicio_quarentena,
            data_fim_quarentena,
            TotalAmount_USD_Valor AS TotalAmount_USD_ValorTotal_USD,
            OriginAllocatedPosition AS OriginAllocatedPosition_PosicaoAlocadaOrigem,
            QuantityToBeTransferred AS QuantityToBeTransferred_QuantidadeATransferir
        FROM conferencia 
        WHERE 1=1
        """
        
        values = []
        for campo_frontend, campo_db in filtros_map.items():
            if campo_frontend in params and params[campo_frontend]:
                query += f" AND {campo_db} = ?"
                values.append(params[campo_frontend])

        cursor.execute(query, tuple(values))
        col_names = [desc[0] for desc in cursor.description]
        data = [dict(zip(col_names, row)) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/embarque/dropdowns", methods=["GET"])
def embarque_dropdowns():
    """
    Retorna os valores distintos para os campos de filtro do embarque (dropdowns).
    Busca da tabela conferencia. Oculta "Embarque Finalizado" do status_final.
    """
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    import traceback
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()
        # Mapeamento: nomes da tabela conferencia → nomes esperados pelo frontend
        campo_map = {
            "FromVessel_NavioOrigem": "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino": "ToVessel_NavioDestino",
            "FromDepartment_DepartamentoOrigem": "FromDepartment_DepartamentoOrigem",
            "ToDepartment_DepartamentoDestino": "ToDepartment_DepartamentoDestino",
            "PRNumberTMMaster_Nome": "PRNumberTMMaster_NumeroPRTMMaster",
            "OraclePRNumber_Numero": "OraclePRNumber_NumeroPROracle",
            "SPN": "SPN",
            "ItemDescription_Descricao": "ItemDescription_DescricaoItem",
            "status_final": "status_final"
        }
        result = {}
        for campo_db, campo_frontend in campo_map.items():
            query = f"SELECT DISTINCT {campo_db} FROM conferencia WHERE {campo_db} IS NOT NULL AND {campo_db} != '' AND lom IS NOT NULL ORDER BY {campo_db}"
            cursor.execute(query)
            values = [str(row[0]) for row in cursor.fetchall() if row[0] is not None and str(row[0]).strip() != ""]
            # Oculta "Embarque Finalizado" no status_final
            if campo_db == "status_final":
                values = [v for v in values if v.strip().lower() != "embarque finalizado".lower()]
            result[campo_frontend] = values
        cursor.close()
        conn.close()
        return jsonify(result), 200
    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/embarque/confirmar", methods=["POST"])
def atualizar_embarque():
    """Atualizar registro de embarque"""
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400


        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Falha na conexão com o banco"}), 500

        cursor = conn.cursor()

        # Trata campos numéricos e strings
        def to_num(val):
            if val in (None, "", "null"):
                return None
            try:
                return float(str(val).replace(",", "."))
            except Exception:
                return None

        embarque_quantidade_conferida = to_num(data.get("embarque_quantidade_conferida"))
        conferencia_quantidade_conferida = to_num(data.get("conferencia_quantidade_conferida"))
        lom = data.get("lom") if data.get("lom") else None

        # Atualiza embarque
        query = """
        UPDATE embarque
        SET
            status_final = ?,
            observacao = ?,
            responsavel_conf = ?,
            lom = ?
        WHERE id = ?
        """

        params = (
            data.get("status_final"),
            data.get("observacao") or "",
            data.get("responsavel_conf") or "",
            lom,
            data.get("id"),
        )
        
        
        cursor.execute(query, params)

        # Se status_final = "Quarentena", atualiza também na conferencia e seta data_fim_quarentena=NULL
        if data.get("status_final") == "Quarentena":
            # Valida e formata a data de início da quarentena
            data_inicio = data.get("data_inicio_quarentena")
            if not data_inicio or data_inicio in ("", "-", "null", "undefined"):
                # Se não tem data válida, usa a data/hora atual
                from datetime import datetime
                data_inicio = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            query_conferencia = """
            UPDATE conferencia
            SET
                data_inicio_quarentena = ?,
                status_final = ?
            WHERE id = ?
            """
            cursor.execute(query_conferencia, (
                data_inicio,
                data.get("status_final"),
                data.get("id")
            ))

            # ⚠️ Reseta data_fim_quarentena para NULL
            query_reset_fim = """
            UPDATE conferencia SET data_fim_quarentena = NULL WHERE id = ?
            """
            cursor.execute(query_reset_fim, (data.get("id"),))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Registro de embarque atualizado."}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500

# ========================================
# 🏠 TELA DE LOM
# ========================================
@app.route("/api/lom", methods=["GET"])
def listar_lom_pendente():
    """
    Listar LOM pendentes com filtros opcionais.
    Pendente = lom IS NULL OU TRIM(lom) = ''.
    Status padrão: 'Enviado para Embarque'.
    Filtros aceitos (querystring):
      - FromVessel_NavioOrigem
      - ToVessel_NavioDestino
      - PRNumberTMMaster_NumeroPRTMMaster
      - OraclePRNumber_NumeroPROracle
      - ItemDescription_DescricaoItem
      - SPN
    Extras opcionais:
      - limit (int) -> TOP N
    """

    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401

    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Campos filtráveis - usar nomes corretos da tabela conferencia
        allowed_filters = {
            "FromVessel_NavioOrigem": "FromVessel_NavioOrigem",
            "ToVessel_NavioDestino": "ToVessel_NavioDestino",
            "PRNumberTMMaster_NumeroPRTMMaster": "PRNumberTMMaster_Nome",
            "OraclePRNumber_NumeroPROracle": "OraclePRNumber_Numero",
            "ItemDescription_DescricaoItem": "ItemDescription_Descricao",
            "SPN": "SPN",
        }

        # Montagem dinâmica de WHERE
        where_clauses = []
        params = []

        # Pendência de LOM: NULL ou vazio
        where_clauses.append("(lom IS NULL OR LTRIM(RTRIM(CAST(lom AS NVARCHAR(255)))) = '')")

        # Status padrão exigido
        where_clauses.append("status_final = ?")
        params.append("Enviado para Embarque")

        # Aplicar filtros LIKE (case-insensitive via COLLATE opcional)
        for qs_key, col in allowed_filters.items():
            val = request.args.get(qs_key, "").strip()
            if val:
                where_clauses.append(f"({col} IS NOT NULL AND {col} LIKE ?)")
                params.append(f"%{val}%")

        # Limit opcional
        try:
            limit = int(request.args.get("limit", "0"))
            top_clause = f"TOP {limit} " if limit and limit > 0 else ""
        except Exception:
            top_clause = ""

        # Query com nomes corretos da tabela conferencia + aliases para o frontend
        base_query = f"""
            SELECT {top_clause}
                   id,
                   FromVessel_NavioOrigem, ToVessel_NavioDestino,
                   FromDepartment_DepartamentoOrigem, ToDepartment_DepartamentoDestino,
                   PRNumberTMMaster_Nome AS PRNumberTMMaster_NumeroPRTMMaster, 
                   OraclePRNumber_Numero AS OraclePRNumber_NumeroPROracle,
                   SPN, 
                   ItemDescription_Descricao AS ItemDescription_DescricaoItem, 
                   OriginAllocatedPosition AS OriginAllocatedPosition_PosicaoAlocadaOrigem,
                   QuantityToBeTransferred AS QuantityToBeTransferred_QuantidadeATransferir, 
                   lom, observacao_lom,
                   desembarque_quantidade
            FROM conferencia
            WHERE {" AND ".join(where_clauses)}
            ORDER BY id DESC
        """

        cursor.execute(base_query, params)
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": results})

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/lom/atualizar", methods=["POST"])
def atualizar_lom():
    """
    Atualiza campos de LOM no registro da tabela `conferencia` e,
    se existir o mesmo `id` em `embarque`, replica os campos relevantes.
    Regras:
      - `lom` é obrigatório e não pode ser vazio/whitespace.
      - `observacao_lom` e `responsavel_conf` são opcionais (gravados como texto; vazio => '').
      - `status_final` em `embarque` permanece fixo como 'Enviado para Embarque'.
      - NÃO insere em `embarque` se o registro não existir (apenas UPDATE condicional).
    Retorno:
      - {"status":"success","data":{...}} em caso de sucesso
      - {"status":"error","message": "..."} em caso de erro
    """

    # -------- Autenticação (via headers x-user-*) --------
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401

    import traceback

    def to_int(v):
        try:
            return int(v) if v not in (None, "", "null", "None") else None
        except Exception:
            return None

    def to_float(v):
        try:
            return float(v) if v not in (None, "", "null", "None") else None
        except Exception:
            return None

    def to_sql_date(dt):
        if not dt:
            return None
        try:
            if isinstance(dt, str) and "T" in dt:
                return dt.split("T")[0]
            if isinstance(dt, str) and len(dt) == 10:
                return dt
        except Exception:
            pass
        return None

    conn = None
    cursor = None

    try:
        # -------- Entrada --------
        data = request.get_json(silent=True)
        
        if not data:
            pass
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400

        # ID é string, não converter para int!
        record_id = data.get("id")
        lom = (data.get("lom") or "").strip()
        observacao_lom = (data.get("observacao_lom") or "").strip()
        lom_responsavel = (data.get("responsavel_conf") or "").strip()


        if not record_id:
            pass
            return jsonify({"status": "error", "message": "ID inválido"}), 400
        if not lom:
            pass
            return jsonify({"status": "error", "message": "O campo LOM é obrigatório"}), 400

        # -------- Conexão --------
        conn = get_sql_connection()
        if not conn:
            pass
            return jsonify({"status": "error", "message": "Falha na conexão com o banco"}), 500
        cursor = conn.cursor()

        # -------- Update em conferencia --------
        update_conferencia = """
            UPDATE conferencia
               SET lom = ?, observacao_lom = ?, lom_responsavel = ?
             WHERE id = ?
        """
        cursor.execute(update_conferencia, (lom, observacao_lom, lom_responsavel, record_id))
        rows_affected = cursor.rowcount
        
        if rows_affected == 0:
            pass
            conn.rollback()
            return jsonify({"status": "error", "message": "Registro de conferencia não encontrado"}), 404


        # -------- Busca campos atuais em conferencia (para refletir na embarque) --------
        select_conferencia = """
            SELECT
                id,
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                FromDepartment_DepartamentoOrigem,
                ToDepartment_DepartamentoDestino,
                PRNumberTMMaster_Nome,
                OraclePRNumber_Numero,
                SPN,
                ItemDescription_Descricao,
                OriginAllocatedPosition,
                QuantityToBeTransferred,
                conf_QuantidadeConferencia,
                status_final,
                observacao,
                data_inicio_quarentena,
                data_fim_quarentena,
                TotalAmount_USD_Valor,
                lom,
                desembarque_quantidade,
                observacao_lom
            FROM conferencia
            WHERE id = ?
        """
        cursor.execute(select_conferencia, (record_id,))
        row = cursor.fetchone()
        if not row:
            conn.rollback()
            return jsonify({"status": "error", "message": "Registro não encontrado após atualização"}), 404

        row = list(row)

        # Casts e normalizações (índices compatíveis com o SELECT)
        # 0:id, 1:FromVessel, 2:ToVessel, 3:FromDept, 4:ToDept, 5:PRTM, 6:PROracle,
        # 7:SPN, 8:ItemDesc, 9:OriginPos, 10:QtyToTransfer, 11:conf_QuantidadeConferencia,
        # 12:status_final, 13:observacao, 14:dt_ini_quarentena, 15:dt_fim_quarentena,
        # 16:TotalUSD, 17:lom, 18:desemb_qtd, 19:observacao_lom
        row[0] = to_int(row[0])
        row[10] = to_int(row[10])
        row[11] = to_int(row[11])
        row[16] = to_float(row[16])
        row[18] = to_int(row[18])
        row[14] = to_sql_date(row[14])
        row[15] = to_sql_date(row[15])

        # -------- UPDATE condicional em embarque (se existir) --------
        cursor.execute("SELECT COUNT(1) FROM embarque WHERE id = ?", (record_id,))
        exists = (cursor.fetchone() or [0])[0]

        if exists:
            update_embarque = """
                UPDATE embarque SET
                    FromVessel_NavioOrigem = ?,
                    ToVessel_NavioDestino = ?,
                    FromDepartment_DepartamentoOrigem = ?,
                    ToDepartment_DepartamentoDestino = ?,
                    PRNumberTMMaster_Nome = ?,
                    OraclePRNumber_Numero = ?,
                    SPN = ?,
                    ItemDescription_Descricao = ?,
                    OriginAllocatedPosition = ?,
                    QuantityToBeTransferred = ?,
                    conf_QuantidadeConferencia = ?,
                    status_final = ?,
                    responsavel_conf = ?,
                    data_inicio_quarentena = ?,
                    data_fim_quarentena = ?,
                    TotalAmount_USD_Valor = ?,
                    lom = ?,
                    conferencia_quantidade = ?,
                    observacao_lom = ?
                WHERE id = ?
            """
            params_update = [
                row[1],   # FromVessel_NavioOrigem
                row[2],   # ToVessel_NavioDestino
                row[3],   # FromDepartment_DepartamentoOrigem
                row[4],   # ToDepartment_DepartamentoDestino
                row[5],   # PRNumberTMMaster_Nome
                row[6],   # OraclePRNumber_Numero
                row[7],   # SPN
                row[8],   # ItemDescription_Descricao
                row[9],   # OriginAllocatedPosition
                row[10],  # QuantityToBeTransferred
                row[11],  # conf_QuantidadeConferencia
                "Enviado para Embarque",  # status_final fixo
                lom_responsavel,          # responsavel_conf
                row[14],  # data_inicio_quarentena
                row[15],  # data_fim_quarentena
                row[16],  # TotalAmount_USD_Valor
                lom,      # lom (atualizado)
                row[11],  # conferencia_quantidade (mesmo que conf_QuantidadeConferencia)
                observacao_lom,  # observacao_lom (atualizada)
                record_id        # WHERE id
            ]
            cursor.execute(update_embarque, params_update)
        else:
            pass

        # -------- Commit --------
        conn.commit()

        # -------- Resposta --------
        response_payload = {
            "id": record_id,
            "lom": lom,
            "observacao_lom": observacao_lom,
            "lom_responsavel": lom_responsavel,
            "replicado_em_embarque": bool(exists),
        }
        return jsonify({"status": "success", "data": response_payload}), 200

    except Exception as e:
        pass
        import traceback
        
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        pass
        try:
            if cursor:
                cursor.close()
        except Exception:
            pass
        try:
            if conn:
                conn.close()
        except Exception:
            pass


# Os endpoints do dashboard já foram atualizados anteriormente, mas vou incluir aqui com verificação de auth:

@app.route('/api/dashboard/desembarque_stats', methods=['GET'])
def get_desembarque_stats():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({'status': 'error', 'message': error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Query para contar finalizados
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Desembarque 
            WHERE transfer_status IN ('Aguardando Conferência Base', 'Finalizado')
        """)
        finalizados = cursor.fetchone()[0] or 0

        # Query para contar pendentes
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Desembarque 
            WHERE transfer_status NOT IN ('Aguardando Conferência Base', 'Finalizado') 
               OR transfer_status IS NULL
        """)
        pendentes = cursor.fetchone()[0] or 0

        # Query para contar total
        cursor.execute("""
            SELECT COUNT(*) 
            FROM Desembarque
        """)
        total = cursor.fetchone()[0] or 0

        cursor.close()
        conn.close()

        results = {
            'total': total,
            'finalizados': finalizados,
            'pendentes': pendentes
        }

        return jsonify({"status": "success", "data": results})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/dashboard/conferencia_stats', methods=['GET'])
def get_conferencia_stats():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({'status': 'error', 'message': error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Query para contar finalizados (status_final = 'Enviado para Embarque')
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE status_final = 'Enviado para Embarque'
        """)
        finalizados = cursor.fetchone()[0] or 0

        # Query para contar pendentes (todos os outros status)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE status_final IN ('PR INCOMPLETA', 'Material Divergente', 'Aguardando Embarque', 'Aguardando Retorno', 'Quarentena', 'Avaria')
               OR status_final IS NULL
        """)
        pendentes = cursor.fetchone()[0] or 0

        # Query para contar total
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia
        """)
        total = cursor.fetchone()[0] or 0

        cursor.close()
        conn.close()

        results = {
            'total': total,
            'finalizados': finalizados,
            'pendentes': pendentes
        }

        return jsonify({"status": "success", "data": results})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/dashboard/lom_stats', methods=['GET'])
def get_lom_stats():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({'status': 'error', 'message': error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Query para contar LOM pendentes (lom IS NULL AND status_final = 'Enviado para Embarque')
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE lom IS NULL AND status_final = 'Enviado para Embarque'
        """)
        pendentes = cursor.fetchone()[0] or 0

        # Query para contar LOM finalizados (lom IS NOT NULL AND status_final = 'Enviado para Embarque')
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE lom IS NOT NULL AND status_final = 'Enviado para Embarque'
        """)
        finalizados = cursor.fetchone()[0] or 0

        # Total LOM (todos que chegaram ao embarque)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE status_final = 'Enviado para Embarque'
        """)
        total = cursor.fetchone()[0] or 0

        cursor.close()
        conn.close()

        results = {
            'total': total,
            'finalizados': finalizados,
            'pendentes': pendentes
        }

        return jsonify({"status": "success", "data": results})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/dashboard/quarentena_stats', methods=['GET'])
def get_quarentena_stats():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({'status': 'error', 'message': error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Query para contar Quarentena pendentes (data_inicio_quarentena IS NOT NULL AND status_final = 'Quarentena')
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE data_inicio_quarentena IS NOT NULL 
              AND status_final = 'Quarentena'
        """)
        pendentes = cursor.fetchone()[0] or 0

        # Query para contar Quarentena finalizados (data_inicio_quarentena IS NOT NULL AND data_fim_quarentena IS NOT NULL)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE data_inicio_quarentena IS NOT NULL 
              AND data_fim_quarentena IS NOT NULL
        """)
        finalizados = cursor.fetchone()[0] or 0

        # Total Quarentena (todos que já entraram em quarentena)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM conferencia 
            WHERE data_inicio_quarentena IS NOT NULL
        """)
        total = cursor.fetchone()[0] or 0

        cursor.close()
        conn.close()

        results = {
            'total': total,
            'finalizados': finalizados,
            'pendentes': pendentes
        }

        return jsonify({"status": "success", "data": results})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/debug/image_status/<path:id>', methods=['GET'])
def debug_image_status(id):
    """Endpoint de diagnóstico: informa existência, tamanho e hash (MD5) de image_bin nas tabelas conferencia e embarque para o id fornecido.

    Uso: GET /api/debug/image_status/123
    """
    # Verificar autenticação
    is_auth, error = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error}), 401

    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "DB connection failed"}), 500
        cur = conn.cursor()

        result = {"id": id, "conferencia": None, "embarque": None}

        try:
            cur.execute(
                "SELECT TOP 1 image, DATALENGTH(image_bin) as size, sys.fn_varbintohexstr(HASHBYTES('MD5', image_bin)) as hash_hex FROM conferencia WHERE id = ?",
                (id,)
            )
            r = cur.fetchone()
            if r:
                result['conferencia'] = {
                    'image_name': r[0],
                    'size': int(r[1]) if r[1] is not None else None,
                    'hash_hex': r[2].strip() if r[2] else None
                }
        except Exception as e:
            pass

        try:
            cur.execute(
                "SELECT TOP 1 image, DATALENGTH(image_bin) as size, sys.fn_varbintohexstr(HASHBYTES('MD5', image_bin)) as hash_hex FROM embarque WHERE id = ?",
                (id,)
            )
            r2 = cur.fetchone()
            if r2:
                result['embarque'] = {
                    'image_name': r2[0],
                    'size': int(r2[1]) if r2[1] is not None else None,
                    'hash_hex': r2[2].strip() if r2[2] else None
                }
        except Exception as e:
            pass

        try:
            cur.close()
            conn.close()
        except Exception:
            pass

        return jsonify({"status": "success", "data": result}), 200

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/dashboard/embarque_stats', methods=['GET'])
def get_embarque_stats():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({'status': 'error', 'message': error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Query para contar Embarque finalizados (status_final = 'Embarque Finalizado')
        cursor.execute("""
            SELECT COUNT(*) 
            FROM embarque 
            WHERE status_final = 'Embarque Finalizado'
        """)
        finalizados = cursor.fetchone()[0] or 0

        # Query para contar Embarque pendentes (status_final != 'Embarque Finalizado' AND lom IS NOT NULL)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM embarque 
            WHERE status_final != 'Embarque Finalizado' 
              AND lom IS NOT NULL
        """)
        pendentes = cursor.fetchone()[0] or 0

        # Total Embarque (todos com LOM preenchido)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM embarque 
            WHERE lom IS NOT NULL
        """)
        total = cursor.fetchone()[0] or 0

        cursor.close()
        conn.close()

        results = {
            'total': total,
            'finalizados': finalizados,
            'pendentes': pendentes
        }

        return jsonify({"status": "success", "data": results})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/dashboard/atividades_recentes', methods=['GET'])
def get_atividades_recentes():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        atividades = []

         # 1. Últimos 5 uploads (Desembarque)
        cursor.execute("""
            SELECT TOP 5 
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                COALESCE(Desembarque_responsavel, AuthorId, 'Sistema') as responsavel,
                Created,
                Modified
            FROM Desembarque 
            WHERE Created IS NOT NULL
            ORDER BY Created DESC
        """)
        uploads = cursor.fetchall()
        
        for upload in uploads:
            atividades.append({
                'tipo': 'upload',
                'icon': '📤',
                'titulo': 'Upload Excel',
                'descricao': f'realizado por {upload[2] if upload[2] else "Sistema"}',
                'data': upload[3].isoformat() if upload[3] else None
            })

        # 2. Últimas 5 transferências (Desembarque - Modified)
        cursor.execute("""
            SELECT TOP 5 
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                Modified
            FROM Desembarque 
            WHERE Modified IS NOT NULL
            ORDER BY Modified DESC
        """)
        transferencias = cursor.fetchall()
        
        for transf in transferencias:
            atividades.append({
                'tipo': 'transferencia',
                'icon': '🚢',
                'titulo': 'Nova transferência',
                'descricao': f'{transf[0]} → {transf[1]}',
                'data': transf[2].isoformat() if transf[2] else None
            })

        # 3. Últimas 5 conferências (Conferencia - data_insercao)
        cursor.execute("""
            SELECT TOP 5 
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                data_insercao
            FROM conferencia 
            WHERE data_insercao IS NOT NULL
            ORDER BY data_insercao DESC
        """)
        conferencias = cursor.fetchall()
        
        for conf in conferencias:
            atividades.append({
                'tipo': 'conferencia',
                'icon': '✅',
                'titulo': 'Conferência finalizada',
                'descricao': f'{conf[0]} → {conf[1]}',
                'data': conf[2].isoformat() if conf[2] else None
            })

        # 4. Últimos 5 embarques (Embarque - data_insercao)
        cursor.execute("""
            SELECT TOP 5 
                FromVessel_NavioOrigem,
                ToVessel_NavioDestino,
                data_insercao
            FROM embarque 
            WHERE data_insercao IS NOT NULL
            ORDER BY data_insercao DESC
        """)
        embarques = cursor.fetchall()
        
        for emb in embarques:
            atividades.append({
                'tipo': 'embarque',
                'icon': '📦',
                'titulo': 'Embarque finalizado',
                'descricao': f'{emb[0]} → {emb[1]}',
                'data': emb[2].isoformat() if emb[2] else None
            })

        # Ordenar todas as atividades por data (mais recente primeiro)
        atividades_ordenadas = sorted(
            [a for a in atividades if a['data']], 
            key=lambda x: x['data'], 
            reverse=True
        )[:10]  # Pegar apenas as 10 mais recentes

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": atividades_ordenadas})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/dashboard/embarque_grafico', methods=['GET'])
def get_embarque_grafico():
    pass
    
    # Verificar autenticação
    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401
    
    try:
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Dados para gráfico de embarques finalizados por data
        cursor.execute("""
            SELECT 
                CAST(data_insercao AS DATE) as data,
                COUNT(*) as total
            FROM embarque 
            WHERE status_final = 'Embarque Finalizado'
              AND data_insercao IS NOT NULL
              AND data_insercao >= DATEADD(day, -30, GETDATE())
            GROUP BY CAST(data_insercao AS DATE)
            ORDER BY data
        """)
        
        resultados = cursor.fetchall()
        
        grafico_data = []
        for row in resultados:
            grafico_data.append({
                'data': row[0].isoformat() if row[0] else None,
                'total': row[1] or 0
            })

        cursor.close()
        conn.close()

        return jsonify({"status": "success", "data": grafico_data})

    except Exception as e:
        pass
        return jsonify({"status": "error", "message": str(e)}), 500
    
# 🏠 ROTAS DE PÁGINAS HTML
@app.route('/')
def index():
    html = """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TransferPlus API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
            .status { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
            .method { font-weight: bold; color: #007bff; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 TransferPlus API Server - DEBUG MODE</h1>
            
            <div class="status">
                ✅ <strong>Status:</strong> API rodando com debug detalhado!<br>
                📅 <strong>Timestamp:</strong> {{ timestamp }}<br>
                🔗 <strong>CORS:</strong> Habilitado para desenvolvimento<br>
                🐛 <strong>Debug:</strong> Inserção limitada a 10 registros para análise
            </div>
            
            <h2>📍 Endpoints Disponíveis</h2>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/health</code><br>
                <small>Health check da API</small>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <code>/authenticate</code><br>
                <small>Autenticação de usuários</small>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/desembarque/dates</code><br>
                <small>Buscar datas disponíveis</small>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/desembarque</code><br>
                <small>Buscar dados com filtros</small>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <code>/api/desembarque/upload</code><br>
                <small>Upload de arquivos Excel (ADMIN only) - COM DEBUG DETALHADO</small>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/desembarque/status</code><br>
                <small>Status da última importação</small>
            </div>
            
            <h2>🔧 Configurações</h2>
            <ul>
                <li><strong>Porta:</strong> {{ port }}</li>
                <li><strong>Modo:</strong> Desenvolvimento + Debug</li>
                <li><strong>CORS:</strong> Habilitado (*)</li>
                <li><strong>Upload:</strong> Excel (.xlsx, .xlsb, .xls)</li>
                <li><strong>Debug SQL:</strong> Ativo (limitado a 10 registros)</li>
            </ul>
        </div>
    </body>
    </html>
    """
    
    return render_template_string(html, 
                                timestamp=datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
                                port=os.environ.get('PORT', 9280))

# ========================================
# 🚀 INICIALIZAÇÃO DO SERVIDOR
# ========================================

if __name__ == '__main__':
    # Desabilitar logs de requisições do Werkzeug
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    
    # Start the Flask app normally; avoid accessing `request` or using `return` at module level.
    port = int(os.environ.get('PORT', 9280))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
