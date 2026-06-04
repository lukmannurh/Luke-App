"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { LocalTime } from "@/components/shared/LocalTime";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  users?: {
    username: string;
    avatar_url?: string;
  } | null;
};

export default function GlobalChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);

      const { data, error } = await supabase
        .from("global_chat")
        .select(`
          id, user_id, message, created_at,
          users:user_id(username, avatar_url)
        `)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        const formatted = data.map((msg: any) => ({
          ...msg,
          users: Array.isArray(msg.users) ? msg.users[0] : msg.users
        }));
        setMessages(formatted as ChatMessage[]);
      } else if (error) {
        console.error("fetchMessages error:", error);
      }
      setIsLoading(false);
    }
    loadData();

    const channel = supabase
      .channel("global-chat-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_chat" },
        async (payload) => {
          // fetch user profile for the new message
          const { data: userData } = await supabase
            .from("users")
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            users: userData || { username: "Unknown" }
          } as ChatMessage;

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const msgText = newMessage.trim();
    setNewMessage(""); // optimistic clear

    const { error } = await supabase
      .from("global_chat")
      .insert({ user_id: currentUserId, message: msgText } as any);

    if (error) {
      toast.error("Failed to send message.");
      setNewMessage(msgText); // revert
    }
  }

  return (
    <div className="flex flex-col w-full flex-1 -mx-4 -mt-5 relative bg-background" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="brutal shrink-0 bg-card p-4 border-b-[3px] border-border z-10 sticky top-0">
        <h1 className="font-display font-black text-2xl leading-tight">🌍 Global Chat</h1>
        <p className="text-xs font-bold text-muted-foreground mt-1">
          Chat history is automatically cleared after 7 days to save space.
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="text-center font-bold text-muted-foreground mt-10 animate-pulse">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center font-bold text-muted-foreground mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                      {msg.users?.username || "Unknown"}
                    </span>
                  )}
                  <div
                    className={`brutal px-3 py-2 text-sm font-medium ${
                      isMe ? "bg-lime text-lime-foreground rounded-2xl rounded-tr-sm" : "bg-white text-zinc-900 rounded-2xl rounded-tl-sm dark:text-zinc-900"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground mt-1 opacity-70">
                    <LocalTime iso={msg.created_at} format="timestamp" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-background border-t-[3px] border-border z-20">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={currentUserId ? "Type a message..." : "Sign in to chat"}
            disabled={!currentUserId}
            className="brutal flex-1 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!currentUserId || !newMessage.trim()}
            className="brutal-press flex items-center justify-center rounded-xl bg-primary text-primary-foreground w-12 flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}
