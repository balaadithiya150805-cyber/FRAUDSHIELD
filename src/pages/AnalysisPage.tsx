import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFraudStore } from "@/hooks/useFraudStore";
import { ShieldAlert, ShieldCheck, Filter } from "lucide-react";

type RiskFilter = "all" | "high" | "medium" | "low";

export default function AnalysisPage() {
  const { predictions, hasResults } = useFraudStore();
  const [filter, setFilter] = useState<RiskFilter>("all");
  const [explainTx, setExplainTx] = useState<string | null>(null);

  const filtered = predictions.filter(p => {
    if (filter === "high") return p.riskScore > 0.8;
    if (filter === "medium") return p.riskScore >= 0.4 && p.riskScore <= 0.8;
    if (filter === "low") return p.riskScore < 0.4;
    return true;
  });

  const fraudCount = predictions.filter(p => p.prediction === "Fraud").length;
  const selectedPred = predictions.find(p => p.transactionId === explainTx);

  if (!hasResults) {
    return (
      <AppLayout title="Fraud Analysis" subtitle="Detailed transaction analysis">
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No analysis data</p>
            <p className="text-sm mt-1">Upload transactions and run detection first.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Fraud Analysis" subtitle="Detailed transaction analysis">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Analyzed</p>
              <p className="text-2xl font-bold">{predictions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-fraud">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Flagged (Fraud)</p>
              <p className="text-2xl font-bold text-fraud">{fraudCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Risk Level:</span>
          {(["all", "high", "medium", "low"] as RiskFilter[]).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "all" ? "All" : f === "high" ? "High (>0.8)" : f === "medium" ? "Medium (0.4–0.8)" : "Low (<0.4)"}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead className="w-40">Risk Score</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => {
                    const isFraud = p.prediction === "Fraud";
                    return (
                      <TableRow key={p.transactionId} className={isFraud ? "fraud-highlight" : ""}>
                        <TableCell className="font-mono text-xs">{p.transactionId}</TableCell>
                        <TableCell>${p.amount.toFixed(2)}</TableCell>
                        <TableCell>{p.time}s</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isFraud ? "bg-fraud/10 text-fraud" : "bg-legitimate/10 text-legitimate"
                          }`}>
                            {isFraud ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                            {p.prediction}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={p.riskScore * 100}
                              className="h-2 flex-1"
                            />
                            <span className="text-xs font-mono w-12 text-right">{(p.riskScore * 100).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setExplainTx(p.transactionId)}>
                            Explain
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Explain Dialog */}
        <Dialog open={!!explainTx} onOpenChange={() => setExplainTx(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Explanation</DialogTitle>
            </DialogHeader>
            {selectedPred && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{selectedPred.transactionId}</span></div>
                  <div><span className="text-muted-foreground">Amount:</span> ${selectedPred.amount.toFixed(2)}</div>
                  <div><span className="text-muted-foreground">Risk Score:</span> <span className="font-mono">{(selectedPred.riskScore * 100).toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">Prediction:</span>{" "}
                    <span className={selectedPred.prediction === "Fraud" ? "text-fraud font-medium" : "text-legitimate font-medium"}>
                      {selectedPred.prediction}
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium">XGBoost Analysis (scale_pos_weight=50)</p>
                  {selectedPred.riskScore > 0.8 && (
                    <p>🔴 <strong>High Risk:</strong> Multiple anomalous features detected. The model's cost-sensitive learning heavily penalizes missing fraud, resulting in high confidence flagging.</p>
                  )}
                  {selectedPred.riskScore >= 0.4 && selectedPred.riskScore <= 0.8 && (
                    <p>🟡 <strong>Medium Risk:</strong> Some suspicious patterns found. The elevated scale_pos_weight causes the model to err on the side of caution for borderline cases.</p>
                  )}
                  {selectedPred.riskScore < 0.4 && (
                    <p>🟢 <strong>Low Risk:</strong> Transaction appears normal. Feature values fall within expected ranges for legitimate transactions.</p>
                  )}
                  <p className="text-muted-foreground text-xs">Key contributing features: V14, V12, V10, Amount, V17</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
