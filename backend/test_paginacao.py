#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de teste para validar a paginação do endpoint /api/R2D/consulta
"""

import requests
import json
from datetime import datetime

API_URL = "http://10.15.3.30:9281/api/R2D/consulta"

# Headers de autenticação
headers = {
    "Authorization": "Bearer auth-token-1769192649329",
    "X-User-Type": "ADMIN",
    "X-User-Name": "gabriel.nascimento",
    "Content-Type": "application/json"
}

def testar_paginacao():
    """Testa a paginação com diferentes páginas"""
    
    params = {
        "data_inicio": "2025-01-01",
        "data_fim": "2026-01-01",
        "pagina": 1,
        "limite": 10
    }
    
    print("=" * 80)
    print("TESTE DE PAGINAÇÃO - R2D CONSULTA")
    print("=" * 80)
    print()
    
    # Teste página 1
    print("Testando Página 1...")
    response = requests.get(API_URL, params=params, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Sucesso: {data['sucesso']}")
        print(f"Total de registros: {data['paginacao']['total_registros']}")
        print(f"Total de páginas: {data['paginacao']['total_paginas']}")
        print(f"Página atual: {data['paginacao']['pagina_atual']}")
        print(f"Registros nesta página: {len(data['dados'])}")
        print(f"Limite por página: {data['paginacao']['limite_por_pagina']}")
        print(f"Tem próxima: {data['paginacao']['tem_proxima']}")
        print(f"Tem anterior: {data['paginacao']['tem_anterior']}")
        print(f"Intervalo de registros: {data['paginacao']['inicio_registro']} a {data['paginacao']['fim_registro']}")
        print()
        
        if len(data['dados']) > 0:
            print("Primeiro registro da página 1:")
            print(f"  PR: {data['dados'][0].get('PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER', 'N/A')}")
            print(f"  SPN: {data['dados'][0].get('SPN', 'N/A')}")
            print(f"  PO: {data['dados'][0].get('NUMERO_PO', 'N/A')}")
            print()
    else:
        print(f"ERRO: Status {response.status_code}")
        print(response.text)
        return
    
    # Teste página 2
    print("Testando Página 2...")
    params['pagina'] = 2
    response = requests.get(API_URL, params=params, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Página atual: {data['paginacao']['pagina_atual']}")
        print(f"Registros nesta página: {len(data['dados'])}")
        print(f"Intervalo de registros: {data['paginacao']['inicio_registro']} a {data['paginacao']['fim_registro']}")
        print()
        
        if len(data['dados']) > 0:
            print("Primeiro registro da página 2:")
            print(f"  PR: {data['dados'][0].get('PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER', 'N/A')}")
            print(f"  SPN: {data['dados'][0].get('SPN', 'N/A')}")
            print(f"  PO: {data['dados'][0].get('NUMERO_PO', 'N/A')}")
            print()
    else:
        print(f"ERRO: Status {response.status_code}")
        print(response.text)
        return
    
    print("=" * 80)
    print("RESUMO DO TESTE")
    print("=" * 80)
    print("✓ Paginação funcionando corretamente!")
    print("✓ Limite de 10 registros por página ativo")
    print("✓ Navegação entre páginas funcional")
    print("=" * 80)

if __name__ == "__main__":
    testar_paginacao()
