import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Send, Loader2, Flower2, RotateCcw, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { useRoadmap } from "@/hooks/useRoadmap";

/* Detect bloom trigger keywords in AI response */
function detectBloomTrigger(content: string): boolean {
  const keywords = [
    "seeding your roadmap",
    "seeding your workflow",
    "planting your",
    "workflow flowerbed",
    "roadmap is ready",
    "roadmap and workflow",
    "setting up your flowerbed",
    "bloom trigger",
    "activated your workspace",
    "i've mapped out",
    "i have mapped out",
    "your 30-day",
    "lighting up your",
    "seeded your",
    "your workspace is",
  ];
  const lower = content.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/* In-chat bloom notification */
function BloomNotification({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="mx-auto max-w-2xl animate-scale-in"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card)), hsl(30 45% 97%))",
        border: "1px solid rgba(26,26,26,0.10)",
        borderRadius: "18px",
        padding: "20px 24px",
        boxShadow: "var(--shadow-float)",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-omni-leaf/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} strokeWidth={1.5} className="text-omni-leaf" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-sans text-foreground mb-1">
            🌸 Your workspace is blooming!
          </p>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-3">
            OmniDesk has seeded your <strong>Roadmap</strong> with personalised milestones and activated your <strong>Workflow Flowerbed</strong> with integration nodes — based on everything you've shared.
          </p>
          <div className="flex gap-2">
            <a
              href="/roadmaps"
              className="text-xs font-semibold font-sans px-4 py-2 bg-foreground text-background transition-all hover:opacity-80"
              style={{ borderRadius: "50px" }}
            >
              View Roadmap
            </a>
            <a
              href="/flowerbed"
              className="text-xs font-semibold font-sans px-4 py-2 text-foreground transition-all hover:bg-muted"
              style={{ borderRadius: "50px", border: "1px solid rgba(26,26,26,0.10)" }}
            >
              Open Flowerbed
            </a>
            <button
              onClick={onDismiss}
              className="text-xs text-muted-foreground font-sans px-3 py-2 hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { updateNodeState, nodes } = useWorkflowNodes();
  const { refetch: refetchRoadmap } = useRoadmap();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [dbMessages, setDbMessages] = useState<{ role: string; content: string }[]>([]);
  const [showBloomNotification, setShowBloomNotification] = useState(false);
  const [bloomTriggered, setBloomTriggered] = useState(false);
  const exchangeCount = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showBloomNotification]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at")
        .limit(60);
      if (data && data.length > 0) {
        setMessages(data.map((m) => ({
          id: m.id,
          role: m.role as "ai" | "user",
          content: m.content,
          timestamp: new Date(m.created_at),
        })));
        setDbMessages(data.map((m) => ({ role: m.role, content: m.content })));
        setHasStarted(true);
        // Count existing user exchanges
        exchangeCount.current = data.filter((m) => m.role === "user").length;
        // Check if bloom was already triggered
        const hasBloomMsg = data.some(
          (m) => m.role === "ai" && detectBloomTrigger(m.content)
        );
        if (hasBloomMsg) setBloomTriggered(true);
      }
    })();
  }, [user]);

  const saveMessage = async (role: "ai" | "user", content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({ user_id: user.id, role, content });
  };

  /* Trigger bloom — update first 2 seed nodes to bloom state */
  const triggerBloom = useCallback(async () => {
    if (bloomTriggered) return;
    setBloomTriggered(true);

    const seedNodes = nodes.filter((n) => n.state === "seed").slice(0, 2);
    for (const node of seedNodes) {
      await new Promise((r) => setTimeout(r, 600));
      updateNodeState(node.id, "bloom");
    }

    // Refresh roadmap in background
    await refetchRoadmap();

    setShowBloomNotification(true);
    toast.success("🌸 Your workspace has bloomed!", {
      description: "Roadmap and Flowerbed updated with your strategy.",
      duration: 5000,
    });
  }, [bloomTriggered, nodes, updateNodeState, refetchRoadmap]);

  const callAI = useCallback(async (history: { role: string; content: string }[]) => {
    const { data, error } = await supabase.functions.invoke("omni-chat", {
      body: { messages: history, userName: user?.username },
    });

    if (error) {
      let errMsg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { const txt = await error.context?.text(); errMsg = txt || errMsg; } catch {}
      }
      console.error("omni-chat error:", errMsg);
      return "I hit a snag on my end — mind trying again?";
    }
    return data?.content || "Something went quiet. Let's try that again.";
  }, [user]);

  const startConversation = async () => {
    setHasStarted(true);
    setIsTyping(true);
    const greeting = `Hi! I'm OmniDesk — your AI business partner.\n\nBefore we build anything, I'd love to understand where you're at. Quick honest question:\n\n**A)** I don't have a solid business idea yet — help me find one\n**B)** I have a side hustle, but I'm drowning in manual work\n**C)** I run a business and I'm ready to scale operations\n\nWhich fits best?`;
    const aiMsg: ChatMessage = { id: Date.now().toString(), role: "ai", content: greeting, timestamp: new Date() };
    setMessages([aiMsg]);
    setDbMessages([{ role: "assistant", content: greeting }]);
    await saveMessage("ai", greeting);
    setIsTyping(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessage("user", text);

    exchangeCount.current += 1;

    const updatedHistory = [...dbMessages, { role: "user", content: text }];
    setDbMessages(updatedHistory);
    setIsTyping(true);

    const reply = await callAI(updatedHistory);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "ai", content: reply, timestamp: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
    setDbMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    await saveMessage("ai", reply);
    setIsTyping(false);

    // Bloom trigger: after 4+ exchanges OR if AI mentions seeding
    const shouldBloom =
      !bloomTriggered &&
      (exchangeCount.current >= 4 || detectBloomTrigger(reply));

    if (shouldBloom) {
      // Small delay so the message renders first
      setTimeout(() => triggerBloom(), 800);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    setDbMessages([]);
    setHasStarted(false);
    setBloomTriggered(false);
    setShowBloomNotification(false);
    exchangeCount.current = 0;
    toast.success("Conversation cleared.");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderContent = (content: string) =>
    content.split("\n").map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} dangerouslySetInnerHTML={{ __html: html }} className={line === "" ? "h-2" : ""} />;
    });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div
        className="px-6 md:px-8 py-5 flex items-center gap-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Flower2 size={16} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-serif text-xl text-foreground">OmniDesk Chat</h1>
          <p className="text-xs text-muted-foreground font-sans">AI strategy session · powered by OnSpace AI</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground font-sans rounded-full" style={{ background: "hsl(var(--muted))" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-omni-leaf animate-pulse" />
            Online
          </div>
          {bloomTriggered && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-omni-leaf font-sans rounded-full bg-omni-leaf/10">
              <Sparkles size={11} />
              Bloomed
            </div>
          )}
          {hasStarted && (
            <button
              onClick={clearChat}
              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
              title="Clear conversation"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-20 h-20 flex items-center justify-center mb-8" style={{ background: "hsl(var(--muted))", borderRadius: "24px" }}>
              <Flower2 size={32} strokeWidth={1} />
            </div>
            <h2 className="font-serif text-3xl text-foreground mb-4">Your AI business partner is ready.</h2>
            <p className="text-base text-muted-foreground font-sans mb-10 leading-relaxed">
              OmniDesk will interview you, understand your goals, and build a personalised roadmap and automation garden — all through natural conversation.
            </p>
            <button onClick={startConversation} className="btn-pill flex items-center gap-2.5 px-10 py-4 text-base">
              Start strategy session <Flower2 size={16} />
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
                {msg.role === "ai" && (
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3"
                    style={{ background: "hsl(var(--muted))", borderRadius: "10px" }}>
                    <Flower2 size={13} strokeWidth={1.5} />
                  </div>
                )}
                <div className={`max-w-[80%] px-5 py-4 text-sm font-sans leading-relaxed space-y-1 ${
                  msg.role === "ai" ? "chat-bubble-ai" : "chat-bubble-user"
                }`}>
                  {renderContent(msg.content)}
                  <p className="text-[10px] opacity-30 mt-2 pt-1" style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3"
                  style={{ background: "hsl(var(--muted))", borderRadius: "10px" }}>
                  <Flower2 size={13} strokeWidth={1.5} />
                </div>
                <div className="chat-bubble-ai px-5 py-4 flex items-center gap-2">
                  <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}

            {/* Bloom notification card */}
            {showBloomNotification && (
              <BloomNotification onDismiss={() => setShowBloomNotification(false)} />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {hasStarted && (
        <div
          className="px-4 md:px-8 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(26,26,26,0.08)", background: "hsl(var(--background))" }}
        >
          <div className="max-w-2xl mx-auto flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Reply to OmniDesk…"
              rows={1}
              className="flex-1 omni-input resize-none"
              style={{ minHeight: "48px", maxHeight: "120px", paddingTop: "13px", paddingBottom: "13px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 flex items-center justify-center bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              style={{ borderRadius: "14px" }}
            >
              {isTyping ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground font-sans text-center mt-2 opacity-40">
            Enter to send · Shift+Enter for new line · Bloom triggers after 4 exchanges
          </p>
        </div>
      )}
    </div>
  );
}
