import { z } from "zod";

export const areaInputSchema = z.object({
  code: z.string().trim().min(1, "Area code is required").max(10, "Area code can be at most 10 characters"),
  name: z.string().trim().min(1, "Area name is required").max(50, "Area name can be at most 50 characters"),
  shortName: z.string().trim().min(1, "Short name is required").max(10, "Short name can be at most 10 characters"),
  isActive: z.boolean().default(true),
});
export const areaUpdateSchema = areaInputSchema.partial();

export interface AreaRow {
  id: number;
  code: string;
  name: string;
  shortName: string;
  isActive: boolean;
  subAreasCount: number;
  /** Ledgers and parties tagged to any of this area's sub-areas. */
  ledgersCount: number;
  partiesCount: number;
}
