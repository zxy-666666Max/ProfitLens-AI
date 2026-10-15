type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
};

export default function MetricCard({ label, value, change, trend }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p
        className={`mt-1 text-sm font-medium ${
          trend === "up" ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {change} vs last month
      </p>
    </div>
  );
}