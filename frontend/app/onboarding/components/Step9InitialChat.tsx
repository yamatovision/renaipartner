'use client'

import { useState } from 'react'
import { PartnerData } from '@/types'

interface Step9InitialChatProps {
  partnerData: PartnerData
  userName: string
  onNext: () => void
  onPrevious: () => void
}

export function Step9InitialChat({ 
  partnerData, 
  userName, 
  onNext, 
  onPrevious 
}: Step9InitialChatProps) {
  const [userMessage, setUserMessage] = useState('')
  const [showResponse, setShowResponse] = useState(false)
  
  // 性格に基づいた挨拶メッセージ
  const getGreeting = () => {
    const { personality, speechStyle } = partnerData
    
    if (personality === 'gentle' && speechStyle === 'polite') {
      return `${userName}さん、こんにちは！よろしくお願いします♪ あなたとお話しできるのを楽しみにしていました。`
    } else if (personality === 'reliable') {
      return `はじめまして、${userName}さん。これからよろしくお願いします。何でも気軽に話しかけてくださいね。`
    } else if (personality === 'cheerful') {
      return `${userName}さん、こんにちは〜！ わーい、やっと会えましたね♪ これからたくさんお話ししましょう！`
    }
    
    return `${userName}さん、こんにちは！よろしくお願いします♪`
  }
  
  const getResponse = () => {
    const responses = [
      'ありがとうございます！これからよろしくお願いします♪',
      'あなたと話せて嬉しいです。今度はどんなお話をしましょうか？',
      '素敵ですね！私もあなたとお話しするのを楽しみにしています。'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }
  
  const sendMessage = () => {
    if (!userMessage.trim()) return
    
    setShowResponse(true)
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
        それでは{partnerData.name}と初めての挨拶をしてみましょう
      </h2>
      <p className="text-gray-600 text-center mb-6">
        設定に満足したら「完了」、変更したい場合は「戻る」を押してください
      </p>
      
      {/* パートナーアバター */}
      <div className="flex justify-center mb-4">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500 shadow-lg bg-pink-200 flex items-center justify-center">
          <span className="text-5xl">
            {partnerData.gender === 'boyfriend' ? '👨' : '👩'}
          </span>
        </div>
      </div>
      
      <h3 className="text-center text-pink-500 font-semibold mb-6">
        {partnerData.name}
      </h3>
      
      {/* チャットデモ */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8">
        {/* AIメッセージ */}
        <div className="mb-4">
          <div className="bg-pink-500 text-white rounded-2xl rounded-tl-none p-4 ml-8 shadow-sm">
            <p className="text-sm">{getGreeting()}</p>
          </div>
        </div>
        
        {/* 入力エリア */}
        <div className="flex gap-2">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="返事を入力してください"
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            📤
          </button>
        </div>
        
        {/* ユーザーメッセージ */}
        {userMessage && showResponse && (
          <div className="mt-4">
            <div className="bg-blue-100 text-gray-800 rounded-2xl rounded-tr-none p-4 mr-8 shadow-sm mb-4">
              <p className="text-sm">{userMessage}</p>
            </div>
            
            {/* AI返答 */}
            <div className="bg-pink-500 text-white rounded-2xl rounded-tl-none p-4 ml-8 shadow-sm">
              <p className="text-sm">{getResponse()}</p>
            </div>
          </div>
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
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full font-medium hover:opacity-90 transition-all"
        >
          完了する
        </button>
      </div>
    </>
  )
}