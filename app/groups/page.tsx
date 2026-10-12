"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { useTitle } from "@/components/ui";
import { GROUPS } from "@/lib/content";
import { useStore } from "@/lib/store";

export default function GroupsPage() {
  useTitle("Groups");
  const router = useRouter();
  const { state, currentUser, toggleMembership } = useStore();

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Trade groups</h1>
        <p className="mt-1 text-muted">Shop talk with people who already know the difference between a ticket and a claim.</p>
        <div className="mt-6 grid gap-4">
          {GROUPS.map((group) => {
            const joined = currentUser ? (state.memberships[currentUser.id] ?? []).includes(group.id) : false;
            const members = group.baselineMembers + Object.values(state.memberships).filter((list) => list.includes(group.id)).length;
            const posts = state.groupPosts.filter((post) => post.groupId === group.id).length;
            return (
              <article key={group.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">{group.trade}</p>
                  <h2 className="text-xl font-bold"><Link href={`/groups/${group.id}`} className="hover:text-brand">{group.name}</Link></h2>
                  <p className="mt-1 max-w-xl text-sm text-muted">{group.about}</p>
                  <p className="mt-2 text-xs text-muted">{members.toLocaleString()} members · {posts} posts</p>
                </div>
                <button
                  className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-brand"
                  onClick={() => {
                  const result = toggleMembership(group.id);
                  if (result) router.push("/login?next=/groups");
                }}
                >
                  {joined ? "Leave" : "Join"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
