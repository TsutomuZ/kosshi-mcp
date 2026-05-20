# kosshi-mcp

> **免責事項 / Disclaimer**
>
> これは非公式の個人プロジェクトです。[Kosshi](https://kosshi.app) の開発元（しろくまMAKE）は、本ツールの動作保証・サポートを一切行いません。
> Kosshi の内部 SQLite スキーマは公開 API ではないため、Kosshi のアップデートにより予告なく変更される可能性があります。その場合、本 MCP サーバーが動作しなくなる可能性があります。
>
> This is an unofficial personal project. The developer of [Kosshi](https://kosshi.app) (しろくまMAKE) provides no warranty or support for this tool.
> Kosshi's internal SQLite schema is not a public API and may change without notice in future updates, which may cause this MCP server to stop working.

Kosshi のアウトラインデータを読み取る MCP（Model Context Protocol）サーバーです。Claude Desktop から Kosshi のデータを参照できるようになります。読み取り専用です。

An MCP (Model Context Protocol) server that reads outline data from [Kosshi](https://kosshi.app). It allows Claude Desktop to access your Kosshi data. Read-only.

## 提供ツール / Tools

| ツール名 / Tool | 説明 / Description |
|---|---|
| `get_outline` | アウトライン全体をツリー形式で取得する / Retrieve the entire outline as a tree |
| `get_children` | 指定 ID の子行を取得する / Retrieve child rows of a given ID |
| `search` | キーワードで全文検索する / Full-text search by keyword |
| `get_bookmarked` | ブックマーク済み行を一覧取得する / List all bookmarked rows |
| `get_incomplete` | 未完了行を一覧取得する / List all incomplete rows |

## 必要環境 / Requirements

- macOS
- [Kosshi](https://kosshi.app) がインストール済みであること / Kosshi must be installed
- Node.js
- Claude Desktop

## セットアップ / Setup

### 1. リポジトリをクローンする / Clone the repository

```bash
git clone https://github.com/TsutomuZ/kosshi-mcp.git
cd kosshi-mcp/kosshi-mcp
```

### 2. 依存パッケージをインストールしてビルドする / Install dependencies and build

```bash
npm install
npm run build
```

### 3. Claude Desktop の設定に追加する / Add to Claude Desktop config

`~/Library/Application Support/Claude/claude_desktop_config.json` の `mcpServers` に以下を追加する。パスは実際のクローン先に合わせて変更すること。

Add the following to the `mcpServers` section of `~/Library/Application Support/Claude/claude_desktop_config.json`. Adjust the path to match your actual clone location.

```json
{
  "mcpServers": {
    "kosshi": {
      "command": "node",
      "args": ["/Users/<your-username>/Documents/GitHub/kosshi-MCP/kosshi-mcp/dist/index.js"]
    }
  }
}
```

### 4. Claude Desktop を再起動する / Restart Claude Desktop

## データベースパス / Database Path

本サーバーは以下のパスにある Kosshi の SQLite データベースを読み取ります。

This server reads the Kosshi SQLite database located at:

```
~/Library/Containers/app.kosshi/Data/Library/Application Support/Kosshi/Kosshi.sqlite
```

## Credits

Built with the assistance of [Claude](https://claude.ai) (Anthropic).
