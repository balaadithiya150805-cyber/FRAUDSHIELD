import { Transaction, PredictionResult, ModelMetrics, computeMetrics, predictTransactions } from "./fraudEngine";

interface FraudState {
  transactions: Transaction[];
  predictions: PredictionResult[];
  metrics: ModelMetrics | null;
  isProcessing: boolean;
  hasResults: boolean;
}

let state: FraudState = {
  transactions: [],
  predictions: [],
  metrics: null,
  isProcessing: false,
  hasResults: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => l());
}

export function getState(): FraudState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTransactions(txs: Transaction[]) {
  state = { ...state, transactions: txs, hasResults: false, predictions: [], metrics: null };
  notify();
}

export async function runPrediction() {
  state = { ...state, isProcessing: true };
  notify();

  await new Promise(r => setTimeout(r, 1500));

  const predictions = predictTransactions(state.transactions);
  const metrics = computeMetrics(predictions);

  state = { ...state, predictions, metrics, isProcessing: false, hasResults: true };
  notify();
}

export function clearResults() {
  state = { transactions: [], predictions: [], metrics: null, isProcessing: false, hasResults: false };
  notify();
}
