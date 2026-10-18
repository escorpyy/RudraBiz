import { z } from "zod";
import { money } from "../money";

/** A rate like "13" or "13.5": digits with at most 2 decimals, 0 to 100. Carried as a string, never a float. */
const ratePercent = z
  .string({ required_error: "Rate % is required", invalid_type_error: "Rate % must be a number between 0 and 100" })
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Rate % must be a number between 0 and 100 with at most 2 decimals")
  .refine((v) => !/^\d+(\.\d{1,2})?$/.test(v) || money(v).lte(100), "Rate % must be between 0 and 100");

export const taxRateInputSchema = z.object({
  code: z.string().trim().min(1, "Tax code is required").max(10, "Tax code can be at most 10 characters"),
  name: z.string().trim().min(1, "Tax name is required").max(50, "Tax name can be at most 50 characters"),
  ratePercent,
  hsnSacCode: z
    .string()
    .trim()
    .max(20, "HSN/SAC code can be at most 20 characters")
    .nullish()
    .transform((v) => (v ? v : null)),
  isActive: z.boolean().default(true),
});
export const taxRateUpdateSchema = taxRateInputSchema.partial();

export type TaxRateInput = z.input<typeof taxRateInputSchema>;

export interface TaxRateRow {
  id: number;
  code: string;
  name: string;
  /** NUMERIC(5,2) as the database prints it, e.g. "13.00". */
  ratePercent: string;
  hsnSacCode: string | null;
  isActive: boolean;
  /** Products (stock, non-stock, service) using this rate. */
  inUseCount: number;
}
