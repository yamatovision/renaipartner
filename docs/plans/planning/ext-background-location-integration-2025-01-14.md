# 機能拡張計画: 背景・場所統合システム完成 [2025-01-14]

## 1. 拡張概要

背景システムと場所システムの基盤実装は完了していますが、AIチャットと画像生成への統合が未完了です。本計画では、「場所が体験を決める」という核心コンセプトを実現するため、AIシステムと背景・場所システムを完全に統合し、恋愛ゲーム的な没入感のある体験を提供します。

## 2. 詳細仕様

### 2.1 現状と課題

**現状**:
- BackgroundContext、LocationContextの実装完了
- 背景画像46枚、場所データベース実装済み
- BackgroundProvider、LocationProviderの統合完了
- 場所関連APIエンドポイント実装済み

**課題**:
- AIチャットが現在地を認識していない
- 画像生成時に場所に応じた服装が適用されない
- 背景画像と場所データの紐付けが不完全
- 場所解放通知システムが未実装

### 2.2 拡張内容

**統合の4つの柱**:

1. **AIチャットの場所認識**
   - システムプロンプトへの現在地情報注入
   - 場所の雰囲気を反映した会話生成

2. **画像生成の場所連動**
   - 場所に応じた服装プロンプトの自動適用
   - 性別考慮した服装バリエーション

3. **背景と場所の完全統合**
   - BackgroundImageとLocationDataの紐付け
   - 場所変更時の背景自動切り替え

4. **ユーザー体験の向上**
   - 場所解放通知システム
   - 季節イベントの自動表示

## 3. ディレクトリ構造

```
backend/src/features/
├── chat/
│   └── chat.service.ts          # 修正：場所情報注入
├── images/
│   ├── images.service.ts        # 修正：場所連動画像生成
│   └── clothing-prompts.ts      # 新規：服装プロンプト管理
└── locations/
    └── location-background-map.ts # 新規：場所-背景マッピング

frontend/src/
├── components/
│   └── features/
│       └── LocationUnlockNotification.tsx # 新規：解放通知
├── hooks/
│   └── useLocationBackground.ts  # 新規：場所-背景連携フック
└── services/
    └── locationBackground.service.ts # 新規：統合サービス
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: 
  - チャット画面での場所表示追加
  - 場所解放通知コンポーネント
  - 背景自動切り替え機能

- **バックエンド**: 
  - chat.service.ts（buildSystemPrompt拡張）
  - images.service.ts（generateImagePrompt拡張）
  - 新規clothing-prompts.ts

- **データモデル**: 
  - 場所-背景マッピングデータ
  - 服装プロンプトテンプレート

### 4.2 変更が必要なファイル

```
- backend/src/features/chat/chat.service.ts: システムプロンプトに場所情報追加
- backend/src/features/chat/chat.controller.ts: currentLocationIdパラメータ追加
- backend/src/features/images/images.service.ts: 場所別服装ロジック追加
- backend/src/features/images/images.controller.ts: currentLocationIdパラメータ追加
- backend/src/features/locations/locations.data.ts: 場所データの追加・更新
- frontend/app/home/page.tsx: 現在地表示UI追加
- frontend/src/components/chat/ChatInterface.tsx: 場所情報をAPIに送信
```

## 5. タスクリスト

### フェーズ1: AIチャット統合
- [ ] **T1**: chat.service.tsにlocationパラメータ追加
- [ ] **T2**: buildSystemPromptメソッドの拡張（場所情報注入）
- [ ] **T3**: チャットAPIエンドポイントにcurrentLocationId追加
- [ ] **T4**: フロントエンドから現在地情報の送信

### フェーズ2: 画像生成統合
- [ ] **T5**: clothing-prompts.tsの作成（服装プロンプトテンプレート）
- [ ] **T6**: images.service.tsに場所連動ロジック追加
- [ ] **T7**: 性別に応じた服装プロンプト生成機能
- [ ] **T8**: 季節対応服装システム（casual_date, casual_outdoor）
- [ ] **T9**: 画像生成APIにcurrentLocationId追加

### フェーズ3: 背景-場所連携
- [ ] **T10**: location-background-map.tsの作成
- [ ] **T11**: useLocationBackgroundフックの実装
- [ ] **T12**: 場所変更時の背景自動切り替え機能
- [ ] **T13**: 季節イベント背景の自動適用

### フェーズ4: UX向上
- [ ] **T14**: LocationUnlockNotificationコンポーネント作成
- [ ] **T15**: 場所解放時のアニメーション実装
- [ ] **T16**: チャット画面への現在地表示UI追加
- [ ] **T17**: 統合テストの実装

## 6. 実装詳細設計

### 6.1 AIチャットへの場所情報注入

```typescript
// chat.service.ts
async buildSystemPrompt(partner: Partner, currentLocationId?: string): Promise<string> {
  let basePrompt = partner.systemPrompt;
  
  if (currentLocationId) {
    const location = await this.locationsService.getLocationById(currentLocationId);
    const clothingDesc = this.getClothingDescription(location.clothing, partner.gender);
    
    const locationPrompt = `
## 現在の状況
- 場所: ${location.name}
- 雰囲気: ${location.appealPoint}
- ${partner.name}の服装: ${clothingDesc}

この場所と状況を考慮して会話してください。`;
    
    basePrompt = locationPrompt + '\n\n' + basePrompt;
  }
  
  return basePrompt;
}
```

### 6.2 場所連動画像生成

```typescript
// images.service.ts
async generateImagePrompt(
  partner: Partner, 
  basePrompt: string,
  currentLocationId?: string
): Promise<string> {
  let enhancedPrompt = basePrompt;
  
  if (currentLocationId) {
    const location = await this.locationsService.getLocationById(currentLocationId);
    const clothingPrompt = await this.clothingPromptsService.getPrompt(
      location.clothing,
      partner.gender,
      this.getCurrentSeason() // 季節を追加
    );
    
    // 場所の背景要素を追加
    const backgroundElements = this.getLocationBackgroundElements(location);
    
    enhancedPrompt = `${basePrompt}, ${clothingPrompt}, ${backgroundElements}`;
  }
  
  return enhancedPrompt;
}

