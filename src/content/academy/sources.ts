import type { AcademySource } from "./types";

export const academySources: AcademySource[] = [
  {
    id: "grzelak-computational-finance",
    name: "Computational Finance Course",
    author: "L. A. Grzelak",
    repository: "LechGrzelak/Computational-Finance-Course",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/LechGrzelak/Computational-Finance-Course/blob/main/LICENSE",
    url: "https://github.com/LechGrzelak/Computational-Finance-Course",
    ref: "main",
    reviewed: "2026-08-12",
    role: "research",
    usePolicy: "Concepts and numerical patterns are reimplemented in original prose and code. Lecture PDFs and scripts are not copied into the product.",
  },
  {
    id: "grzelak-ir-xva",
    name: "Financial Engineering: Interest Rates & xVA",
    author: "L. A. Grzelak",
    repository: "LechGrzelak/FinancialEngineering_IR_xVA",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/LechGrzelak/FinancialEngineering_IR_xVA/blob/main/LICENSE",
    url: "https://github.com/LechGrzelak/FinancialEngineering_IR_xVA",
    ref: "main",
    reviewed: "2026-08-12",
    role: "research",
    usePolicy: "Used to map the later rates, curve and xVA curriculum. No repository code is shipped in Academy V2.",
  },
  {
    id: "grzelak-quantlib-fork",
    name: "LechGrzelak QuantLib fork",
    author: "QuantLib contributors; fork maintained by L. A. Grzelak",
    repository: "LechGrzelak/QuantLib",
    license: "QuantLib permissive license",
    licenseUrl: "https://github.com/LechGrzelak/QuantLib/blob/master/LICENSE.TXT",
    url: "https://github.com/LechGrzelak/QuantLib",
    ref: "master (historical fork)",
    reviewed: "2026-08-12",
    role: "historical-reference",
    usePolicy: "Architecture reference only. It is never treated as authority for current APIs.",
  },
  {
    id: "quantlib-upstream",
    name: "QuantLib upstream",
    author: "QuantLib contributors",
    repository: "lballabio/QuantLib",
    license: "QuantLib permissive license",
    licenseUrl: "https://github.com/lballabio/QuantLib/blob/v1.42.1/LICENSE.TXT",
    url: "https://github.com/lballabio/QuantLib",
    ref: "v1.42.1",
    reviewed: "2026-08-12",
    role: "implementation-reference",
    usePolicy: "Current release documentation and tests are the API authority. Academy explains the mathematics before showing library abstractions.",
  },
];

export function findAcademySource(id: string): AcademySource | undefined {
  return academySources.find((source) => source.id === id);
}
