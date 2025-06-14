# 性別対応服装システム設計

## 概要
パートナーの性別（Gender）に応じて、適切な服装プロンプトを自動選択するシステムです。

## 実装方針

### 1. 服装プロンプトの構造
```typescript
interface ClothingPrompt {
  male: string;    // 男性用プロンプト
  female: string;  // 女性用プロンプト
}
```

### 2. 服装選択ロジック
```typescript
function getClothingPrompt(
  clothingStyle: ClothingStyle,
  gender: Gender
): string {
  const prompts = CLOTHING_PROMPTS[clothingStyle];
  return gender === Gender.BOYFRIEND ? prompts.male : prompts.female;
}
```

### 3. 服装タイプの設計指針

#### ユニセックスな服装タイプ
- `casual` - カジュアル
- `formal` - フォーマル
- `sporty` - スポーティー
- `school_uniform` - 制服
- `loungewear` - 部屋着
- `pajamas` - パジャマ
- `office_suit` - ビジネススーツ

#### 性別特化の服装タイプ
女性向けの服装でも、男性版では別の解釈をする：
- `swimsuit` → 女性：ビキニ/ワンピース、男性：トランクス
- `yukata` → 女性：華やかな柄、男性：シックな柄
- `devil_costume` → 女性：セクシー、男性：クール
- `santa_costume` → 女性：ミニスカート、男性：ジャケット

### 4. 特殊ケースの処理

#### 女性専用の服装
以下は男性の場合、類似の男性的な服装に変換：
- `spring_dress` → 男性：春らしいカジュアルシャツ
- `winter_dress` → 男性：冬のジャケットスタイル
- `yoga_wear` → 男性：トレーニングウェア

#### 場所による調整
- ホットヨガ → 男性：ジムでのトレーニング
- オフィス → 男女ともにプロフェッショナル

## 実装例

### 画像生成サービスでの利用
```typescript
// images.service.ts
async generateImage(request: ImageGenerationRequest) {
  const partner = await this.getPartner(request.partnerId);
  const location = await this.getLocation(request.locationId);
  
  // 性別に応じた服装プロンプトを取得
  const clothingPrompt = this.getClothingPrompt(
    location.clothing,
    partner.gender
  );
  
  // プロンプトに組み込み
  const fullPrompt = `
    ${partner.gender === Gender.BOYFRIEND ? 'handsome man' : 'beautiful woman'},
    ${clothingPrompt},
    ${location.name} background,
    ...
  `;
}
```

### 場所と服装のマッピング更新
```typescript
const locationClothingMap = {
  'school_classroom': {
    name: '教室',
    clothing: 'school_uniform',
    // 性別に関わらず同じ服装タイプ、プロンプトで分岐
  },
  'office': {
    name: 'オフィス',
    clothing: 'office_suit', // office_ladyから変更
  }
}
```

## メリット

1. **包括性**: 男女両方のユーザーに対応
2. **柔軟性**: 性別に応じた適切な表現
3. **拡張性**: 新しい服装タイプの追加が容易
4. **一貫性**: 統一された服装システム

## 今後の拡張

- ノンバイナリー対応
- カスタム服装オプション
- 文化的な服装バリエーション