import React, { useState, useRef, useEffect } from 'react';

interface Props {
    onSend: (text: string) => void;
    disabled?: boolean;
    sending?: boolean;
}

const ChatInput: React.FC<Props> = ({ onSend, disabled, sending }) => {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const text = value.trim();
        if (!text) return;
        onSend(text);
        setValue('');
    }

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = '0px';
        const scrollHeight = el.scrollHeight;
        el.style.height = Math.min(scrollHeight, 180) + 'px';
    }, [value]);

    const buttonBase =
        'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold transition bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow shadow-indigo-950/40';
    const buttonDisabled =
        (disabled || !value.trim()) ? ' opacity-40 cursor-not-allowed shadow-none' : '';
    const buttonClass = buttonBase + buttonDisabled;

    return (
        <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3"
        >
      <textarea
          ref={textareaRef}
          className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:text-slate-500 pr-12"
          placeholder="Digite sua mensagem e pressione Enter. Shift+Enter para nova linha."
          rows={1}
          disabled={disabled}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
              }
          }}
      />
            <div className="absolute right-4 bottom-3 flex items-center gap-2">
                {sending && (
                    <div className="text-[10px] text-indigo-300 animate-pulse">
                        Enviando...
                    </div>
                )}
                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    className={buttonClass}
                    aria-label="Enviar"
                >
                    ➤
                </button>
            </div>
        </form>
    );
};

export default ChatInput;