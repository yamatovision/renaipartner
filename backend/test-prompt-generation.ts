// プロンプト生成ロジックのテスト（実際のAPI呼び出しはなし）

// モックパートナーデータ
const mockPartner = {
  id: 'test-partner-id',
  userId: 'test-user-id', 
  name: 'テストパートナー',
  gender: 'girlfriend',
  personalityType: 'gentle',
  speechStyle: 'polite',
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

// buildLocationAwareChatPromptのロジックを直接実装
function buildLocationAwareChatPrompt(request: any, partner: any): string {
  console.log('[画像生成] buildLocationAwareChatPrompt 開始:', {
    requestPrompt: request.prompt,
    locationId: request.locationId,
    emotion: request.emotion,
    intimacyLevel: partner.intimacyLevel
  });
  
  // 1. 基本形 + 性別
  const genderStr = partner.gender === 'boyfriend' ? 'young man' : 'young woman';
  let prompt = `anime style ${genderStr}`;
  
  // 2. 外見特徴（髪色、髪型、目の色）
  if (partner.appearance) {
    const appearance = partner.appearance;
    const appearancePrompts: string[] = [];
    
    if (appearance.hairColor && appearance.hairStyle) {
      appearancePrompts.push(`${appearance.hairColor} ${appearance.hairStyle}`);
    }
    if (appearance.eyeColor) {
      appearancePrompts.push(`${appearance.eyeColor} eyes`);
    }
    
    if (appearancePrompts.length > 0) {
      prompt = `${prompt}, ${appearancePrompts.join(', ')}`;
    }
  }
  
  // 3. 性格（personality typeから抽出）
  const personalityMap: { [key: string]: string } = {
    'gentle': 'gentle',
    'energetic': 'energetic',
    'cool': 'cool',
    'warm': 'warm',
    'mysterious': 'mysterious'
  };
  const personalityPrompt = personalityMap[partner.personalityType] || 'gentle';
  prompt = `${prompt}, ${personalityPrompt} personality`;
  
  // 4. 感情表現
  if (request.emotion) {
    const emotionMap: { [key: string]: string } = {
      'happy': 'happy expression with warm expressive',
      'sad': 'sad expression with gentle melancholic',
      'excited': 'excited expression with energetic vibrant',
      'calm': 'calm expression with peaceful serene',
      'loving': 'loving expression with tender affectionate'
    };
    const emotionPrompt = emotionMap[request.emotion] || `${request.emotion} expression`;
    prompt = `${prompt}, ${emotionPrompt}`;
  }
  
  // 5. 親密度による表現
  const intimacyLevel = partner.intimacyLevel || 0;
  if (intimacyLevel < 40) {
    prompt = `${prompt}, polite respectful gaze, formal posture`;
  } else if (intimacyLevel < 70) {
    prompt = `${prompt}, direct friendly gaze, open comfortable posture`;
  } else {
    prompt = `${prompt}, loving intimate gaze, relaxed close posture`;
  }
  
  // 6. 服装（場所に対応）- 簡略化
  if (request.locationId) {
    const clothingMap: { [key: string]: string } = {
      'cafe': 'casual date outfit, cute and comfortable, date night style',
      'beach': 'beach wear, summer style',
      'park': 'casual outdoor wear, comfortable style',
      'gym': 'sports wear, athletic style',
      'school': 'school uniform'
    };
    const clothing = clothingMap[request.locationId] || 'casual comfortable clothing';
    prompt = `${prompt}, wearing ${clothing}`;
    
    // 7. 場所設定
    prompt = `${prompt}, in ${request.locationId} setting`;
  }
  
  // 8. 親密度による雰囲気
  if (intimacyLevel < 40) {
    prompt = `${prompt}, professional formal atmosphere`;
  } else if (intimacyLevel < 70) {
    prompt = `${prompt}, warm and trusting atmosphere`;
  } else {
    prompt = `${prompt}, intimate loving atmosphere`;
  }
  
  // 9. 品質指定（固定）
  prompt = `${prompt}, high quality anime artwork, consistent character design`;
  
  console.log('[画像生成] buildLocationAwareChatPrompt 最終プロンプト:', prompt);
  return prompt;
}

// テストケース
const testCases = [
  {
    name: 'カフェでの幸せな表情',
    request: {
      partnerId: mockPartner.id,
      prompt: '君を思って作った画像',
      context: 'カフェでデート中',
      emotion: 'happy',
      locationId: 'cafe',
      season: 'spring',
      gender: 'girlfriend'
    }
  },
  {
    name: 'ビーチでの興奮した表情',
    request: {
      partnerId: mockPartner.id,
      prompt: '今日のデート',
      context: 'ビーチで遊んでいる',
      emotion: 'excited',
      locationId: 'beach',
      season: 'summer',
      gender: 'girlfriend'
    }
  },
  {
    name: '公園での穏やかな表情',
    request: {
      partnerId: mockPartner.id,
      prompt: 'おはよう',
      context: '朝の散歩',
      emotion: 'calm',
      locationId: 'park',
      season: 'autumn',
      gender: 'girlfriend'
    }
  }
];

console.log('=== 画像生成プロンプトテスト開始 ===\n');

// テスト実行
for (const testCase of testCases) {
  console.log(`\n📍 テストケース: ${testCase.name}`);
  console.log('リクエストパラメータ:', JSON.stringify(testCase.request, null, 2));
  
  const prompt = buildLocationAwareChatPrompt(testCase.request, mockPartner);
  
  console.log('\n✅ 生成されたプロンプト:');
  console.log(prompt);
  
  // プロンプトの各要素をチェック
  const checks = {
    '基本形': prompt.includes('anime style young woman'),
    '外見特徴': prompt.includes('brown long') && prompt.includes('green eyes'),
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
  
  console.log('\n' + '='.repeat(80));
}

// 親密度別のテストも実行
console.log('\n\n=== 親密度レベル別テスト ===\n');

const intimacyLevels = [20, 50, 80];

for (const level of intimacyLevels) {
  const testPartner = { ...mockPartner, intimacyLevel: level };
  const request = {
    partnerId: testPartner.id,
    prompt: '愛してるよ💕',
    context: 'カフェでデート',
    emotion: 'happy',
    locationId: 'cafe',
    season: 'spring',
    gender: 'girlfriend'
  };
  
  console.log(`\n💕 親密度レベル: ${level}`);
  
  const prompt = buildLocationAwareChatPrompt(request, testPartner);
  
  // 親密度に関連する部分を抽出して表示
  const gazeMatch = prompt.match(/(\w+\s+\w+\s+gaze)/);
  const postureMatch = prompt.match(/(\w+\s+\w*\s*posture)/);
  const atmosphereMatch = prompt.match(/(\w+\s+\w*\s*atmosphere)/);
  
  console.log('  視線表現:', gazeMatch ? gazeMatch[1] : '見つかりません');
  console.log('  姿勢表現:', postureMatch ? postureMatch[1] : '見つかりません');
  console.log('  雰囲気:', atmosphereMatch ? atmosphereMatch[1] : '見つかりません');
}

console.log('\n✅ すべてのテストが完了しました');