// 季節判定メソッド
private getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}
```

### 6.3 季節対応服装プロンプト生成

```typescript
// clothing-prompts.ts
export class ClothingPromptsService {
  getPrompt(
    clothingStyle: ClothingStyle, 
    gender: Gender,
    season?: 'spring' | 'summer' | 'autumn' | 'winter'
  ): string {
    // 季節対応が必要な服装タイプ
    if (clothingStyle === 'casual_date') {
      return this.getSeasonalCasualDate(gender, season || this.getCurrentSeason());
    }
    
    if (clothingStyle === 'casual_outdoor') {
      return this.getSeasonalCasualOutdoor(gender, season || this.getCurrentSeason());
    }
    
    // 通常の服装プロンプト
    return this.getBasicClothingPrompt(clothingStyle, gender);
  }
  
  private getSeasonalCasualDate(gender: Gender, season: string): string {
    const prompts = {
      male: {
        spring: 'knit sweater, chino pants, casual shoes',
        summer: 'short sleeve shirt, chino pants, loafers',
        autumn: 'knit sweater, chino pants, casual shoes',
        winter: 'thick sweater, wool pants, boots'
      },
      female: {
        spring: 'soft pastel sweater, midi skirt, flats',
        summer: 'short sleeve blouse, flare skirt, sandals',
        autumn: 'soft pastel sweater, midi skirt, flats',
        winter: 'thick sweater, wool skirt, boots'
      }
    };
    
    return prompts[gender === 'boyfriend' ? 'male' : 'female'][season];
  }
  
