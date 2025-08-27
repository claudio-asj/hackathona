from flask import Blueprint, request, jsonify, Response
from chat.utils.validators import validate_session_id, validate_message_data, sanitize_message
from chat.services.chat_service import chat_service
from chat.models.chat_model import chat_model
import json
import logging

# Configuração de logging
logger = logging.getLogger(__name__)

# Cria o blueprint para as rotas de chat
chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se a API está funcionando"""
    return jsonify({
        "status": "healthy",
        "message": "Chat API está funcionando"
    })

@chat_bp.route('/model/info', methods=['GET'])
def get_model_info():
    try:
        return jsonify(chat_model.get_model_info())
    except Exception as e:
        logger.error(f"Erro ao obter informações do modelo: {str(e)}")
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/status', methods=['GET'])
def status():
    return jsonify(chat_service.get_status())

@chat_bp.route('/status', methods=['GET'])
def get_status():
    """Status de carregamento do modelo"""
    return jsonify(chat_service.get_status())

@chat_bp.route('/session/create', methods=['POST'])
def create_session():
    """Cria uma nova sessão de chat"""
    try:
        if not chat_service.model_loaded:
            return jsonify({"error": "Modelo carregando"}), 503
        session_id = chat_service.create_session()
        return jsonify({
            "session_id": session_id,
            "message": "Sessão criada com sucesso"
        })
    except Exception as e:
        logger.error(f"Erro ao criar sessão: {str(e)}")
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/session/<session_id>/message', methods=['POST'])
def send_message(session_id):
    """Envia uma mensagem e recebe resposta"""
    try:
        # Valida session_id
        if not validate_session_id(session_id):
            return jsonify({"error": "Session ID inválido"}), 400
        
        data = request.get_json()
        
        # Valida dados da mensagem
        is_valid, error_msg = validate_message_data(data)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        
        user_message = sanitize_message(data['message'])
        max_length = data.get('max_length', 1000)
        temperature = data.get('temperature', 0.7)
        
        # Gera resposta
        if not chat_service.model_loaded:
            return jsonify({"error": "Modelo carregando"}), 503
        response_data = chat_service.send_message(
            session_id=session_id,
            message=user_message,
            max_length=max_length,
            temperature=temperature
        )
        
        return jsonify(response_data)
        
    except ValueError as e:
        logger.error(f"Sessão não encontrada: {str(e)}")
        return jsonify({"error": "Sessão não encontrada"}), 404
    except Exception as e:
        logger.error(f"Erro ao processar mensagem: {str(e)}")
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/session/<session_id>/history', methods=['GET'])
def get_history(session_id):
    """Retorna o histórico de uma sessão"""
    try:
        history = chat_model.get_chat_history(session_id)
        return jsonify({
            "session_id": session_id,
            "history": history
        })
    except Exception as e:
        logger.error(f"Erro ao obter histórico: {str(e)}")
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/session/<session_id>/clear', methods=['DELETE'])
def clear_session(session_id):
    """Limpa o histórico de uma sessão"""
    try:
        chat_model.clear_session(session_id)
        return jsonify({
            "message": "Sessão limpa com sucesso",
            "session_id": session_id
        })
    except Exception as e:
        logger.error(f"Erro ao limpar sessão: {str(e)}")
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/session/<session_id>/stream', methods=['POST'])
def stream_message(session_id):
    """Endpoint para streaming de respostas (SSE)"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Mensagem é obrigatória"}), 400
        
        user_message = data['message']
        max_length = data.get('max_length', 1000)
        temperature = data.get('temperature', 0.7)
        
        def generate():
            try:
                # Gera resposta
                response_data = chat_model.generate_response(
                    session_id=session_id,
                    user_message=user_message,
                    max_length=max_length,
                    temperature=temperature
                )
                
                # Envia resposta em chunks para simular streaming
                response_text = response_data['response']
                chunk_size = 50
                
                for i in range(0, len(response_text), chunk_size):
                    chunk = response_text[i:i + chunk_size]
                    yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
                
                # Sinaliza fim do streaming
                yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return Response(generate(), mimetype='text/event-stream')
        
    except Exception as e:
        logger.error(f"Erro no streaming: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Middleware para logging de requisições
@chat_bp.before_request
def log_request():
    logger.info(f"Requisição: {request.method} {request.path}")

@chat_bp.after_request
def log_response(response):
    logger.info(f"Resposta: {response.status_code}")
    return response
