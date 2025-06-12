'use client'

import { useState, useEffect } from 'react'
import { PersonalityType, SpeechStyle, PersonalityQuestion, PresetPersonality } from '@/types'
import { onboardingService } from '@/services'

interface Step6PresetSelectionProps {
  userName: string
  partnerName: string
  personalityAnswers: PersonalityQuestion[]
  selectedPreset: PersonalityType | ''
  onSelect: (personality: PersonalityType, speechStyle: SpeechStyle, prompt: string) => void
  onNext: () => void
  onPrevious: () => void
}

// フォールバック用のプリセット（APIが失敗した場合）
const fallbackPresets: PresetPersonality[] = [
  {
    id: 'gentle-lover',
    name: '優しい恋人',
    personality: PersonalityType.GENTLE,
    speechStyle: SpeechStyle.POLITE,
    description: '思いやり深く、いつもあなたを支えてくれる理想的なパートナー',
    icon: '💖',
    prompt: 'あなたは優しく思いやりのあるパートナーです。相手の気持ちを大切にし、常に支えになるような言葉をかけます。',
    systemPrompt: 'あなたは優しく思いやりのあるパートナーです。相手の気持ちを大切にし、常に支えになるような言葉をかけます。',
    recommended: true
  },
  {
    id: 'reliable-senior',
    name: '頼れる年上',
    personality: PersonalityType.RELIABLE,
    speechStyle: SpeechStyle.CASUAL,
    description: '包容力があり、人生経験豊富で頼りになる存在',
    icon: '🌟',
    prompt: 'あなたは頼れる年上のパートナーです。経験に基づいたアドバイスと包容力で相手を包み込みます。',
    systemPrompt: 'あなたは頼れる年上のパートナーです。経験に基づいたアドバイスと包容力で相手を包み込みます。',
    recommended: true
  },
  {
    id: 'cheerful-lover',
    name: '明るい恋人',
    personality: PersonalityType.CHEERFUL,
    speechStyle: SpeechStyle.CASUAL,
    description: 'いつも前向きで、あなたを笑顔にしてくれる元気な存在',
    icon: '☀️',
    prompt: 'あなたは明るく元気なパートナーです。前向きな性格で、相手を笑顔にすることが大好きです。',
    systemPrompt: 'あなたは明るく元気なパートナーです。前向きな性格で、相手を笑顔にすることが大好きです。',
    recommended: true
  }
]

export function Step6PresetSelection({ 
  userName, 
  partnerName, 
  personalityAnswers, 
  selectedPreset, 
  onSelect, 
  onNext, 
  onPrevious 
}: Step6PresetSelectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [presetPersonalities, setPresetPersonalities] = useState<PresetPersonality[]>(fallbackPresets)
  const [loading, setLoading] = useState(true)
  const isValid = selectedPreset !== ''
  
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        // おすすめプリセットを取得
        if (personalityAnswers.length > 0) {
          const recommendedResponse = await onboardingService.getRecommendedPresets({
            personalityAnswers: personalityAnswers
              .filter(a => a.answer !== undefined && a.question !== undefined)
              .map(a => ({
                id: a.id,
                question: a.question!,
                answer: a.answer!
              }))
          })
          
          if (recommendedResponse.success && recommendedResponse.data) {
            setPresetPersonalities(recommendedResponse.data as PresetPersonality[])
          }
        } else {
          // 回答がない場合は全プリセットを取得
          const presetsResponse = await onboardingService.getPresets()
          if (presetsResponse.success && presetsResponse.data) {
            setPresetPersonalities(presetsResponse.data as PresetPersonality[])
          }
        }
      } catch (error) {
        console.error('プリセットの取得に失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPresets()
  }, [personalityAnswers])
  
  const handleSelect = (preset: PresetPersonality) => {
    onSelect(preset.personality, preset.speechStyle, preset.prompt || preset.systemPrompt)
  }
  
  const displayedPresets = showAll ? presetPersonalities : presetPersonalities.filter(p => p.recommended)
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
        {userName}さんにピッタリの{partnerName}タイプ
      </h2>
      <p className="text-gray-600 text-center mb-8">
        先ほどの回答に基づいて、おすすめを3つ選びました
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {displayedPresets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => handleSelect(preset)}
            className={`
              p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 text-center
              ${selectedPreset === preset.personality
                ? 'border-pink-500 bg-pink-50 transform -translate-y-1 shadow-lg'
                : 'border-gray-200 hover:border-pink-300 hover:transform hover:-translate-y-1 hover:shadow-md'
              }
            `}
          >
            <div className="text-5xl mb-3">{preset.icon}</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{preset.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
            {preset.recommended && (
              <span className="text-xs text-pink-500 font-semibold">★ おすすめ</span>
            )}
          </div>
        ))}
      </div>
      
      {!showAll && (
        <div className="text-center mb-6">
          <button
            onClick={() => setShowAll(true)}
            className="text-pink-500 hover:text-pink-600 text-sm font-medium transition-colors"
          >
            他の性格も見る
          </button>
        </div>
      )}
      
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