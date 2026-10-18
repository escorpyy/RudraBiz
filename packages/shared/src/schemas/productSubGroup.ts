import { z } from "zod";

export const productSubGroupInputSchema = z.object({
  productGroupId: z
    .number({ required_error: "Product group is required", invalid_type_error: "Product group is required" })
    .int()
    .positive("Product group is required"),
  code: z.string().trim().min(1, "Sub-group code is required").max(10, "Sub-group code can be at most 10 characters"),
  name: z.string().trim().min(1, "Sub-group name is required").max(50, "Sub-group name can be at most 50 characters"),
  isActive: z.boolean().default(true),
});
export const productSubGroupUpdateSchema = productSubGroupInputSchema.partial();

export interface ProductSubGroupRow {
  id: number;
  productGroupId: number;
  groupName: string;
  code: string;
  name: string;
  isActive: boolean;
  productsCount: number;
}
