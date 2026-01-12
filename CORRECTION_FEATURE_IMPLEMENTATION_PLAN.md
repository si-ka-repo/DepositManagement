# 訂正機能実装計画

## 概要
利用者詳細画面の入金・出金明細の各行に「訂正」ボタンを追加し、既存の取引を訂正状態に変更する機能を実装します。

## 要件
1. 各行の一番後ろに「訂正」ボタンを追加
2. 訂正を実行すると：
   - その行に取り消し線を表示
   - 区分を「訂正入金」または「訂正出金」に変更（`correct_in` または `correct_out`）
   - 計算から除外（区分が `correct_in` または `correct_out` のものは残高計算から除外）
   - 印刷時には訂正の行を含めない

## 実装タスク

### 1. バックエンド: Transaction更新APIの作成
**ファイル**: `app/api/transactions/[id]/route.ts` (新規作成)

**機能**:
- `PATCH` メソッドで取引を更新
- `transactionType` を `in` → `correct_in`、`out` → `correct_out` に変更
- 既に訂正済みの場合はエラーを返す

**実装内容**:
```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // transactionTypeを訂正区分に変更
  // 既に訂正済みの場合はエラー
}
```

---

### 2. フロントエンド: 利用者詳細画面の更新
**ファイル**: `app/residents/[id]/page.tsx`

**変更内容**:
- テーブルに「操作」列を追加（最後の列）
- 各行に「訂正」ボタンを追加
- 訂正済みの行には取り消し線を表示（`line-through` スタイル）
- 訂正済みの行には「訂正」ボタンを非表示または無効化
- 訂正ボタンクリック時に確認ダイアログを表示
- APIを呼び出して取引を更新

**実装内容**:
- `handleCorrectTransaction` 関数を追加
- テーブルの各行に訂正ボタンを追加
- 訂正済み行のスタイリング（取り消し線）

---

### 3. 残高計算ロジックの修正
**ファイル**: `lib/balance.ts`

**変更内容**:
- `calculateBalance` 関数: 訂正区分（`correct_in`, `correct_out`）を計算から除外
- `calculateBalanceUpToMonth` 関数: 訂正区分を計算から除外

**実装内容**:
```typescript
// 訂正区分は計算から除外
if (transaction.transactionType === 'in') {
  balance += transaction.amount
} else if (transaction.transactionType === 'out') {
  balance -= transaction.amount
}
// correct_in と correct_out は計算しない
```

---

### 4. 印刷データ変換ロジックの修正
**ファイル**: `pdf/utils/transform.ts`

**変更内容**:
- `transformToPrintData` 関数: 訂正区分の取引を印刷データから除外
- `transformToResidentPrintData` 関数: 訂正区分の取引を印刷データから除外

**実装内容**:
```typescript
// 訂正区分の取引をフィルタリング
const filteredTransactions = transactions.filter(
  t => t.transactionType !== 'correct_in' && t.transactionType !== 'correct_out'
)
```

---

### 5. 表示ラベルの更新
**ファイル**: `app/residents/[id]/page.tsx`

**変更内容**:
- 訂正済みの行は視覚的に区別できるようにする
- 区分ラベルは既に `getTransactionTypeLabel` で対応済み（確認）

---

## データフロー

### 訂正実行時の流れ
1. ユーザーが「訂正」ボタンをクリック
2. 確認ダイアログを表示
3. 確認後、`PATCH /api/transactions/[id]` を呼び出し
4. APIで `transactionType` を更新
5. フロントエンドでデータを再取得
6. 画面に取り消し線が表示される
7. 残高が再計算される（訂正行は除外）

### 残高計算時の流れ
1. 取引一覧を取得
2. `calculateBalance` または `calculateBalanceUpToMonth` で計算
3. 訂正区分（`correct_in`, `correct_out`）は計算から除外
4. 残高を表示

### 印刷時の流れ
1. 取引一覧を取得
2. `transformToPrintData` または `transformToResidentPrintData` で変換
3. 訂正区分の取引をフィルタリングして除外
4. PDFを生成

---

## UI/UXの考慮事項

1. **訂正ボタンの配置**
   - テーブルの最後の列に「操作」列を追加
   - ボタンは小さめのサイズで、アイコン付き（例: ✏️ 訂正）

2. **視覚的フィードバック**
   - 訂正済みの行は取り消し線を表示
   - 訂正済みの行はグレーアウト（オプション）
   - 訂正ボタンは訂正済みの行では非表示または無効化

3. **確認ダイアログ**
   - 訂正実行前に確認ダイアログを表示
   - 「この取引を訂正としてマークしますか？」などのメッセージ

4. **エラーハンドリング**
   - 既に訂正済みの場合のエラー表示
   - APIエラー時のトースト通知

---

## テスト項目

1. **機能テスト**
   - [ ] 入金行を訂正できる
   - [ ] 出金行を訂正できる
   - [ ] 訂正済みの行は再度訂正できない
   - [ ] 訂正後、取り消し線が表示される
   - [ ] 訂正後、区分が「訂正入金」「訂正出金」に変更される

2. **計算テスト**
   - [ ] 訂正行は残高計算から除外される
   - [ ] 訂正前後の残高が正しく計算される
   - [ ] 複数の訂正行がある場合も正しく計算される

3. **印刷テスト**
   - [ ] 訂正行は印刷に含まれない
   - [ ] 印刷データの合計が正しい
   - [ ] 利用者別明細書と施設別明細書の両方で確認

4. **UIテスト**
   - [ ] 訂正ボタンが正しい位置に表示される
   - [ ] 訂正済み行のスタイルが正しい
   - [ ] 確認ダイアログが表示される
   - [ ] エラーメッセージが正しく表示される

---

## 注意事項

1. **既存の訂正入力機能との関係**
   - 既存の「訂正入力」機能（締め済み月の訂正入力）は維持
   - 新しい「訂正」機能は既存取引を訂正状態にする機能

2. **データ整合性**
   - 訂正済みの取引は削除しない（履歴として残す）
   - 訂正区分への変更は不可逆的な操作として扱う

3. **パフォーマンス**
   - 訂正実行後はデータを再取得するため、API呼び出しが発生
   - 必要に応じて楽観的更新を検討

---

## 実装順序

1. バックエンドAPIの作成（`app/api/transactions/[id]/route.ts`）
2. 残高計算ロジックの修正（`lib/balance.ts`）
3. 印刷データ変換ロジックの修正（`pdf/utils/transform.ts`）
4. フロントエンドUIの実装（`app/residents/[id]/page.tsx`）
5. テストと動作確認

---

## ファイル一覧

### 新規作成
- `app/api/transactions/[id]/route.ts`

### 修正
- `app/residents/[id]/page.tsx`
- `lib/balance.ts`
- `pdf/utils/transform.ts`

---

## 完了条件

- [ ] 各行に「訂正」ボタンが表示される
- [ ] 訂正ボタンをクリックすると取引が訂正状態になる
- [ ] 訂正済みの行に取り消し線が表示される
- [ ] 訂正済みの行は残高計算から除外される
- [ ] 訂正済みの行は印刷に含まれない
- [ ] エラーハンドリングが適切に実装されている
- [ ] UI/UXが適切に実装されている
