import { z } from "zod";

export const productGroupInputSchema = z.object({
  code: z.string().trim().min(1, "Group code is required").max(10, "Group code can be at most 10 characters"),
  name: z.string().trim().min(1, "Group name is required").max(50, "Group name can be at most 50 characters"),
  isActive: z.boolean().default(true),
});
export const productGroupUpdateSchema = productGroupInputSchema.partial();

export interface ProductGroupRow {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  subGroupsCount: number;
  /** Products across all of this group's sub-groups. */
  productsCount: number;
}
