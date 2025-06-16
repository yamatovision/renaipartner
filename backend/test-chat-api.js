#!/usr/bin/env node

/**
 * Chat API 実際のエンドポイントテスト
 * 実際のサーバーを起動して会話APIをテストします
 */

const axios = require('axios');
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

const API_BASE = 'http://localhost:8080';

async function testServerConnection() {
  try {
    info('サーバー接続をテスト中...');
    const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    success('サーバー接続成功');
    return true;
  } catch (err) {
    error(`サーバー接続失敗: ${err.message}`);
    error('サーバーが起動していることを確認してください: npm run dev');
    return false;
  }
}

async function createTestUser() {
  try {
    info('テストユーザーを作成中...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const userData = {
      email: testEmail,
      password: 'testpassword123',
      surname: 'テスト',
      firstName: '太郎',
      birthday: '1990-01-01'
    };
    
    // 管理者権限でユーザーを作成
    const response = await axios.post(`${API_BASE}/api/users`, userData, {
      headers: { 
        'Authorization': 'Bearer dummy-admin-token', // 開発環境では管理者権限をスキップ
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      success('テストユーザー作成成功');
      
      // 作成したユーザーでログイン
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testEmail,
        password: 'testpassword123'
      });
      
      if (loginResponse.data.success) {
        return {
          user: loginResponse.data.user,
          accessToken: loginResponse.data.accessToken
        };
      } else {
        throw new Error(loginResponse.data.error || 'ログイン失敗');
      }
    } else {
      throw new Error(response.data.error || 'ユーザー作成失敗');
    }
  } catch (err) {
    error(`テストユーザー作成エラー: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function createTestPartner(accessToken) {
  try {
    info('テストパートナーを作成中...');
    
    const partnerData = {
      name: 'テストパートナー',
      gender: 'girlfriend',
      personalityType: 'gentle',
      speechStyle: 'polite',
      systemPrompt: 'あなたは優しいAIパートナーです。',
      avatarDescription: 'テスト用の美しいパートナー',
      appearance: {
        hairStyle: 'long',
        eyeColor: 'brown',
        bodyType: 'normal',
        clothingStyle: 'casual'
      },
      hobbies: ['読書', '映画鑑賞'],
      intimacyLevel: 30
    };
    
    const response = await axios.post(`${API_BASE}/api/partners`, partnerData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      success('テストパートナー作成成功');
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'パートナー作成失敗');
    }
  } catch (err) {
    error(`テストパートナー作成エラー: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function testChatWithOpenAI(accessToken, partnerId) {
  try {
    info('OpenAI（デフォルト設定）での会話テスト...');
    
    const messageData = {
      message: 'こんにちは！これはOpenAIでのテストメッセージです。',
      partnerId: partnerId
    };
    
    const response = await axios.post(`${API_BASE}/api/chat/messages`, messageData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      success(`OpenAI会話テスト成功: ${response.data.data.response.substring(0, 50)}...`);
      info(`感情: ${response.data.data.emotion}, 親密度: ${response.data.data.intimacyLevel}`);
      return true;
    } else {
      throw new Error(response.data.error || '会話テスト失敗');
    }
  } catch (err) {
    error(`OpenAI会話テストエラー: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function updateAIModelToClaude(accessToken) {
  try {
    info('AIモデル設定をClaudeに変更中...');
    
    const settingsData = {
      userSettings: {
        aiModel: {
          provider: 'claude',
          model: 'claude-3-haiku-20240307',
          temperature: 0.8,
          maxTokens: 2000
        }
      }
    };
    
    const response = await axios.put(`${API_BASE}/api/settings`, settingsData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      success('AIモデル設定変更成功 (Claude)');
      return true;
    } else {
      throw new Error(response.data.error || '設定変更失敗');
    }
  } catch (err) {
    error(`AIモデル設定変更エラー: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function testChatWithClaude(accessToken, partnerId) {
  try {
    info('Claude設定での会話テスト...');
    
    const messageData = {
      message: 'こんにちは！これはClaudeでのテストメッセージです。',
      partnerId: partnerId
    };
    
    const response = await axios.post(`${API_BASE}/api/chat/messages`, messageData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      success(`Claude会話テスト成功: ${response.data.data.response.substring(0, 50)}...`);
      info(`感情: ${response.data.data.emotion}, 親密度: ${response.data.data.intimacyLevel}`);
      return true;
    } else {
      throw new Error(response.data.error || '会話テスト失敗');
    }
  } catch (err) {
    error(`Claude会話テストエラー: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function runChatAPITest() {
  log('🚀 Chat API 統合テスト開始', colors.bold);
  log(`実行時刻: ${new Date().toLocaleString()}`, colors.blue);
  
  const results = {
    serverConnection: false,
    userCreation: false,
    partnerCreation: false,
    openaiChat: false,
    modelUpdate: false,
    claudeChat: false
  };
  
  // 1. サーバー接続テスト
  results.serverConnection = await testServerConnection();
  if (!results.serverConnection) {
    log('\n❌ サーバーが起動していません。テストを中止します。', colors.red);
    return false;
  }
  
  // 2. テストユーザー作成
  const userInfo = await createTestUser();
  results.userCreation = !!userInfo;
  
  if (!userInfo) {
    log('\n❌ テストユーザーの作成に失敗しました。テストを中止します。', colors.red);
    return false;
  }
  
  const { accessToken } = userInfo;
  
  // 3. テストパートナー作成
  const partner = await createTestPartner(accessToken);
  results.partnerCreation = !!partner;
  
  if (!partner) {
    log('\n❌ テストパートナーの作成に失敗しました。テストを中止します。', colors.red);
    return false;
  }
  
  // 4. OpenAI での会話テスト
  results.openaiChat = await testChatWithOpenAI(accessToken, partner.id);
  
  // 5. AIモデル設定をClaudeに変更
  results.modelUpdate = await updateAIModelToClaude(accessToken);
  
  // 6. Claude での会話テスト
  if (results.modelUpdate) {
    results.claudeChat = await testChatWithClaude(accessToken, partner.id);
  }
  
  // 結果まとめ
  log('\n=== Chat API テスト結果 ===', colors.bold);
  
  Object.entries(results).forEach(([test, passed]) => {
    const testNames = {
      serverConnection: 'サーバー接続',
      userCreation: 'ユーザー作成',
      partnerCreation: 'パートナー作成',
      openaiChat: 'OpenAI会話',
      modelUpdate: 'モデル設定変更',
      claudeChat: 'Claude会話'
    };
    
    if (passed) {
      success(`${testNames[test]}: PASS`);
    } else {
      error(`${testNames[test]}: FAIL`);
    }
  });
  
  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log(`\n📊 総合結果: ${totalPassed}/${totalTests} テスト通過`, 
      totalPassed === totalTests ? colors.green : colors.yellow);
  
  if (results.openaiChat && results.claudeChat) {
    success('🎉 OpenAI と Claude の両方で会話が成功しました！モデル切り替えが正常に動作しています！');
  } else if (results.openaiChat) {
    success('✅ OpenAI での会話が成功しました');
    if (!results.claudeChat) {
      error('Claude での会話でエラーが発生しました');
    }
  } else {
    error('会話テストが失敗しました');
  }
  
  return results.openaiChat && results.claudeChat;
}

// スクリプト実行
if (require.main === module) {
  runChatAPITest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      error(`予期しないエラー: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runChatAPITest };