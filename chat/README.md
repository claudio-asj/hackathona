# Chat API - Backend Flask

Backend Flask para o chatbot usando transformers e pipeline.

## Estrutura do Projeto

```
chat/
├── app.py                 # Aplicação principal Flask
├── run.py                 # Script para executar o servidor
├── wsgi.py               # WSGI para produção
├── requirements.txt      # Dependências Python
├── env.example          # Exemplo de variáveis de ambiente
├── README.md            # Esta documentação
├── config/              # Configurações
│   ├── __init__.py
│   └── settings.py
├── models/              # Modelos de ML
│   ├── __init__.py
│   └── chat_model.py
├── routes/              # Rotas da API
│   ├── __init__.py
│   └── chat_routes.py
├── services/            # Serviços
│   ├── __init__.py
│   └── chat_service.py
└── utils/               # Utilitários
    ├── __init__.py
    └── validators.py
```

## Instalação

1. **Instale as dependências:**
```bash
cd chat
pip install -r requirements.txt
```

2. **Configure as variáveis de ambiente:**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Execute o servidor:**
```bash
python run.py
```

## Endpoints da API

### Health Check
- **GET** `/api/chat/health`
- Verifica se a API está funcionando

### Informações do Modelo
- **GET** `/api/chat/model/info`
- Retorna informações sobre o modelo carregado

### Sessões de Chat

#### Criar Sessão
- **POST** `/api/chat/session/create`
- Cria uma nova sessão de chat
- **Resposta:**
```json
{
  "session_id": "uuid-da-sessao",
  "message": "Sessão criada com sucesso"
}
```

#### Enviar Mensagem
- **POST** `/api/chat/session/{session_id}/message`
- Envia uma mensagem e recebe resposta
- **Body:**
```json
{
  "message": "Sua mensagem aqui",
  "max_length": 1000,
  "temperature": 0.7
}
```
- **Resposta:**
```json
{
  "response": "Resposta do modelo",
  "session_id": "uuid-da-sessao",
  "timestamp": "2024-01-01T12:00:00",
  "model": "microsoft/DialoGPT-medium"
}
```

#### Obter Histórico
- **GET** `/api/chat/session/{session_id}/history`
- Retorna o histórico de mensagens da sessão

#### Limpar Sessão
- **DELETE** `/api/chat/session/{session_id}/clear`
- Limpa o histórico da sessão

#### Streaming (SSE)
- **POST** `/api/chat/session/{session_id}/stream`
- Envia mensagem e recebe resposta em streaming
- Usa Server-Sent Events (SSE)

## Configurações

### Variáveis de Ambiente

- `SECRET_KEY`: Chave secreta do Flask
- `DEBUG`: Modo debug (True/False)
- `PORT`: Porta do servidor (padrão: 5000)
- `DEFAULT_MODEL`: Modelo a ser usado (padrão: microsoft/DialoGPT-medium)
- `MAX_MESSAGE_LENGTH`: Comprimento máximo da mensagem
- `DEFAULT_TEMPERATURE`: Temperatura para geração (0.0-2.0)
- `CORS_ORIGINS`: Origens permitidas para CORS

### Modelos Disponíveis

- `microsoft/DialoGPT-small`: Modelo pequeno (117M parâmetros)
- `microsoft/DialoGPT-medium`: Modelo médio (345M parâmetros)
- `microsoft/DialoGPT-large`: Modelo grande (774M parâmetros)

## Desenvolvimento

### Executar em Desenvolvimento
```bash
python run.py
```

### Executar em Produção
```bash
gunicorn chat.wsgi:app
```

### Testar Endpoints
```bash
# Health check
curl http://localhost:5000/api/chat/health

# Criar sessão
curl -X POST http://localhost:5000/api/chat/session/create

# Enviar mensagem
curl -X POST http://localhost:5000/api/chat/session/{session_id}/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá, como você está?"}'
```

## Características

- ✅ Carregamento assíncrono do modelo
- ✅ Gerenciamento de sessões
- ✅ Streaming de respostas (SSE)
- ✅ Validação de dados
- ✅ Logging configurável
- ✅ CORS configurado
- ✅ Estrutura modular
- ✅ Configurações por ambiente

## Integração com React

O backend está configurado para aceitar requisições do frontend React rodando em:
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (Create React App)

As rotas da API seguem o padrão RESTful e retornam JSON.
