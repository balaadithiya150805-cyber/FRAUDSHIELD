import { useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFraudStore } from "@/hooks/useFraudStore";
import { setTransactions, runPrediction } from "@/lib/fraudStore";
import { generateSampleData, Transaction } from "@/lib/fraudEngine";
import { Upload, FileSpreadsheet, Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

export default function UploadPage() {
  const { transactions, predictions, isProcessing, hasResults } = useFraudStore();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = useCallback((file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const txs: Transaction[] = results.data.map((row: any, i: number) => {
            const amount = parseFloat(row.Amount || row.amount || "0");
            if (isNaN(amount)) throw new Error("Invalid Amount column");
            const tx: Transaction = {
              id: `TXN-${String(i + 1).padStart(6, "0")}`,
              amount,
              time: parseFloat(row.Time || row.time || "0") || 0,
              class: row.Class !== undefined ? parseInt(row.Class) : undefined,
            };
            // Parse V features
            for (let v = 1; v <= 28; v++) {
              const key = `V${v}`;
              if (row[key] !== undefined) {
                (tx as any)[key.toLowerCase()] = parseFloat(row[key]);
              }
            }
            return tx;
          });

          setTransactions(txs);
          toast({ title: "Upload successful", description: `${txs.length} transactions loaded from ${file.name}` });
        } catch (e: any) {
          toast({ title: "Error", description: e.message || "Failed to parse CSV", variant: "destructive" });
        }
      },
      error: () => {
        toast({ title: "Error", description: "Failed to read CSV file", variant: "destructive" });
      },
    });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      parseCSV(file);
    } else {
      toast({ title: "Invalid file", description: "Please upload a CSV file", variant: "destructive" });
    }
  }, [parseCSV, toast]);

  const handleLoadSample = () => {
    const data = generateSampleData(200);
    setTransactions(data);
    setFileName("sample_dataset.csv");
    toast({ title: "Sample loaded", description: "200 sample transactions generated" });
  };

  const handleRun = async () => {
    await runPrediction();
    toast({ title: "Detection complete", description: "Fraud detection model has finished processing" });
  };

  const fraudCount = predictions.filter(p => p.prediction === "Fraud").length;
  const legitCount = predictions.filter(p => p.prediction === "Legitimate").length;

  return (
    <AppLayout title="Upload Transactions" subtitle="Upload CSV data for fraud detection">
      <div className="space-y-6 max-w-5xl">
        {/* Upload Area */}
        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">Drop CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">Required column: Amount. Optional: Time, V1–V28, Class</p>
              {fileName && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) parseCSV(file);
            }} />

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={handleLoadSample}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Load Sample Dataset
              </Button>
              <Button onClick={handleRun} disabled={transactions.length === 0 || isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? "Processing..." : "Run Fraud Detection"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {hasResults && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-fraud">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-fraud" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fraud Detected</p>
                  <p className="text-xl font-bold text-fraud">{fraudCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-legitimate">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-legitimate" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Legitimate</p>
                  <p className="text-xl font-bold text-legitimate">{legitCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Table */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Dataset Preview ({Math.min(50, transactions.length)} of {transactions.length} rows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-96 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                      {hasResults && <TableHead>Prediction</TableHead>}
                      {hasResults && <TableHead>Risk Score</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 50).map((tx, i) => {
                      const pred = predictions[i];
                      const isFraud = pred?.prediction === "Fraud";
                      return (
                        <TableRow key={tx.id} className={hasResults ? (isFraud ? "fraud-highlight" : "legitimate-highlight") : ""}>
                          <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                          <TableCell>${tx.amount.toFixed(2)}</TableCell>
                          <TableCell>{tx.time}s</TableCell>
                          {hasResults && (
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isFraud ? "bg-fraud/10 text-fraud" : "bg-legitimate/10 text-legitimate"
                              }`}>
                                {pred.prediction}
                              </span>
                            </TableCell>
                          )}
                          {hasResults && (
                            <TableCell className="font-mono text-xs">{pred.riskScore.toFixed(4)}</TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
