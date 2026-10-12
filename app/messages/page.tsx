"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Avatar, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function MessagesPage() {
  return (
    <Suspense fallback={<Shell><p className="p-10 text-muted">Loading messages…</p></Shell>}>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  useTitle("Messages");
  const router = useRouter();
  const params = useSearchParams();
  const withId = params.get("with") ?? "";
  const store = useStore();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const user = store.currentUser;

  useEffect(() => {
    if (!user) router.replace(`/login?next=${encodeURIComponent(withId ? `/messages?with=${withId}` : "/messages")}`);
  }, [router, user, withId]);

  const threads = useMemo(() => {
    if (!user) return [];
    return store.state.threads
      .filter((thread) => thread.participantIds.includes(user.id))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [store.state.threads, user]);

  const active = withId
    ? threads.find((thread) => thread.participantIds.includes(withId))
    : threads[0];

  useEffect(() => {
    if (active) store.markThreadRead(active.id);
    // Mark the open thread read once it is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  if (!user) return <Shell><p className="p-10 text-muted">Redirecting to sign in…</p></Shell>;

  const otherId = withId || active?.participantIds.find((id) => id !== user.id) || "";
  const other = store.state.users.find((item) => item.id === otherId);
  const messages = active ? store.state.messages.filter((message) => message.threadId === active.id) : [];

  function nameFor(id: string) {
    return store.state.users.find((item) => item.id === id)?.name ?? "Member";
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-line bg-surface">
          <h1 className="border-b border-line px-4 py-3 font-bold">Messages</h1>
          {threads.length === 0 && !other ? <p className="p-4 text-sm text-muted">Contact a tradesperson from their profile to start a thread.</p> : null}
          {threads.map((thread) => {
            const partner = thread.participantIds.find((id) => id !== user.id) ?? "";
            const last = [...store.state.messages].reverse().find((message) => message.threadId === thread.id);
            const unread = store.state.messages.some((message) => message.threadId === thread.id && message.senderId !== user.id && !message.read);
            const selected = active?.id === thread.id;
            return (
              <button
                key={thread.id}
                className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left ${selected ? "bg-soft" : "hover:bg-soft"}`}
                onClick={() => router.push(`/messages?with=${partner}`)}
              >
                <Avatar name={nameFor(partner)} size={36} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold">
                    {nameFor(partner)}
                    {unread ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
                  </span>
                  <span className="block truncate text-sm text-muted">{last?.body}</span>
                </span>
              </button>
            );
          })}
        </aside>
        <section className="flex min-h-[480px] flex-col rounded-2xl border border-line bg-surface">
          {other ? (
            <>
              <header className="border-b border-line px-4 py-3">
                <p className="font-bold">{other.name}</p>
                <p className="text-xs text-muted">{other.role === "employer" ? "Employer" : "Tradesperson"}</p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? <p className="text-sm text-muted">No messages yet. Say what the job is and when it starts.</p> : null}
                {messages.map((message) => {
                  const mine = message.senderId === user.id;
                  return (
                    <div key={message.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto bg-brand text-white" : "bg-soft"}`}>
                      <p>{message.body}</p>
                      <p className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-muted"}`}>{timeAgo(message.createdAt)}</p>
                    </div>
                  );
                })}
              </div>
              <form
                className="flex gap-2 border-t border-line p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const result = store.sendMessage(other.id, draft);
                  if (result) setError(result);
                  else {
                    setDraft("");
                    setError(null);
                    router.replace(`/messages?with=${other.id}`);
                  }
                }}
              >
                <input className={inputClass} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${other.name.split(" ")[0]}`} />
                <button className={btnPrimary}>Send</button>
              </form>
              {error ? <p className="px-3 pb-3 text-sm text-rose-600">{error}</p> : null}
            </>
          ) : (
            <p className="m-auto text-sm text-muted">Pick a conversation.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}
