export interface Source {
  label: string;
  url: string;
}
export interface DepartmentInfo {
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  coordinates: { lat: number; lng: number };
  source: Source;
}
export interface Leadership {
  name: string;
  title: string;
  source: Source;
}
export interface Apparatus {
  description: string;
  year?: number;
  acquiredYear?: number;
  source: Source;
}
export interface Grant {
  organization: string;
  program: string;
  amount: string;
  fiscalYear: string;
  source: Source;
}
export interface NewsArticle {
  title: string;
  snippet: string;
  link: string;
  source: Source;
}
export interface CallSignal {
  headline: string;
  detail: string;
  kind: "timing" | "fleet" | "funding" | "context";
  source: Source;
}
export interface BriefData {
  department: DepartmentInfo;
  leadership: Leadership[];
  fleet: Apparatus[];
  grants: Grant[];
  news: NewsArticle[];
  callSignals: CallSignal[];
  generatedAt: string;
}
export interface BriefResponse {
  success: boolean;
  data?: BriefData;
  error?: string;
  warnings: string[];
}
