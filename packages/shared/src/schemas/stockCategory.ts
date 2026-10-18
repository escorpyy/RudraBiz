import { z } from "zod";

export const stockCategoryInputSchema = z.object({
  code: z.string().trim().min(1, "Category code is required").max(10, "Category code can be at most 10 characters"),
  name: z.string().trim().min(1, "Category name is required").max(50, "Category name can be at most 50 characters"),
  isActive: z.boolean().default(true),
});
export const stockCategoryUpdateSchema = stockCategoryInputSchema.partial();

export type StockCategoryInput = z.input<typeof stockCategoryInputSchema>;

export interface StockCategoryRow {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  /** Stock products in this category. */
  productCount: number;
}
