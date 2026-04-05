import { useSyncExternalStore } from "react";
import { getState, subscribe } from "@/lib/fraudStore";

export function useFraudStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}
