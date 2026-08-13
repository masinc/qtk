// qtk CLI エントリポイント (citty でサブコマンド振り分け)
import { defineCommand, runMain } from "citty";
import { initStore } from "./commands/init";
import { resolveContext } from "./commands/context";
import {
  createIssue,
  listIssues,
  showIssue,
  editIssue,
  archiveIssue,
  parseIssueId,
} from "./commands/issue";
import {
  newAdr,
  listAdrs,
  showAdr,
  editAdr,
  adrTags,
  validateAdrs,
  parseAdrId,
} from "./commands/adr";
import {
  createSpec,
  listSpecs,
  showSpec,
  updateSpec,
  parseSpecId,
} from "./commands/spec";
import {
  createPlan,
  listPlans,
  showPlan,
  editPlan,
  archivePlan,
  parsePlanId,
} from "./commands/plan";
import { listTags } from "./commands/tags";
import { search } from "./commands/search";

const issueCmd = defineCommand({
  meta: { name: "issue", description: "チケット管理" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "チケットを作成" },
      args: {
        title: { type: "positional", description: "タイトル", required: true },
        description: { alias: "d", type: "string", description: "説明" },
        ac: { type: "string", description: "受け入れ基準 (複数指定可)" },
        tag: { type: "string", description: "タグ (複数指定可)" },
        assignee: { type: "string", description: "担当者" },
        dep: { type: "string", description: "依存ID (複数指定可)" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const tags = args.tag ? [args.tag] : undefined;
        const deps = args.dep ? [parseIssueId(args.dep) ?? 0] : undefined;
        const { id } = await createIssue(ctx.storeDir, ctx.config, {
          title: args.title,
          description: args.description,
          acceptanceCriteria: args.ac ? [args.ac] : undefined,
          tags,
          assignees: args.assignee ? [args.assignee] : undefined,
          dependencies: deps,
        });
        console.log(`作成しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "チケット一覧" },
      args: {
        status: { alias: "s", type: "string", description: "ステータスでフィルタ" },
        assignee: { alias: "a", type: "string", description: "担当者でフィルタ" },
        tag: { type: "string", description: "タグでフィルタ" },
        ready: { type: "boolean", default: false, description: "実行可能なチケットのみ" },
        blocked: { type: "boolean", default: false, description: "ブロック中のチケットのみ" },
        search: { type: "string", description: "キーワード検索" },
        limit: { type: "string", description: "件数制限" },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        await listIssues(ctx.storeDir, ctx.config, {
          status: args.status,
          assignee: args.assignee,
          tag: args.tag,
          ready: args.ready,
          blocked: args.blocked,
          keyword: args.search,
          limit: args.limit ? parseInt(args.limit, 10) : undefined,
          json: args.json,
        });
      },
    }),
    show: defineCommand({
      meta: { name: "show", description: "チケット詳細" },
      args: {
        id: { type: "positional", description: "チケットID", required: true },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseIssueId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await showIssue(ctx.storeDir, ctx.config, id, { json: args.json });
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "チケット編集" },
      args: {
        id: { type: "positional", description: "チケットID", required: true },
        description: { alias: "d", type: "string", description: "説明" },
        ac: { type: "string", description: "受け入れ基準" },
        plan: { type: "string", description: "実装計画" },
        notes: { type: "string", description: "メモ" },
        comment: { type: "string", description: "コメント本文" },
        "comment-author": { type: "string", description: "コメント投稿者" },
        tag: { type: "string", description: "タグ (置き換え)" },
        "add-tag": { type: "string", description: "タグ追加" },
        "remove-tag": { type: "string", description: "タグ削除" },
        "clear-tags": { type: "boolean", default: false, description: "タグ全削除" },
        assignee: { type: "string", description: "担当者" },
        dep: { type: "string", description: "依存ID" },
        status: { type: "string", description: "ステータス" },
        "final-summary": { type: "string", description: "完了時サマリー" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseIssueId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await editIssue(ctx.storeDir, ctx.config, id, {
          description: args.description,
          acceptanceCriteria: args.ac ? [args.ac] : undefined,
          plan: args.plan,
          notes: args.notes,
          comment: args.comment,
          commentAuthor: args["comment-author"],
          tags: args.tag ? [args.tag] : undefined,
          addTags: args["add-tag"] ? [args["add-tag"]] : undefined,
          removeTags: args["remove-tag"] ? [args["remove-tag"]] : undefined,
          clearTags: args["clear-tags"],
          assignees: args.assignee ? [args.assignee] : undefined,
          dependencies: args.dep ? [parseIssueId(args.dep) ?? 0] : undefined,
          status: args.status,
          finalSummary: args["final-summary"],
        });
        console.log(`更新しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    archive: defineCommand({
      meta: { name: "archive", description: "チケットをアーカイブ" },
      args: {
        id: { type: "positional", description: "チケットID", required: true },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseIssueId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await archiveIssue(ctx.storeDir, ctx.config, id);
        console.log(`アーカイブしました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
  },
});

const adrCmd = defineCommand({
  meta: { name: "adr", description: "ADR 管理" },
  subCommands: {
    new: defineCommand({
      meta: { name: "new", description: "ADR を作成" },
      args: {
        title: { type: "positional", description: "タイトル", required: true },
        description: { alias: "d", type: "string", description: "要約" },
        tag: { type: "string", description: "タグ" },
        status: { type: "string", description: "ステータス" },
        supersedes: { type: "string", description: "置き換える旧 ADR ID" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const { id } = await newAdr(ctx.storeDir, ctx.config, {
          title: args.title,
          description: args.description,
          tags: args.tag ? [args.tag] : undefined,
          status: args.status,
          supersedes: args.supersedes ? parseAdrId(args.supersedes) : undefined,
        });
        console.log(`作成しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "ADR 一覧" },
      args: {
        tag: { type: "string", description: "タグでフィルタ" },
        status: { type: "string", description: "ステータスでフィルタ" },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        await listAdrs(ctx.storeDir, ctx.config, {
          tag: args.tag,
          status: args.status,
          json: args.json,
        });
      },
    }),
    show: defineCommand({
      meta: { name: "show", description: "ADR 詳細" },
      args: {
        id: { type: "positional", description: "ADR ID", required: true },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseAdrId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await showAdr(ctx.storeDir, ctx.config, id, { json: args.json });
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "ADR 編集" },
      args: {
        id: { type: "positional", description: "ADR ID", required: true },
        status: { type: "string", description: "ステータス" },
        tag: { type: "string", description: "タグ (置き換え)" },
        "add-tag": { type: "string", description: "タグ追加" },
        "remove-tag": { type: "string", description: "タグ削除" },
        supersedes: { type: "string", description: "置き換える旧 ADR ID" },
        "superseded-by": { type: "string", description: "置き換える新 ADR ID" },
        title: { type: "string", description: "タイトル" },
        description: { type: "string", description: "要約" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseAdrId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await editAdr(ctx.storeDir, ctx.config, id, {
          status: args.status,
          tags: args.tag ? [args.tag] : undefined,
          addTags: args["add-tag"] ? [args["add-tag"]] : undefined,
          removeTags: args["remove-tag"] ? [args["remove-tag"]] : undefined,
          supersedes: args.supersedes ? parseAdrId(args.supersedes) : undefined,
          supersededBy: args["superseded-by"] ? parseAdrId(args["superseded-by"]) : undefined,
          title: args.title,
          description: args.description,
        });
        console.log(`更新しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    tags: defineCommand({
      meta: { name: "tags", description: "タグ一覧" },
      args: {
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        await adrTags(ctx.storeDir, args.json);
      },
    }),
    validate: defineCommand({
      meta: { name: "validate", description: "ADR バリデーション" },
      args: {
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const issues = await validateAdrs(ctx.storeDir);
        if (issues.length === 0) {
          console.log("全ての ADR は有効です");
        } else {
          for (const issue of issues) {
            console.log(`#${String(issue.id).padStart(ctx.config.idDigits, "0")} ${issue.field}: ${issue.message}`);
          }
          process.exitCode = 1;
        }
      },
    }),
  },
});

const specCmd = defineCommand({
  meta: { name: "spec", description: "仕様管理" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "仕様を作成" },
      args: {
        title: { type: "positional", description: "タイトル", required: true },
        type: { type: "string", description: "種別 (specification/readme/guide/other)" },
        description: { alias: "d", type: "string", description: "説明" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const { id } = await createSpec(ctx.storeDir, ctx.config, {
          title: args.title,
          specType: args.type,
          description: args.description,
        });
        console.log(`作成しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "仕様一覧" },
      args: {
        type: { type: "string", description: "種別でフィルタ" },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        await listSpecs(ctx.storeDir, ctx.config, {
          specType: args.type,
          json: args.json,
        });
      },
    }),
    show: defineCommand({
      meta: { name: "show", description: "仕様詳細" },
      args: {
        id: { type: "positional", description: "仕様 ID", required: true },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseSpecId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await showSpec(ctx.storeDir, ctx.config, id, { json: args.json });
      },
    }),
    update: defineCommand({
      meta: { name: "update", description: "仕様の本文を更新" },
      args: {
        id: { type: "positional", description: "仕様 ID", required: true },
        content: { type: "string", description: "本文" },
        plain: { type: "boolean", default: false, description: "そのまま本文設定" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parseSpecId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await updateSpec(ctx.storeDir, ctx.config, id, {
          content: args.content,
          plain: args.plain,
        });
        console.log(`更新しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
  },
});

const planCmd = defineCommand({
  meta: { name: "plan", description: "計画管理" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "計画を作成" },
      args: {
        title: { type: "positional", description: "タイトル", required: true },
        description: { alias: "d", type: "string", description: "要約" },
        "related-issue": { type: "string", description: "関連 issue ID" },
        "related-adr": { type: "string", description: "関連 ADR ID" },
        "generated-by": { type: "string", description: "生成エージェント名" },
        status: { type: "string", description: "ステータス" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const { id } = await createPlan(ctx.storeDir, ctx.config, {
          title: args.title,
          description: args.description,
          relatedIssues: args["related-issue"] ? [parsePlanId(args["related-issue"]) ?? 0] : undefined,
          relatedAdrs: args["related-adr"] ? [parsePlanId(args["related-adr"]) ?? 0] : undefined,
          generatedBy: args["generated-by"],
          status: args.status,
        });
        console.log(`作成しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "計画一覧" },
      args: {
        status: { type: "string", description: "ステータスでフィルタ" },
        "related-issue": { type: "string", description: "関連 issue でフィルタ" },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        await listPlans(ctx.storeDir, ctx.config, {
          status: args.status,
          relatedIssue: args["related-issue"] ? parsePlanId(args["related-issue"]) ?? undefined : undefined,
          json: args.json,
        });
      },
    }),
    show: defineCommand({
      meta: { name: "show", description: "計画詳細" },
      args: {
        id: { type: "positional", description: "計画 ID", required: true },
        json: { type: "boolean", default: false, description: "JSON 出力" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parsePlanId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await showPlan(ctx.storeDir, ctx.config, id, { json: args.json });
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "計画編集" },
      args: {
        id: { type: "positional", description: "計画 ID", required: true },
        status: { type: "string", description: "ステータス" },
        "related-issue": { type: "string", description: "関連 issue ID" },
        "related-adr": { type: "string", description: "関連 ADR ID" },
        supersedes: { type: "string", description: "置き換える旧計画 ID" },
        title: { type: "string", description: "タイトル" },
        description: { type: "string", description: "要約" },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parsePlanId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await editPlan(ctx.storeDir, ctx.config, id, {
          status: args.status,
          relatedIssues: args["related-issue"] ? [parsePlanId(args["related-issue"]) ?? 0] : undefined,
          relatedAdrs: args["related-adr"] ? [parsePlanId(args["related-adr"]) ?? 0] : undefined,
          supersedes: args.supersedes ? parsePlanId(args.supersedes) : undefined,
          title: args.title,
          description: args.description,
        });
        console.log(`更新しました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
    archive: defineCommand({
      meta: { name: "archive", description: "計画をアーカイブ" },
      args: {
        id: { type: "positional", description: "計画 ID", required: true },
        dir: { type: "string", description: "ストアディレクトリ" },
      },
      async run({ args }) {
        const ctx = await resolveContext(args.dir);
        const id = parsePlanId(args.id);
        if (id === null) throw new Error(`不正な ID: ${args.id}`);
        await archivePlan(ctx.storeDir, ctx.config, id);
        console.log(`アーカイブしました: #${String(id).padStart(ctx.config.idDigits, "0")}`);
      },
    }),
  },
});

const tagsCmd = defineCommand({
  meta: { name: "tags", description: "タグ一覧" },
  args: {
    json: { type: "boolean", default: false, description: "JSON 出力" },
    dir: { type: "string", description: "ストアディレクトリ" },
  },
  async run({ args }) {
    const ctx = await resolveContext(args.dir);
    await listTags(ctx.storeDir, args.json);
  },
});

const searchCmd = defineCommand({
  meta: { name: "search", description: "横断検索" },
  args: {
    keyword: { type: "positional", description: "検索キーワード", required: true },
    type: { type: "string", description: "種別 (issue/adr/spec/plan)" },
    status: { type: "string", description: "ステータスでフィルタ" },
    tag: { type: "string", description: "タグでフィルタ" },
    limit: { type: "string", description: "件数制限" },
    json: { type: "boolean", default: false, description: "JSON 出力" },
    dir: { type: "string", description: "ストアディレクトリ" },
  },
  async run({ args }) {
    const ctx = await resolveContext(args.dir);
    await search(ctx.storeDir, ctx.config, {
      keyword: args.keyword,
      type: args.type,
      status: args.status,
      tag: args.tag,
      limit: args.limit ? parseInt(args.limit, 10) : undefined,
      json: args.json,
    });
  },
});

const initCmd = defineCommand({
  meta: { name: "init", description: "ストアを初期化" },
  args: {
    defaults: { type: "boolean", default: false, description: "非対話実行" },
    dir: { type: "string", description: "ストアディレクトリ" },
  },
  async run({ args }) {
    const storeDir = await initStore({ dir: args.dir, defaults: args.defaults });
    console.log(`初期化しました: ${storeDir}`);
  },
});

export const main = defineCommand({
  meta: {
    name: "qtk",
    version: "0.1.0",
    description: "Local issue / ADR / spec / plan management CLI tool",
  },
  subCommands: {
    init: initCmd,
    issue: issueCmd,
    adr: adrCmd,
    spec: specCmd,
    plan: planCmd,
    tags: tagsCmd,
    search: searchCmd,
  },
});

runMain(main);
