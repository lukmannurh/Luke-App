"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Reply, X, SmilePlus, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { LocalTime } from "@/components/shared/LocalTime";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  parent_id?: string | null;
  reactions?: Record<string, string> | null;
  users?: {
    username: string;
    avatar_url?: string;
  } | null;
};

const EMOJIS = ["👍", "🔥", "❤️", "😂"];

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline font-semibold break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function GlobalChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [activePopoverMsgId, setActivePopoverMsgId] = useState<string | null>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const handlePointerDown = (msgId: string) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setActivePopoverMsgId(msgId);
    }, 400);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollArrow(true);
    } else {
      setShowScrollArrow(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);

      const { data, error } = await supabase
        .from("global_chat")
        .select(`
          id, user_id, message, created_at, parent_id, reactions,
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
        { event: "*", schema: "public", table: "global_chat" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: userData } = await supabase
              .from("users")
              .select("username, avatar_url")
              .eq("id", payload.new.user_id)
              .single();

            const newMsg = {
              ...payload.new,
              users: userData || { username: "Unknown" }
            } as ChatMessage;

            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id
                  ? { ...m, reactions: payload.new.reactions }
                  : m
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
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
    const parentId = replyingTo?.id || null;
    
    setNewMessage(""); 
    setReplyingTo(null);

    const { error } = await (supabase as any)
      .from("global_chat")
      .insert({ 
        user_id: currentUserId, 
        message: msgText,
        parent_id: parentId
      });

    if (error) {
      toast.error("Failed to send message.");
      setNewMessage(msgText); // revert
    }
  }

  async function toggleReaction(msgId: string, currentReactions: Record<string, string> | null, emoji: string) {
    if (!currentUserId) return;
    setActivePopoverMsgId(null);
    const newReactions = { ...(currentReactions || {}) };
    if (newReactions[currentUserId] === emoji) {
      delete newReactions[currentUserId];
    } else {
      newReactions[currentUserId] = emoji;
    }

    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: newReactions } : m)));
    await (supabase as any).from("global_chat").update({ reactions: newReactions }).eq('id', msgId);
  }

  return (
    <div className="flex flex-col w-full min-h-[100dvh] relative bg-background">
      {/* Header */}
      <div className="brutal shrink-0 bg-card p-4 border-b-[3px] border-border z-10 sticky top-0">
        <h1 className="font-display font-black text-2xl leading-tight">🌍 Global Chat</h1>
        <p className="text-xs font-bold text-muted-foreground mt-1">
          Chat history is automatically cleared after 7 days to save space.
        </p>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-12 scroll-smooth"
      >
        {isLoading ? (
          <div className="text-center font-bold text-muted-foreground mt-10 animate-pulse">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center font-bold text-muted-foreground mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            
            // Render Avatar Logic
            const avatarContent = msg.users?.avatar_url ? (
              <img src={msg.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{msg.users?.username.charAt(0).toUpperCase() || "?"}</span>
            );

            // Group reactions
            const groupedReactions = Object.values(msg.reactions || {}).reduce((acc, emoji) => {
              acc[emoji] = (acc[emoji] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            // Find parent message if reply
            const parentMsg = msg.parent_id ? messages.find((m) => m.id === msg.parent_id) : null;

            return (
              <div key={msg.id} className={`flex w-full gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="w-8 h-8 mt-4 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-zinc-200 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                    {avatarContent}
                  </div>
                )}
                
                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                      {msg.users?.username || "Unknown"}
                    </span>
                  )}
                  
                  {parentMsg && (
                    <div className="text-[10px] bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md mb-1 w-full truncate border-l-2 border-black/20 font-medium">
                      Replying to <span className="font-bold">{parentMsg.users?.username}</span>: {parentMsg.message}
                    </div>
                  )}

                  <div className="relative group flex items-center gap-2">
                    {isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => setReplyingTo(msg)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800" aria-label="Reply">
                          <Reply className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    <div
                      onPointerDown={() => handlePointerDown(msg.id)}
                      onPointerUp={handlePointerUpOrLeave}
                      onPointerLeave={handlePointerUpOrLeave}
                      onContextMenu={(e) => {
                        // Prevent native context menu on long press on mobile
                        if (window.matchMedia("(max-width: 768px)").matches) {
                          e.preventDefault();
                        }
                      }}
                      className={`brutal px-3 py-2 text-sm font-medium relative select-none ${
                        isMe ? "bg-lime text-lime-foreground rounded-2xl rounded-tr-sm" : "bg-white text-zinc-900 rounded-2xl rounded-tl-sm dark:text-zinc-900"
                      }`}
                      style={{ wordBreak: "break-word" }}
                    >
                      <LinkifiedText text={msg.message} />
                      
                      {/* Reactions Popover Button attached to bubble */}
                      {currentUserId && (
                        <button 
                          onClick={() => setActivePopoverMsgId(activePopoverMsgId === msg.id ? null : msg.id)}
                          className={`absolute -bottom-2 ${isMe ? "-left-2" : "-right-2"} w-5 h-5 bg-white border border-black rounded-full flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity z-10`}
                        >
                          <SmilePlus className="w-3 h-3 text-zinc-700" />
                        </button>
                      )}

                      {/* Emoji Popover */}
                      {activePopoverMsgId === msg.id && (
                        <div className={`absolute -bottom-10 ${isMe ? "left-0" : "right-0"} bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1 flex gap-1 z-50`}>
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, msg.reactions || null, emoji)}
                              className="hover:bg-zinc-200 rounded px-1 text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => setReplyingTo(msg)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800" aria-label="Reply">
                          <Reply className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-muted-foreground opacity-70">
                      <LocalTime iso={msg.created_at} format="timestamp" />
                    </span>
                  </div>
                  
                  {Object.keys(groupedReactions).length > 0 && (
                    <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? "justify-end" : "justify-start"}`}>
                      {Object.entries(groupedReactions).map(([emoji, count]) => (
                        <button 
                          key={emoji} 
                          onClick={() => toggleReaction(msg.id, msg.reactions || null, emoji)}
                          className={`bg-zinc-100 text-zinc-900 border border-black rounded-md px-1.5 py-0.5 text-xs inline-flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-200 ${
                            msg.reactions?.[currentUserId!] === emoji ? "bg-zinc-300" : ""
                          }`}
                        >
                          {emoji} <span className="font-bold">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Scroll to Bottom Arrow */}
      {showScrollArrow && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 z-30 brutal flex h-10 w-10 animate-bounce items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary/90"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {/* Input */}
      <div className="sticky bottom-0 left-0 right-0 bg-background border-t-[3px] border-border z-20">
        {replyingTo && (
          <div className="flex items-center justify-between bg-zinc-100 border-b border-zinc-300 p-2 text-xs font-semibold text-zinc-700">
            <span>Replying to {replyingTo.users?.username}</span>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-zinc-200 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 p-3 py-2.5">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={currentUserId ? "Type a message..." : "Sign in to chat"}
            disabled={!currentUserId}
            className="brutal flex-1 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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
