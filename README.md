# kosshi-mcp

Kosshi アウトラインを読み取る MCP サーバー（読み取り専用）。

## セットアップ

### 1. リポジトリをローカルに配置する

```bash
cp -r <このディレクトリ> ~/Developer/kosshi-mcp
cd ~/Developer/kosshi-mcp
```

### 2. 依存パッケージをインストールしてビルドする

```bash
npm install
npm run build
```

### 3. Claude Desktop の設定に追加する

`~/Library/Application Support/Claude/claude_desktop_config.json` を編集する。

```json
{
  "mcpServers": {
    "kosshi": {
      "command": "node",
      "args": ["/Users/tsutomunuiidaiida/Developer/kosshi-mcp/dist/index.js"]
    }
  }
}
```

### 4. Claude Desktop を再起動する

## 提供ツール

| ツール名 | 説明 |
|---|---|
| `get_outline` | アウトライン全体をツリー形式で取得する |
| `get_children` | 指定IDの子行を取得する |
| `search` | キーワードで全文検索する |
| `get_bookmarked` | ブックマーク済み行を一覧取得する |
| `get_incomplete` | 未完了行を一覧取得する |

## データベースパス

```
~/Library/Containers/app.kosshi/Data/Library/Application Support/Kosshi/Kosshi.sqlite
```
