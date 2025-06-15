// プロンプトのエンコーディングをテスト

const testPrompts = [
  '君を思って作った画像',
  'thinking of you',
  'anime style 君を思って作った画像, happy mood',
  'anime style thinking of you, happy mood',
  'anime style young woman, brown long hair, green eyes'
];

console.log('=== プロンプトエンコーディングテスト ===\n');

for (const prompt of testPrompts) {
  console.log(`プロンプト: "${prompt}"`);
  console.log(`文字数: ${prompt.length}`);
  console.log(`バイト数: ${Buffer.byteLength(prompt, 'utf-8')}`);
  
  // URLエンコード
  console.log(`URLエンコード: ${encodeURIComponent(prompt)}`);
  
  // 非ASCII文字の検出
  const hasNonAscii = /[^\x00-\x7F]/.test(prompt);
  console.log(`非ASCII文字を含む: ${hasNonAscii ? 'はい' : 'いいえ'}`);
  
  if (hasNonAscii) {
    const nonAsciiChars = prompt.match(/[^\x00-\x7F]/g);
    console.log(`非ASCII文字: ${nonAsciiChars?.join(', ')}`);
  }
  
  console.log('---\n');
}

// Leonardo AI APIが期待するフォーマット
console.log('=== 推奨されるプロンプト形式 ===');
console.log('1. 英語のみを使用');
console.log('2. 特殊文字や絵文字を避ける');
console.log('3. 明確で具体的な記述');
console.log('4. カンマで要素を区切る');

// 修正案
console.log('\n=== 日本語プロンプトの英語変換マッピング ===');
const japaneseToEnglish = {
  '君を思って作った画像': 'thinking of you',
  '愛してるよ💕': 'with love',
  '今日のデート': 'on a date',
  'おはよう': 'good morning',
  'おやすみ': 'good night',
  '会いたい': 'miss you',
  'ありがとう': 'thank you',
  '大好き': 'love you so much'
};

console.log(JSON.stringify(japaneseToEnglish, null, 2));