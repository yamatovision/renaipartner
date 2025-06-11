'use client'

import { useState } from 'react'

interface Step8NicknameProps {
  partnerName: string
  userName: string
  selectedNickname: string
  onSelect: (nickname: string) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step8Nickname({ 
  partnerName, 
  userName, 
  selectedNickname, 
  onSelect, 
  onNext, 
  onPrevious 
}: Step8NicknameProps) {
  const [customNickname, setCustomNickname] = useState('')
  const isValid = selectedNickname !== ''
  
  // AI提案のニックネーム生成
  const suggestedNicknames = [
    `${userName}ちゃん`,
    `${userName}くん`,
    userName.length > 2 ? `${userName.slice(0, 2)}ちゃん` : `${userName}っち`,
    userName.length > 1 ? `${userName.slice(0, 1)}ちゃん` : userName,
    `${userName}っち`
  ]
  
  const handleCustomChange = (value: string) => {
    setCustomNickname(value)
    if (value.trim()) {
      onSelect(value.trim())
    }
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        {partnerName}があなたを呼ぶ時の呼び方を決めましょう
      </h2>
      
      <div className="space-y-6 mb-8">
        {/* AI提案 */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <span className="mr-2 text-pink-500">💡</span>
            AI提案（おすすめ）
          </h3>
          <div className="flex flex-wrap gap-3">
            {suggestedNicknames.map((nickname) => (
              <button
                key={nickname}
                onClick={() => onSelect(nickname)}
                className={`
                  px-6 py-3 rounded-full border-2 font-medium transition-all
                  ${selectedNickname === nickname
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white border-gray-300 hover:border-pink-500 hover:transform hover:-translate-y-0.5'
                  }
                `}
              >
                {nickname}
              </button>
            ))}
          </div>
        </div>
        
        {/* カスタム入力 */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <span className="mr-2 text-pink-500">✏️</span>
            カスタム入力
          </h3>
          <input
            type="text"
            value={customNickname}
            onChange={(e) => handleCustomChange(e.target.value)}
            maxLength={10}
            placeholder="お好みの呼び方"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
          />
        </div>
        
        {/* 親密度による呼び方の変化説明 */}
        <div className="bg-pink-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-pink-600">💡 ヒント：</span><br />
            親密度が上がると呼び方も変化します<br />
            初期：{userName}さん → 中期：{userName} → 親密：{selectedNickname || 'あだ名'}
          </p>
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