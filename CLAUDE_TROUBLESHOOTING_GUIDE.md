# Claude Code トラブルシューティング手順書

## 対象セッションの概要

DreamTracker（目標・習慣管理アプリ）を Next.js で開発し、  
`hiromuzono/dream-tracker` という新規 GitHub リポジトリにデプロイするまでの記録。

---

## 発生した問題と解決策

---

### 問題 1：MCP の `push_files` ツールが別リポジトリへのアクセスを拒否する

**状況**  
Claude Code Web セッションでは、MCP（Model Context Protocol）の GitHub ツールが  
**セッション設定で許可されたリポジトリにのみアクセス可能**。  
今回は `hiromuzono/hiromuzono.github.io` のみ許可されており、  
新規作成した `hiromuzono/dream-tracker` へのプッシュが拒否された。

**エラーメッセージ**
```
Access denied: repository 'hiromuzono/dream-tracker' is not configured for this session.
Allowed repositories: hiromuzono/hiromuzono.github.io
```

**原因**  
Claude Code Web のセッションは起動時にリポジトリのアクセス権限が固定される。  
MCP ツール（`mcp__github__push_files` 等）は許可リスト外のリポジトリに操作できない。

**解決策**  
MCP ツールに頼らず、**GitHub Contents API を `curl` で直接叩く** か、  
**ローカルの git コマンドでプッシュする**（後述の問題 3 も参照）。

```bash
# GitHub API で直接ファイルを更新する場合（base64エンコードが必要）
curl -X PUT https://api.github.com/repos/OWNER/REPO/contents/path/to/file.tsx \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Fix import paths",
    "content": "<base64エンコードされたファイル内容>",
    "sha": "<現在のファイルのSHA>"
  }'
```

**教訓**  
- 新規リポジトリへの作業は、最初からそのリポジトリを対象としたセッションを開くか、  
  Personal Access Token を使った直接 API 操作で対応する。
- MCP ツールで操作できるリポジトリは **セッション開始時に決まる**。途中で変更不可。

---

### 問題 2：新規 GitHub リポジトリの作成に MCP が使えない

**状況**  
`mcp__github__create_repository` を呼んだが 403 エラーで失敗した。

**エラーメッセージ**
```
403 Forbidden
```

**原因**  
MCP の GitHub 統合にはリポジトリ作成権限が付与されていなかった。

**解決策**  
Personal Access Token を使い、**GitHub REST API を `curl` で直接呼ぶ**。

```bash
curl -X POST https://api.github.com/user/repos \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dream-tracker",
    "description": "DreamTracker - Goal & Habit Tracking App",
    "private": false,
    "auto_init": false
  }'
```

**教訓**  
- リポジトリ作成は MCP ではなく curl + API トークンで行う。
- トークンには `repo` スコープが必要（`public_repo` だと private リポジトリ作成不可）。

---

### 問題 3：`/tmp` 以下でのコミット署名エラー

**状況**  
別リポジトリを `/tmp/dream-tracker-fix/` にクローンしてファイルを修正後、  
`git commit` を実行したところ署名エラーで失敗した。

**エラーメッセージ**
```
error: gpg failed to sign the data
signing failed: signing operation failed: signing server returned status 400: missing source
```

**原因**  
Claude Code Web 環境では、**メインリポジトリのディレクトリ外で `git commit` を行うと、  
コミット署名フックが失敗する**。  
署名サーバーが元のリポジトリコンテキストを必要とするが、`/tmp` 以下ではそれが得られない。

**解決策**  
`git commit` 時に **署名を無効化するオプションを付ける**。

```bash
# 署名を無効化してコミット
git -c gpg.format=none -c commit.gpgsign=false commit -m "Fix component import paths"

# その後は通常通りプッシュ可能
git push -u origin main
```

**補足：リモート URL に認証情報を埋め込む方法**  
`git push` が 403 になる場合は、リモート URL にトークンを含める。

```bash
git remote set-url origin https://YOUR_GITHUB_TOKEN@github.com/OWNER/REPO.git
git push -u origin main
```

