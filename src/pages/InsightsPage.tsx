import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFraudStore } from "@/hooks/useFraudStore";
import { getFeatureImportances } from "@/lib/fraudEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Brain, Info } from "lucide-react";

export default function InsightsPage() {
  const { metrics, hasResults } = useFraudStore();
  const features = getFeatureImportances();

  const confusionMatrix = hasResults && metrics
    ? [
        [metrics.tn, metrics.fp],
        [metrics.fn, metrics.tp],
      ]
    : [
        [0, 0],
        [0, 0],
      ];

  return (
    <AppLayout title="Model Insights" subtitle="XGBoost model performance and feature analysis">
      <div className="space-y-6">
        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Feature Importance (XGBoost)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={features} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => value.toFixed(3)} />
                <Bar dataKey="importance" fill="hsl(222, 80%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confusion Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Confusion Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <div className="grid grid-cols-3 gap-1 text-center text-sm">
                <div />
                <div className="font-medium text-muted-foreground py-2">Predicted Legit</div>
                <div className="font-medium text-muted-foreground py-2">Predicted Fraud</div>

                <div className="font-medium text-muted-foreground flex items-center justify-end pr-3">Actual Legit</div>
                <div className="bg-legitimate/10 border border-legitimate/20 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">TN</p>
                  <p className="text-2xl font-bold text-legitimate">{confusionMatrix[0][0]}</p>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">FP</p>
                  <p className="text-2xl font-bold text-warning">{confusionMatrix[0][1]}</p>
                </div>

                <div className="font-medium text-muted-foreground flex items-center justify-end pr-3">Actual Fraud</div>
                <div className="bg-fraud/10 border border-fraud/20 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">FN</p>
                  <p className="text-2xl font-bold text-fraud">{confusionMatrix[1][0]}</p>
                </div>
                <div className="bg-legitimate/10 border border-legitimate/20 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">TP</p>
                  <p className="text-2xl font-bold text-legitimate">{confusionMatrix[1][1]}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">Cost-Sensitive Learning (scale_pos_weight = 50)</p>
              <p className="text-muted-foreground">
                The model uses <code className="font-mono bg-secondary px-1 rounded text-xs">scale_pos_weight = 50</code> to
                address class imbalance. This penalizes false negatives (missed fraud) 50× more than false positives,
                resulting in high recall at the cost of lower precision. This is ideal for fraud detection where missing
                fraudulent transactions is far more costly than flagging legitimate ones for review.
              </p>
            </div>
          </CardContent>
        </Card>

        {!hasResults && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="font-medium">Run fraud detection to see confusion matrix results</p>
              <p className="text-sm mt-1">Feature importances are from the pre-trained XGBoost model.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
