'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gender, AppearanceSettings, PersonalityType } from '@/types'
import { CircularProgress } from '@mui/material'
import Image from 'next/image'
import { imagesService } from '@/services'

interface Step7AppearanceProps {
  partnerName: string
  gender: Gender
  appearance: AppearanceSettings
  personality: PersonalityType
  onUpdate: (appearance: AppearanceSettings) => void
  onNext: () => void
  onPrevious: () => void
}

// 髪色パレット
const hairColorPalette = [
  { value: '#000000', label: '黒', english: 'black' },
  { value: '#3B2F2F', label: 'ダークブラウン', english: 'dark brown' },
  { value: '#8B4513', label: 'ブラウン', english: 'brown' },
  { value: '#FFD700', label: 'ブロンド', english: 'blonde' },
  { value: '#FF6B6B', label: 'ピンク', english: 'pink' },
  { value: '#4ECDC4', label: '水色', english: 'light blue' },
  { value: '#95E1D3', label: 'ミントグリーン', english: 'mint green' },
  { value: '#C7CEEA', label: 'ラベンダー', english: 'lavender' },
  { value: '#FFEAA7', label: 'ライトゴールド', english: 'light gold' },
  { value: '#636E72', label: 'シルバー', english: 'silver' }
]

// 日本語の髪色を英語に変換
const getHairColorEnglish = (japaneseColor: string): string => {
  const colorMap = hairColorPalette.find(color => color.label === japaneseColor)
  return colorMap?.english || 'brown'
}

// 名前タイプ判定
const getNameType = (name: string): 'japanese' | 'western' | 'anime' => {
  if (/^[ぁ-んァ-ヶー]+$/.test(name)) return 'japanese'
  if (/^[ァ-ヶー]+$/.test(name)) return 'western'
  if (['キリト', 'リヴァイ', 'レム', 'エミリア', 'ルルーシュ', 'かぐや', 'あすな'].includes(name)) return 'anime'
  return 'japanese'
}

// 性格タイプによる外見特徴マッピング
const personalityAppearanceMap: Record<PersonalityType, { style: string; atmosphere: string }> = {
  [PersonalityType.GENTLE]: { style: 'soft and warm appearance', atmosphere: 'kind gentle expression' },
  [PersonalityType.COOL]: { style: 'sharp and stylish appearance', atmosphere: 'cool confident expression' },
  [PersonalityType.CHEERFUL]: { style: 'bright and energetic appearance', atmosphere: 'cheerful happy expression' },
  [PersonalityType.TSUNDERE]: { style: 'cute but strong appearance', atmosphere: 'slightly blushing expression' },
  [PersonalityType.SWEET]: { style: 'adorable and sweet appearance', atmosphere: 'loving tender expression' },
  [PersonalityType.RELIABLE]: { style: 'mature and dependable appearance', atmosphere: 'trustworthy expression' },
  [PersonalityType.CLINGY]: { style: 'cute and affectionate appearance', atmosphere: 'loving puppy-eyes expression' },
  [PersonalityType.GENIUS]: { style: 'intellectual appearance with glasses', atmosphere: 'intelligent thoughtful expression' },
  [PersonalityType.CHILDHOOD]: { style: 'familiar and nostalgic appearance', atmosphere: 'warm friendly expression' },
  [PersonalityType.SPORTS]: { style: 'athletic and energetic appearance', atmosphere: 'confident sporty expression' },
  [PersonalityType.ARTIST]: { style: 'creative and unique appearance', atmosphere: 'artistic dreamy expression' },
  [PersonalityType.COOKING]: { style: 'homely warm appearance', atmosphere: 'caring nurturing expression' },
  [PersonalityType.MYSTERIOUS]: { style: 'enigmatic and alluring appearance', atmosphere: 'mysterious captivating expression' },
  [PersonalityType.PRINCE]: { style: 'elegant noble appearance', atmosphere: 'princely graceful expression' },
  [PersonalityType.OTAKU]: { style: 'casual otaku fashion', atmosphere: 'passionate enthusiastic expression' },
  [PersonalityType.YOUNGER]: { style: 'youthful cute appearance', atmosphere: 'playful innocent expression' },
  [PersonalityType.BAND]: { style: 'cool musician appearance', atmosphere: 'charismatic rock-star expression' }
}

