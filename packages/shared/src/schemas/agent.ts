import { z } from "zod";

/**
 * Agent master input. Single source of truth for the API (validate()) and the web form
 * (React Hook Form resolver). Lengths mirror the "Agent" table; apps/api has a test
 * (drizzle-zod) that fails if they drift from the database columns.
 */
export const agentInputSchema = z.object({
  code: z.string().trim().min(1, "Agent code is required").max(10, "Agent code can be at most 10 characters"),
  name: z.string().trim().min(1, "Agent name is required").max(100, "Agent name can be at most 100 characters"),
  // empty string from a form means "no phone"
  phone: z
    .string()
    .trim()
    .max(25, "Phone can be at most 25 characters")
    .nullish()
    .transform((v) => (v ? v : null)),
  isActive: z.boolean().default(true),
});
export const agentUpdateSchema = agentInputSchema.partial();

export type AgentInput = z.input<typeof agentInputSchema>;
export type AgentData = z.output<typeof agentInputSchema>;

export const agentListQuerySchema = z.object({
  status: z.enum(["all", "active"]).default("all"),
  q: z.string().trim().max(100).optional(),
});

export interface AgentRow {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  ledgersCount: number;
  partiesCount: number;
}

export interface AgentDetail extends AgentRow {
  ledgers: { id: number; code: string; name: string; isActive: boolean }[];
  parties: { id: number; code: string; name: string }[];
}
