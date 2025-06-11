'use client'

import { useState, useEffect } from 'react'
import { Gender, AppearanceSettings } from '@/types'
import { CircularProgress } from '@mui/material'

interface Step7AppearanceProps {
  partnerName: string
  gender: Gender
  appearance: AppearanceSettings
  onUpdate: (appearance: AppearanceSettings) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step7Appearance({ 
  partnerName, 
  gender, 
  appearance, 
  onUpdate, 
  onNext, 
  onPrevious 
}: Step7AppearanceProps) {
  const [isGenerating, setIsGenerating] = useState(true)
  
  useEffect(() => {
    // 画像生成のシミュレーション
    const timer = setTimeout(() => {
      setIsGenerating(false)
      // モック画像URLを設定
      onUpdate({
        ...appearance,
        generatedImageUrl: '/api/placeholder/180/180'
      })
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleChange = (field: keyof AppearanceSettings, value: string) => {
    onUpdate({
      ...appearance,
      [field]: value
    })
    // 実際の実装では、ここで画像を再生成
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
        {partnerName}の理想の見た目を作りましょう
      </h2>
      <p className="text-gray-600 text-center mb-8">
        選択した性別・性格に合う外見を自動生成し、お好みに調整できます
      </p>
      
      {/* アバタープレビュー */}
      <div className="flex justify-center mb-8">
        <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-pink-500 shadow-lg bg-gray-100 flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center">
              <CircularProgress className="text-pink-500 mb-2" />
              <p className="text-sm text-gray-600">生成中...</p>
            </div>
          ) : (
            <div className="w-full h-full bg-pink-200 flex items-center justify-center">
              <span className="text-6xl">
                {gender === 'boyfriend' ? '👨' : '👩'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* カスタマイズオプション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">髪型</label>
          <select
            value={appearance.hairStyle || 'medium'}
            onChange={(e) => handleChange('hairStyle', e.target.value)}
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
            onChange={(e) => handleChange('eyeColor', e.target.value)}
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
            onChange={(e) => handleChange('bodyType', e.target.value)}
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
            onChange={(e) => handleChange('clothingStyle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
          >
            <option value="casual">カジュアル</option>
            <option value="formal">フォーマル</option>
            <option value="sporty">スポーティ</option>
            <option value="elegant">エレガント</option>
          </select>
        </div>
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
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full font-medium hover:opacity-90 transition-all"
        >
          次へ
        </button>
      </div>
    </>
  )
}