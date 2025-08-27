import logging
from typing import Optional
from chat.models.simple_chat_model import simple_chat_model

logger = logging.getLogger(__name__)

class SimpleChatService:
    def __init__(self):
        self.model_loaded = True  # Sempre carregado pois é simples
        
    def create_session(self) -> str:
        """Cria uma nova sessão de chat"""
        return simple_chat_model.create_chat_session()
    
    def send_message(self, session_id: str, message: str, **kwargs):
        """Envia uma mensagem e retorna a resposta"""
        return simple_chat_model.generate_response(session_id, message, **kwargs)
    
    def get_status(self) -> dict:
        """Retorna o status do serviço"""
        return {
            "model_loaded": self.model_loaded,
            "model_info": simple_chat_model.get_model_info()
        }

# Instância global do serviço
simple_chat_service = SimpleChatService()
