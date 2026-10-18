import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No data yet</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Upload your first receipts and your shop&apos;s dashboard and health report will appear here.
      </p>
      <Link
        href="/upload"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Upload receipts
      </Link>
    </div>
  );
}