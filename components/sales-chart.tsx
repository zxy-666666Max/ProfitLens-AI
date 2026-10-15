type SalesChartProps = {
  data: { label: string; sales: number }[];
};

export default function SalesChart({ data }: SalesChartProps) {
  const max = Math.max(...data.map((d) => d.sales), 1);

  return (
    <div className="flex h-56 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-2">
          <div
            className="w-full rounded-t-md bg-emerald-500"
            style={{ height: `${(d.sales / max) * 100}%` }}
            title={`$${d.sales.toLocaleString()}`}
          />
          <span className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}