import React, { useState } from 'react';
import type { ChatMessage } from './Chatbot';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
    messages: ChatMessage[];
    onRetry: (id: string) => void;
    onCopy?: (text: string) => void;
}

const ChatMessages: React.FC<Props> = ({ messages, onRetry, onCopy }) => {
    if (!messages.length) {
        return (
            <div className="text-sm text-slate-400 py-10 text-center">
                Comece digitando sua primeira mensagem abaixo.
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            {messages.map((m, i) => {
                const isAssistant = m.role === 'assistant';
                const rowBg = isAssistant ? 'bg-[#444654]' : 'bg-[#343541]';

                return (
                    <div
                        key={m.id}
                        className={
                            'w-full flex justify-center ' +
                            rowBg +
                            (i === 0 ? ' pt-6' : ' ') +
                            ' px-4 md:px-6'
                        }
                    >
                        <div className="max-w-3xl w-full flex gap-5 py-6 group relative">
                            <Avatar isAssistant={isAssistant} />
                            <div className="flex-1 min-w-0">
                                <MessageBody message={m} />
                                <MessageFooters message={m} onRetry={onRetry} />
                            </div>
                            <ActionButtons message={m} onRetry={onRetry} onCopy={onCopy} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatMessages;

/* Avatar circular quadrado leve (ChatGPT hoje usa ícones redondos/variantes). */
const Avatar: React.FC<{ isAssistant: boolean }> = ({ isAssistant }) => {
    if (isAssistant) {
        return (
            <div className="h-9 w-9 rounded-sm bg-emerald-500/20 text-emerald-200 flex items-center justify-center text-xs font-semibold">
                AI
            </div>
        );
    }
    return (
        <div className="h-9 w-9 rounded-sm bg-indigo-500/25 text-indigo-200 flex items-center justify-center text-[11px] font-medium">
            Você
        </div>
    );
};

const MessageBody: React.FC<{ message: ChatMessage }> = ({ message }) => {
    // Placeholder “digitando”
    if (!message.content) {
        return (
            <div className="flex gap-1 pt-1">
                <span className="w-1.5 h-1.5 bg-slate-300/50 rounded-full animate-bounce" />
                <span
                    className="w-1.5 h-1.5 bg-slate-300/50 rounded-full animate-bounce"
                    style={{ animationDelay: '120ms' }}
                />
                <span
                    className="w-1.5 h-1.5 bg-slate-300/50 rounded-full animate-bounce"
                    style={{ animationDelay: '240ms' }}
                />
            </div>
        );
    }

    return (
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:m-0 max-w-none text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            <MarkdownRender
                text={message.content}
                streaming={message.streaming}
            />
        </div>
    );
};

const MessageFooters: React.FC<{
    message: ChatMessage;
    onRetry: (id: string) => void;
}> = ({ message, onRetry }) => {
    return (
        <>
            {message.error && (
                <div className="mt-3 text-xs text-red-300 flex items-center gap-3">
                    Ocorreu um erro ao gerar a resposta.
                    <button
                        onClick={() => onRetry(message.id)}
                        className="px-2 py-0.5 rounded bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 transition"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}
            {!message.error && message.pending && (
                <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-2">
                    {message.streaming ? (
                        <>
                            Transmitindo
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </>
                    ) : (
                        'Gerando resposta...'
                    )}
                </div>
            )}
        </>
    );
};

const ActionButtons: React.FC<{
    message: ChatMessage;
    onRetry: (id: string) => void;
    onCopy?: (t: string) => void;
}> = ({ message, onRetry, onCopy }) => {
    const [copied, setCopied] = useState(false);

    if (!message.content) return null;

    function copy() {
        const text = message.content;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            onCopy?.(text);
            setTimeout(() => setCopied(false), 1600);
        });
    }

    return (
        <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 text-[11px]">
            {!message.error && (
                <button
                    onClick={copy}
                    className="px-2 py-1 rounded bg-[#565869] text-slate-200 hover:bg-[#606274] transition"
                >
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
            )}
            {message.error && (
                <button
                    onClick={() => onRetry(message.id)}
                    className="px-2 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30 transition"
                >
                    Retry
                </button>
            )}
        </div>
    );
};

/* ---------- Markdown com code blocks ao estilo ChatGPT ---------- */

const MarkdownRender: React.FC<{ text: string; streaming?: boolean }> = ({
                                                                             text,
                                                                             streaming
                                                                         }) => {
    // Parse simples de ```code``` já feito pelo react-markdown.
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(codeProps) {
                    const { className, children } = codeProps as any;
                    const isInline = (codeProps as any).inline;
                    const language = (className || '').replace(/language-/, '');
                    if (isInline) {
                        return (
                            <code className="px-1 py-0.5 rounded bg-[#202123] text-emerald-300 text-[13px]">
                                {children}
                            </code>
                        );
                    }
                    return <CodeBlock code={String(children)} language={language} />;
                },
                a(props) {
                    const { href, children } = props;
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-300 underline hover:text-emerald-200"
                        >
                            {children}
                        </a>
                    );
                }
            }}
        >
            {text + (streaming ? ' ' : '')}
        </ReactMarkdown>
    );
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({
                                                                      code,
                                                                      language
                                                                  }) => {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <div className="relative my-4 border border-[#3e3f4b] rounded-md overflow-hidden bg-[#202123] text-[13px]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2f36] text-[11px] uppercase tracking-wide text-slate-400">
                <span>{language || 'text'}</span>
                <button
                    onClick={copy}
                    className="px-2 py-0.5 rounded bg-[#3d4049] hover:bg-[#4a4d57] text-slate-300 transition"
                >
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
        </div>
    );
};