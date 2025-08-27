#!/usr/bin/env python3
"""
Script de teste para verificar se a API está funcionando
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000/api/chat"

def test_health():
    """Testa o endpoint de health check"""
    print("🔍 Testando health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check OK")
            return True
        else:
            print(f"❌ Health check falhou: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar ao servidor")
        return False

def test_model_info():
    """Testa o endpoint de informações do modelo"""
    print("🔍 Testando informações do modelo...")
    try:
        response = requests.get(f"{BASE_URL}/model/info")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Modelo: {data.get('model_name', 'N/A')}")
            print(f"   Carregado: {data.get('is_loaded', False)}")
            print(f"   Sessões ativas: {data.get('active_sessions', 0)}")
            return True
        else:
            print(f"❌ Falha ao obter informações do modelo: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_create_session():
    """Testa a criação de uma sessão"""
    print("🔍 Testando criação de sessão...")
    try:
        response = requests.post(f"{BASE_URL}/session/create")
        if response.status_code == 200:
            data = response.json()
            session_id = data.get('session_id')
            print(f"✅ Sessão criada: {session_id}")
            return session_id
        else:
            print(f"❌ Falha ao criar sessão: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

def test_send_message(session_id):
    """Testa o envio de uma mensagem"""
    print("🔍 Testando envio de mensagem...")
    try:
        payload = {
            "message": "Olá! Como você está?",
            "max_length": 200,
            "temperature": 0.7
        }
        response = requests.post(
            f"{BASE_URL}/session/{session_id}/message",
            json=payload
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Resposta recebida: {data.get('response', '')[:100]}...")
            return True
        else:
            print(f"❌ Falha ao enviar mensagem: {response.status_code}")
            print(f"   Resposta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_get_history(session_id):
    """Testa a obtenção do histórico"""
    print("🔍 Testando obtenção do histórico...")
    try:
        response = requests.get(f"{BASE_URL}/session/{session_id}/history")
        if response.status_code == 200:
            data = response.json()
            history = data.get('history', [])
            print(f"✅ Histórico obtido: {len(history)} mensagens")
            return True
        else:
            print(f"❌ Falha ao obter histórico: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_clear_session(session_id):
    """Testa a limpeza da sessão"""
    print("🔍 Testando limpeza da sessão...")
    try:
        response = requests.delete(f"{BASE_URL}/session/{session_id}/clear")
        if response.status_code == 200:
            print("✅ Sessão limpa com sucesso")
            return True
        else:
            print(f"❌ Falha ao limpar sessão: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes da API...")
    print("=" * 50)
    
    # Testa health check
    if not test_health():
        print("❌ Servidor não está rodando. Execute 'python run.py' primeiro.")
        sys.exit(1)
    
    print()
    
    # Testa informações do modelo
    test_model_info()
    
    print()
    
    # Testa criação de sessão
    session_id = test_create_session()
    if not session_id:
        print("❌ Não foi possível criar sessão")
        sys.exit(1)
    
    print()
    
    # Aguarda um pouco para o modelo carregar (se necessário)
    print("⏳ Aguardando modelo carregar...")
    time.sleep(5)
    
    # Testa envio de mensagem
    test_send_message(session_id)
    
    print()
    
    # Testa obtenção do histórico
    test_get_history(session_id)
    
    print()
    
    # Testa limpeza da sessão
    test_clear_session(session_id)
    
    print()
    print("=" * 50)
    print("✅ Todos os testes concluídos!")

if __name__ == '__main__':
    main()
