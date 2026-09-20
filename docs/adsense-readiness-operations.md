# 再審査前の運用と検証

## 公開する構成

- ツールは17本を維持。トップの重複一覧・擬似プレビューを用途別ディレクトリへ統合。
- `/blog/` のURLは維持し、表示名を「ガイド・記事」へ変更。
- `pdf-editor`, `heic-converter`, `audio-extractor`, `audio-loudness`, `ai-psd-exporter`, `token-counter` は元のURLと公開日を維持して大幅リライト。形式選択、仕様の限界、具体的な確認手順を追加。更新日を別途表示。
- `browser-local-processing` を新規追加。通信とファイル処理の違い、ローカル処理の適用範囲を説明。
- `first-post`, `background-remover`, `character-counter`, `frame-extractor`, `glow-frame`, `ipod-silhouette`, `mesh-gradient`, `slide-palette`, `sticker-bomb`, `stripe-generator`, `video-optimizer`, `video-trimmer` の12記事は公開履歴として保持し `noindex, follow`、sitemapから除外。削除・URLリダイレクトなし。短い機能紹介がツールページと重複し、独立した実用ガイドとして扱うには不足するため。noindexだけでサイト品質やAdSense承認を保証するものではない。必要性がある記事から今後内容を再評価する。

## 広告・解析の設定

- 既存のAdSense publisher IDとads.txtは維持。所有権確認に `google-adsense-account` metaを使用。
- `PUBLIC_ADSENSE_ENABLED=true` のときだけ本番のindex対象ページにAdSenseスクリプトを出す。未設定時は配信しない。広告枠は追加しない。
- 本番GAは従来の `PUBLIC_GA_MEASUREMENT_ID` に従う。任意のツールイベントは従来の `PUBLIC_GA_TOOL_EVENTS_ENABLED` に従う。
- Cloudflare標準の `CF_PAGES=1` かつ `CF_PAGES_BRANCH != main` ではPreviewとして全ページにnoindexを付け、当サイトのGA/広告を抑止する。公開canonicalは本番URLに固定する。
- 人間がAdSense画面で所有権確認方式・不承認理由を確認する。広告開始前に、必要な地域のGoogle認定CMP/同意メッセージとAuto adsの除外・配置を確認する。今回のmeta追加はAdSense設定の代行やCMP導入ではない。
- Preview URLそのものは審査対象にしない。人間のレビュー・merge・本番反映確認の後、`glowpunch.net` を再審査する。

## ローカル検証

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node scripts/check-deployment-builds.mjs
npx playwright install chromium
npm run test:e2e
```

`lint` は記事のmetadata、重複title、見出し、内部リンク、過剰な安全性表現を検査するコンテンツlint。TypeScript/Astroの検査は `typecheck`。既存の汎用ESLint設定はない。

ブラウザを既に用意している環境では `PLAYWRIGHT_CHROMIUM_EXECUTABLE` で指定できる。Cloudflareのデプロイ確認後は以下で同じテストをPreviewに対して実行する。

```sh
PREVIEW_URL=https://<deployment-id>.glowpunch.pages.dev npm run test:e2e
```

公開全43ページを390px/1280pxで表示し、h1、canonical、description、JSON-LD、内部リンク、横方向の崩れ、スクリプトエラーを確認。別途404、sitemap、robots、文字/トークン計測、PDF生成、画像書き出し、動画フレーム・音声抽出、キーボード操作を確認する。AIモデルの全画像での精度、大容量処理、Safari/iOS、全コーデックの互換性まではこの検証では保証しない。

## 人間が優先して確認すること

1. AdSenseの不承認通知全文を確認し、固有の指摘が今回の改善に含まれるか照合する。
2. Aboutの運営窓口表記と `contact@glowpunch.net` の受信・返信を実確認する。公開できる運営者名・プロフィールがあれば実在情報のみ補足する。
3. 依存関係のaudit警告を評価・更新する。ブラウザでファイルを扱うライブラリも含まれるため、静的サイトであることだけで影響なしとは判断しない。
4. 元ファイルと比較して出力内容を確認する。特にHEICの色・撮影情報、AIの境界、PSDの2層、音声・動画の納品条件。実機スマートフォンでも確認する。
5. 広告開始前に認定CMP、広告設定、操作UIの近くに広告が出ないこと、Privacy Policyとの整合を確認する。
6. 人間によるmainへのmerge後、本番デプロイを確認。Search Consoleでsitemapと主要URL・404・canonicalを確認し、本番ドメインを再申請する。

mainへのmerge・本番deploy・再申請・自動mergeの設定は本作業では行わない。

## 検証時に残る警告

- Astro型検査：0 errors / 0 warnings。未使用宣言・inline script等の既存hintは残る。
- Vite：500 kB超のチャンク警告。主に各ツール用PDF・AI・トークナイザーの資材。トップページへまとめて読み込む構成ではない。
- ローカルNode 26：module.register()の非推奨警告。CloudflareのNode環境とは分けて扱う。
- `npm audit --json`（2026-09-20）の最終取得は18件（critical 2 / high 12 / moderate 3 / low 1）。install時の簡易表示と詳細audit集計は異なるため詳細JSONの集計を採用。未使用の `@xenova/transformers` とその依存63パッケージを削除したが、Astro、pdfjs-dist、IMG.LY/onnxruntime-web、protobufjs等の警告は未解消。互換性評価なしの `npm audit fix --force` は実施しない。

広告有効な本番相当buildと、広告・GAの設定値があるPreview相当buildの両方を検査し、本番index対象のみ読み込み、Preview/公開履歴では読み込まないことを確認済み。

## ローカル最終結果

2026-09-20、Node 26.7.0 / Chromiumで確認。content lint成功、単体3件成功、型検査0 errors / 0 warnings（18 hints）、44ページbuild成功、ブラウザ8件すべて成功。全43公開ページを390px/1280pxで検査し、トップ・記事一覧・About・PDFのスクリーンショットを記録。PDF結合結果のページ順・寸法、PNG/SVGの実ファイル、動画フレームとWAVの書き出しも検証した。

ソース変更一覧はPRのFiles changedを参照。監査・運用文書、共有レイアウト/コンポーネント、トップ/案内/ポリシー/記事ページ、ガイドとツールカタログ、説明修正したツール、画像保存・音声抽出処理、テスト/開発依存を含む。
