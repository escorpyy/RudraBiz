import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApp } from "../app";
import { errorHandler, mapPgError, notFoundHandler } from "./errorHandler";
import { AppError, forbidden } from "./errors";
import { validate } from "./validate";

function appWith(register: (a: express.Express) => void) {
  const a = express();
  a.use(express.json());
  register(a);
  a.use(notFoundHandler);
  a.use(errorHandler);
  return a;
}

describe("createApp", () => {
  const app = createApp({ webOrigin: "http://localhost:5173", db: {} as never, auth: { handler: async () => new Response("x") } as never });
  it("serves /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
  it("returns 400 (not 500) for malformed JSON", async () => {
    const res = await request(app).post("/api/health").set("content-type", "application/json").send("{bad");
    expect(res.status).toBe(400);
  });
});

describe("validate()", () => {
  const app = appWith((a) => {
    a.post(
      "/items/:id",
      validate({
        params: z.object({ id: z.coerce.number().int().positive() }),
        query: z.object({ dry: z.enum(["0", "1"]).default("0") }),
        body: z.object({ name: z.string().trim().min(1) }),
      }),
      (req, res) => res.json(req.valid),
    );
  });
  it("coerces and exposes parsed values on req.valid", async () => {
    const res = await request(app).post("/items/7").send({ name: "  Ram " });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: 7 }, query: { dry: "0" }, body: { name: "Ram" } });
  });
  it("rejects bad input with field errors", async () => {
    const res = await request(app).post("/items/abc").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(res.body.error.details.fieldErrors.id).toBeDefined();
    expect(res.body.error.details.fieldErrors.name).toBeDefined();
  });
});

describe("errorHandler", () => {
  it("shows AppError to the client", async () => {
    const app = appWith((a) => a.get("/x", () => { throw forbidden("No access to this company"); }));
    const res = await request(app).get("/x");
    expect(res.status).toBe(403);
    expect(res.body.error).toMatchObject({ code: "FORBIDDEN", message: "No access to this company" });
  });
  it("catches async handler rejections (Express 5)", async () => {
    const app = appWith((a) => a.get("/x", async () => { throw new AppError(418, "TEAPOT", "short and stout"); }));
    expect((await request(app).get("/x")).status).toBe(418);
  });
  it("hides internals of unexpected errors", async () => {
    const app = appWith((a) => a.get("/x", () => { throw new Error("secret db password"); }));
    const res = await request(app).get("/x");
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });
  it("maps trigger exceptions to 422 with the trigger's message", () => {
    const e = mapPgError({ code: "P0001", message: "JournalVoucher 5 is out of balance: debit 10 != credit 9" });
    expect(e).toMatchObject({ status: 422, code: "RULE_VIOLATION" });
    expect(e!.message).toContain("out of balance");
  });
  it("maps unique/foreign-key violations to 409", () => {
    expect(mapPgError({ code: "23505" })!.status).toBe(409);
    expect(mapPgError({ code: "23503" })!.status).toBe(409);
    expect(mapPgError({ code: "XX000" })).toBeNull();
  });
});
