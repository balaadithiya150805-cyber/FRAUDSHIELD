import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFraudStore } from "@/hooks/useFraudStore";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ShieldAlert, ShieldCheck, Activity, Target, Crosshair, BarChart3, Gauge, TrendingUp } from "lucide-react";

const FRAUD_COLOR = "hsl(0, 84%, 55%)";
const LEGIT_COLOR = "hsl(152, 60%, 42%)";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "default" | "fraud" | "legitimate";
}

function MetricCard({ title, value, icon, variant = "default" }: MetricCardProps) {
  const borderClass = variant === "fraud"
    ? "border-l-4 border-l-fraud"
    : variant === "legitimate"
    ? "border-l-4 border-l-legitimate"
    : "";

  return (
    <Card className={borderClass}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { predictions, metrics, hasResults } = useFraudStore();

  const fraudCount = predictions.filter(p => p.prediction === "Fraud").length;
  const legitCount = predictions.filter(p => p.prediction === "Legitimate").length;
  const avgRisk = predictions.length > 0
    ? (predictions.reduce((s, p) => s + p.riskScore, 0) / predictions.length).toFixed(4)
    : "—";

  const pieData = hasResults
    ? [
        { name: "Fraud", value: fraudCount },
        { name: "Legitimate", value: legitCount },
      ]
    : [
        { name: "Fraud", value: 1 },
        { name: "Legitimate", value: 19 },
      ];

  const riskBuckets = [
    { range: "0–0.2", count: 0 },
    { range: "0.2–0.4", count: 0 },
    { range: "0.4–0.6", count: 0 },
    { range: "0.6–0.8", count: 0 },
    { range: "0.8–1.0", count: 0 },
  ];

  for (const p of predictions) {
    if (p.riskScore < 0.2) riskBuckets[0].count++;
    else if (p.riskScore < 0.4) riskBuckets[1].count++;
    else if (p.riskScore < 0.6) riskBuckets[2].count++;
    else if (p.riskScore < 0.8) riskBuckets[3].count++;
    else riskBuckets[4].count++;
  }

  return (
    <AppLayout title="Dashboard" subtitle="Real-time fraud detection overview">
      <div className="space-y-6">
        {/* Metrics Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Transactions"
            value={hasResults ? predictions.length : "—"}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            title="Fraud Detected"
            value={hasResults ? fraudCount : "—"}
            icon={<ShieldAlert className="h-5 w-5" />}
            variant="fraud"
          />
          <MetricCard
            title="Legitimate"
            value={hasResults ? legitCount : "—"}
            icon={<ShieldCheck className="h-5 w-5" />}
            variant="legitimate"
          />
          <MetricCard
            title="Avg Risk Score"
            value={hasResults ? avgRisk : "—"}
            icon={<Gauge className="h-5 w-5" />}
          />
        </div>

        {/* Metrics Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title="Accuracy" value={metrics?.accuracy?.toFixed(3) ?? "—"} icon={<Target className="h-5 w-5" />} />
          <MetricCard title="Precision" value={metrics?.precision?.toFixed(3) ?? "—"} icon={<Crosshair className="h-5 w-5" />} />
          <MetricCard title="Recall" value={metrics?.recall?.toFixed(3) ?? "—"} icon={<TrendingUp className="h-5 w-5" />} />
          <MetricCard title="F1 Score" value={metrics?.f1Score?.toFixed(3) ?? "—"} icon={<BarChart3 className="h-5 w-5" />} />
          <MetricCard title="ROC-AUC" value={metrics?.rocAuc?.toFixed(3) ?? "—"} icon={<Activity className="h-5 w-5" />} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Fraud vs Legitimate Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                    <Cell fill={FRAUD_COLOR} />
                    <Cell fill={LEGIT_COLOR} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Risk Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={riskBuckets}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(222, 80%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {!hasResults && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No data yet</p>
              <p className="text-sm mt-1">Upload transactions and run fraud detection to see results here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
