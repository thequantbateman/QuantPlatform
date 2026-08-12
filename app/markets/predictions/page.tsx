import { AppShell } from "@/src/components/AppShell";
import { PredictionsDashboard } from "@/src/components/markets/PredictionsDashboard";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Prediction Markets", description: "Read-only macro prediction-market probabilities with explicit provenance." }, es: { title: "Mercados de predicción", description: "Probabilidades macro de mercados de predicción en modo lectura y con procedencia explícita." } });
export default function PredictionsPage() { return <AppShell><PredictionsDashboard /></AppShell>; }
