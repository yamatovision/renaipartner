import { ImagesService } from './src/features/images/images.service';
import { Partner, Gender, PersonalityType, SpeechStyle } from './src/types';
import dotenv from 'dotenv';
import path from 'path';

// 環境変数を読み込み
dotenv.config({ path: path.join(__dirname, '.env') });

// モックパートナーデータ
const mockPartner: Partner = {
  id: 'test-partner-id',
  userId: 'test-user-id',
  name: 'テストパートナー',
  gender: Gender.GIRLFRIEND,
  personalityType: PersonalityType.GENTLE,
  speechStyle: SpeechStyle.POLITE,
  systemPrompt: 'あなたは優しい性格のAIパートナーです。',
  avatarDescription: '優しい雰囲気の女性',
  appearance: {
    hairStyle: 'long',
    hairColor: 'brown',
    eyeColor: 'green',
    bodyType: 'slim',
    clothingStyle: 'casual',
    generatedImageUrl: undefined
  },
  hobbies: ['読書', '音楽鑑賞'],
  intimacyLevel: 60,
  baseImageUrl: undefined,
  createdAt: new Date(),
  updatedAt: new Date()
};

// テスト用リクエストパラメータ
const testCases = [
  {
    name: 'カフェでの幸せな表情',
    request: {
      partnerId: mockPartner.id,
      prompt: '君を思って作った画像',
      context: 'カフェでデート中',
      emotion: 'happy' as any,
      locationId: 'cafe',
      season: 'spring' as const,
      gender: Gender.GIRLFRIEND
    }
  },
  {
    name: 'ビーチでの興奮した表情',
    request: {
      partnerId: mockPartner.id,
      prompt: '今日のデート',
      context: 'ビーチで遊んでいる',
      emotion: 'excited' as any,
      locationId: 'beach',
      season: 'summer' as const,
      gender: Gender.GIRLFRIEND
    }
  },
  {
    name: '公園での穏やかな表情',
    request: {
      partnerId: mockPartner.id,
      prompt: 'おはよう',
      context: '朝の散歩',
      emotion: 'calm' as any,
      locationId: 'park',
      season: 'autumn' as const,
      gender: Gender.GIRLFRIEND
    }
  }
];

async function testImageGeneration() {
  console.log('=== 画像生成プロンプトテスト開始 ===\n');
  
  const imagesService = new ImagesService();
  
  for (const testCase of testCases) {
    console.log(`\n📍 テストケース: ${testCase.name}`);
    console.log('リクエストパラメータ:', JSON.stringify(testCase.request, null, 2));
    
    try {
      // buildLocationAwareChatPromptメソッドを直接呼び出してプロンプトを確認
      // @ts-ignore - プライベートメソッドへのアクセス
      const prompt = await imagesService.buildLocationAwareChatPrompt(testCase.request, mockPartner);
      
      console.log('\n✅ 生成されたプロンプト:');
      console.log(prompt);
      
      // プロンプトの各要素をチェック
      const checks = {
        '基本形': prompt.includes('anime style young woman'),
        '外見特徴': prompt.includes('brown long hair') && prompt.includes('green eyes'),
        '性格': prompt.includes('gentle personality'),
        '感情表現': prompt.includes('expression'),
        '親密度表現': prompt.includes('gaze') && prompt.includes('posture'),
        '服装': prompt.includes('wearing'),
        '場所': prompt.includes('setting'),
        '雰囲気': prompt.includes('atmosphere'),
        '品質指定': prompt.includes('high quality anime artwork')
      };
      
      console.log('\n🔍 プロンプト要素チェック:');
      Object.entries(checks).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}`);
      });
      
      // 実際のAPI呼び出しをテスト（環境変数が設定されている場合のみ）
      if (process.env.LEONARDO_AI_API_KEY) {
        console.log('\n🚀 Leonardo AI APIを呼び出しています...');
        
        // callLeonardoAPIメソッドを直接呼び出し
        // @ts-ignore - プライベートメソッドへのアクセス
        const result = await imagesService.callLeonardoAPI({
          prompt: prompt,
          modelId: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8',
          width: 512,
          height: 512,
          guidanceScale: 5,
          numImages: 1
        });
        
        console.log('✅ API呼び出し成功!');
        console.log('画像URL:', result);
      } else {
        console.log('\n⚠️  LEONARDO_AI_API_KEY が設定されていないため、実際のAPI呼び出しはスキップします');
      }
      
    } catch (error) {
      console.error('\n❌ エラー発生:', error);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// 親密度別のテストも実行
async function testIntimacyLevels() {
  console.log('\n\n=== 親密度レベル別テスト ===\n');
  
  const imagesService = new ImagesService();
  const intimacyLevels = [20, 50, 80];
  
  for (const level of intimacyLevels) {
    const testPartner = { ...mockPartner, intimacyLevel: level };
    const request = {
      partnerId: testPartner.id,
      prompt: '愛してるよ💕',
      context: 'カフェでデート',
      emotion: 'happy' as any,
      locationId: 'cafe',
      season: 'spring' as const,
      gender: Gender.GIRLFRIEND
    };
    
    console.log(`\n💕 親密度レベル: ${level}`);
    
    // @ts-ignore
    const prompt = await imagesService.buildLocationAwareChatPrompt(request, testPartner);
    
    // 親密度に関連する部分を抽出して表示
    const gazeMatch = prompt.match(/(\w+\s+\w+\s+gaze)/);
    const postureMatch = prompt.match(/(\w+\s+\w*\s*posture)/);
    const atmosphereMatch = prompt.match(/(\w+\s+\w*\s*atmosphere)/);
    
    console.log('  視線表現:', gazeMatch ? gazeMatch[1] : '見つかりません');
    console.log('  姿勢表現:', postureMatch ? postureMatch[1] : '見つかりません');
    console.log('  雰囲気:', atmosphereMatch ? atmosphereMatch[1] : '見つかりません');
  }
}

// テスト実行
(async () => {
  try {
    await testImageGeneration();
    await testIntimacyLevels();
    console.log('\n✅ すべてのテストが完了しました');
  } catch (error) {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  }
})();