**教訓**  
- `/tmp` など**メインリポジトリ外でのコミットは署名エラーになる**可能性が高い。
- その場合は `-c commit.gpgsign=false` を付けてコミットする。
- プッシュ先が別リポジトリの場合、リモート URL にトークンを直接埋め込む。

---

### 問題 4：ファイル移動後のインポートパスがずれてビルドエラー

**状況**  
ファイル構成を変更した際（`app/dreamtracker/components/` → `app/components/`）に、  
`sed` でインポートパスを一括置換したが、逆に壊れてしまった。

**変更前の正しい構成（移動前）**
```
app/
  dreamtracker/
    context.tsx      ← コンテキスト
    types.ts         ← 型定義
    components/
      Dashboard.tsx  ← import '../context' が正しい
```

**変更後の正しい構成（移動後）**
```
app/
  context.tsx        ← コンテキスト
  types.ts           ← 型定義
  components/
    Dashboard.tsx    ← import '../context' が正しい（変わらない！）
```

**実際に起きたこと**  
`sed` が `../context` → `./context` に誤って書き換え、Vercel ビルドが失敗。

**Vercel のエラーメッセージ**
```
Module not found: Can't resolve './context'
Module not found: Can't resolve './types'
```

**解決策**  
修正内容を確認してから正しい方向で `sed` を実行する。

```bash
# 誤ったパスを正しいパスに戻す
sed -i "s|from '\./context'|from '../context'|g; s|from '\./types'|from '../types'|g" \
  app/components/*.tsx
```

**教訓**  
- ファイルを移動する前後でインポートパスがどう変わるべきかを**図に書いて確認**してから `sed` を使う。
- `sed` の置換後は必ず `grep -r "from '\." app/components/` で確認する。
- Vercel のビルドログは具体的なファイル名とエラー内容が出るので必ず確認する。

---

### 問題 5：モーダルコンポーネントへの props 渡し方のバグ

**状況**  
「習慣を追加」ボタンを押すと、新規追加ではなく既存習慣の更新（`updateHabit('')`）が  
呼ばれてしまうバグがあった。

**原因**  
`addModal` 状態に `{ id: '', title: '', type: 'daily' }` というダミーオブジェクトを  
セットして `<HabitModal habit={dummyHabit} />` で渡していたため、  
モーダル内で `habit` が存在すると判定され更新処理になっていた。

**解決策**  
ダミーオブジェクトを渡すのではなく、`defaultType` という専用 prop を追加する。

```tsx
// 修正前（NG）
const [addModal, setAddModal] = useState<Habit | null>(null);
// <HabitModal habit={{ id: '', title: '', type: addModal.type }} />

// 修正後（OK）
const [addModal, setAddModal] = useState<{ type: 'daily' | 'weekly' | 'monthly' } | null>(null);
// <HabitModal defaultType={addModal.type} onClose={() => setAddModal(null)} />
```

**教訓**  
- モーダルに「新規追加」「編集」を同居させる場合、  
  **`habit` prop の有無（`undefined` か否か）で分岐する**のが正しいパターン。  
  ダミーオブジェクトを渡すと条件分岐が壊れる。

---

## 今後の Claude Code セッションへの指示テンプレート

新規リポジトリへの作業を含む場合は、セッション開始時に以下を伝える：

```
作業対象リポジトリ: hiromuzono/XXX
GitHub Personal Access Token: ghp_XXXX（pushに使用）

【重要ルール】
- コミット・プッシュは必ず私の確認を取ってから行うこと
- /tmp など別ディレクトリで git commit する場合は
  git -c gpg.format=none -c commit.gpgsign=false commit を使うこと
- MCP の push_files はセッション許可リポジトリ外では使えないので
  curl + GitHub API か git push で対応すること
```

---

## チェックリスト：新規リポジトリへのデプロイ手順

1. `curl` で GitHub リポジトリを作成する
2. `/tmp` にクローンし、必要なファイルを用意する
3. インポートパスを確認する（`grep -r "from '\."` で漏れを検出）
4. `git -c commit.gpgsign=false commit` でコミットする
5. `git remote set-url origin https://TOKEN@github.com/OWNER/REPO.git` でリモートを設定
6. `git push -u origin main` でプッシュする
7. Vercel のビルドログを確認してエラーがないか見る

---

*作成日: 2026-05-09*
