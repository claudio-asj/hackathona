// Configuração da API com variável de ambiente (definida em .env.local -> VITE_CHAT_API_URL)
const API_BASE_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:5000/api/chat';

// Tipos
export interface ChatSession {
    session_id: string;
    message: string;
}

export interface ChatResponse {
    response: string;
    session_id: string;
    timestamp: string;
    model: string;
}

export interface ChatError {
    error: string;
}

// Função para status / carregamento do modelo
export async function getStatus(): Promise<any> {
    try {
        const res = await fetch(`${API_BASE_URL}/status`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// Função para criar uma nova sessão de chat
export async function createChat(): Promise<{ id: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/session/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData: ChatError = await response.json();
            throw new Error(errorData.error || 'Erro ao criar sessão');
        }

        const data: ChatSession = await response.json();
        return { id: data.session_id };
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        throw new Error('Falha na conexão com o servidor');
    }
}

// Função para enviar mensagem e receber resposta completa
export async function sendMessage(
    sessionId: string, 
    message: string, 
    signal?: AbortSignal
): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                max_length: 1000,
                temperature: 0.7
            }),
            signal
        });

        if (!response.ok) {
            const errorData: ChatError = await response.json();
            throw new Error(errorData.error || 'Erro ao enviar mensagem');
        }

        const data: ChatResponse = await response.json();
        return data.response;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        console.error('Erro ao enviar mensagem:', error);
        throw new Error('Falha na conexão com o servidor');
    }
}

// Função para streaming de mensagens (simulada)
export async function* sendMessageStream(
    sessionId: string, 
    message: string, 
    signal?: AbortSignal
): AsyncGenerator<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                max_length: 1000,
                temperature: 0.7
            }),
            signal
        });

        if (!response.ok) {
            const errorData: ChatError = await response.json();
            throw new Error(errorData.error || 'Erro ao enviar mensagem');
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Stream não disponível');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.chunk) {
                                yield data.chunk;
                            }
                            if (data.done) {
                                return;
                            }
                        } catch (e) {
                            // Ignora linhas que não são JSON válido
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        console.error('Erro no streaming:', error);
        throw new Error('Falha na conexão com o servidor');
    }
}

// Função para obter histórico de uma sessão
export async function getChatHistory(sessionId: string): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/history`);

        if (!response.ok) {
            const errorData: ChatError = await response.json();
            throw new Error(errorData.error || 'Erro ao obter histórico');
        }

        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error('Erro ao obter histórico:', error);
        throw new Error('Falha na conexão com o servidor');
    }
}

// Função para limpar uma sessão
export async function clearChatSession(sessionId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/clear`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData: ChatError = await response.json();
            throw new Error(errorData.error || 'Erro ao limpar sessão');
        }
    } catch (error) {
        console.error('Erro ao limpar sessão:', error);
        throw new Error('Falha na conexão com o servidor');
    }
}

// Função para verificar se a API está funcionando
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('API não está disponível:', error);
        return false;
    }
}
