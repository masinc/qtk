// Web UI API ハンドラ (Bun.serve 用)
import type { Config } from "../models/types";
import {
  createIssue,
  listIssueFiles,
  editIssue,
  claimIssue,
  findIssue,
} from "../commands/issue";
import { formatId } from "../models/id";

export interface WebContext {
  storeDir: string;
  config: Config;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function handleApi(
  ctx: WebContext,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // GET /api/issues — 一覧
  if (path === "/api/issues" && req.method === "GET") {
    const files = await listIssueFiles(ctx.storeDir);
    const issues: Record<string, unknown>[] = files.map((f) => ({
      ...f.record.frontmatter,
      body: f.record.body,
      idLabel: formatId(f.record.frontmatter.id as number, ctx.config),
    }));
    issues.sort((a, b) => (a.id as number) - (b.id as number));
    return jsonResponse({ issues });
  }

  // POST /api/issues — 作成
  if (path === "/api/issues" && req.method === "POST") {
    const body = (await req.json()) as {
      title?: string;
      description?: string;
      tags?: string[];
    };
    if (!body.title) return jsonResponse({ error: "title は必須です" }, 400);
    const { id } = await createIssue(ctx.storeDir, ctx.config, {
      title: body.title,
      description: body.description,
      tags: body.tags,
    });
    return jsonResponse({ id, idLabel: formatId(id, ctx.config) }, 201);
  }

  // POST /api/issues/:id/edit — 編集 (status 等)
  const editMatch = path.match(/^\/api\/issues\/(\d+)\/edit$/);
  if (editMatch && req.method === "POST") {
    const id = parseInt(editMatch[1]!, 10);
    const body = (await req.json()) as {
      status?: string;
      description?: string;
      addTags?: string[];
      removeTags?: string[];
      comment?: string;
    };
    const found = await findIssue(ctx.storeDir, id);
    if (!found) return jsonResponse({ error: "issue が見つかりません" }, 404);
    await editIssue(ctx.storeDir, ctx.config, id, {
      status: body.status,
      description: body.description,
      addTags: body.addTags,
      removeTags: body.removeTags,
      comment: body.comment,
    });
    return jsonResponse({ ok: true, id });
  }

  // POST /api/issues/:id/claim — クレーム
  const claimMatch = path.match(/^\/api\/issues\/(\d+)\/claim$/);
  if (claimMatch && req.method === "POST") {
    const id = parseInt(claimMatch[1]!, 10);
    const body = (await req.json().catch(() => ({}))) as { as?: string };
    try {
      await claimIssue(ctx.storeDir, ctx.config, id, { as: body.as });
      return jsonResponse({ ok: true, id });
    } catch (err) {
      return jsonResponse({ error: (err as Error).message }, 409);
    }
  }

  return jsonResponse({ error: "Not Found" }, 404);
}
