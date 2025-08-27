import os
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import logging
from typing import Dict, Any, List, Literal
import uuid
from datetime import datetime

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "Qwen/Qwen1.8B-Chat")
PORT = int(os.getenv("PORT", 5000))
DEBUG = os.getenv("DEBUG", "1").lower() in ("1", "true", "yes")
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    "Você é um assistente útil, conciso e responde sempre em português claro."
)

MessageRole = Literal["system", "user", "assistant"]

class ChatModel:
    def __init__(self, model_name: str = DEFAULT_MODEL, system_prompt: str | None = None):
        self.model_name = model_name
        self.system_prompt = system_prompt or SYSTEM_PROMPT
        self.tokenizer = None
        self.model = None
        # chat_history[session_id] = list[ {role, content} ]
        self.chat_history: dict[str, List[dict[str, str]]] = {}
        self.is_loaded = False
        
    def load_model(self):
        """Carrega o modelo e tokenizer"""
        try:
            logger.info(f"Carregando modelo: {self.model_name}")
            if torch.cuda.is_available():
                logger.info(f"CUDA disponível - usando GPU: {torch.cuda.get_device_name(0)}")
            else:
                logger.info("CUDA não disponível - usando CPU")

            load_kwargs = {}
            if os.getenv("LOAD_8BIT", "0").lower() in ("1", "true"):
                try:
                    import bitsandbytes  # noqa: F401
                    if torch.cuda.is_available():
                        load_kwargs.update({"device_map": "auto", "load_in_8bit": True})
                        logger.info("Ativando carregamento 8-bit")
                except ImportError:
                    logger.warning("bitsandbytes não instalado; ignorando LOAD_8BIT")

            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name, trust_remote_code=True, **load_kwargs)

            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            self.is_loaded = True
            logger.info("Modelo carregado com sucesso!")
            
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {str(e)}")
            raise
    
    def create_chat_session(self) -> str:
        session_id = str(uuid.uuid4())
        self.chat_history[session_id] = [{"role": "system", "content": self.system_prompt}]
        logger.info(f"Nova sessão criada: {session_id}")
        return session_id
    
    def generate_response(self, session_id: str, user_message: str,
                          max_length: int = 512, temperature: float = 0.7) -> Dict[str, Any]:
        if not self.is_loaded:
            raise RuntimeError("Modelo não foi carregado. Chame load_model() primeiro.")
        if session_id not in self.chat_history:
            raise ValueError(f"Sessão {session_id} não encontrada")

        try:
            self.chat_history[session_id].append({"role": "user", "content": user_message})

            is_qwen_like = "qwen" in self.model_name.lower()

            if is_qwen_like and hasattr(self.tokenizer, "apply_chat_template"):
                prompt_text = self.tokenizer.apply_chat_template(
                    self.chat_history[session_id], tokenize=False, add_generation_prompt=True
                )
                inputs = self.tokenizer(prompt_text, return_tensors="pt", truncation=True, max_length=1024)
            else:
                turns: List[str] = []
                for m in self.chat_history[session_id][-12:]:
                    r = m["role"].capitalize()
                    turns.append(f"{r}: {m['content']}")
                turns.append("Assistant:")
                prompt_text = "\n".join(turns)
                inputs = self.tokenizer(prompt_text, return_tensors="pt", truncation=True, max_length=1024)

            input_len = inputs["input_ids"].shape[1]
            gen_kwargs = {
                "max_new_tokens": min(max_length, 384),
                "temperature": temperature,
                "top_p": 0.9,
                "top_k": 50,
                "do_sample": True,
                "repetition_penalty": 1.12,
                "pad_token_id": self.tokenizer.eos_token_id,
            }
            if torch.cuda.is_available():
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}

            with torch.no_grad():
                output_ids = self.model.generate(**inputs, **gen_kwargs)

            generated = output_ids[0][input_len:]
            response = self.tokenizer.decode(generated, skip_special_tokens=True).strip()

            if is_qwen_like and response.lower().startswith("assistant:"):
                response = response.split(":", 1)[1].strip()

            self.chat_history[session_id].append({"role": "assistant", "content": response})

            # Limita histórico: mantém system + últimos 18 turnos (9 pares)
            if len(self.chat_history[session_id]) > 1 + 18:
                base = [self.chat_history[session_id][0]]
                self.chat_history[session_id] = base + self.chat_history[session_id][-18:]

            return {
                "response": response,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "model": self.model_name
            }
        except Exception as e:
            logger.error(f"Erro ao gerar resposta: {str(e)}")
            raise
    
    def get_chat_history(self, session_id: str) -> list:
        return self.chat_history.get(session_id, [])
    
    def clear_session(self, session_id: str):
        if session_id in self.chat_history:
            del self.chat_history[session_id]
            logger.info(f"Sessão {session_id} limpa")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Retorna informações sobre o modelo"""
        return {
            "model_name": self.model_name,
            "is_loaded": self.is_loaded,
            "active_sessions": len(self.chat_history)
        }

# Instância global do modelo
chat_model = ChatModel()

