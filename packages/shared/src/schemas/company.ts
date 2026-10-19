import { z } from "zod";
import { BUSINESS_TYPES, CALENDAR_PREFERENCES } from "../enums";

/** Optional free text: trimmed, empty becomes null (so clearing a field stores NULL, not ""). */
const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} can be at most ${max} characters`).nullish().transform((v) => (v ? v : null));

export const companyInputSchema = z.object({
  code: z.string().trim().min(1, "Company code is required").max(15, "Company code can be at most 15 characters"),
  name: z.string().trim().min(1, "Company name is required").max(200, "Company name can be at most 200 characters"),
  legalName: optionalText(200, "Legal name"),
  businessType: z.enum(BUSINESS_TYPES, { message: "Choose a business type" }).default("OTHER"),
  registrationNo: optionalText(50, "Registration no."),
  panNo: optionalText(25, "PAN no."),
  vatNo: optionalText(25, "VAT no."),
  isVatRegistered: z.boolean().default(false),
  taxOfficeName: optionalText(100, "Tax office"),
  address: optionalText(300, "Address"),
  city: optionalText(50, "City"),
  district: optionalText(50, "District"),
  province: optionalText(50, "Province"),
  country: optionalText(50, "Country"),
  phone: optionalText(20, "Phone"),
  email: z
    .string()
    .trim()
    .max(255, "Email can be at most 255 characters")
    .email("Enter a valid email address")
    .or(z.literal(""))
    .nullish()
    .transform((v) => (v ? v : null)),
  website: optionalText(255, "Website"),
  baseCurrency: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code such as NPR"))
    .default("NPR"),
  defaultCalendarPref: z.enum(CALENDAR_PREFERENCES, { message: "Choose BS or AD" }).default("BS"),
  isActive: z.boolean().default(true),
});
export const companyUpdateSchema = companyInputSchema.partial();

export interface CompanyBranchSummary {
  id: number;
  code: string;
  name: string;
  isHeadOffice: boolean;
  isActive: boolean;
}

export interface CompanyRow {
  id: number;
  code: string;
  name: string;
  legalName: string | null;
  businessType: (typeof BUSINESS_TYPES)[number];
  registrationNo: string | null;
  panNo: string | null;
  vatNo: string | null;
  isVatRegistered: boolean;
  taxOfficeName: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  baseCurrency: string;
  defaultCalendarPref: (typeof CALENDAR_PREFERENCES)[number];
  isActive: boolean;
  branchesCount: number;
  fiscalYearsCount: number;
  /** The signed-in user's strongest role in this company. */
  role: "ADMIN" | "ACCOUNTANT" | "VIEWER";
}

export interface CompanyDetail extends CompanyRow {
  branches: CompanyBranchSummary[];
  fiscalYears: { id: number; code: string; isCurrent: boolean; isClosed: boolean }[];
}
