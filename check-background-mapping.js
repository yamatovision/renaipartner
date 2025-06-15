const fs = require('fs');
const path = require('path');

// バックエンドの背景データを読み込む
const backgroundsDataPath = './backend/src/features/images/backgrounds-data.ts';
const backgroundsDataContent = fs.readFileSync(backgroundsDataPath, 'utf-8');

// 背景IDとURLのマッピングを抽出
const backgroundMappings = [];
const idPattern = /id:\s*'([^']+)'/g;
const urlPattern = /url:\s*'([^']+)'/g;

// すべてのIDを抽出
const ids = [...backgroundsDataContent.matchAll(idPattern)].map(match => match[1]);
// すべてのURLを抽出
const urls = [...backgroundsDataContent.matchAll(urlPattern)].map(match => match[1]);

// IDとURLをペアリング
for (let i = 0; i < ids.length && i < urls.length; i++) {
  backgroundMappings.push({
    id: ids[i],
    url: urls[i],
    fullPath: path.join('./frontend/public', urls[i])
  });
}

console.log('=== 背景画像マッピング確認レポート ===\n');
console.log(`総背景数: ${backgroundMappings.length}\n`);

// カテゴリ別に整理
const categories = {};
let missingFiles = [];
let existingFiles = [];

backgroundMappings.forEach(mapping => {
  // URLからカテゴリを抽出
  const urlParts = mapping.url.split('/');
  const category = urlParts[urlParts.length - 2]; // backgrounds/[category]/filename.jpg
  
  if (!categories[category]) {
    categories[category] = { existing: [], missing: [] };
  }
  
  // ファイルの存在確認
  const exists = fs.existsSync(mapping.fullPath);
  
  if (exists) {
    categories[category].existing.push(mapping);
    existingFiles.push(mapping);
  } else {
    categories[category].missing.push(mapping);
    missingFiles.push(mapping);
  }
});

// カテゴリ別レポート
console.log('【カテゴリ別の状況】');
Object.keys(categories).sort().forEach(category => {
  const cat = categories[category];
  const total = cat.existing.length + cat.missing.length;
  console.log(`\n${category}: ${cat.existing.length}/${total} 存在`);
  
  if (cat.missing.length > 0) {
    console.log('  ❌ 見つからない画像:');
    cat.missing.forEach(m => {
      console.log(`     - ${m.id}: ${m.url}`);
    });
  }
});

// 問題のある場所の詳細確認
console.log('\n【特に問題のある場所の詳細】');
const problemLocations = ['gym', 'pool', 'restaurant', 'spa'];

problemLocations.forEach(location => {
  console.log(`\n${location}関連の背景:`);
  const relatedBackgrounds = backgroundMappings.filter(m => m.id.includes(location));
  
  relatedBackgrounds.forEach(bg => {
    const exists = fs.existsSync(bg.fullPath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${bg.id}: ${bg.url}`);
    if (exists) {
      const stats = fs.statSync(bg.fullPath);
      console.log(`     サイズ: ${(stats.size / 1024).toFixed(2)} KB`);
    }
  });
});

// サマリー
console.log('\n【サマリー】');
console.log(`✅ 存在する画像: ${existingFiles.length}/${backgroundMappings.length}`);
console.log(`❌ 見つからない画像: ${missingFiles.length}/${backgroundMappings.length}`);

if (missingFiles.length > 0) {
  console.log('\n【修正が必要な背景データ】');
  missingFiles.forEach(m => {
    console.log(`- ${m.id}: ${m.url}`);
  });
}

// フロントエンドの実際のファイル構造を確認
console.log('\n【実際のファイル構造】');
const backgroundsDir = './frontend/public/images/backgrounds';

function listFiles(dir, indent = '') {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        console.log(`${indent}📁 ${item}/`);
        listFiles(fullPath, indent + '  ');
      } else if (item.endsWith('.jpg') || item.endsWith('.png')) {
        const relativePath = fullPath.replace('./frontend/public', '');
        const isUsed = backgroundMappings.some(m => m.url === relativePath);
        const status = isUsed ? '✅' : '⚠️ ';
        console.log(`${indent}${status} ${item}`);
      }
    });
  } catch (err) {
    console.log(`${indent}❌ ディレクトリが見つかりません: ${dir}`);
  }
}

listFiles(backgroundsDir);

// 使われていない画像ファイルを特定
console.log('\n【使われていない画像ファイル】');
function findUnusedImages(dir) {
  const unused = [];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          scan(fullPath);
        } else if (item.endsWith('.jpg') || item.endsWith('.png')) {
          // Windowsパス区切り文字をUnix形式に変換
          const relativePath = fullPath.replace(/\\/g, '/').replace('./frontend/public', '');
          const isUsed = backgroundMappings.some(m => m.url === relativePath);
          if (!isUsed && !item.includes('README')) {
            unused.push(relativePath);
          }
        }
      });
    } catch (err) {
      // エラーは無視
    }
  }
  
  scan(dir);
  return unused;
}

const unusedImages = findUnusedImages(backgroundsDir);
console.log(`未使用画像数: ${unusedImages.length}`);

// 追加: URLパスの詳細比較
console.log('\n【URLパスの詳細確認（gym関連）】');
const gymBackgrounds = backgroundMappings.filter(m => m.id.includes('gym'));
gymBackgrounds.forEach(bg => {
  console.log(`ID: ${bg.id}`);
  console.log(`  設定されたURL: ${bg.url}`);
  console.log(`  ファイル存在: ${fs.existsSync(bg.fullPath) ? '✅' : '❌'}`);
});