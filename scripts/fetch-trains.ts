/**
 * fetch-trains.ts
 *
 * 日本語 Wikipedia から電車の写真・名前・情報を取得して
 * public/trains.json を更新するスクリプト。
 *
 * 使い方:
 *   pnpm fetch-trains [--category <カテゴリ名>] [--merge] [--dry-run]
 *
 * 例:
 *   pnpm fetch-trains                        # デフォルトカテゴリから全取得
 *   pnpm fetch-trains --merge                # 既存データに追記（上書きしない）
 *   pnpm fetch-trains --dry-run              # trains.json を更新せずコンソール出力のみ
 *   pnpm fetch-trains --category JR東日本の電車  # 指定カテゴリのみ
 */

import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../public/trains.json');
const API = 'https://ja.wikipedia.org/w/api.php';
const UA = 'train-quiz-fetcher/1.0 (https://github.com/; fetch-trains.ts)';
const DELAY_MS = 300;

// ─── 引数パース ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isMerge = args.includes('--merge');
const catIdx = args.indexOf('--category');
const onlyCategory = catIdx !== -1 ? args[catIdx + 1] : null;

// ─── 型定義 ────────────────────────────────────────────────────────────────────
interface Train {
  id: string;
  name: string;
  nickname: string;
  operator: string;
  line: string;
  category: '新幹線' | 'JR在来線' | '私鉄' | '地下鉄';
  image_url: string;
}

// ─── 取得対象カテゴリ ──────────────────────────────────────────────────────────
// カテゴリ名 → 電車カテゴリ（アプリ内分類）のマッピング
const CATEGORIES: { wikiCategory: string; appCategory: Train['category'] }[] = [
  { wikiCategory: '東海旅客鉄道の新幹線電車',   appCategory: '新幹線' },
  { wikiCategory: '東日本旅客鉄道の新幹線電車', appCategory: '新幹線' },
  { wikiCategory: '西日本旅客鉄道の新幹線電車', appCategory: '新幹線' },
  { wikiCategory: '九州旅客鉄道の新幹線電車',   appCategory: '新幹線' },
  { wikiCategory: '東日本旅客鉄道の電車',       appCategory: 'JR在来線' },
  { wikiCategory: '西日本旅客鉄道の電車',       appCategory: 'JR在来線' },
  { wikiCategory: '東海旅客鉄道の電車',         appCategory: 'JR在来線' },
  { wikiCategory: '九州旅客鉄道の電車',         appCategory: 'JR在来線' },
  { wikiCategory: '北海道旅客鉄道の気動車',     appCategory: 'JR在来線' },
  { wikiCategory: '東急電鉄の電車',             appCategory: '私鉄' },
  { wikiCategory: '東武鉄道の電車',             appCategory: '私鉄' },
  { wikiCategory: '西武鉄道の電車',             appCategory: '私鉄' },
  { wikiCategory: '京浜急行電鉄の電車',         appCategory: '私鉄' },
  { wikiCategory: '小田急電鉄の電車',           appCategory: '私鉄' },
  { wikiCategory: '阪急電鉄の電車',             appCategory: '私鉄' },
  { wikiCategory: '近畿日本鉄道の電車',         appCategory: '私鉄' },
  { wikiCategory: '南海電気鉄道の電車',         appCategory: '私鉄' },
  { wikiCategory: '東京地下鉄の電車',           appCategory: '地下鉄' },
  { wikiCategory: '大阪市高速電気軌道の電車',   appCategory: '地下鉄' },
  { wikiCategory: '福岡市交通局の電車',         appCategory: '地下鉄' },
  { wikiCategory: '札幌市交通局の鉄道車両',     appCategory: '地下鉄' },
];

// ─── ユーティリティ ────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wikiGet(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API);
  url.search = new URLSearchParams({ ...params, format: 'json' }).toString();
  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// ─── カテゴリメンバー取得 ──────────────────────────────────────────────────────
async function fetchCategoryMembers(category: string): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;

  do {
    const params: Record<string, string> = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: `カテゴリ:${category}`,
      cmtype: 'page',
      cmlimit: '500',
    };
    if (cmcontinue) params['cmcontinue'] = cmcontinue;

    const data = (await wikiGet(params)) as {
      query: { categorymembers: { title: string }[] };
      continue?: { cmcontinue: string };
    };

    for (const m of data.query.categorymembers) {
      // 記事名に「系」「形」「型」が含まれる電車記事に絞る
      if (/[系形型]/.test(m.title)) {
        titles.push(m.title);
      }
    }
    cmcontinue = data.continue?.cmcontinue;
    await sleep(DELAY_MS);
  } while (cmcontinue);

  return titles;
}

