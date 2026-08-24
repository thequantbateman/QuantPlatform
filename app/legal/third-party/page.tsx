import { AppShell } from "@/src/components/AppShell";
import { ThirdPartyNoticesPage } from "@/src/components/legal/ThirdPartyNoticesPage";
import { localizedMetadata, serverLocale } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({
  en: { title: "Third-party notices", description: "Third-party material redistributed by TheQuantBateman." },
  es: { title: "Avisos de terceros", description: "Material de terceros redistribuido por TheQuantBateman." },
});

export default async function ThirdPartyNoticesRoute() {
  return <AppShell><ThirdPartyNoticesPage locale={await serverLocale()} /></AppShell>;
}
