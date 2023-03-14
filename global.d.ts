type AmzReport = {
  country: Country;
  timeframes: Timeframe[];
};

type DataReport = {
  filepath: string;
  reportId: number;
  countryCode: Country["code"];
  countryFolderId: string;
  department: string;
  departmentId: number;
  timeframe: Timeframe["name"];
  endDay: Date;
  dataCheck: { sterm: string; rank: number; asin1: string } | NULL;
  size: number;
};

type Country = {
  id: number;
  name: string;
  code:
    | "AE"
    | "AU"
    | "BR"
    | "CA"
    | "DE"
    | "ES"
    | "FR"
    | "IN"
    | "IT"
    | "JP"
    | "MX"
    | "NL"
    | "SA"
    | "SE"
    | "SG"
    | "TR"
    | "GB"
    | "US";
  url: string;
  marketplaceId: string;
  googleFolderId: string;
  dateFormat: string;
  mainDepartmentId: number;
};

type Timeframe = {
  name: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  endDays: {
    day: Date;
    departments: {
      reportId: number;
      name: string;
    }[];
  }[];
};

type ICountryCodes = {
  [key in AmzReport.code]: string;
};

type FilterReport = {
  attempt: { [key in "min" | "max"]: number };
  range: { [key in "min" | "max"]: Date };
};

declare module globalThis {
  var countryCode: Country["code"];
  var reportId: number;
  var importFlag: boolean;
}

namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    AMAZON_EMAIL: string;
    AMAZON_PASSWORD: string;
  }
}
