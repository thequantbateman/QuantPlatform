"use client";

import { useContext } from "react";
import { QuantBatemanContext } from "./QuantBatemanProvider";

export function useQuantBateman() {
  const context = useContext(QuantBatemanContext);
  if (!context) throw new Error("useQuantBateman must be used inside QuantBatemanProvider");
  return context;
}
