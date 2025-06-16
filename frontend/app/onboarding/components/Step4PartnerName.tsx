'use client'

import { useState, useEffect } from 'react'
import { Gender } from '@/types'

interface Step4PartnerNameProps {
  gender: Gender
  selectedName: string
  onSelect: (name: string) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step4PartnerName({ gender, selectedName, onSelect, onNext, onPrevious }: Step4PartnerNameProps) {
  const [namingMethod, setNamingMethod] = useState<'ai-suggest' | 'custom'>('ai-suggest')
  const [customName, setCustomName] = useState('')
  const [suggestedNames, setSuggestedNames] = useState<string[]>([])
  
  // 名前プール
  const maleNamePool = [
    // 人気の漢字系
    '蓮', '湊', '陽翔', '樹', '悠真', '大和', '颯', '陸', '晴', '翔太',
    // かっこいいイメージ系
    '流星', '優斗', '陽斗', '海斗', '蒼', '藍', '凪',
    // アニメ・ゲーム系
    'キリト', 'リヴァイ', 'ルルーシュ', '八幡', '翔陽',
    // 外国風・カタカナ
    'レオ', 'カイ', 'ユウ', 'レン',
    // ひらがな系
    'はると', 'そうた', 'ゆうま', 'かいと'
  ]
  const femaleNamePool = [
    'さくら', 'アリサ', 'みつり', 'ひなた', '美月',
    'レム', 'エミリア', 'かぐや', 'あすな', 'ルナ',
    'ここな', 'ひより', 'あおい', 'ななみ', 'みく',
    '結愛', '陽葵', '芽依', '莉子', '美結'
  ]
  
  // コンポーネントマウント時にランダムで5つ選択
  useEffect(() => {
    const namePool = gender === 'boyfriend' ? maleNamePool : femaleNamePool
    const shuffled = [...namePool].sort(() => Math.random() - 0.5)
    setSuggestedNames(shuffled.slice(0, 5))
  }, [gender])
  
  // 他の候補を表示する関数
  const shuffleNames = () => {
    const namePool = gender === 'boyfriend' ? maleNamePool : femaleNamePool
    const shuffled = [...namePool].sort(() => Math.random() - 0.5)
    setSuggestedNames(shuffled.slice(0, 5))
  }
  
  const partnerText = gender === 'boyfriend' ? '彼氏' : '彼女'
  const isValid = selectedName !== ''
  
  const handleCustomNameChange = (value: string) => {
    setCustomName(value)
    if (value.trim()) {
      onSelect(value.trim())
    }
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        あなたの{partnerText}の名前を決めましょう
      </h2>
      
      <div className="space-y-4 mb-8">
        {/* AI提案 */}
        <div 
          className={`
            p-6 border-2 rounded-2xl cursor-pointer transition-all
            ${namingMethod === 'ai-suggest' 
              ? 'border-pink-500 bg-pink-50' 
              : 'border-gray-200 hover:border-pink-300'
            }
          `}
          onClick={() => setNamingMethod('ai-suggest')}
        >
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <span className="mr-2 text-pink-500">💡</span>
            AI提案から選ぶ（おすすめ）
          </h3>
          
          {namingMethod === 'ai-suggest' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {suggestedNames.map((name) => (
                  <button
                    key={name}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(name)
                    }}
                    className={`
                      px-6 py-3 rounded-full border-2 font-medium transition-all
                      ${selectedName === name
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white border-gray-300 hover:border-pink-500 hover:transform hover:-translate-y-0.5'
                      }
                    `}
                  >
                    {name}
                  </button>
                ))}
              </div>
              
              <div className="text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    shuffleNames()
                  }}
                  className="text-pink-500 hover:text-pink-600 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <span>🔄</span>
                  他の候補を見る
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* カスタム入力 */}
        <div 
          className={`
            p-6 border-2 rounded-2xl cursor-pointer transition-all
            ${namingMethod === 'custom' 
              ? 'border-pink-500 bg-pink-50' 
              : 'border-gray-200 hover:border-pink-300'
            }
          `}
          onClick={() => setNamingMethod('custom')}
        >
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <span className="mr-2 text-pink-500">✏️</span>
            自分で決める
          </h3>
          
          {namingMethod === 'custom' && (
            <input
              type="text"
              value={customName}
              onChange={(e) => handleCustomNameChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              maxLength={10}
              placeholder="名前を入力してください"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
            />
          )}
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
          disabled={!isValid}
          className={`
            px-8 py-3 rounded-full font-medium transition-all duration-200
            ${isValid
              ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:opacity-90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          次へ
        </button>
      </div>
    </>
  )
}