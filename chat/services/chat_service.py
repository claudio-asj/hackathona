import threading
import time
import logging
from typing import Optional
from chat.models.chat_model import chat_model

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.model_loading = False
        self.model_loaded = False
        self.loading_thread: Optional[threading.Thread] = None
        
    def start_model_loading(self):
        """Inicia o carregamento do modelo em uma thread separada"""
        if self.model_loading or self.model_loaded:
            return
            
        self.model_loading = True
        self.loading_thread = threading.Thread(target=self._load_model_async)
        self.loading_thread.daemon = True
        self.loading_thread.start()
        
    def _load_model_async(self):
        """Carrega o modelo de forma assíncrona"""
        try:
            logger.info("Iniciando carregamento do modelo...")
            chat_model.load_model()
            self.model_loaded = True
            logger.info("Modelo carregado com sucesso!")
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {str(e)}")
        finally:
            self.model_loading = False
    
    def wait_for_model(self, timeout: int = 300) -> bool:
        """Aguarda o modelo ser carregado"""
        if self.model_loaded:
            return True
            
        if not self.model_loading:
            self.start_model_loading()
            
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.model_loaded:
                return True
            time.sleep(1)
            
        return False
    
    def get_status(self) -> dict:
        """Retorna o status do serviço"""
        return {
            "model_loading": self.model_loading,
            "model_loaded": self.model_loaded,
            "model_info": chat_model.get_model_info() if self.model_loaded else None
        }
    
    def create_session(self) -> str:
        """Cria uma nova sessão de chat"""
        if not self.model_loaded:
            raise RuntimeError("Modelo não está carregado")
        return chat_model.create_chat_session()
    
    def send_message(self, session_id: str, message: str, **kwargs):
        """Envia uma mensagem e retorna a resposta"""
        if not self.model_loaded:
            raise RuntimeError("Modelo não está carregado")
        return chat_model.generate_response(session_id, message, **kwargs)

# Instância global do serviço
chat_service = ChatService()

