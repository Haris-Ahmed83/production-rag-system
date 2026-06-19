import { useState, useEffect } from "react";
import { getEvalResults } from "../hooks/use_rag_api";

interface EvalData {
  last_run: string;
  overall_score: number;
  retrieval: Record<string, number>;
  generation: Record<string, number>;
  latency: Record<string, number>;
}

interface DashboardProps {
  token: string;
}

function Dashboard({ token }: DashboardProps) {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvalResults(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Overall Score"
          value={data.overall_score}
          format="percent"
        />
        <MetricCard
          label="P50 Latency"
          value={data.latency.p50_ms}
          format="ms"
        />
        <MetricCard
          label="P95 Latency"
          value={data.latency.p95_ms}
          format="ms"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Retrieval Metrics
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {Object.entries(data.retrieval).map(([key, value]) => (
              <MetricRow key={key} label={key} value={value} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Generation Metrics
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {Object.entries(data.generation).map(([key, value]) => (
              <MetricRow key={key} label={key} value={value} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Last evaluation: {data.last_run}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format: "percent" | "ms";
}) {
  const display =
    format === "percent"
      ? `${(value * 100).toFixed(0)}%`
      : `${value.toFixed(0)}ms`;

  const color =
    format === "percent"
      ? value >= 0.8
        ? "text-green-600"
        : "text-yellow-600"
      : value < 3000
        ? "text-green-600"
        : "text-yellow-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{display}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  const display = value < 1 ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
  const color = value >= 0.8 ? "text-green-600" : value >= 0.6 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-700 capitalize">
        {label.replace(/_/g, " ")}
      </span>
      <span className={`text-sm font-semibold ${color}`}>{display}</span>
    </div>
  );
}

export default Dashboard;
