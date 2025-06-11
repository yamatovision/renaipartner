# AI-FAQ

TypeScriptエラー解決時に20分以上かかった問題を記録します。

## Q: UserSetting.model.tsでSequelizeモデルのエラーが出ます
A: このプロジェクトはSequelizeを使用していません。pgライブラリベースのモデルパターンに書き換えてください。

## Q: PartnerModel.findByUserIdが配列を返すエラーが出ます  
A: findByUserIdメソッドは単一のPartnerオブジェクトまたはnullを返します。配列として扱わないでください。

## Q: UserSettingとUserSettingModelのインポートエラーが出ます
A: モデルはUserSettingModelとしてエクスポートされています。import { UserSettingModel } from ...を使用してください。

## Q: 画像生成システム統合テストが失敗します（★9統合テスト品質エンジニア 2025-01-11完了）

**🎉 アバター画像生成テスト完全成功達成！**

A: **実績**: Leonardo AI API 400エラーの根本原因を完全解決し、**アバター画像生成テスト（API 7.1）を完全成功**

**✅ 完全解決済み**:
1. **Leonardo AI API 400エラー**: `guidance_scale`パラメータを浮動小数点数（7.5）から整数（8）に修正
2. **データベースJSON解析エラー**: GeneratedImageモデルのmetadataフィールド型安全処理実装
3. **実データ主義の完全実装**: モック回避策を排除し、実際のLeonardo AI APIとの統合成功
4. **型定義完全同期**: フロントエンド・バックエンドのGeneratedImage型定義一貫性確保

**🎯 テスト成功状況**:
- ✅ **アバター画像生成（API 7.1）**: 完全成功（12秒実行時間）
- ✅ 背景画像一覧取得（2テスト）
- ✅ 利用可能モデル一覧取得
- ✅ 認証なしアクセス401エラー
- ✅ バリデーションエラー処理

**📋 次の担当者への引き継ぎ**:
1. **チャット用画像生成（API 7.2）**: アバター生成と同じ修正を適用済み、テスト実行推奨
2. **画像履歴・統計機能**: 基盤部分は正常動作、残りテストの実行確認
3. **完全ワークフローテスト**: Leonardo AI統合が正常動作するため成功見込み高い

**重要技術知見**:
- **Leonardo AI API仕様**: `guidance_scale`は整数のみ、`num_images`はsnake_case形式
- **PostgreSQL JSONB**: metadata型の安全な解析（string/object判定）
- **実データ主義の有効性**: モック環境では発見できない具体的API仕様問題を特定・解決