import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppLayout title="Settings" subtitle="Application configuration">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Model Type</span>
              <span className="font-medium font-mono">XGBoost Classifier</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">scale_pos_weight</span>
              <span className="font-medium font-mono">50</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Decision Threshold</span>
              <span className="font-medium font-mono">0.5</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">High Risk Threshold</span>
              <span className="font-medium font-mono">&gt; 0.8</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Medium Risk Range</span>
              <span className="font-medium font-mono">0.4 – 0.8</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Low Risk Threshold</span>
              <span className="font-medium font-mono">&lt; 0.4</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">About FraudShield AI</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>FraudShield AI uses XGBoost with cost-sensitive learning to detect fraudulent transactions in highly imbalanced datasets.</p>
            <p>The model prioritizes high recall (catching fraud) while maintaining balanced performance for legitimate transactions through <code className="font-mono bg-secondary px-1 rounded text-xs">scale_pos_weight = 50</code>.</p>
            <p className="text-xs">Version 1.0.0</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
