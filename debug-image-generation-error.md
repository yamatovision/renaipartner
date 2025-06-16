# 画像生成エラー デバッグレポート

## エラー概要
- **エラー内容**: オンボーディング時の画像生成で500エラー
- **エラーメッセージ**: `null value in column "partner_id" of relation "generated_images" violates not-null constraint`
- **発生箇所**: `/api/images/generate-onboarding` エンドポイント

## 問題の根本原因
オンボーディング時にパートナーがまだ作成されていないため、`generated_images`テーブルへの保存時に`partner_id`がnullとなり、NOT NULL制約に違反している。

## エラーフロー
1. `Step7Appearance.tsx` → `generateOnboardingImage` APIを呼び出し
2. `images.controller.ts` → `generateOnboardingAvatar`メソッドでリクエスト処理
3. `images.service.ts` → `generateAvatarImage`メソッドで画像生成
4. Leonardo AI APIは正常に画像を生成（URLが返却される）
5. `GeneratedImageModel.create`でDBに保存しようとする際、`partner_id`がnullでエラー

## 修正案
1. オンボーディング画像生成用の専用メソッドを作成し、`partner_id`を必須としない
2. または、`generated_images`テーブルの`partner_id`カラムをNULL許容に変更
3. または、オンボーディング時は画像URLのみ返却し、DBには保存しない

## ログ分析
- Leonardo AI APIは正常動作（画像URL取得成功）
- 認証も正常（userId: 2f743e74-bfe1-440e-b22b-ca0f09508a2d）
- データベース制約違反でエラー発生