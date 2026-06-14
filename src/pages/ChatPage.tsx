import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase";
import { Send, Loader2, Flower2, RotateCcw, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { useRoadmap } from "@/hooks/useRoadmap";

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

function BloomNotification({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="mx-auto max-w-2xl animate-scale-in"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card)), hsl(30 45% 97%))",
        border: "1px solid rgba(26,26,26,0.10)",
        borderRadius: "18px",
        padding: "18px 20px",
        boxShadow: "var(--shadow-float)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-omni-leaf/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} strokeWidth={1.5} className="text-omni-leaf" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-sans text-foreground mb-1">🌸 Your workspace is blooming!</p>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-3">
            OmniDesk has seeded your <strong>Roadmap</strong> and activated your <strong>Workflow Flowerbed</strong> — based on everything you've shared.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a href="/roadmaps" className="text-xs font-semibold font-sans px-4 py-2 bg-foreground text-background transition-all hover:opacity-80" style={{ borderRadius: "50px" }}>
              View Roadmap
            </a>
            <a href="/flowerbed" className="text-xs font-semibold font-sans px-4 py-2 text-foreground transition-all hover:bg-muted" style={{ borderRadius: "50px", border: "1px solid rgba(26,26,26,0.10)" }}>
              Open Flowerbed
            </a>
            <button onClick={onDismiss} className="text-xs text-muted-foreground font-sans px-3 py-2 hover:text-foreground transition-colors">
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
  const { onboarding } = useOnboarding();
  const { addNotification } = useNotifications();
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
        setDbMessages(data.map((m) => ({ role: m.role === "ai" ? "assistant" : m.role, content: m.content })));
        setHasStarted(true);
        exchangeCount.current = data.filter((m) => m.role === "user").length;
        const hasBloomMsg = data.some((m) => m.role === "ai" && detectBloomTrigger(m.content));
        if (hasBloomMsg) setBloomTriggered(true);
      }
    })();
  }, [user]);

  const saveMessage = async (role: "ai" | "user", content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({ user_id: user.id, role, content });
  };

  const triggerBloom = useCallback(async () => {
    if (bloomTriggered) return;
    setBloomTriggered(true);

    // Bloom seed nodes
    const seedNodes = nodes.filter((n) => n.state === "seed").slice(0, 2);
    for (const node of seedNodes) {
      await new Promise((r) => setTimeout(r, 600));
      updateNodeState(node.id, "bloom");
      await addNotification(
        "integration_change",
        `${node.label} activated 🌸`,
        `Your ${node.label} integration has bloomed and is now live in your Workflow Flowerbed.`,
        { nodeId: node.id, tool: node.tool }
      );
    }
    await refetchRoadmap();
    setShowBloomNotification(true);

    // Add bloom notification
    await addNotification(
      "bloom_trigger",
      "Workspace bloomed! 🌺",
      "OmniDesk seeded your Roadmap and Workflow Flowerbed based on your strategy session.",
      { exchangeCount: exchangeCount.current }
    );

    toast.success("🌸 Your workspace has bloomed!", {
      description: "Roadmap and Flowerbed updated with your strategy.",
      duration: 5000,
    });
  }, [bloomTriggered, nodes, updateNodeState, refetchRoadmap, addNotification]);

  const callAI = useCallback(async (history: { role: string; content: string }[]) => {
    const { data, error } = await supabase.functions.invoke("omni-chat", {
      body: {
        messages: history,
        userName: user?.username,
        onboarding: onboarding
          ? {
              user_type: onboarding.user_type,
              primary_goal: onboarding.primary_goal,
              business_idea: onboarding.business_idea,
              bottleneck: onboarding.bottleneck,
            }
          : undefined,
      },
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
  }, [user, onboarding]);

  const buildOpeningGreeting = () => {
    const name = user?.username?.split(" ")[0] || "there";
    const type = onboarding?.user_type;
    const goal = onboarding?.primary_goal;

    if (type === "finder") {
      return `Hi ${name}! I can see you're on the hunt for the right business idea — that's actually one of the most exciting places to start.\n\nYou've got a blank canvas, which means we can build something genuinely tailored to you.\n\nTo kick us off: **what activities or topics do you find yourself talking about or doing for free, without anyone asking you to?**`;
    }
    if (type === "grower") {
      return `Hi ${name}! I see you're already in the game — building something real while juggling everything else.\n\n${goal ? `Your goal: *"${goal}"* — let's make that happen.\n\n` : ""}The most common thing that kills early hustles isn't lack of effort, it's doing everything manually. Let's find your biggest bottleneck.\n\n**What's the one thing in your business that takes the most time but gives you the least return?**`;
    }
    if (type === "scaler") {
      return `Hi ${name}! You're in the scaling stage — this is where real leverage comes in.\n\n${goal ? `You want to: *"${goal}"* — I'm here to help you build the systems to get there.\n\n` : ""}Before we map your next 90 days, I need to understand your current setup.\n\n**What does your current tech stack look like, and where do you feel the most friction operationally?**`;
    }
    return `Hi ${name}! I'm OmniDesk — your AI business partner.\n\nBefore we build anything, I'd love to understand where you're at.\n\n**A)** I don't have a solid business idea yet — help me find one\n**B)** I have a side hustle, stuck in manual work\n**C)** I run a business and I'm ready to scale\n\nWhich fits best?`;
  };

  const startConversation = async () => {
    setHasStarted(true);
    setIsTyping(true);
    const greeting = buildOpeningGreeting();
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

    const shouldBloom = !bloomTriggered && (exchangeCount.current >= 4 || detectBloomTrigger(reply));
    if (shouldBloom) setTimeout(() => triggerBloom(), 800);
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
      const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
      return <p key={i} dangerouslySetInnerHTML={{ __html: html }} className={line === "" ? "h-2" : ""} />;
    });

  const personaLabel = onboarding?.user_type
    ? { finder: "Finder", grower: "Grower", scaler: "Scaler" }[onboarding.user_type] ?? ""
    : null;

  return (
    <div className="flex flex-col bg-background" style={{ height: "calc(100vh - env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div className="px-4 md:px-8 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--muted))" }}>
          <Flower2 size={15} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-lg text-foreground leading-tight">OmniDesk Chat</h1>
          <p className="text-xs text-muted-foreground font-sans hidden sm:block">AI strategy session · OnSpace AI</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground font-sans rounded-full" style={{ background: "hsl(var(--muted))" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-omni-leaf animate-pulse" />Online
          </div>
          {personaLabel && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans rounded-full bg-muted text-muted-foreground">{personaLabel}</div>
          )}
          {bloomTriggered && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-omni-leaf font-sans rounded-full bg-omni-leaf/10">
              <Sparkles size={10} /> Bloomed
            </div>
          )}
          {hasStarted && (
            <button onClick={clearChat} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted" title="Clear conversation">
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-5">
        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 flex items-center justify-center mb-6" style={{ background: "hsl(var(--muted))", borderRadius: "20px" }}>
              <Flower2 size={28} strokeWidth={1} />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">Your AI business partner is ready.</h2>
            {onboarding?.user_type && (
              <p className="text-sm text-muted-foreground font-sans mb-4 px-4 py-3 bg-muted rounded-xl">
                Signed up as <strong className="text-foreground capitalize">{onboarding.user_type}</strong>
                {onboarding.primary_goal && <> · <em>"{onboarding.primary_goal}"</em></>}
              </p>
            )}
            <p className="text-sm text-muted-foreground font-sans mb-8 leading-relaxed">
              OmniDesk will interview you, understand your goals, and build a personalised roadmap and automation garden.
            </p>
            <button onClick={startConversation} className="btn-pill flex items-center gap-2 px-8 py-4">
              Start strategy session <Flower2 size={15} />
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2.5" style={{ background: "hsl(var(--muted))", borderRadius: "9px" }}>
                    <Flower2 size={12} strokeWidth={1.5} />
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-3.5 text-sm font-sans leading-relaxed space-y-1 ${msg.role === "ai" ? "chat-bubble-ai" : "chat-bubble-user"}`}>
                  {renderContent(msg.content)}
                  <p className="text-[10px] opacity-30 mt-1.5 pt-1" style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2.5" style={{ background: "hsl(var(--muted))", borderRadius: "9px" }}>
                  <Flower2 size={12} strokeWidth={1.5} />
                </div>
                <div className="chat-bubble-ai px-4 py-3.5 flex items-center gap-2">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}

            {showBloomNotification && <BloomNotification onDismiss={() => setShowBloomNotification(false)} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {hasStarted && (
        <div
          className="px-3 md:px-8 py-3 flex-shrink-0"
          style={{
            borderTop: "1px solid rgba(26,26,26,0.08)",
            background: "hsl(var(--background))",
          }}
        >
          <div className="max-w-2xl mx-auto flex gap-2.5 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Reply to OmniDesk…"
              rows={1}
              className="flex-1 omni-input resize-none"
              style={{ minHeight: "44px", maxHeight: "120px", paddingTop: "12px", paddingBottom: "12px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 flex items-center justify-center bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              style={{ borderRadius: "13px" }}
            >
              {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-sans text-center mt-1.5 opacity-40 hidden sm:block">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
