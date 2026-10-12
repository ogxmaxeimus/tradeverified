"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Avatar, Empty, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { GROUPS } from "@/lib/content";
import { timeAgo } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const group = GROUPS.find((item) => item.id === params.id);
  useTitle(group ? group.name : "Group");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!group) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Empty title="Group not found" body="That crew does not exist." action={<Link href="/groups" className={btnPrimary}>All groups</Link>} />
        </div>
      </Shell>
    );
  }

  const joined = store.currentUser ? (store.state.memberships[store.currentUser.id] ?? []).includes(group.id) : false;
  const posts = store.state.groupPosts
    .filter((post) => post.groupId === group.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/groups" className="text-sm font-semibold text-brand">All groups</Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{group.name}</h1>
        <p className="mt-2 text-muted">{group.about}</p>
        <button
          className="mt-4 rounded-full border border-line px-4 py-2 text-sm font-semibold"
          onClick={() => {
            const result = store.toggleMembership(group.id);
            if (result) router.push(`/login?next=${encodeURIComponent(`/groups/${group.id}`)}`);
          }}
        >
          {joined ? "Leave group" : "Join group"}
        </button>
        {joined ? (
          <form
            className="mt-6 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const result = store.postToGroup(group.id, body);
              if (result) setError(result);
              else {
                setBody("");
                setError(null);
              }
            }}
          >
            <textarea className={inputClass} rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share a job-site note, not a slogan." />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button className={`${btnPrimary} w-max`}>Post</button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">Join to post. You can still read.</p>
        )}
        <div className="mt-6 space-y-3">
          {posts.map((post) => {
            const author = store.state.users.find((user) => user.id === post.authorId);
            return (
              <article key={post.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={author?.name ?? "Member"} size={36} />
                  <div>
                    <p className="font-semibold">{author?.name ?? "Member"}</p>
                    <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6">{post.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
