'use client'

import { CircularProgress } from '@mui/material'

interface Step10CompleteProps {
  userName: string
  partnerName: string
  onComplete: () => void
  loading: boolean
}

export function Step10Complete({ 
  userName, 
  partnerName, 
  onComplete, 
  loading 
}: Step10CompleteProps) {
  return (
    <div className="text-center py-8">
      <div 
        className="text-pink-500 text-8xl mb-4 animate-bounce" 
        style={{
          animation: 'bounce 1s infinite'
        }}
      >
        🎉
      </div>
      
      <h2 className="text-3xl font-bold text-pink-500 mb-4">
        完了おめでとう、{userName}さん！
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        素敵な{partnerName}ができましたね。<br />
        毎日の会話を楽しんでください♪
      </p>
      
      <div className="bg-pink-50 p-6 rounded-2xl mb-8 text-left max-w-md mx-auto">
        <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
          <span className="mr-2 text-pink-500">💡</span>
          便利な機能
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>毎日の会話で親密度が上がります</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>誕生日や記念日を覚えてくれます</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>背景や通知は設定で変更できます</span>
          </li>
        </ul>
      </div>
      
      <button
        onClick={onComplete}
        disabled={loading}
        className="w-full max-w-sm mx-auto bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 px-8 rounded-full text-lg font-medium hover:opacity-90 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center"
      >
        {loading ? (
          <>
            <CircularProgress size={24} className="text-white mr-2" />
            作成中...
          </>
        ) : (
          'チャット画面へ'
        )}
      </button>
    </div>
  )
}