// ─── wikitext から infobox フィールド抽出 ──────────────────────────────────────
function extractInfoboxField(wikitext: string, ...fields: string[]): string {
  for (const field of fields) {
    const re = new RegExp(
      `\\|\\s*${field}\\s*=\\s*(?:(?:\\[\\[)?(?:File:|ファイル:|Image:))?([^|\\]\\n\\[<>{}]+\\.(?:jpg|jpeg|png))`,
      'i',
    );
    const m = wikitext.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function extractTextField(wikitext: string, ...fields: string[]): string {
  for (const field of fields) {
    const re = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\n|][^\\n]*)`);
    const m = wikitext.match(re);
    if (m) {
      let val = m[1];

      // {{Plainlist| ... }} や {{plainlist| ... }} を展開して最初の項目を取得
      val = val.replace(/\{\{[Pp]lainlist\s*\|([\s\S]*?)\}\}/g, (_, inner) => {
        const first = inner.split(/\n\*\s*/).find((s: string) => s.trim());
        return first?.trim() ?? '';
      });
      // {{unbulleted list|a|b}} 系も最初の値を取る
      val = val.replace(/\{\{[^|{}]+\|([^|}]+)(?:\|[^}]*)?\}\}/g, '$1');

      return val
        .split(/<br\s*\/?>/i)[0]                              // <br> 以降を除去
        .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')    // [[表示名]] → 表示名
        .replace(/\{\{[^}]*\}\}/g, '')                        // 残ったテンプレートを削除
        .replace(/<[^>]+>/g, '')
        .replace(/'{2,3}/g, '')
        .trim();
    }
  }
  return '';
}

// ─── wikitext から愛称（通称名）を抽出 ────────────────────────────────────────
function extractNickname(wikitext: string): string {
  // パターン1: 愛称は'''名前''' / 愛称：'''名前'''
  const p1 = wikitext.match(/愛称[はが：:は]*[『「]?'''([^'\n]{2,20})'''/);
  if (p1) return p1[1].trim();
  // パターン2: 愛称は「名前」「名前2」（最初の1つ）
  const p2 = wikitext.match(/愛称[はが：: ]*[「『]([^」』\n]{2,20})[」』]/);
  if (p2) return p2[1].trim();
  // パターン3: 特急「名前」（冒頭800文字内）
  const intro = wikitext.slice(0, 800);
  const p3 = intro.match(/特(?:急|別急行)[「『]([ァ-ヶー\w ]{2,15})[」』]/);
  if (p3) return p3[1].trim();
  // パターン4: 列車名「名前」
  const p4 = intro.match(/列車名[「『]([^」』\n]{2,15})[」』]/);
  if (p4) return p4[1].trim();
  return '';
}


async function fetchWikitexts(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const BATCH = 20;

  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const data = (await wikiGet({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: batch.join('|'),
    })) as {
      query: {
        pages: Record<
          string,
          { title: string; revisions?: [{ slots: { main: { '*': string } } }] }
        >;
      };
    };

    for (const page of Object.values(data.query.pages)) {
      const wt = page.revisions?.[0]?.slots?.main?.['*'] ?? '';
      if (wt) result.set(page.title, wt);
    }
    process.stdout.write(`  wikitext: ${Math.min(i + BATCH, titles.length)}/${titles.length}\r`);
    await sleep(DELAY_MS);
  }
  console.log();
  return result;
}

// ─── ファイル名から画像URL取得 ─────────────────────────────────────────────────
async function fetchImageUrls(
  filenames: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = [...new Set(filenames.filter(Boolean))];
  const BATCH = 20;

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH).map((f) => `File:${f}`);
    const data = (await wikiGet({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '960',
      titles: batch.join('|'),
    })) as {
      query: {
        pages: Record<
          string,
          { title: string; imageinfo?: [{ thumburl?: string; url?: string }] }
        >;
      };
    };

    for (const page of Object.values(data.query.pages)) {
      // APIは "ファイル:" または "File:" を返す
      const filename = page.title.replace(/^(?:File:|ファイル:)/i, '');
      const ii = page.imageinfo?.[0];
      if (ii) result.set(filename, ii.thumburl ?? ii.url ?? '');
    }
    process.stdout.write(`  imageinfo: ${Math.min(i + BATCH, unique.length)}/${unique.length}\r`);
    await sleep(DELAY_MS);
  }
  console.log();
  return result;
}

// ─── タイトルから ID 生成 ──────────────────────────────────────────────────────
function titleToId(title: string): string {
  // 英数字・ハイフン以外を除去してIDを生成。先頭が数字になる場合はプレフィックスを付ける
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  return /^\d/.test(base) ? `train-${base}` : base;
}

// ─── メイン処理 ────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚃 電車データ取得スクリプト\n');

  // 対象カテゴリを絞り込み
  const targets = onlyCategory
    ? CATEGORIES.filter((c) => c.wikiCategory.includes(onlyCategory))
    : CATEGORIES;

  if (targets.length === 0) {
    console.error(`❌ カテゴリ "${onlyCategory}" が見つかりません`);
    process.exit(1);
  }

  // ── Step 1: カテゴリメンバー収集 ──
  console.log('📂 カテゴリメンバーを取得中...');
  const categoryMap = new Map<string, Train['category']>();

  for (const { wikiCategory, appCategory } of targets) {
    if (onlyCategory) console.log(`  → カテゴリ:${wikiCategory}`);
    const members = await fetchCategoryMembers(wikiCategory);
    for (const title of members) {
      if (!categoryMap.has(title)) categoryMap.set(title, appCategory);
    }
    process.stdout.write(`  収集: ${categoryMap.size} 件\r`);
  }
  console.log(`\n✅ 候補記事: ${categoryMap.size} 件\n`);

  const allTitles = [...categoryMap.keys()];

  // ── Step 2: wikitext 取得 ──
  console.log('📄 wikitext を取得中...');
  const wikitexts = await fetchWikitexts(allTitles);
  console.log(`✅ wikitext 取得: ${wikitexts.size} 件\n`);

  // ── Step 3: infobox パース & 画像ファイル名抽出 ──
  console.log('🔍 infobox を解析中...');
  const parsed: Array<{
    title: string;
    name: string;
    nickname: string;
    operator: string;
    line: string;
    imageFile: string;
    appCategory: Train['category'];
  }> = [];

  for (const [title, wt] of wikitexts) {
    const imageFile = extractInfoboxField(wt, '画像', 'image', '写真');
    if (!imageFile) continue; // 画像なしはスキップ

    // 名前: infoboxの車両名 → なければ記事タイトルをそのまま使用
    const name = extractTextField(wt, '車両名', '形式名', '名称') || title;
    // 愛称・通称
    const nickname = extractNickname(wt);
    // 運行者: 最初の1社のみ
    const operator = extractTextField(wt, '運用者', '事業者', '運行者');
    // 使用線区: フィールドがない記事も多いため空でも許容
    const line = extractTextField(wt, '使用線区', '運行路線', '路線');

    parsed.push({
      title,
      name: name || title,
      nickname,
      operator,
      line,
      imageFile,
      appCategory: categoryMap.get(title)!,
    });
  }
  console.log(`✅ 画像あり記事: ${parsed.length} 件\n`);

  // ── Step 4: 画像URL取得 ──
  console.log('🖼️  画像URLを取得中...');
  const imageUrls = await fetchImageUrls(parsed.map((p) => p.imageFile));
  console.log(`✅ 画像URL取得: ${imageUrls.size} 件\n`);

  // ── Step 5: Train オブジェクト組み立て ──
  const newTrains: Train[] = [];
  const skipped: string[] = [];

  for (const p of parsed) {
    const image_url = imageUrls.get(p.imageFile) ?? '';
    if (!image_url) {
      skipped.push(p.title);
      continue;
    }
    newTrains.push({
      id: titleToId(p.title),
      name: p.name,
      nickname: p.nickname,
      operator: p.operator || '不明',
      line: p.line || '不明',
      category: p.appCategory,
      image_url,
    });
  }

  console.log(`✅ 生成: ${newTrains.length} 件  スキップ: ${skipped.length} 件\n`);

  if (isDryRun) {
    console.log('--- DRY RUN (先頭10件) ---');
    console.log(JSON.stringify(newTrains.slice(0, 10), null, 2));
    return;
  }

  // ── Step 6: 既存データとマージ / 書き込み ──
  let finalTrains: Train[] = newTrains;

  if (isMerge && existsSync(OUTPUT_PATH)) {
    const existing: Train[] = JSON.parse(await readFile(OUTPUT_PATH, 'utf-8'));
    const existingIds = new Set(existing.map((t) => t.id));
    const added = newTrains.filter((t) => !existingIds.has(t.id));
    finalTrains = [...existing, ...added];
    console.log(`🔀 マージ: 既存 ${existing.length} 件 + 新規 ${added.length} 件 = ${finalTrains.length} 件`);
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(finalTrains, null, 2));
  console.log(`\n🎉 完了: ${OUTPUT_PATH} に ${finalTrains.length} 件書き込みました`);
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
