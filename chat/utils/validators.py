import re
from typing import Dict, Any, Optional

def validate_session_id(session_id: str) -> bool:
    """Valida se o session_id tem formato UUID válido"""
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(session_id))

def validate_message_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Valida os dados da mensagem"""
    if not data:
        return False, "Dados da requisição são obrigatórios"
    
    if 'message' not in data:
        return False, "Campo 'message' é obrigatório"
    
    message = data.get('message', '').strip()
    if not message:
        return False, "Mensagem não pode estar vazia"
    
    if len(message) > 1000:
        return False, "Mensagem muito longa (máximo 1000 caracteres)"
    
    # Valida parâmetros opcionais
    max_length = data.get('max_length', 1000)
    if not isinstance(max_length, int) or max_length < 1 or max_length > 2000:
        return False, "max_length deve ser um inteiro entre 1 e 2000"
    
    temperature = data.get('temperature', 0.7)
    if not isinstance(temperature, (int, float)) or temperature < 0.0 or temperature > 2.0:
        return False, "temperature deve ser um número entre 0.0 e 2.0"
    
    return True, None

def sanitize_message(message: str) -> str:
    """Remove caracteres potencialmente perigosos da mensagem"""
    # Remove caracteres de controle exceto quebras de linha
    message = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', message)
    
    # Limita múltiplas quebras de linha
    message = re.sub(r'\n{3,}', '\n\n', message)
    
    # Remove espaços em branco excessivos
    message = re.sub(r' {2,}', ' ', message)
    
    return message.strip()

def validate_model_name(model_name: str) -> bool:
    """Valida se o nome do modelo é válido"""
    if not model_name or not isinstance(model_name, str):
        return False
    
    # Verifica se contém caracteres válidos
    if not re.match(r'^[a-zA-Z0-9\-_/]+$', model_name):
        return False
    
    # Verifica se tem formato de modelo HuggingFace
    if '/' not in model_name:
        return False
    
    return True

