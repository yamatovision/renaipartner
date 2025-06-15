// Pool背景問題のデバッグ用テストコード

export function debugPoolBackground(availableBackgrounds: any[]) {
  console.log('=== Pool背景デバッグ開始 ===');
  console.log('利用可能な背景の総数:', availableBackgrounds.length);
  
  // pool関連の背景を検索
  const poolBackgrounds = availableBackgrounds.filter(bg => 
    bg.id.toLowerCase().includes('pool')
  );
  
  console.log('\npool関連の背景:', poolBackgrounds.length, '件');
  poolBackgrounds.forEach(bg => {
    console.log(`- ID: ${bg.id}, 名前: ${bg.name || 'N/A'}, カテゴリ: ${bg.category || 'N/A'}`);
  });
  
  // pool_afternoonを探す
  const poolAfternoon = availableBackgrounds.find(bg => bg.id === 'pool_afternoon');
  if (poolAfternoon) {
    console.log('\n✅ pool_afternoonが見つかりました:');
    console.log(poolAfternoon);
  } else {
    console.log('\n❌ pool_afternoonが見つかりません');
    
    // 似た名前の背景を探す
    const similarBackgrounds = availableBackgrounds.filter(bg => 
      bg.id.toLowerCase().includes('pool') || 
      bg.id.toLowerCase().includes('swim') ||
      bg.id.toLowerCase().includes('water')
    );
    
    console.log('\n類似の背景:', similarBackgrounds.length, '件');
    similarBackgrounds.forEach(bg => {
      console.log(`- ${bg.id}`);
    });
  }
  
  // 最初の10個の背景IDを表示
  console.log('\n最初の10個の背景ID:');
  availableBackgrounds.slice(0, 10).forEach(bg => {
    console.log(`- ${bg.id}`);
  });
  
  console.log('=== デバッグ終了 ===');
}