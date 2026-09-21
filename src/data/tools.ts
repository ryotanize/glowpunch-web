export const tools = [
  {
    "id": "pdf-editor",
    "name": "PDF結合・並べ替え",
    "category": "書類・テキスト",
    "description": "複数のPDFをまとめ、ページを並べ替え・削除。",
    "note": "電子署名・フォーム・しおりの保持は保証しません。元ファイルを残し、保存後に全ページを確認してください。",
    "guide": "pdf-editor"
  },
  {
    "id": "character-counter",
    "name": "文字数カウンター",
    "category": "書類・テキスト",
    "description": "文字数・空白除外文字数・行数を確認。",
    "note": "文字数はJavaScriptの文字列長で計算します。絵文字や結合文字、投稿先独自の数え方とは一致しない場合があります。",
    "guide": "browser-local-processing"
  },
  {
    "id": "token-counter",
    "name": "トークンカウンター",
    "category": "書類・テキスト",
    "description": "入力テキストのトークン数を端末内で計算。",
    "note": "o200k_base方式の本文のみの概算です。メッセージ構造や画像を含むAPI全体の使用量は計測しません。",
    "guide": "token-counter"
  },
  {
    "id": "heic-converter",
    "name": "HEIC → JPG・PNG",
    "category": "画像・デザイン",
    "description": "HEIC写真を共有しやすい画像形式へ変換。",
    "note": "変換後の色・向き・枚数を確認してください。撮影情報やHDR、Live Photosの保持を目的としたツールではありません。",
    "guide": "heic-converter"
  },
  {
    "id": "background-remover",
    "name": "画像の背景透過",
    "category": "画像・デザイン",
    "description": "AIで被写体を切り抜いて透過画像を作成。",
    "note": "初回はAIモデルを外部CDNから取得します。髪・透明物・背景と同色の被写体は手直しが必要な場合があります。",
    "guide": "browser-local-processing"
  },
  {
    "id": "ai-psd-exporter",
    "name": "被写体・背景のPSD分割",
    "category": "画像・デザイン",
    "description": "画像を被写体と背景の2層に分けてPSDへ。",
    "note": "元の制作レイヤーの復元や、隠れた背景の補完はできません。AIモデルの読み込みには通信が必要です。",
    "guide": "ai-psd-exporter"
  },
  {
    "id": "glow-frame",
    "name": "GlowFrame スクショ装飾",
    "category": "画像・デザイン",
    "description": "スクリーンショットに余白や背景、枠を追加。",
    "note": "画像内の氏名・通知・URLなどは自動で隠しません。共有前に元画像の写り込みを確認してください。",
    "guide": "browser-local-processing"
  },
  {
    "id": "mesh-gradient",
    "name": "メッシュグラデーション",
    "category": "画像・デザイン",
    "description": "色の配置を調整し、背景素材を生成。",
    "note": "CSS・SVG・PNGは描画方法が異なります。書き出し先で色や質感を確認してください。",
    "guide": "browser-local-processing"
  },
  {
    "id": "sticker-bomb",
    "name": "ステッカーボム",
    "category": "画像・デザイン",
    "description": "写真を切り抜き、1枚のコラージュに配置。",
    "note": "AIモデルを取得して端末内で切り抜きます。枚数が多いとメモリを使うため、少数の画像から試してください。",
    "guide": "browser-local-processing"
  },
  {
    "id": "slide-palette",
    "name": "スライドパレット",
    "category": "画像・デザイン",
    "description": "画像から配色を抽出し、テーマ用ファイルへ。",
    "note": "抽出色の読みやすさは別途確認が必要です。保存したファイルをGoogleスライドへ取り込む際はGoogleへの送信になります。",
    "guide": "browser-local-processing"
  },
  {
    "id": "stripe-generator",
    "name": "ストライプ生成",
    "category": "画像・デザイン",
    "description": "画像の代表色からストライプ画像を作成。",
    "note": "被写体抽出を使う場合はAIモデルを取得します。抽出色は照明や背景の影響を受けます。",
    "guide": "browser-local-processing"
  },
  {
    "id": "ipod-silhouette",
    "name": "レトロシルエット",
    "category": "画像・デザイン",
    "description": "被写体のシルエットと背景色を組み合わせ。",
    "note": "AIモデルの取得が必要です。輪郭が重なる写真では形が伝わりにくいため、背景から被写体が離れた写真を選んでください。",
    "guide": "browser-local-processing"
  },
  {
    "id": "video-trimmer",
    "name": "動画トリマー",
    "category": "動画・音声",
    "description": "動画の前後をカットし、縦横比を変更。",
    "note": "クロップは画面の一部を切り落とします。字幕や顔の位置を確認してください。変換対応はブラウザとコーデックに依存します。",
    "guide": "audio-extractor"
  },
  {
    "id": "frame-extractor",
    "name": "動画から静止画",
    "category": "動画・音声",
    "description": "好きな場面や指定間隔のフレームを画像へ。",
    "note": "出力解像度は動画に依存し、元映像の手ぶれや圧縮ノイズは除去されません。連続抽出では画像枚数に注意してください。",
    "guide": "audio-extractor"
  },
  {
    "id": "audio-extractor",
    "name": "動画から音声抽出",
    "category": "動画・音声",
    "description": "動画の音声をMP3・WAV・AACへ書き出し。",
    "note": "入力・出力の対応はブラウザに依存します。MP3/AACが使えない環境ではWAVを試してください。音声のない動画からは抽出できません。",
    "guide": "audio-extractor"
  },
  {
    "id": "video-optimizer",
    "name": "動画スペック確認・変換",
    "category": "動画・音声",
    "description": "解像度やFPSを調べ、出力設定を調整。",
    "note": "サイズから求めるビットレートは概算です。出力は再圧縮されるため画質が変わります。入稿先の適合保証はありません。",
    "guide": "audio-loudness"
  },
  {
    "id": "audio-loudness",
    "name": "動画ラウドネス測定・調整",
    "category": "動画・音声",
    "description": "音量を測定し、目標値に合わせて調整。",
    "note": "目標値は納品先の仕様で確認してください。True Peakの適合や入稿承認は保証せず、出力の再測定と試聴が必要です。",
    "guide": "audio-loudness"
  }
] as const;
export const categories = ["書類・テキスト", "画像・デザイン", "動画・音声"] as const;
