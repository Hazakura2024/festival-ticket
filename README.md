# 模擬店 整理券システム (Festival Queue Management App)

文化祭などの模擬店で利用できる、シンプルでリアルタイムな整理券（順番待ち）Webアプリケーションです。
ユーザー登録やアプリのインストールは不要で、QRコードを読み込むだけで簡単に整理券を発券できます。

裏側のデータベース連携により、お客さんの画面とお店側の管理画面がリアルタイム（ページ更新不要）で連動します。

## ✨ 主な機能

### 客側（ユーザー画面）
- **ワンタップ発券:** アクセス直後のURLプレビューボット等による自動発券を防ぎ、ボタンタップで確実に発券。
- **リアルタイム更新:** 自分の待ち人数と整理番号を常に最新の状態で表示。
- **視覚的な呼出通知:** 自分の番が来ると画面全体が赤色に切り替わり、音の聞こえにくい環境でも見逃しを防止。
- **シームレスな再注文:** 商品受け取り完了後、状態をリセットしてすぐに新たな発券が可能。

### 店側（管理画面）
- **リアルタイム注文管理:** 新規発券が自動でリストの最後尾に追加。
- **2段階オペレーション:** 「完成（呼出）」→「完了（受渡済）」の2ステップで、渡し忘れや現場の混乱を防止。
- **ステータス別の画面整理:** 進行中の注文を常に上部に表示し、完了済みのものは下にグレーアウト。
- **全データリセット:** 1日の終わりにワンクリック（確認ダイアログ付き）で全注文データを安全に一括削除。

- ## 🛠 技術スタック

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Hosting:** Vercel
- **Authentication:** なし（ブラウザの `localStorage` を使用してユーザーを識別）

- ## 🚀 ローカルでのセットアップ

### 1. リポジトリのクローンとパッケージインストール
```bash
git clone https://github.com/Hazakura2024/festival-ticket.git
cd festival-ticket
npm install
```

### 2. 環境変数の設定
ルートディレクトリに `.env.local` を作成し、Firebaseのプロジェクト設定を入力します。
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで以下のURLにアクセスして動作を確認します。
- 客側画面: `http://localhost:3000`
- 管理画面: `http://localhost:3000/admin-xyz123`

## ☁️ デプロイと運用

このプロジェクトは **Vercel** へのデプロイを前提としています。

### デプロイ手順
1. Vercelのダッシュボードから `festival-ticket` リポジトリをインポート。
2. Settingsの `Environment Variables` にて、ローカルの `.env.local` と同じ6つの環境変数を設定。
3. デプロイを実行。

### Firebaseのセキュリティルールについて
本アプリはユーザー認証を行わずに発券処理を行うため、Firestoreのセキュリティルールは「テストモード（誰でも読み書き可能）」で運用することを想定しています。
文化祭などの短期イベントでの利用に最適化されているため、長期間公開し続ける場合はルールの見直しを行ってください。
