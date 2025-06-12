'use client'

import { Gender } from '@/types'
import Image from 'next/image'

interface Step2GenderProps {
  selectedGender: Gender | ''
  onSelect: (gender: Gender) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step2Gender({ selectedGender, onSelect, onNext, onPrevious }: Step2GenderProps) {
  const isSelected = selectedGender !== ''
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        どちらのパートナーを作成しますか？
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div
          onClick={() => onSelect(Gender.BOYFRIEND)}
          className={`
            p-8 border-4 rounded-3xl text-center cursor-pointer transition-all duration-300 overflow-hidden
            ${selectedGender === Gender.BOYFRIEND 
              ? 'border-pink-500 bg-pink-50 transform -translate-y-2 shadow-lg' 
              : 'border-gray-200 hover:border-pink-300 hover:transform hover:-translate-y-1 hover:shadow-md'
            }
          `}
        >
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/asset/Leonardo_Anime_XL_anime_style_handsome_young_man_intelligent_2.jpg"
              alt="彼氏アバター"
              fill
              className="object-cover rounded-full"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">彼氏を作る</h3>
          <p className="text-gray-600">理想の男性パートナー</p>
        </div>
        
        <div
          onClick={() => onSelect(Gender.GIRLFRIEND)}
          className={`
            p-8 border-4 rounded-3xl text-center cursor-pointer transition-all duration-300 overflow-hidden
            ${selectedGender === Gender.GIRLFRIEND 
              ? 'border-pink-500 bg-pink-50 transform -translate-y-2 shadow-lg' 
              : 'border-gray-200 hover:border-pink-300 hover:transform hover:-translate-y-1 hover:shadow-md'
            }
          `}
        >
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/asset/Leonardo_Anime_XL_anime_style_beautiful_young_woman_short_pal_0.jpg"
              alt="彼女アバター"
              fill
              className="object-cover rounded-full"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">彼女を作る</h3>
          <p className="text-gray-600">理想の女性パートナー</p>
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
          disabled={!isSelected}
          className={`
            px-8 py-3 rounded-full font-medium transition-all duration-200
            ${isSelected
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