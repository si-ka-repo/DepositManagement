# デプロイメント設定

## 本番環境の設定

### 環境変数の設定

本番環境（Vercel、その他のホスティングサービス）で以下の環境変数を設定してください：

```
DATABASE_URL="postgresql://neondb_owner:npg_My8hZBcuq2IO@ep-winter-breeze-a4w1uj78-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Vercelでの設定方法

1. Vercelのダッシュボードにアクセス
2. プロジェクトの「Settings」→「Environment Variables」を選択
3. `DATABASE_URL`を追加し、上記のPostgreSQLのURLを設定
4. 環境を「Production」「Preview」「Development」すべてに適用

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

- `DATABASE_URL`が正しく設定されているか確認してください
- 環境変数が正しく読み込まれているか確認してください（`.env`ファイルの場所、Vercelの環境変数設定など）

### エラー: "the URL must start with the protocol `file:`"

- `prisma/schema.prisma`の`provider`が`sqlite`になっていないか確認してください
- 本番環境では`postgresql`に設定されている必要があります
