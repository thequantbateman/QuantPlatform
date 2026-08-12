import { AppShell } from "@/src/components/AppShell";
import { DeskEditorial } from "@/src/components/DeskEditorial";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "The Desk", description: "Editorial quantitative finance notes, market debates and research questions." }, es: { title: "La Mesa", description: "Notas editoriales de finanzas cuantitativas, debates de mercado y preguntas de investigación." } });

export default function DeskPage() { return <AppShell><DeskEditorial /></AppShell>; }
