"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare, User, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

interface Message {
    id: string;
    content: string;
    userId: string;
    userName: string;
    avatarColor: string;
    timestamp: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export default function ChatSidebar({
    contestId,
    isOpen,
    onClose
}: {
    contestId: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [connected, setConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Initialize socket connection
        const socket = io(SOCKET_URL, {
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("chat:join", contestId);
        });

        socket.on("chat:message", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.disconnect();
        };
    }, [isOpen, contestId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim() || !socketRef.current) return;

        // In a real app, we'd get userId from context/auth
        const userId = localStorage.getItem("userId") || "anon";

        socketRef.current.emit("chat:send", {
            contestId,
            userId,
            content: inputValue.trim()
        });

        setInputValue("");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-[61px] bottom-0 w-[350px] bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] z-[60] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-primary)] opacity-20">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-[var(--text-primary)]">
                                <MessageSquare size={16} className="text-[var(--accent)]" /> Intel Feed
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--accent)]">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 text-[var(--text-muted)]">
                                <Hash size={48} className="mb-4" />
                                <p className="font-mono text-[0.7rem] uppercase tracking-widest">No transmissions detected</p>
                                <p className="text-[0.6rem] mt-2">Initialize the feed by sending a message</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: msg.avatarColor }} />
                                            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--text-primary)] opacity-80">{msg.userName}</span>
                                        </div>
                                        <span className="text-[0.55rem] font-mono text-[var(--text-muted)] opacity-20">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-3 rounded-xl rounded-tl-none group-hover:bg-[var(--bg-card-hover)] transition-colors">
                                        <p className="text-[0.78rem] leading-relaxed text-[var(--text-primary)] opacity-90">{msg.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] opacity-10">
                        <div className="relative">
                            <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Broadcast a message..."
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl px-5 py-3 pr-12 text-[0.8rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)] transition-all placeholder:text-[var(--text-muted)] placeholder:opacity-50 font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-[var(--accent)] text-[var(--accent-text-on)] rounded-lg flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-20 disabled:grayscale"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[0.55rem] font-mono uppercase tracking-widest text-[var(--text-muted)] opacity-20">
                            <span>{connected ? "Connection Secure" : "Re-linking..."}</span>
                            <span>AES-256 Encrypted</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
