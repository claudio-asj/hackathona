from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
import sys
from pathlib import Path

# Garantir que o pacote 'chat' possa ser importado mesmo executando `python app.py` dentro da pasta chat
_CURR = Path(__file__).resolve().parent
_PARENT = _CURR.parent
if str(_PARENT) not in sys.path:
    sys.path.insert(0, str(_PARENT))

# Carrega variáveis de ambiente
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuração de logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Configuração CORS para permitir requisições do frontend React
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])
    
    # Configurações da aplicação
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Inicia serviço com modelo transformers
    from chat.services.chat_service import chat_service
    from chat.models.chat_model import chat_model
    logging.info("Iniciando carregamento do modelo %s", chat_model.model_name)
    chat_service.start_model_loading()

    from chat.routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api/chat')

    @app.route('/api/chat/status', methods=['GET'])
    def status():
        return jsonify(chat_service.get_status())
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
