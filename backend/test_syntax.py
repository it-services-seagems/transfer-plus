#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Script para testar se o Api.py tem erro de sintaxe"""

import sys
import traceback

try:
    print("✅ Verificando sintaxe do Api.py...")
    import Api
    print("✅ Api.py carregado com SUCESSO!")
    print(f"✅ Servidor Flask iniciado em: {Api.app.config}")
except SyntaxError as e:
    print(f"❌ ERRO DE SINTAXE: {e}")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"⚠️ Erro ao carregar Api.py: {e}")
    traceback.print_exc()
    sys.exit(1)
