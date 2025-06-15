// 実際のコードから抜粋した最小限のLeonardo AI APIテスト

// プロンプトのテスト（全て英語）
async function testLeonardoPrompts() {
  console.log('=== Leonardo AI プロンプトテスト ===\n');
  
  // 修正されたプロンプト生成（実際のコードと同じロジック）
  const partner = {
    gender: 'girlfriend',
    personalityType: 'gentle',
    appearance: {
      hairColor: 'brown',
      hairStyle: 'long',
      eyeColor: 'green'
    },
    intimacyLevel: 60
  };
  
  const request = {
    emotion: 'happy',
    locationId: 'cafe'
  };
  
  // プロンプト生成
  const genderStr = partner.gender === 'boyfriend' ? 'young man' : 'young woman';
  let prompt = `anime style ${genderStr}`;
  
  // 外見特徴
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
  
  // 性格
  const personalityMap: { [key: string]: string } = {
    'gentle': 'gentle',
    'energetic': 'energetic',
    'cool': 'cool',
    'warm': 'warm',
    'mysterious': 'mysterious'
  };
  const personalityPrompt = personalityMap[partner.personalityType] || 'gentle';
  prompt = `${prompt}, ${personalityPrompt} personality`;
  
  // 感情表現
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
  
  // 親密度による表現
  const intimacyLevel = partner.intimacyLevel || 0;
  if (intimacyLevel < 40) {
    prompt = `${prompt}, polite respectful gaze, formal posture`;
  } else if (intimacyLevel < 70) {
    prompt = `${prompt}, direct friendly gaze, open comfortable posture`;
  } else {
    prompt = `${prompt}, loving intimate gaze, relaxed close posture`;
  }
  
  // 服装（場所に対応）
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
    prompt = `${prompt}, in ${request.locationId} setting`;
  }
  
  // 親密度による雰囲気
  if (intimacyLevel < 40) {
    prompt = `${prompt}, professional formal atmosphere`;
  } else if (intimacyLevel < 70) {
    prompt = `${prompt}, warm and trusting atmosphere`;
  } else {
    prompt = `${prompt}, intimate loving atmosphere`;
  }
  
  // 品質指定（固定）
  prompt = `${prompt}, high quality anime artwork, consistent character design`;
  
  console.log('生成されたプロンプト:');
  console.log(prompt);
  console.log(`\n文字数: ${prompt.length}`);
  console.log(`非ASCII文字を含む: ${/[^\x00-\x7F]/.test(prompt) ? 'はい' : 'いいえ'}`);
  
  return prompt;
}

// 実行
testLeonardoPrompts();