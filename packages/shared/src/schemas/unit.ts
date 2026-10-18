import { z } from "zod";

export const unitInputSchema = z.object({
  code: z.string().trim().min(1, "Unit code is required").max(10, "Unit code can be at most 10 characters"),
  name: z.string().trim().min(1, "Unit name is required").max(50, "Unit name can be at most 50 characters"),
  decimalPlaces: z
    .number({ required_error: "Decimal places is required", invalid_type_error: "Decimal places must be a whole number between 0 and 6" })
    .int("Decimal places must be a whole number between 0 and 6")
    .min(0, "Decimal places must be a whole number between 0 and 6")
    .max(6, "Decimal places must be a whole number between 0 and 6")
    .default(0),
  isActive: z.boolean().default(true),
});
export const unitUpdateSchema = unitInputSchema.partial();

export interface UnitRow {
  id: number;
  code: string;
  name: string;
  /** How many decimals a quantity in this unit may have (0 for PCS, 3 for KG). */
  decimalPlaces: number;
  isActive: boolean;
  /** Product records using this unit (stock base, non-stock, alternate, service). */
  inUseCount: number;
}
