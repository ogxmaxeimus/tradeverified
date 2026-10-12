"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Empty, btnPrimary, useTitle } from "@/components/ui";
import { ARTICLES } from "@/lib/content";

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const article = ARTICLES.find((item) => item.slug === params.slug);
  useTitle(article ? article.title : "Resource");

  if (!article) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Empty title="Article not found" body="That guide is not on the shelf." action={<Link href="/resources" className={btnPrimary}>All resources</Link>} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/resources" className="text-sm font-semibold text-brand">All resources</Link>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{article.title}</h1>
        <p className="mt-2 text-sm text-muted">{article.minutes} min read</p>
        <div className="mt-6 space-y-4 text-base leading-7">
          {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </article>
    </Shell>
  );
}
