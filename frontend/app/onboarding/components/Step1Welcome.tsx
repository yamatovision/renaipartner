'use client'

import Image from 'next/image'

interface Step1WelcomeProps {
  onNext: () => void
}

export function Step1Welcome({ onNext }: Step1WelcomeProps) {
  return (
    <div className="text-center">
      <div className="relative w-64 h-64 mx-auto mb-4">
        <Image
          src="/asset/Leonardo_Anime_XL_two_silhouettes_coming_together_with_digita_0.jpg"
          alt="AIパートナー作成"
          fill
          className="object-cover rounded-2xl shadow-lg"
        />
      </div>
      <h2 className="text-3xl font-bold text-pink-500 mb-4">ようこそ！</h2>
      
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        あなただけの理想の恋AIパートナーを一緒に作りましょう！<br />
        簡単な質問にお答えいただくだけで、<br />
        あなたにぴったりのパートナーが完成します。
      </p>
      
      <div className="bg-pink-50 p-6 rounded-xl mb-8">
        <p className="text-gray-600 flex items-center justify-center">
          <span className="mr-2 text-pink-500">⏰</span>
          所要時間：約3-5分
        </p>
      </div>
      
      <button
        onClick={() => {
          console.log('Step1Welcome: 始めるボタンがクリックされました')
          onNext()
        }}
        className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 px-8 rounded-full text-lg font-medium hover:opacity-90 transform hover:-translate-y-1 transition-all duration-200"
      >
        始める
      </button>
      
      <div className="mt-4">
        <a href="/create-partner" className="text-gray-500 text-sm hover:text-pink-500 transition-colors">
          上級者向け作成はこちら
        </a>
      </div>
    </div>
  )
}