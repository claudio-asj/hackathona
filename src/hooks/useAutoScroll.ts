import { useEffect, useRef } from 'react';

export default function useAutoScroll(isLoading: boolean) {
    const scrollContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoading && scrollContentRef.current) {
            scrollContentRef.current.scrollTop = scrollContentRef.current.scrollHeight;
        }
    }, [isLoading, scrollContentRef.current?.scrollHeight]);

    return scrollContentRef;
}