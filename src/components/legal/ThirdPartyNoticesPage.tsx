import { noticeRecords } from "@/src/licensing/notices";
import { sourceRegistry } from "@/src/licensing/registry";
import type { Locale } from "@/src/i18n";

function localized<T>(locale: Locale, values: { en: T; es: T }): T {
  return values[locale];
}

export function ThirdPartyNoticesPage({ locale }: { locale: Locale }) {
  const notices = noticeRecords(sourceRegistry);
  return <section className="legal-notices section-shell" aria-labelledby="third-party-notices-title">
    <header>
      <span className="eyebrow">{localized(locale, { en: "LEGAL · SOURCE USE", es: "LEGAL · USO DE FUENTES" })}</span>
      <h1 id="third-party-notices-title">{localized(locale, { en: "Third-party notices", es: "Avisos de terceros" })}</h1>
      <p>{localized(locale, {
        en: "This page lists third-party material redistributed by the public application. Research references remain separate from distributed assets.",
        es: "Esta página enumera el material de terceros redistribuido por la aplicación pública. Las referencias de investigación permanecen separadas de los recursos distribuidos.",
      })}</p>
    </header>
    {notices.length === 0 ? <p className="legal-notices-empty">{localized(locale, {
      en: "No third-party source code, document assets, media, or datasets are redistributed by the current public application.",
      es: "La aplicación pública actual no redistribuye código fuente, recursos documentales, contenido multimedia ni conjuntos de datos de terceros.",
    })}</p> : <div className="legal-notices-list">{notices.map((record) => <section key={record.id}>
      <h2>{record.title}</h2>
      <p>{record.authorOrOwner}</p>
      <dl><div><dt>{localized(locale, { en: "License", es: "Licencia" })}</dt><dd>{record.licenseId}</dd></div></dl>
      {record.publicSourceUrl && <a href={record.publicSourceUrl} target="_blank" rel="noreferrer">{localized(locale, { en: "Original source", es: "Fuente original" })} ↗</a>}
    </section>)}</div>}
  </section>;
}
