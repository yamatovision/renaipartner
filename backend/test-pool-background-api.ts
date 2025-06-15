import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testPoolBackground() {
  try {
    console.log('=== Pool背景テスト開始 ===');
    
    // 背景画像APIを呼び出し
    const response = await axios.get(`${API_URL}/api/images/backgrounds`);
    const backgrounds = response.data.data;
    
    console.log('取得した背景の総数:', backgrounds.length);
    
    // pool関連の背景を抽出
    const poolBackgrounds = backgrounds.filter((bg: any) => bg.id.includes('pool'));
    console.log('\npool関連の背景:');
    poolBackgrounds.forEach((bg: any) => {
      console.log(`- ID: ${bg.id}, 名前: ${bg.name}, URL: ${bg.url}`);
    });
    
    // pool_afternoonが存在するか確認
    const poolAfternoon = backgrounds.find((bg: any) => bg.id === 'pool_afternoon');
    if (poolAfternoon) {
      console.log('\n✅ pool_afternoonが見つかりました:');
      console.log(JSON.stringify(poolAfternoon, null, 2));
    } else {
      console.log('\n❌ pool_afternoonが見つかりません');
    }
    
    // locationIdがpoolの背景を確認
    const poolLocationBackgrounds = backgrounds.filter((bg: any) => bg.locationId === 'pool');
    console.log('\nlocationIdがpoolの背景:', poolLocationBackgrounds.length);
    poolLocationBackgrounds.forEach((bg: any) => {
      console.log(`- ${bg.id}`);
    });
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testPoolBackground();