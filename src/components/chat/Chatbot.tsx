import React, { useEffect, useRef } from 'react';
import { useImmer } from 'use-immer';
import ChatMessages from '../chat/ChatMenssages';
import ChatInput from './ChatInput';
import { createChat, sendMessage, sendMessageStream, checkApiHealth } from './chatApi';


type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
    createdAt: string;
    pending?: boolean;
    error?: boolean;
    streaming?: boolean;
}

interface ChatState {
    chatId: string | null;
    loading: boolean;
    error: string | null;
    messages: ChatMessage[];
    sending: boolean;
    connected: boolean;
}

const initialState: ChatState = {
    chatId: null,
    loading: true,
    error: null,
    messages: [],
    sending: false,
    connected: false
};

const USE_STREAMING = true;

const Chatbot: React.FC = () => {
    const [state, update] = useImmer<ChatState>(() => initialState);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }, [state.messages.length]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                console.log('🔍 Iniciando conexão com a API...');
                
                // Verifica se a API está disponível
                const isApiAvailable = await checkApiHealth();
                console.log('📡 Status da API:', isApiAvailable);
                
                if (!isApiAvailable) {
                    throw new Error('Servidor não está disponível. Verifique se o backend Flask está rodando.');
                }

                console.log('✅ API disponível, criando sessão...');
                const c = await createChat();
                console.log('🎯 Sessão criada:', c);
                
                if (!mounted) return;
                update(d => {
                    d.chatId = c.id;
                    d.loading = false;
                    d.connected = true;
                    d.messages.push({
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: 'Olá! Como posso ajudar hoje?',
                        createdAt: new Date().toISOString()
                    });
                });
                console.log('🎉 Chat inicializado com sucesso!');
            } catch (e: any) {
                console.error('❌ Erro ao inicializar chat:', e);
                update(d => {
                    d.loading = false;
                    d.error = e?.message || 'Erro ao iniciar.';
                });
            }
        })();
        return () => {
            mounted = false;
            abortRef.current?.abort();
        };
    }, [update]);

    async function handleSend(text: string) {
        if (!text.trim() || state.sending || !state.chatId) return;

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const userId = crypto.randomUUID();
        const assistantId = crypto.randomUUID();
        const ts = new Date().toISOString();

        update(d => {
            d.sending = true;
            d.messages.push({
                id: userId,
                role: 'user',
                content: text,
                createdAt: ts
            });
            d.messages.push({
                id: assistantId,
                role: 'assistant',
                content: '',
                createdAt: ts,
                pending: true,
                streaming: USE_STREAMING
            });
        });

        try {
            if (USE_STREAMING) {
                for await (const chunk of sendMessageStream(state.chatId, text, controller.signal)) {
                    update(d => {
                        const msg = d.messages.find(m => m.id === assistantId);
                        if (msg) msg.content += chunk;
                    });
                }
            } else {
                const full = await sendMessage(state.chatId, text, controller.signal);
                update(d => {
                    const msg = d.messages.find(m => m.id === assistantId);
                    if (msg) msg.content = full;
                });
            }

            update(d => {
                const msg = d.messages.find(m => m.id === assistantId);
                if (msg) {
                    msg.pending = false;
                    msg.streaming = false;
                }
                d.sending = false;
            });
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                update(d => {
                    const msg = d.messages.find(m => m.id === assistantId);
                    if (msg) {
                        msg.pending = false;
                        msg.streaming = false;
                        msg.error = true;
                        if (!msg.content) msg.content = '(Cancelado)';
                    }
                    d.sending = false;
                });
                return;
            }
            update(d => {
                const msg = d.messages.find(m => m.id === assistantId);
                if (msg) {
                    msg.pending = false;
                    msg.streaming = false;
                    msg.error = true;
                    if (!msg.content) msg.content = 'Erro ao gerar resposta.';
                }
                d.sending = false;
            });
        }
    }

    function handleRetry(id: string) {
        const failed = state.messages.find(m => m.id === id && m.error);
        if (!failed) return;
        const lastUser = [...state.messages].reverse().find(m => m.role === 'user');
        if (!lastUser) return;
        // Remove a mensagem com erro e reenviar
        update(d => {
            d.messages = d.messages.filter(m => m.id !== id);
        });
        void handleSend(lastUser.content);
    }

    function handleAbort() {
        abortRef.current?.abort();
    }

    return (
        <div className="h-screen w-full flex flex-col bg-[#343541] text-slate-100">
            {/* Área de mensagens com scroll */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
                <ChatMessages messages={state.messages} onRetry={handleRetry} />
                <div ref={bottomRef} />
                {state.loading && (
                    <div className="text-center py-6 text-sm text-slate-400">
                        Carregando sessão...
                    </div>
                )}
                {state.error && (
                    <div className="text-center py-6 text-sm text-red-400">
                        {state.error}
                    </div>
                )}
                {!state.error && !state.loading && !state.connected && (
                    <div className="text-center py-6 text-sm text-yellow-400">
                        Conectando ao servidor...
                    </div>
                )}
            </div>

            {/* Gradiente superior do input (igual ChatGPT) */}
            <div className="w-full pointer-events-none select-none h-32 bg-gradient-to-t from-[#343541] via-[#343541] to-transparent -mt-32 z-10" />

            {/* Barra de entrada fixa */}
            <div className="relative px-4 md:px-6 pb-6 z-20">
                <div className="max-w-3xl mx-auto">
                    <ChatInput
                        disabled={state.loading}
                        onSend={handleSend}
                        sending={state.sending}
                    />
                    <p className="text-center text-[11px] mt-3 text-slate-500">
                        Este assistente pode cometer erros. Verifique as informações.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;