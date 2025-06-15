import dotenv from 'dotenv';
import path from 'path';

// 環境変数を読み込み
dotenv.config({ path: path.join(__dirname, '.env') });

// Leonardo AI APIを直接呼び出すテスト
async function testLeonardoAPI() {
  console.log('=== Leonardo AI API テスト ===\n');
  
  const apiKey = process.env.LEONARDO_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ LEONARDO_AI_API_KEY が設定されていません');
    return;
  }
  
  console.log('✅ API Key が設定されています');
  
  // 以前の実装で生成されていたプロンプト形式
  const testPrompts = [
    {
      name: 'カフェでの幸せな表情（完全な英語プロンプト）',
      prompt: 'anime style young woman, brown long hair, green eyes, gentle personality, happy expression with warm expressive, direct friendly gaze, open comfortable posture, wearing casual date outfit, cute and comfortable, date night style, in cafe setting, warm and trusting atmosphere, high quality anime artwork, consistent character design'
    },
    {
      name: 'シンプルなテスト（短いプロンプト）',
      prompt: 'anime style young woman, brown hair, green eyes, happy expression, cafe setting, high quality'
    },
    {
      name: '日本語が含まれる問題のあるプロンプト',
      prompt: 'anime style 君を思って作った画像, happy mood'
    }
  ];
  
  for (const test of testPrompts) {
    console.log(`\n📝 テスト: ${test.name}`);
    console.log(`プロンプト: ${test.prompt}`);
    console.log(`文字数: ${test.prompt.length}`);
    
    try {
      const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: test.prompt,
          modelId: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8',
          width: 512,
          height: 512,
          guidanceScale: 5,
          num_images: 1,
          public: false,
        }),
      });
      
      const responseText = await response.text();
      console.log(`\nステータス: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error('❌ エラーレスポンス:', responseText);
        
        // エラーの詳細を解析
        try {
          const errorData = JSON.parse(responseText);
          console.error('エラー詳細:', JSON.stringify(errorData, null, 2));
        } catch {
          console.error('レスポンスのパースに失敗');
        }
      } else {
        const result = JSON.parse(responseText);
        console.log('✅ 成功! Generation ID:', result.sdGenerationJob?.generationId);
        console.log('レスポンス:', JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      console.error('❌ リクエストエラー:', error);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// パラメータ検証テスト
async function testAPIParameters() {
  console.log('\n\n=== Leonardo AI API パラメータ検証 ===\n');
  
  const apiKey = process.env.LEONARDO_AI_API_KEY;
  if (!apiKey) return;
  
  // 最小限のパラメータでテスト
  const minimalRequest = {
    prompt: 'anime girl portrait',
    modelId: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8',
    width: 512,
    height: 512
  };
  
  console.log('最小限のリクエスト:', JSON.stringify(minimalRequest, null, 2));
  
  try {
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalRequest),
    });
    
    const responseText = await response.text();
    console.log(`\nステータス: ${response.status}`);
    
    if (!response.ok) {
      console.error('❌ エラー:', responseText);
    } else {
      console.log('✅ 成功!');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// テスト実行
(async () => {
  await testLeonardoAPI();
  await testAPIParameters();
  console.log('\n✅ すべてのテストが完了しました');
})();