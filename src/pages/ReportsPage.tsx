import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFraudStore } from "@/hooks/useFraudStore";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const { predictions, metrics, hasResults } = useFraudStore();
  const { toast } = useToast();

  const fraudCount = predictions.filter(p => p.prediction === "Fraud").length;
  const legitCount = predictions.filter(p => p.prediction === "Legitimate").length;
  const avgRisk = predictions.length > 0
    ? (predictions.reduce((s, p) => s + p.riskScore, 0) / predictions.length).toFixed(4)
    : "0";

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("FraudShield AI - Detection Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(0);

    const summaryData = [
      ["Total Transactions", String(predictions.length)],
      ["Fraud Detected", String(fraudCount)],
      ["Legitimate", String(legitCount)],
      ["Average Risk Score", avgRisk],
      ["Accuracy", metrics?.accuracy?.toFixed(3) ?? "N/A"],
      ["Precision", metrics?.precision?.toFixed(3) ?? "N/A"],
      ["Recall", metrics?.recall?.toFixed(3) ?? "N/A"],
      ["F1 Score", metrics?.f1Score?.toFixed(3) ?? "N/A"],
      ["ROC-AUC", metrics?.rocAuc?.toFixed(3) ?? "N/A"],
    ];

    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: summaryData,
      startY: 38,
      theme: "striped",
    });

    autoTable(doc, {
      head: [["Transaction ID", "Amount", "Prediction", "Risk Score"]],
      body: predictions.slice(0, 100).map(p => [
        p.transactionId,
        `$${p.amount.toFixed(2)}`,
        p.prediction,
        p.riskScore.toFixed(4),
      ]),
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: "striped",
    });

    doc.save("fraudshield_report.pdf");
    toast({ title: "PDF Downloaded", description: "Report saved as fraudshield_report.pdf" });
  };

  const downloadCSV = () => {
    const headers = ["Transaction ID", "Amount", "Time", "Prediction", "Risk Score"];
    const rows = predictions.map(p =>
      [p.transactionId, p.amount.toFixed(2), String(p.time), p.prediction, p.riskScore.toFixed(4)].join(",")
    );

    const metricsHeader = "\n\nMetrics Summary\nMetric,Value";
    const metricsRows = [
      `Accuracy,${metrics?.accuracy?.toFixed(3) ?? "N/A"}`,
      `Precision,${metrics?.precision?.toFixed(3) ?? "N/A"}`,
      `Recall,${metrics?.recall?.toFixed(3) ?? "N/A"}`,
      `F1 Score,${metrics?.f1Score?.toFixed(3) ?? "N/A"}`,
      `ROC-AUC,${metrics?.rocAuc?.toFixed(3) ?? "N/A"}`,
      `Total Transactions,${predictions.length}`,
      `Fraud Count,${fraudCount}`,
      `Legitimate Count,${legitCount}`,
      `Average Risk Score,${avgRisk}`,
    ];

    const csv = [headers.join(","), ...rows, metricsHeader, ...metricsRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fraudshield_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV Downloaded", description: "Report saved as fraudshield_report.csv" });
  };

  if (!hasResults) {
    return (
      <AppLayout title="Reports" subtitle="Generate and download detection reports">
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No data to report</p>
            <p className="text-sm mt-1">Run fraud detection first to generate reports.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reports" subtitle="Generate and download detection reports">
      <div className="space-y-6 max-w-3xl">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Total:</span> <strong>{predictions.length}</strong></div>
              <div><span className="text-muted-foreground">Fraud:</span> <strong className="text-fraud">{fraudCount}</strong></div>
              <div><span className="text-muted-foreground">Legitimate:</span> <strong className="text-legitimate">{legitCount}</strong></div>
              <div><span className="text-muted-foreground">Accuracy:</span> <strong>{metrics?.accuracy?.toFixed(3)}</strong></div>
              <div><span className="text-muted-foreground">Precision:</span> <strong>{metrics?.precision?.toFixed(3)}</strong></div>
              <div><span className="text-muted-foreground">Recall:</span> <strong>{metrics?.recall?.toFixed(3)}</strong></div>
              <div><span className="text-muted-foreground">F1 Score:</span> <strong>{metrics?.f1Score?.toFixed(3)}</strong></div>
              <div><span className="text-muted-foreground">ROC-AUC:</span> <strong>{metrics?.rocAuc?.toFixed(3)}</strong></div>
              <div><span className="text-muted-foreground">Avg Risk:</span> <strong>{avgRisk}</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* Download Buttons */}
        <div className="flex gap-4">
          <Card className="flex-1 cursor-pointer hover:border-primary/50 transition-colors" onClick={downloadPDF}>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-fraud/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-fraud" />
              </div>
              <p className="font-medium">Download PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Full report with metrics and transactions</p>
              <Button className="mt-3" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDF Report
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 cursor-pointer hover:border-primary/50 transition-colors" onClick={downloadCSV}>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-legitimate/10 flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="h-6 w-6 text-legitimate" />
              </div>
              <p className="font-medium">Download CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Raw data for further analysis</p>
              <Button variant="outline" className="mt-3" size="sm">
                <Download className="mr-2 h-4 w-4" />
                CSV Export
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