// プレースホルダーコンポーネント
const AvatarPlaceholder = () => (
  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center animate-pulse">
    <div className="text-center">
      <div className="mb-4">
        <svg className="w-16 h-16 mx-auto text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-600">AIがアバターを生成中...</p>
      <div className="mt-2 flex justify-center gap-1">
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  </div>
)

export function Step7Appearance({ 
  partnerName, 
  gender, 
  appearance, 
  personality,
  onUpdate, 
  onNext, 
  onPrevious 
}: Step7AppearanceProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [imageHistory, setImageHistory] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [error, setError] = useState<string>('')
  
  // 画像生成プロンプト構築
  const generateImagePrompt = useCallback(() => {
    const nameType = getNameType(partnerName)
    const personalityFeatures = personalityAppearanceMap[personality] || personalityAppearanceMap[PersonalityType.GENTLE]
    
    let prompt = `anime style ${gender === Gender.BOYFRIEND ? 'handsome young man' : 'beautiful young woman'}, `
    
    // 名前タイプに応じた特徴
    if (nameType === 'western') {
      prompt += 'western features, '
    } else if (nameType === 'anime') {
      prompt += 'fantasy anime character style, '
    }
    
    // 外見設定（英語に変換）
    const hairColorEnglish = appearance.hairColor ? getHairColorEnglish(appearance.hairColor) : 'brown'
    prompt += `hair: ${hairColorEnglish} ${appearance.hairStyle}, `
    prompt += `eyes: ${appearance.eyeColor} eyes, `
    prompt += `${personalityFeatures.style}, `
    prompt += `${personalityFeatures.atmosphere}, `
    prompt += `wearing ${appearance.clothingStyle} outfit, `
    prompt += 'high quality anime artwork, consistent character design, clean background'
    
    return prompt
  }, [partnerName, gender, appearance, personality])
  
  // 画像生成関数
  const generateImage = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    
    try {
      const prompt = generateImagePrompt()
      console.log('Generating image with prompt:', prompt)
      
      // オンボーディング用のエンドポイントを使用（partnerIdなし）
      const response = await imagesService.generateOnboardingAvatar({
        prompt,
        context: `${partnerName} avatar generation`,
        emotion: 'neutral',
        width: 512,
        height: 512
      })
      
      if (response.success && response.data) {
        const newImage = response.data.imageUrl
        const newHistory = [...imageHistory, newImage]
        setImageHistory(newHistory)
        setCurrentImageIndex(newHistory.length - 1)
        setGenerationCount(prev => prev + 1)
        
        onUpdate({
          ...appearance,
          generatedImageUrl: newImage
        })
      } else {
        throw new Error(response.error || '画像生成に失敗しました')
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
      setError('画像生成に失敗しました。もう一度お試しください。')
      
      // デモ用のフォールバック画像
      const demoImage = gender === Gender.BOYFRIEND 
        ? '/asset/Leonardo_Anime_XL_anime_style_handsome_young_man_intelligent_2.jpg'
        : '/asset/Leonardo_Anime_XL_anime_style_beautiful_young_woman_short_pal_0.jpg'
      
      const newHistory = [...imageHistory, demoImage]
      setImageHistory(newHistory)
      setCurrentImageIndex(newHistory.length - 1)
      setGenerationCount(prev => prev + 1)
      
      onUpdate({
        ...appearance,
        generatedImageUrl: demoImage
      })
    } finally {
      setIsGenerating(false)
    }
  }, [generateImagePrompt, imageHistory, appearance, onUpdate, gender, partnerName])
  
  // 初回自動生成
  useEffect(() => {
    if (generationCount === 0) {
      generateImage()
    }
  }, [generationCount, generateImage])
  
  // 外見変更ハンドラー
  const handleChange = (field: keyof AppearanceSettings, value: string) => {
    onUpdate({
      ...appearance,
      [field]: value
    })
  }
  
  // 現在の画像を選択
  const selectCurrentImage = (index: number) => {
    if (imageHistory[index]) {
      onUpdate({
        ...appearance,
        generatedImageUrl: imageHistory[index]
      })
    }
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
        {partnerName}の理想の見た目を作りましょう
      </h2>
      <p className="text-gray-600 text-center mb-8">
        選択した性格・性格に合う外見を自動生成し、お好みに調整できます
        <br />
        <span className="text-sm text-pink-500">何度でも再生成できるので、理想の見た目を見つけてください！</span>
      </p>
      
      {/* アバタープレビュー */}
      <div className="relative">
        <div className="flex justify-center mb-4">
          {imageHistory.length > 0 ? (
            <div className="relative">
              <Image
                src={imageHistory[currentImageIndex]}
                alt={`${partnerName}のアバター`}
                width={256}
                height={256}
                className="rounded-full border-4 border-pink-500 shadow-lg"
                unoptimized // 一時的にNext.jsの画像最適化を無効化
              />
              
              {/* 生成回数バッジ */}
              <div className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {generationCount}
              </div>
            </div>
          ) : (
            <AvatarPlaceholder />
          )}
        </div>
        
        {/* 履歴ナビゲーション */}
        {imageHistory.length > 1 && (
          <div className="flex justify-center items-center gap-2 mb-4">
            <button
              onClick={() => {
                const newIndex = Math.max(0, currentImageIndex - 1)
                setCurrentImageIndex(newIndex)
                selectCurrentImage(newIndex)
              }}
              disabled={currentImageIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              ←
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {currentImageIndex + 1} / {imageHistory.length}
            </span>
            <button
              onClick={() => {
                const newIndex = Math.min(imageHistory.length - 1, currentImageIndex + 1)
                setCurrentImageIndex(newIndex)
                selectCurrentImage(newIndex)
              }}
              disabled={currentImageIndex === imageHistory.length - 1}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {/* カスタマイズオプション */}
      <div className="space-y-4 mb-6">
        {/* 髪色パレット */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-3">髪の色</label>
          <div className="grid grid-cols-5 gap-2">
            {hairColorPalette.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChange('hairColor', color.label)}
                className={`
                  relative w-full h-12 rounded-lg border-2 transition-all group
                  ${appearance.hairColor === color.label 
                    ? 'border-pink-500 scale-110 shadow-lg' 
                    : 'border-gray-300 hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color.value }}
              >
                {appearance.hairColor === color.label && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-lg drop-shadow-md">✓</span>
                  </div>
                )}
                <span className="sr-only">{color.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* その他のカスタマイズオプション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">髪型</label>
            <select
              value={appearance.hairStyle || 'medium'}
              onChange={(e) => handleChange('hairStyle', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
            >
              <option value="short">ショート</option>
              <option value="medium">ミディアム</option>
              <option value="long">ロング</option>
            </select>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">目の色</label>
            <select
              value={appearance.eyeColor || 'brown'}
              onChange={(e) => handleChange('eyeColor', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
            >
              <option value="brown">ブラウン</option>
              <option value="black">ブラック</option>
              <option value="blue">ブルー</option>
              <option value="green">グリーン</option>
            </select>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">体型</label>
            <select
              value={appearance.bodyType || 'average'}
              onChange={(e) => handleChange('bodyType', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
            >
              <option value="slim">スリム</option>
              <option value="average">普通</option>
              <option value="athletic">アスリート</option>
            </select>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">服装スタイル</label>
            <select
              value={appearance.clothingStyle || 'casual'}
              onChange={(e) => handleChange('clothingStyle', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
            >
              <option value="casual">カジュアル</option>
              <option value="formal">フォーマル</option>
              <option value="sporty">スポーティ</option>
              <option value="elegant">エレガント</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* アクションボタン */}
      <div className="space-y-3 mb-6">
        <button
          onClick={generateImage}
          disabled={isGenerating}
          className={`
            w-full py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2
            ${isGenerating 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transform hover:scale-105'
            }
          `}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={20} className="text-white" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <span>🎲</span>
              <span>別のデザインを生成</span>
              {generationCount > 0 && (
                <span className="text-sm opacity-80">
                  （{generationCount}回目）
                </span>
              )}
            </>
          )}
        </button>
        
        {generationCount > 0 && (
          <p className="text-center text-sm text-gray-500">
            💡 ヒント: 気に入るまで何度でも生成できます！
          </p>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-8 py-3 border-2 border-pink-500 text-pink-500 rounded-full font-medium hover:bg-pink-50 transition-colors"
        >
          戻る
        </button>
        
        <button
          onClick={onNext}
          disabled={imageHistory.length === 0}
          className={`
            px-8 py-3 rounded-full font-medium transition-all duration-200
            ${imageHistory.length > 0
              ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:opacity-90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {imageHistory.length === 0 ? '生成完了後に進めます' : '次へ'}
        </button>
      </div>
    </>
  )
}