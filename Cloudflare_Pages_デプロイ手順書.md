# Cloudflare Pages デプロイ＆ドメイン設定ガイド

Cloudflareのアカウント作成、おめでとうございます！
このドキュメントは、現在手元にある「GlowPunch」のWebサイトをインターネット上に公開し、「glowpunch.net」というドメインでアクセスできるようにするための、初心者向けのステップ・バイ・ステップのガイドです。

---

## 🚀 ステップ1：GitHubへのソースコードのプッシュ
Cloudflare Pagesは、GitHubというソースコード管理サービスと連携して自動的にサイトを構築・公開する仕組みが最も簡単で便利です。

1. **GitHubアカウントの準備**
   - [GitHub](https://github.com/) のアカウントを持っていない場合は作成します。
2. **リポジトリの作成**
   - GitHub画面右上の「+」ボタンから「New repository」を選択します。
   - Repository nameを `glowpunch-web` （など任意）と入力し、「Private（非公開）」を選択して「Create repository」をクリックします。
3. **ローカルからGitHubへプッシュ**
   - コマンドライン（ターミナル）で現在作業している `glowpunch` ディレクトリにて、以下のコマンドを順番に実行し、コードをGitHubへアップロードします。
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/あなたのユーザー名/glowpunch-web.git
   git push -u origin main
   ```

---

## ☁️ ステップ2：Cloudflare Pagesでの公開設定
GitHubにコードが上がったら、Cloudflareと連携させます。

1. **Cloudflareダッシュボードへアクセス**
   - Cloudflareにログインし、左側のメニューから **「Workers & Pages」** をクリックします。
2. **Pagesの作成（重要！）**
   - 画面右上の **「アプリケーションの作成（Create application）」** をクリックします。
   - 画面が少し紛らわしいですが、上部のタブから必ず **「Pages」** タブを選んでください。（初期表示の「Worker」のまま進めないように注意！）
   - Pagesタブの下にある **「Git に接続（Connect to Git）」** ボタンをクリックします。
3. **GitHubとの連携**
   - CloudflareがGitHubアカウントへのアクセスを求めてくるので承認し、先ほど作成した `glowpunch-web` リポジトリを選択します。
   - 「セットアップの開始」をクリックします。
4. **ビルド設定（ここが重要です！）**
   - **プロジェクト名**: `glowpunch` (これがデフォルトの一時URLになります。例: `glowpunch.pages.dev`)
   - **プロダクションブランチ**: `main`
   - **フレームワーク プリセット**: `Astro` を選択します。（自動で以下の設定が入ります）
     - **ビルドコマンド**: `npm run build`
     - **ビルド出力ディレクトリ**: `dist`
5. **保存してデプロイ**
   - 下部の「保存してデプロイ」をクリックします。
   - 数分待つと「Success！」と表示され、`https://glowpunch.pages.dev` のようなテスト用URLで現在手元で見ているサイトがそのままインターネット上で見られるようになります。

---

## 🌐 ステップ3：カスタムドメイン（glowpunch.net）の設定
テスト用URLでの表示が確認できたら、いよいよ独自ドメインを紐付けます。

1. **カスタムドメインの設定開始**
   - Cloudflareの `glowpunch` Pagesプロジェクトの画面を開き、**「カスタム ドメイン」** のタブをクリックします。
   - **「カスタム ドメインの設定」** をクリックし、`glowpunch.net` と入力して「続行」をクリックします。
2. **DNSレコードの自動追加**
   - Cloudflareが自動でドメインの接続に必要な設定を検知してくれます。「ドメインの有効化」をクリックします。
3. **（重要）ネームサーバーの変更**
   - *（※もしドメインをCloudflare以外のサービス（お名前.comやエックスサーバー等）で取得した場合に必要です）*
   - ダッシュボードの指示に従い、ドメインを取得した会社の管理画面にログインします。
   - 「ネームサーバー（DNS）の変更」メニューを探し、Cloudflareから指定された2つのネームサーバー（例： `alice.ns.cloudflare.com` と `bob.ns.cloudflare.com` など）に変更します。
4. **完了を待つ**
   - ネームサーバーの変更がインターネット全体に行き渡るまで、数分から最大で数時間かかる場合があります。
   - Cloudflareの画面上でドメインが「アクティブ」になれば設定完了です！

> **ℹ️ 豆知識**
> Cloudflare Pagesは**無料枠内で月間500回のデプロイ（更新）が可能**で、アクセスによる帯域制限は事実上無料・無制限です！今後の運用コストはドメインの年間更新料のみとなります。

---

**運用・更新の仕組み**
今後は、ローカルでコードを書き換えて、GitHubへ `git push`（コードをアップロード）するだけで、Cloudflareが全自動で最新版をビルドし、数分後には本番の `glowpunch.net` が更新されるようになります。

何か分からない項目があれば、いつでも聞いてください！
