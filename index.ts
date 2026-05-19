#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Database from "better-sqlite3";
import * as path from "path";
import * as os from "os";

const DB_PATH = path.join(
  os.homedir(),
  "Library/Containers/app.kosshi/Data/Library/Application Support/Kosshi/Kosshi.sqlite"
);

interface OutlineRow {
  id: string;
  content: string;
  sortKey: string;
  parentID: string | null;
  collapsed: number;
  prose: number;
  completed: number;
  bookmarked: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface OutlineNode extends OutlineRow {
  children: OutlineNode[];
}

function getDb(): Database.Database {
  return new Database(DB_PATH, { readonly: true });
}

function buildTree(rows: OutlineRow[], parentID: string | null = null): OutlineNode[] {
  return rows
    .filter((r) => r.parentID === parentID)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((r) => ({
      ...r,
      children: buildTree(rows, r.id),
    }));
}

function nodeToText(node: OutlineNode, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  const completed = node.completed ? "[x] " : "";
  const bookmarked = node.bookmarked ? "★ " : "";
  const line = `${indent}${completed}${bookmarked}${node.content}`;
  const children = node.children.map((c) => nodeToText(c, depth + 1)).join("\n");
  return children ? `${line}\n${children}` : line;
}

const server = new Server(
  { name: "kosshi-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_outline",
      description: "Kosshi のアウトライン全体をツリー形式で取得する",
      inputSchema: {
        type: "object",
        properties: {
          rootId: {
            type: "string",
            description: "取得起点の行ID（省略時はルート全体）",
          },
        },
      },
    },
    {
      name: "get_children",
      description: "指定した行IDの直下の子行を取得する",
      inputSchema: {
        type: "object",
        properties: {
          parentId: {
            type: "string",
            description: "親行のID",
          },
        },
        required: ["parentId"],
      },
    },
    {
      name: "search",
      description: "content をキーワードで全文検索する",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "検索キーワード",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_bookmarked",
      description: "ブックマーク済みの行を一覧取得する",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_incomplete",
      description: "未完了の行を一覧取得する",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const db = getDb();

  try {
    if (name === "get_outline") {
      const all = db.prepare("SELECT * FROM outlineRow ORDER BY sortKey").all() as OutlineRow[];
      const rootId = (args as { rootId?: string })?.rootId ?? null;

      let tree: OutlineNode[];
      if (rootId) {
        const root = all.find((r) => r.id === rootId);
        if (!root) {
          return { content: [{ type: "text", text: `ID ${rootId} が見つからなかった。` }] };
        }
        tree = [{ ...root, children: buildTree(all, rootId) }];
      } else {
        tree = buildTree(all, null);
      }

      const text = tree.map((n) => nodeToText(n)).join("\n");
      return { content: [{ type: "text", text: text || "データが存在しない。" }] };
    }

    if (name === "get_children") {
      const { parentId } = args as { parentId: string };
      const rows = db
        .prepare("SELECT * FROM outlineRow WHERE parentID = ? ORDER BY sortKey")
        .all(parentId) as OutlineRow[];
      if (rows.length === 0) {
        return { content: [{ type: "text", text: "子行が存在しない。" }] };
      }
      const text = rows.map((r) => `[${r.id}] ${r.content}`).join("\n");
      return { content: [{ type: "text", text }] };
    }

    if (name === "search") {
      const { query } = args as { query: string };
      const rows = db
        .prepare("SELECT * FROM outlineRow WHERE content LIKE ? ORDER BY updatedAt DESC")
        .all(`%${query}%`) as OutlineRow[];
      if (rows.length === 0) {
        return { content: [{ type: "text", text: `「${query}」に一致する行が存在しない。` }] };
      }
      const text = rows
        .map((r) => {
          const flags = [r.completed ? "完了" : "", r.bookmarked ? "★" : ""].filter(Boolean).join(" ");
          return `[${r.id}] ${r.content}${flags ? ` (${flags})` : ""}`;
        })
        .join("\n");
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_bookmarked") {
      const rows = db
        .prepare("SELECT * FROM outlineRow WHERE bookmarked = 1 ORDER BY updatedAt DESC")
        .all() as OutlineRow[];
      if (rows.length === 0) {
        return { content: [{ type: "text", text: "ブックマーク済みの行が存在しない。" }] };
      }
      const text = rows.map((r) => `[${r.id}] ${r.content}`).join("\n");
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_incomplete") {
      const rows = db
        .prepare("SELECT * FROM outlineRow WHERE completed = 0 ORDER BY updatedAt DESC")
        .all() as OutlineRow[];
      if (rows.length === 0) {
        return { content: [{ type: "text", text: "未完了の行が存在しない。" }] };
      }
      const text = rows.map((r) => `[${r.id}] ${r.content}`).join("\n");
      return { content: [{ type: "text", text }] };
    }

    return { content: [{ type: "text", text: `未知のツール: ${name}` }] };
  } finally {
    db.close();
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kosshi MCP server started.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
