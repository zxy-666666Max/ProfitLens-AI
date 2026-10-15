export default function InventoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory insights</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Stock levels, fast sellers and items to reorder.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Inventory insights coming soon.
      </div>
    </div>
  );
}