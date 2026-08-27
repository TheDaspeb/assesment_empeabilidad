"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  translations,
  Language,
} from "@/i18n/translations";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Profile {
  userId: string;
  name: string;
  jobTitle: string;
}

interface CopilotMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: {
    messageId: string;
    channelId: string;
    similarity: number;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<
    {
      id: string;
      sender_id: string;
      content: string;
      created_at: string;
      uiStatus?: "PENDING" | "SENT" | "FAILED";
    }[]
  >([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      content: string;
      highlighted_content: string;
      channel_id: string;
    }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [askingCopilot, setAskingCopilot] = useState(false);
  const [language, setLanguage] = useState<Language>("es");

  const t = translations[language];

  async function loadMessages(channelId: string) {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    const response = await fetch(
      `/api/channels/${channelId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    setMessages(data.messages.reverse());
  }

  async function sendMessage() {
    if (
      !selectedChannel ||
      !messageInput.trim() ||
      sending
    ) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token || !profile) return;

    const content = messageInput.trim();

    const temporaryId = crypto.randomUUID();

    const optimisticMessage = {
      id: temporaryId,
      sender_id: profile.userId,
      content,
      created_at: new Date().toISOString(),
      uiStatus: "PENDING" as const,
    };

    setMessages((current) => [
      ...current,
      optimisticMessage,
    ]);

    setMessageInput("");

    try {
      setSending(true);

      const response = await fetch(
        `/api/channels/${selectedChannel.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("MESSAGE_FAILED");
      }

      await loadMessages(selectedChannel.id);
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === temporaryId
            ? {
                ...message,
                uiStatus: "FAILED",
              }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  async function searchMessages() {
    const token = localStorage.getItem("access_token");

    if (!token || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      const response = await fetch(
        `/api/messages/search?q=${encodeURIComponent(searchQuery.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setSearchResults(data.messages);
    } finally {
      setSearching(false);
    }
  }

  async function askCopilot() {
    if (!copilotQuestion.trim() || askingCopilot) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) return;

    const question = copilotQuestion.trim();

    const userMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: "USER",
      content: question,
    };

    setCopilotMessages((current) => [
      ...current,
      userMessage,
    ]);

    setCopilotQuestion("");

    try {
      setAskingCopilot(true);

      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await response.json();

      const assistantMessage: CopilotMessage = {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: response.ok
          ? data.answer
          : data.message ?? t.copilotError,
        citations: response.ok
          ? data.citations ?? []
          : [],
      };

      setCopilotMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch {
      setCopilotMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: t.copilotError,
          citations: [],
        },
      ]);
    } finally {
      setAskingCopilot(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      localStorage.removeItem("access_token");
      router.push("/login");
    }
  }

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [channelsResponse, profileResponse] = await Promise.all([
          fetch("/api/channels", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("/api/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!channelsResponse.ok || !profileResponse.ok) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        const channelsData = await channelsResponse.json();
        const profileData = await profileResponse.json();

        setChannels(channelsData.channels);
        setProfile(profileData.user);

        if (channelsData.channels.length > 0) {
          const firstChannel = channelsData.channels[0];

          setSelectedChannel(firstChannel);
          await loadMessages(firstChannel.id);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        {t.loading}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_340px]">

        {/* Conversations */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">
                  Riwi Chat
                </h1>

                <p className="text-sm text-slate-400">
                  {t.conversations}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("es")}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    language === "es"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  ES
                </button>

                <button
                  onClick={() => setLanguage("en")}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    language === "en"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    searchMessages();
                  }
                }}
                placeholder={t.searchPlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />

              <button
                onClick={searchMessages}
                disabled={searching}
                className="rounded-xl bg-slate-800 px-3 text-sm hover:bg-slate-700 disabled:opacity-50"
              >
                {searching ? "..." : t.search}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-800 p-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="rounded-lg bg-slate-800 p-3 text-xs text-slate-300"
                  >
                    <p
                      dangerouslySetInnerHTML={{
                        __html: result.highlighted_content,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedChannel(channel);
                  loadMessages(channel.id);
                }}
                className={`w-full rounded-xl px-4 py-3 text-left transition ${
                  selectedChannel?.id === channel.id
                    ? "bg-indigo-600"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                <p className="font-medium">
                  # {channel.name}
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  {channel.type === "PUBLIC"
                    ? t.public
                    : t.private}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-h-[500px] max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-slate-800 bg-slate-900 lg:min-h-[calc(100vh-2rem)]">
          <header className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">
              {selectedChannel
                ? `# ${selectedChannel.name}`
                : t.selectConversation}
            </h2>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-slate-500">
                {t.noMessages}
              </div>
            ) : (
              messages.map((message) => {
                const isMine =
                  message.sender_id === profile?.userId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                        isMine
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-100"
                      }`}
                    >
                      <p className="break-words text-sm">
                        {message.content}
                      </p>

                      <div className="mt-1 flex justify-end gap-2 text-[10px] opacity-60">
                        <span>
                          {new Date(
                            message.created_at,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {message.uiStatus === "PENDING" && (
                          <span>{t.pending}</span>
                        )}

                        {message.uiStatus === "FAILED" && (
                          <span className="text-red-300">
                            {t.failed}
                          </span>
                        )}

                        {!message.uiStatus && (
                          <span>{t.sent}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-800 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={messageInput}
                onChange={(event) =>
                  setMessageInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t.messagePlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />

              <button
                onClick={sendMessage}
                disabled={
                  sending ||
                  !messageInput.trim() ||
                  !selectedChannel
                }
                className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? t.sending : t.send}
              </button>
            </div>
          </div>
        </section>

        {/* Copilot + profile */}
        <aside className="flex min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:h-[calc(100vh-2rem)]">
          <div>
            <h2 className="text-lg font-bold">
              {t.copilotTitle}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {t.copilotSubtitle}
            </p>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
              {copilotMessages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-slate-500">
                  {t.copilotEmpty}
                </div>
              ) : (
                copilotMessages.map((message) => {
                  const isUser = message.role === "USER";

                  return (
                    <div
                      key={message.id}
                      className={`flex shrink-0 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                          isUser
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-6">
                          {message.content}
                        </p>

                        {!isUser &&
                          message.citations &&
                          message.citations.length > 0 && (
                            <div className="mt-3 border-t border-slate-700 pt-3">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {t.sources}
                              </p>

                              <div className="space-y-2">
                                {message.citations.map((citation) => (
                                  <div
                                    key={citation.messageId}
                                    className="rounded-lg bg-slate-900 p-2 text-[11px] text-slate-400"
                                  >
                                    <p>
                                      {t.message}{" "}
                                      {citation.messageId.slice(0, 8)}...
                                    </p>

                                    <p>
                                      {t.relevance}:{" "}
                                      {Math.round(
                                        citation.similarity * 100,
                                      )}
                                      %
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
              )}

              {askingCopilot && (
                <div className="flex shrink-0 justify-start">
                  <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-400">
                    {t.thinking}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0">
              <textarea
                value={copilotQuestion}
                onChange={(event) =>
                  setCopilotQuestion(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    askCopilot();
                  }
                }}
                placeholder={t.copilotPlaceholder}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />

              <button
                onClick={askCopilot}
                disabled={
                  askingCopilot ||
                  !copilotQuestion.trim()
                }
                className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {askingCopilot ? t.consulting : t.send}
              </button>
            </div>
          </div>

          {profile && (
            <div className="mt-5 border-t border-slate-800 pt-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {t.profile}
              </p>

              <p className="mt-2 font-semibold">
                {profile.name}
              </p>

              <p className="text-sm text-slate-400">
                {profile.jobTitle}
              </p>

              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                {language === "es" ? "Cerrar sesión" : "Log out"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
