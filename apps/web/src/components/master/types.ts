import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ZodTypeAny } from "zod";
import type { StatCardProps } from "../shared/StatCard";

export interface MasterRow {
  id: number;
  isActive: boolean;
}

export interface ColumnDef<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  /** Extra classes for the cells, e.g. "font-medium text-slate-900". */
  className?: string;
}

/** Form inputs a master can declare. Add a kind here when a master needs one (number, select, ...). */
export type FieldDef<Row = never> =
  | {
      kind: "text";
      name: string;
      label: string;
      hint: string;
      placeholder?: string;
      icon?: LucideIcon;
      required?: boolean;
      /** Mobile keyboard hint; use "decimal" for amounts and rates (the value stays a string, never a float). */
      inputMode?: "text" | "decimal" | "numeric";
      /** Short unit shown inside the input on the right, e.g. "%". */
      suffix?: string;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      hint: string;
      required?: boolean;
      icon?: LucideIcon;
      /**
       * Static choices; `{ self: label }` to pick another row of this same master (the current row is left out);
       * or `{ from }` to pick a row of another master, e.g. the Area of a Sub-Area (inactive ones are marked).
       */
      options:
        | { value: number | string; label: string }[]
        | { self: (row: Row) => string }
        | { from: { key: string; apiPath: string; label: (row: MasterRow & Record<string, string>) => string } };
      /** Shown for the empty choice. Present = optional field, empty is sent as null. */
      emptyLabel?: string;
      /** Initial value on the create form. */
      defaultValue?: number | string;
    }
  | { kind: "status"; label: string; hint: string };

/**
 * Everything the generic list / form / detail pages need to run one master.
 * A new simple master = the API config + one of these (see modules/agents, modules/stockCategories).
 */
export interface MasterConfig<Row extends MasterRow, Detail extends Row = Row> {
  /** TanStack Query key root, e.g. "agents". */
  key: string;
  apiPath: string;
  /** Route prefix, e.g. "/master/agents". */
  basePath: string;
  /** "Agent" */
  singular: string;
  /** "Agent Master" */
  title: string;
  subtitle: string;
  /** "New Agent" */
  newLabel: string;
  nameOf: (row: Row) => string;
  codeOf: (row: Row) => string;

  stats: (rows: Row[]) => StatCardProps[];
  columns: ColumnDef<Row>[];
  searchText: (row: Row) => string[];
  /** What deleting does, shown in the confirm dialog (single and bulk). */
  deleteMessage: string;

  /** Shared Zod schema, used as the form resolver. */
  schema: ZodTypeAny;
  fields: FieldDef<Row>[];
  /** Optional side panel on the form page. */
  infoPanel?: ReactNode;

  /** Cards at the top of the detail page. */
  summary: { label: string; value: (row: Detail) => ReactNode }[];
  /** Extra sections on the detail page (e.g. records tagged to this one). */
  detailExtra?: (row: Detail) => ReactNode;
}
