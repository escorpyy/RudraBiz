import { z } from "zod";

export const subAreaInputSchema = z.object({
  areaId: z.number({ required_error: "Area is required", invalid_type_error: "Area is required" }).int().positive("Area is required"),
  code: z.string().trim().min(1, "Sub-area code is required").max(10, "Sub-area code can be at most 10 characters"),
  name: z.string().trim().min(1, "Sub-area name is required").max(50, "Sub-area name can be at most 50 characters"),
  shortName: z.string().trim().min(1, "Short name is required").max(10, "Short name can be at most 10 characters"),
  isActive: z.boolean().default(true),
});
export const subAreaUpdateSchema = subAreaInputSchema.partial();

export interface SubAreaRow {
  id: number;
  areaId: number;
  areaName: string;
  code: string;
  name: string;
  shortName: string;
  isActive: boolean;
  ledgersCount: number;
  partiesCount: number;
}
