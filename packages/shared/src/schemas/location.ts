import { z } from "zod";

export const locationInputSchema = z.object({
  code: z.string().trim().min(1, "Location code is required").max(10, "Location code can be at most 10 characters"),
  name: z.string().trim().min(1, "Location name is required").max(50, "Location name can be at most 50 characters"),
  /** null or empty = a top-level location. */
  parentId: z.number().int().positive().nullish().transform((v) => v ?? null),
  isActive: z.boolean().default(true),
});
export const locationUpdateSchema = locationInputSchema.partial();

export interface LocationRow {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  parentName: string | null;
  isActive: boolean;
  childrenCount: number;
  /** Stock and fixed-asset records placed here. */
  usageCount: number;
}
