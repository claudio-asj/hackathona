import os
from typing import Dict, Any

class Config:
    """Configurações base da aplicação"""
    
    # Configurações do Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
    
    # Configurações do modelo
    DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'Qwen/Qwen1.5-0.5B-Chat')
    MAX_MESSAGE_LENGTH = int(os.getenv('MAX_MESSAGE_LENGTH', 1000))
    DEFAULT_TEMPERATURE = float(os.getenv('DEFAULT_TEMPERATURE', 0.7))
    MAX_HISTORY_LENGTH = int(os.getenv('MAX_HISTORY_LENGTH', 10))
    
    # Configurações de CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Configurações de logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Configurações de timeout
    MODEL_LOADING_TIMEOUT = int(os.getenv('MODEL_LOADING_TIMEOUT', 300))  # 5 minutos
    REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', 60))  # 1 minuto
    
    @classmethod
    def get_model_config(cls) -> Dict[str, Any]:
        """Retorna configurações específicas do modelo"""
        return {
            'model_name': cls.DEFAULT_MODEL,
            'max_length': cls.MAX_MESSAGE_LENGTH,
            'temperature': cls.DEFAULT_TEMPERATURE,
            'max_history': cls.MAX_HISTORY_LENGTH
        }
    
    @classmethod
    def get_cors_config(cls) -> Dict[str, Any]:
        """Retorna configurações de CORS"""
        return {
            'origins': cls.CORS_ORIGINS,
            'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'allow_headers': ['Content-Type', 'Authorization']
        }

class DevelopmentConfig(Config):
    """Configurações para desenvolvimento"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Configurações para produção"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    
    @classmethod
    def init_app(cls, app):
        # Configurações específicas para produção
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not app.debug and not app.testing:
            # Configura logging para arquivo
            if not os.path.exists('logs'):
                os.mkdir('logs')
            file_handler = RotatingFileHandler(
                'logs/chat_api.log', 
                maxBytes=10240000, 
                backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(cls.LOG_FORMAT))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)
            app.logger.info('Chat API startup')

class TestingConfig(Config):
    """Configurações para testes"""
    TESTING = True
    DEBUG = True
    # Modelo menor para testes rápidos
    DEFAULT_MODEL = 'Qwen/Qwen1.5-0.5B-Chat'

# Dicionário de configurações
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

