// Web UI API (Hono アプリ定義)

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { claimIssue, createIssue, editIssue, findIssue, listIssueFiles } from "../commands/issue";
import { formatId } from "../models/id";
import type { Config } from "../models/types";

export interface WebContext {
  storeDir: string;
  config: Config;
}

const createIssueSchema = z.object({
  title: z.string().min(1, "title は必須です"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const editIssueSchema = z.object({
  status: z.string().optional(),
  description: z.string().optional(),
  addTags: z.array(z.string()).optional(),
  removeTags: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

const claimSchema = z.object({
  as: z.string().optional(),
});

export function createApp(ctx: WebContext) {
  const app = new Hono()
    .get("/api/issues", async (c) => {
      const files = await listIssueFiles(ctx.storeDir);
      const issues: Record<string, unknown>[] = files.map((f) => ({
        ...f.record.frontmatter,
        body: f.record.body,
        idLabel: formatId(f.record.frontmatter.id as number, ctx.config),
      }));
      issues.sort((a, b) => (a.id as number) - (b.id as number));
      return c.json({ issues });
    })
    .post("/api/issues", zValidator("json", createIssueSchema), async (c) => {
      const body = c.req.valid("json");
      const { id } = await createIssue(ctx.storeDir, ctx.config, {
        title: body.title,
        description: body.description,
        tags: body.tags,
      });
      return c.json({ id, idLabel: formatId(id, ctx.config) }, 201);
    })
    .post("/api/issues/:id/edit", zValidator("json", editIssueSchema), async (c) => {
      const id = parseInt(c.req.param("id"), 10);
      const found = await findIssue(ctx.storeDir, id);
      if (!found) return c.json({ error: "issue が見つかりません" }, 404);
      const body = c.req.valid("json");
      await editIssue(ctx.storeDir, ctx.config, id, {
        status: body.status,
        description: body.description,
        addTags: body.addTags,
        removeTags: body.removeTags,
        comment: body.comment,
      });
      return c.json({ ok: true, id });
    })
    .post("/api/issues/:id/claim", zValidator("json", claimSchema), async (c) => {
      const id = parseInt(c.req.param("id"), 10);
      const body = c.req.valid("json");
      try {
        await claimIssue(ctx.storeDir, ctx.config, id, { as: body.as });
        return c.json({ ok: true, id });
      } catch (err) {
        return c.json({ error: (err as Error).message }, 409);
      }
    })
    .notFound((c) => c.json({ error: "Not Found" }, 404));

  return app;
}

export type App = ReturnType<typeof createApp>;
