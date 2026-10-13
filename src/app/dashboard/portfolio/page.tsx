import type { Metadata } from "next";
import Image from "next/image";
import { addPortfolioItem, deletePortfolioItem } from "@/app/actions/portfolio";
import { DashboardNav, Flash } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { publicAssetUrl } from "@/lib/media";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Portfolio" };

type Item = {
  id: string;
  title: string;
  description: string | null;
  image_path: string;
  completed_on: string | null;
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { supabase, viewer } = await requireRole("worker");
  const { data } = await supabase
    .from("portfolio_items")
    .select("id, title, description, image_path, completed_on")
    .eq("worker_id", viewer.id)
    .order("created_at", { ascending: false });
  const items = (data ?? []) as Item[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Portfolio</h1>
      <DashboardNav role={viewer.role} />
      <Flash error={flash.error} notice={flash.notice} />
      <form action={addPortfolioItem} className="card max-w-2xl space-y-4 p-6">
        <h2 className="text-lg font-semibold">Add work</h2>
        <label className="label">
          Title
          <input className="input" name="title" required />
        </label>
        <label className="label">
          Description
          <textarea className="input min-h-24" name="description" />
        </label>
        <label className="label">
          Completed
          <input className="input" name="completed_on" type="date" />
        </label>
        <label className="label">
          Photo
          <input className="input" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
        </label>
        <button className="btn btn-primary" type="submit">Add to portfolio</button>
      </form>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="card overflow-hidden">
            <Image
              src={publicAssetUrl(item.image_path)}
              alt={item.title}
              width={640}
              height={360}
              className="h-44 w-full object-cover"
              unoptimized={item.image_path.endsWith(".svg") || !item.image_path.startsWith("/")}
            />
            <div className="space-y-2 p-4">
              <h2 className="font-semibold">{item.title}</h2>
              {item.completed_on ? <p className="text-sm text-slate-500">{formatDate(item.completed_on)}</p> : null}
              {item.description ? <p className="text-sm text-slate-700">{item.description}</p> : null}
              <form action={deletePortfolioItem}>
                <input type="hidden" name="id" value={item.id} />
                <button className="btn btn-ghost" type="submit">Remove</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