  private getSeasonalCasualOutdoor(gender: Gender, season: string): string {
    const prompts = {
      male: {
        spring: 'outdoor jacket, cargo pants, hiking boots',
        summer: 'quick-dry t-shirt, shorts, sneakers',
        autumn: 'outdoor jacket, cargo pants, hiking boots',
        winter: 'down jacket, thermal pants, winter boots'
      },
      female: {
        spring: 'active wear, shorts, sneakers',
        summer: 'tank top, shorts, sport shoes',
        autumn: 'active wear, shorts, sneakers',
        winter: 'winter jacket, leggings, warm boots'
      }
    };
    
    return prompts[gender === 'boyfriend' ? 'male' : 'female'][season];
  }
}
```

### 6.4 場所-背景マッピング

```typescript
// location-background-map.ts
export const locationBackgroundMap: Record<string, string[]> = {
  // 通常場所
  'school_classroom': ['school_classroom_morning', 'school_classroom_afternoon'],
  'cafe': ['cafe_morning', 'cafe_afternoon', 'cafe_evening'],
  'beach': ['beach_morning', 'beach_afternoon', 'beach_sunset'],
  'office': ['office_morning', 'office_afternoon', 'office_evening'],
  'home_living': ['home_living_afternoon', 'home_living_evening'],
  'bedroom': ['bedroom_morning', 'bedroom_night'],
  'park': ['park_morning', 'park_afternoon'],
  'museum': ['museum_afternoon'],
  'amusement_park': ['amusement_park_afternoon'],
  'gym': ['gym_morning', 'gym_afternoon'],
  'restaurant': ['restaurant_evening', 'restaurant_night'],
  'karaoke': ['karaoke_evening', 'karaoke_night'],
  'night_view': ['night_view_night'],
  'onsen': ['onsen_evening', 'onsen_night'],
  'luxury_hotel': ['luxury_hotel_evening', 'luxury_hotel_night'],
  
  // 季節イベント
  'cherry_blossoms': ['cherry_blossoms_afternoon'],
  'fireworks_festival': ['fireworks_festival_night'],
  'summer_festival': ['summer_festival_evening', 'summer_festival_night'],
  'halloween_party': ['halloween_party_night'],
  'autumn_leaves': ['autumn_leaves_afternoon'],
  'christmas_illumination': ['christmas_illumination_evening', 'christmas_illumination_night'],
  'christmas_party': ['christmas_party_night'],
  'new_year_shrine': ['new_year_shrine_morning'],
  'valentine_date': ['valentine_date_evening'],
  'ski_resort': ['ski_resort_morning', 'ski_resort_afternoon'],
};
```

### 6.5 場所解放通知

```typescript
// LocationUnlockNotification.tsx
export const LocationUnlockNotification: React.FC = () => {
  const { newlyUnlockedLocations } = useLocation();
  
  return (
    <AnimatePresence>
      {newlyUnlockedLocations.map(location => (
        <motion.div
          key={location.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 
                     text-white p-6 rounded-lg shadow-xl"
        >
          <h3 className="text-xl font-bold mb-2">🎉 新しい場所が解放されました！</h3>
          <p className="text-lg">{location.name}</p>
          <p className="text-sm opacity-90">{location.appealPoint}</p>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
```

## 7. テスト計画

1. **AIチャット統合テスト**
   - 各場所での会話内容の適切性確認
   - 場所情報がシステムプロンプトに正しく注入されるか

2. **画像生成統合テスト**
   - 場所に応じた服装が適用されるか
   - 性別による服装バリエーションの確認

3. **背景切り替えテスト**
   - 場所変更時の背景自動切り替え
   - 時間帯考慮の動作確認

4. **場所解放テスト**
   - 親密度上昇時の解放通知
   - 季節イベントの自動解放

## 8. SCOPE_PROGRESSへの統合

```markdown
- [ ] **T-BG-002**: 背景・場所統合システムの完成
  - 目標: 2025-01-21
  - 参照: [/docs/plans/planning/ext-background-location-integration-2025-01-14.md]
  - 内容: AIチャット・画像生成への場所システム統合、UX向上機能の実装
  - 前提: T-BG-001（戦略的背景システムの基盤実装）完了
```

## 9. 実装優先順位

1. **最優先**: AIチャットへの場所情報注入（T1-T4）
   - ユーザー体験への影響が最も大きい
   - 実装が比較的シンプル

2. **高優先**: 画像生成の場所連動（T5-T8）
   - ビジュアル面での没入感向上
   - 既存の画像生成システムの拡張

3. **中優先**: 背景-場所連携（T9-T12）
   - 視覚的な一貫性の向上
   - 季節イベントの自動化

4. **低優先**: UX向上機能（T13-T16）
   - 場所解放通知などの演出
   - 基本機能完成後の磨き込み

## 10. 備考

- 服装プロンプトは男女両対応を必須とする
- 季節イベントはリアルタイムの日付で判定
- 場所解放は親密度上昇時に即座に反映
- 「お宝画像」への到達は自然な流れで実現する設計