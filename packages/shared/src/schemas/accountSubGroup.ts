import { z } from "zod";
import { ACCOUNT_TYPES } from "../enums";

export const accountSubGroupInputSchema = z.object({
  accountGroupId: z
    .number({ required_error: "Account group is required", invalid_type_error: "Account group is required" })
    .int()
    .positive("Account group is required"),
  code: z.string().trim().min(1, "Sub-group code is required").max(10, "Sub-group code can be at most 10 characters"),
  description: z.string().trim().min(1, "Description is required").max(50, "Description can be at most 50 characters"),
  isActive: z.boolean().default(true),
});
export const accountSubGroupUpdateSchema = accountSubGroupInputSchema.partial();

export interface AccountSubGroupRow {
  id: number;
  accountGroupId: number;
  groupDescription: string;
  groupType: (typeof ACCOUNT_TYPES)[number];
  code: string;
  description: string;
  isActive: boolean;
  ledgersCount: number;
}
