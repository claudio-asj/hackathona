#!/usr/bin/env python3
"""
Script para executar o servidor de desenvolvimento
"""
import os
import sys
import logging
from pathlib import Path

# Garante que o diretório raiz do projeto esteja no sys.path quando executado diretamente
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from chat.app import create_app
from chat.services.chat_service import chat_service

# Configura logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def main():
    """Função principal"""
    try:
        # Cria a aplicação Flask
        app = create_app()
        
        # Inicia o carregamento do modelo em background
        print("🚀 Iniciando carregamento do modelo em background...")
        chat_service.start_model_loading()
        
        # Configurações do servidor
        port = int(os.getenv('PORT', 5000))
        debug = os.getenv('DEBUG', 'True').lower() == 'true'
        
        print(f"🌐 Servidor iniciando na porta {port}")
        print(f"🔧 Modo debug: {debug}")
        print(f"📡 API disponível em: http://localhost:{port}")
        print(f"🔍 Health check: http://localhost:{port}/api/chat/health")
        
        # Executa o servidor
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug,
            use_reloader=False  # Desabilita reloader para evitar conflitos com o modelo
        )
        
    except KeyboardInterrupt:
        print("\n👋 Servidor interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
