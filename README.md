# 🚃 電車クイズ

電車の写真を見て4択で車両名を当てる鉄道クイズアプリです。学習モードでは写真と名前をフリップカードで確認できます。

🌐 **[アプリを開く](https://oharato.github.io/train-quiz/)**

---

## 機能

### クイズモード
- 電車の写真を見て4択で車両名を当てる
- 新幹線・JR在来線・私鉄・地下鉄からカテゴリを選択
- 出題数を選択（5・10・15・20問）
- キーボード操作対応（1〜4キーで選択、Enter で決定）
- タイマー・スコア表示

### 学習モード
- **写真 → 名前**：写真を見て車両名を確認（フリップで答え表示）
- **名前 → 写真**：車両名を見て写真を確認（フリップで写真表示）
- カテゴリ絞り込み
- サムネイルグリッドでジャンプ
- キーボード操作（← → で移動、スペースでめくる）

---

## 開発

### 技術スタック

| 技術 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | UIフレームワーク |
| [TypeScript](https://www.typescriptlang.org/) | 型安全な開発 |
| [Pinia](https://pinia.vuejs.org/) | 状態管理 |
| [Vue Router](https://router.vuejs.org/) | ルーティング |
| [Tailwind CSS v4](https://tailwindcss.com/) | スタイリング |
| [VitePlus](https://viteplus.dev/) | ビルド・Lint・フォーマット |

### セットアップ

```bash
pnpm install
pnpm dev
```

### ビルド

```bash
pnpm build
```

### 電車データの取得・更新

Wikipedia から電車の写真・名前・情報を自動取得してデータを更新できます。

```bash
# 全カテゴリから取得して上書き
pnpm fetch-trains

# 既存データに新規車両を追記
pnpm fetch-trains --merge

# 取得内容を確認のみ（ファイル更新なし）
pnpm fetch-trains --dry-run

# カテゴリを絞り込んで取得
pnpm fetch-trains --category 東日本旅客鉄道の電車
```

**対応カテゴリ（Wikipedia）：**
- 新幹線: 東海・東日本・西日本・九州旅客鉄道の新幹線電車
- JR在来線: 東日本・西日本・東海・九州・北海道旅客鉄道の電車/気動車
- 私鉄: 東急・東武・西武・京急・小田急・阪急・近鉄・南海電鉄の電車
- 地下鉄: 東京メトロ・大阪メトロ・福岡市・札幌市交通局の電車

---

## データについて

画像は [Wikipedia Commons](https://commons.wikimedia.org/) のライセンスに従います。

