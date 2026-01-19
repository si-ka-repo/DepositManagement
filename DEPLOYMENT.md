# デプロイメント設定

## 本番環境の設定

### 環境変数の設定

本番環境（Vercel、その他のホスティングサービス）で以下の環境変数を設定してください：

```
DATABASE_URL="postgresql://neondb_owner:npg_My8hZBcuq2IO@ep-winter-breeze-a4w1uj78-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Vercelでの設定方法（重要）

1. Vercelのダッシュボードにアクセス（https://vercel.com/dashboard）
2. プロジェクトを選択
3. 「Settings」タブをクリック
4. 左側のメニューから「Environment Variables」を選択
5. 「Add New」ボタンをクリック
6. 以下のように設定：
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_My8hZBcuq2IO@ep-winter-breeze-a4w1uj78-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - **Environment**: 「Production」「Preview」「Development」すべてにチェックを入れる
7. 「Save」をクリック
8. **重要**: 環境変数を追加・変更した後は、必ず再デプロイが必要です
   - 「Deployments」タブから最新のデプロイメントを選択
   - 「Redeploy」ボタンをクリック

### 環境変数の確認方法

Vercelで環境変数が正しく設定されているか確認する方法：

1. Vercelのダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」を確認
3. `DATABASE_URL`が存在し、値が`postgresql://`で始まっていることを確認
4. もし設定されていない、または値が間違っている場合は、上記の手順で再設定してください

### データベースのマイグレーション

本番環境にデプロイ後、データベースのマイグレーションを実行してください：

```bash
npx prisma migrate deploy
```

または、Vercelのビルドコマンドに追加：

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## ローカル環境の設定

### オプション1: 本番環境と同じPostgreSQLを使用（推奨）

`.env`ファイルに本番環境と同じPostgreSQLのURLを設定：

```
DATABASE_URL="postgresql://neondb_owner:npg_My8hZBcuq2IO@ep-winter-breeze-a4w1uj78-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**注意**: 本番環境のデータベースを直接操作することになるため、開発用のデータのみを使用するか、別のPostgreSQLデータベースを作成することを推奨します。

### オプション2: ローカル用のPostgreSQLデータベースを使用

ローカルでPostgreSQLをインストールし、新しいデータベースを作成：

```bash
# PostgreSQLをインストール（macOSの場合）
brew install postgresql
brew services start postgresql

# データベースを作成
createdb deposit_management_dev
```

`.env`ファイルに設定：

```
DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/deposit_management_dev"
```

## トラブルシューティング

### エラー: "the URL must start with the protocol `postgresql://` or `postgres://`"

このエラーは、`DATABASE_URL`が設定されていないか、正しい形式になっていない場合に発生します。

**解決方法：**

1. **Vercelの環境変数を確認**
   - Vercelダッシュボード → プロジェクト → Settings → Environment Variables
   - `DATABASE_URL`が存在するか確認
   - 値が`postgresql://`で始まっているか確認

2. **環境変数を再設定**
   - 上記の「Vercelでの設定方法」を参照して、正しく設定してください
   - **重要**: 環境変数を追加・変更した後は、必ず再デプロイが必要です

3. **再デプロイの実行**
   - Vercelダッシュボード → Deployments → 最新のデプロイメント → Redeploy

4. **ローカル環境の場合**
   - `.env`ファイルがプロジェクトのルートディレクトリにあるか確認
   - `.env`ファイルに`DATABASE_URL`が正しく設定されているか確認
   - 開発サーバーを再起動してください

### エラー: "the URL must start with the protocol `file:`"

- `prisma/schema.prisma`の`provider`が`sqlite`になっていないか確認してください
- 本番環境では`postgresql`に設定されている必要があります
