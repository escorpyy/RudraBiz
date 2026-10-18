import { z } from "zod";
import { ACCOUNT_TYPES } from "../enums";

export const accountGroupInputSchema = z.object({
  type: z.enum(ACCOUNT_TYPES, { required_error: "Account type is required", invalid_type_error: "Account type is required", message: "Account type is required" }),
  code: z.string().trim().min(1, "Group code is required").max(10, "Group code can be at most 10 characters"),
  description: z.string().trim().min(1, "Description is required").max(50, "Description can be at most 50 characters"),
  isActive: z.boolean().default(true),
});
export const accountGroupUpdateSchema = accountGroupInputSchema.partial();

export interface AccountGroupRow {
  id: number;
  type: (typeof ACCOUNT_TYPES)[number];
  code: string;
  description: string;
  isActive: boolean;
  subGroupsCount: number;
  /** Ledgers under any of this group's sub-groups. */
  ledgersCount: number;
}
