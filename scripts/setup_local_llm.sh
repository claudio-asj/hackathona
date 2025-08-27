#!/usr/bin/env bash
set -euo pipefail

# Script de preparação do ambiente local para rodar o backend LLM (Flask + Transformers)
# Uso:
#   bash scripts/setup_local_llm.sh [--model <nome_do_modelo>] [--simple] [--8bit]
# Exemplo:
#   bash scripts/setup_local_llm.sh --model Qwen/Qwen1.8B-Chat --8bit
#   bash scripts/setup_local_llm.sh --simple

MODEL_OVERRIDE=""
USE_SIMPLE_REQ=0
USE_8BIT=0
PYTHON_BIN="python3"
VENV_DIR=".venv"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAT_DIR="$PROJECT_ROOT/chat"
REQ_FILE="requirements.txt"

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
info() { echo "$(color 36 '[INFO]') $*"; }
warn() { echo "$(color 33 '[WARN]') $*"; }
err()  { echo "$(color 31 '[ERRO]') $*"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --model)
      MODEL_OVERRIDE="$2"; shift 2;;
    --simple)
      USE_SIMPLE_REQ=1; shift;;
    --8bit)
      USE_8BIT=1; shift;;
    --python)
      PYTHON_BIN="$2"; shift 2;;
    --help|-h)
      grep '^# ' "$0" | sed 's/^# //'; exit 0;;
    *) err "Argumento desconhecido: $1"; exit 1;;
  esac
done

cd "$PROJECT_ROOT"

if [[ $USE_SIMPLE_REQ -eq 1 ]]; then
  REQ_FILE="requirements_simple.txt"
fi

if [[ ! -d "$CHAT_DIR" ]]; then
  err "Diretório chat/ não encontrado em $PROJECT_ROOT"; exit 1
fi

info "Python: $($PYTHON_BIN --version 2>&1)"

if [[ ! -d "$VENV_DIR" ]]; then
  info "Criando virtualenv em $VENV_DIR";
  $PYTHON_BIN -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

pip install --upgrade pip

cd "$CHAT_DIR"

if [[ ! -f "$REQ_FILE" ]]; then
  err "Arquivo $REQ_FILE não encontrado (diretório: $CHAT_DIR)"; exit 1
fi

info "Instalando dependências base ($REQ_FILE)"
pip install -r "$REQ_FILE"

if [[ $USE_8BIT -eq 1 ]]; then
  info "Instalando bitsandbytes para quantização 8-bit (opcional)"
  if ! pip install bitsandbytes accelerate; then
    warn "Falha ao instalar bitsandbytes. Continuando sem 8-bit."
    USE_8BIT=0
  fi
fi

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  info "Criando .env a partir de env.example"
  cp env.example "$ENV_FILE"
fi

if [[ -n "$MODEL_OVERRIDE" ]]; then
  info "Aplicando override de modelo DEFAULT_MODEL=$MODEL_OVERRIDE"
  if grep -q '^DEFAULT_MODEL=' "$ENV_FILE"; then
    sed -i "s|^DEFAULT_MODEL=.*|DEFAULT_MODEL=$MODEL_OVERRIDE|" "$ENV_FILE"
  else
    echo "DEFAULT_MODEL=$MODEL_OVERRIDE" >> "$ENV_FILE"
  fi
fi

if [[ $USE_8BIT -eq 1 ]]; then
  if grep -q '^LOAD_8BIT=' "$ENV_FILE"; then
    sed -i 's|^LOAD_8BIT=.*|LOAD_8BIT=1|' "$ENV_FILE"
  else
    echo 'LOAD_8BIT=1' >> "$ENV_FILE"
  fi
fi

MODEL_NAME=$(grep '^DEFAULT_MODEL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
if [[ -z "$MODEL_NAME" ]]; then
  MODEL_NAME="Qwen/Qwen1.5-0.5B-Chat"
fi

info "Pré-baixando pesos e tokenizer do modelo: $MODEL_NAME"
python - <<PYEOF
import os, sys
from transformers import AutoTokenizer, AutoModelForCausalLM
model_name = os.getenv('MODEL_NAME', '$MODEL_NAME')
print(f'Download inicial do modelo {model_name}...')
try:
    tok = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    _ = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True)
    print('Download concluído.')
except Exception as e:
    print(f'Falha no download antecipado: {e}')
    sys.exit(1)
PYEOF

info "Resumo do ambiente:" 
python - <<PYEOF
import torch, os
print('CUDA disponível:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU:', torch.cuda.get_device_name(0))
print('Modelo definido:', os.getenv('MODEL_NAME', '$MODEL_NAME'))
PYEOF

info "Ambiente pronto. Ative com: source $VENV_DIR/bin/activate"
info "Para iniciar o servidor: python chat/run.py (de dentro do diretório raiz ou chat/)"
