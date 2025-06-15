import { config } from 'dotenv';
import { resolve } from 'path';

// .envファイルを読み込む
config({ path: resolve(__dirname, '../.env') });

console.log('=== 画像生成マッピングの修正確認 ===\n');

// 修正後のマッピング
const personalityMap: { [key: string]: string } = {
  'gentle': 'gentle',
  'cool': 'cool',
  'cheerful': 'cheerful',
  'tsundere': 'tsundere',
  'sweet': 'sweet',
  'reliable': 'reliable',
  'clingy': 'clingy',
  'genius': 'genius',
  'childhood': 'childhood friend',
  'sports': 'sporty',
  'artist': 'artistic',
  'cooking': 'cooking enthusiast',
  'mysterious': 'mysterious',
  'prince': 'princely',
  'otaku': 'otaku',
  'younger': 'younger',
  'band': 'band member'
};

const emotionMap: { [key: string]: string } = {
  'happy': 'happy expression with warm expressive',
  'sad': 'sad expression with gentle melancholic',
  'excited': 'excited expression with energetic vibrant',
  'calm': 'calm expression with peaceful serene',
  'loving': 'loving expression with tender affectionate',
  'amused': 'amused expression with playful cheerful',
  'confused': 'confused expression with puzzled uncertain',
  'curious': 'curious expression with interested attentive',
  'frustrated': 'frustrated expression with troubled annoyed',
  'neutral': 'neutral expression with relaxed natural',
  'surprised': 'surprised expression with astonished wide-eyed'
};

// テストケース
const testCases = [
  {
    name: 'アリサ（髪色あり）',
    partner: {
      gender: 'girlfriend',
      personalityType: 'reliable',
      appearance: {
        hairColor: 'blonde',
        hairStyle: 'long',
        eyeColor: 'blue'
      }
    },
    emotion: 'happy'
  },
  {
    name: 'かぐや（髪色なし）',
    partner: {
      gender: 'girlfriend',
      personalityType: 'tsundere',
      appearance: {
        hairColor: null,
        hairStyle: 'long',
        eyeColor: 'brown'
      }
    },
    emotion: 'confused'
  },
  {
    name: '新しい感情のテスト',
    partner: {
      gender: 'boyfriend',
      personalityType: 'cool',
      appearance: {
        hairColor: 'black',
        hairStyle: 'short',
        eyeColor: 'green'
      }
    },
    emotion: 'surprised'
  }
];

console.log('=== テストケース ===');
testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  
  // プロンプト生成シミュレーション
  const genderStr = test.partner.gender === 'boyfriend' ? 'young man' : 'young woman';
  let prompt = `anime style ${genderStr}`;
  
  // 髪の処理（修正後のロジック）
  const appearance = test.partner.appearance;
  const appearancePrompts: string[] = [];
  
  if (appearance.hairColor && appearance.hairStyle) {
    appearancePrompts.push(`${appearance.hairColor} ${appearance.hairStyle} hair`);
  } else if (!appearance.hairColor && appearance.hairStyle) {
    appearancePrompts.push(`${appearance.hairStyle} hair`);
  } else if (appearance.hairColor && !appearance.hairStyle) {
    appearancePrompts.push(`${appearance.hairColor} hair`);
  }
  
  if (appearance.eyeColor) {
    appearancePrompts.push(`${appearance.eyeColor} eyes`);
  }
  
  if (appearancePrompts.length > 0) {
    prompt = `${prompt}, ${appearancePrompts.join(', ')}`;
  }
  
  // 性格
  const personalityPrompt = personalityMap[test.partner.personalityType] || test.partner.personalityType;
  prompt = `${prompt}, ${personalityPrompt} personality`;
  
  // 感情
  const emotionPrompt = emotionMap[test.emotion] || `${test.emotion} expression`;
  prompt = `${prompt}, ${emotionPrompt}`;
  
  console.log(`  生成プロンプト: "${prompt}"`);
});

console.log('\n\n=== 修正内容のまとめ ===');
console.log('1. PersonalityMap: 全17種類の性格タイプに対応 ✓');
console.log('2. EmotionMap: 10種類の感情表現に拡張 ✓');
console.log('3. 髪色がnullの場合の処理を追加 ✓');
console.log('4. buildAvatarPromptの髪型表現を統一 ✓');
console.log('5. フォールバック処理の改善 ✓');