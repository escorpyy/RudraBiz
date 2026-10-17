import { z } from "zod";

/** Query string of every master list endpoint. */
export const masterListQuerySchema = z.object({
  status: z.enum(["all", "active"]).default("all"),
  q: z.string().trim().max(100).optional(),
});
export type MasterListQuery = z.infer<typeof masterListQuerySchema>;

/** A unique-key violation reported by the API: which form field clashed. */
export interface ConflictDetails {
  field?: string;
  constraint?: string;
}
