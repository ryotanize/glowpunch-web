# GlowPunch 改善監査（2026-09-20）

## 基準と前提

不承認通知・Search Console・AdSense管理画面は未提供。不承認理由を断定せず、プロダクト価値・説明の正確性・導線を改善する。承認の保証、最低記事数や文字数の独自基準は設けない。

- 同期前ローカルmain: `53cb648`。既存PSDビューワー作業を `pre-adsense-readiness existing PSD viewer work` のstashに未追跡ファイルごと保全。
- 取得したmain: `3b43eb076d68a27812b86850044a40e979f869d6`。
- Astro 6静的HTML、Tailwind 4、17ツール、18ブログ記事。サーバー処理APIなし。Cloudflare PagesのGitHub連携（project: glowpunch、production branch: main、build: npm run build、output: dist）。直近mainのCloudflare check成功を確認。

## 修正前の主要所見

| 優先度 | 所見 | 対応方針 |
| --- | --- | --- |
| 高 | 全通信なし・漏洩リスクゼロとの断定。実際はAdSenseスクリプト、設定時GA、AIモデルCDN通信あり | 処理対象データと閲覧通信を区別。ポリシーと全ページの説明を一致させる |
| 高 | 18記事の大半が公開告知・機能紹介でツール説明と重複。比較、制約、失敗時の判断材料が少ない | PDF・HEIC等の既存URLを実用ガイドへ。告知は履歴として区別。独立したブラウザ処理ガイドを1本追加 |
| 高 | PSD記事はSegFormerによる多クラス分割と説明、実装はIMG.LY背景除去による2層。トークン説明も実装と不一致 | ソースコードに合わせて説明を訂正。固定モデル料金の断定を避ける |
| 高 | プライバシーポリシーに広告設定、Googleでのデータ利用、インフラ通信、問い合わせ情報の扱いが不足 | 公式リンク・利用者の選択肢・実装上の送信範囲を説明 |
| 中 | トップに重複するツール一覧と機能プレビュー。モバイルで主要ナビ非表示 | 静的な用途別一覧へ集約し、モバイルからも移動可能に |
| 中 | Aboutが名称・運営事務局・一般説明に留まる | 開発思想、範囲、限界、記事の訂正方針を記載。架空の人物や実績は追加しない |
| 中 | カスタム404なし、記事構造化データ・著者導線なし。canonical末尾スラッシュに揺れ | URL方針統一、404、記事の公開日/更新日と運営者導線追加 |
| 中 | 既存テスト・lint・型検査コマンドなし | 再実行可能な静的出力検証とブラウザ回帰テストを追加 |

## 公開サイトの確認

https://glowpunch.net と /blog/ の公開HTMLを取得。コードの所見と一致。各ページの直接HTTP・ブラウザ・モバイル確認は検証記録に追記する。

## 参照したGoogle公式情報

- https://support.google.com/adsense/answer/7299563?hl=ja （独自コンテンツとユーザーの利便性）
- https://support.google.com/publisherpolicies/answer/10502938?hl=ja （低価値コンテンツ、誤解を招く表現、プライバシー）
- https://support.google.com/adsense/answer/1348695?hl=ja （Cookie・第三者広告・設定方法の開示）
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja （読者の問題解決、作成主体と正確性）
- https://support.google.com/adsense/answer/13554116?hl=ja （EEA・英国・スイス向け広告の認定CMP要件）

## 運営側でしか確認できない事項

不承認通知の具体的理由、連絡先メールの受信、公開可能な運営者名、AdSense管理画面でのAuto ads/CMP設定、Search Consoleのクロール状況は人間の確認が必要。広告配信は明示設定に分離し、未設定時は所有権確認metaのみ。Previewでは広告・GAを読み込まない。

## 追加の実測所見と修正

公開サイトは `/missing-audit-page/` が200でトップを返すsoft 404だった。カスタム404を追加しローカルで404を確認。
既存の型検査は94エラーだったため、DOM要素の型チェック、Canvas取得、File/レイヤー型、Blobのバイト列型を修正。型チェックを弱める設定変更はしていない。
実操作でメッシュSVGボタンの未実装、メッシュ/GlowFrameのPNG出力先Canvas欠落、音声抽出のWAVコーデック名不一致を発見。実際のSVG/PNG/WAV出力を検査する回帰テストとともに修正。
