'use client'

// O-001: オンボーディング統合ページ
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserLayout from '@/layouts/UserLayout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Gender, 
  PersonalityType, 
  SpeechStyle,
  OnboardingProgress,
  PersonalityQuestion,
  PresetPersonality,
  PartnerCreate,
  PartnerData
} from '@/types'
import { partnersService } from '@/services'
import { showMockIndicator } from '@/services/mock'

// ステップコンポーネント
import { Step1Welcome } from './components/Step1Welcome'
import { Step2Gender } from './components/Step2Gender'
import { Step3UserInfo } from './components/Step3UserInfo'
import { Step4PartnerName } from './components/Step4PartnerName'
import { Step5Personality } from './components/Step5Personality'
import { Step6PresetSelection } from './components/Step6PresetSelection'
import { Step7Appearance } from './components/Step7Appearance'
import { Step8Nickname } from './components/Step8Nickname'
import { Step9InitialChat } from './components/Step9InitialChat'
import { Step10Complete } from './components/Step10Complete'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // オンボーディングの進行状況（クライアント側の一時的な状態）
  interface OnboardingState {
    currentStep: number
    completedSteps: number[]
    userData: {
      surname: string
      firstName: string
      birthday: string
    }
    partnerData: PartnerData
    personalityAnswers: PersonalityQuestion[]
    completed: boolean
  }
  
  const [onboardingData, setOnboardingData] = useState<OnboardingState>({
    currentStep: 1,
    completedSteps: [],
    userData: {
      surname: '',
      firstName: '',
      birthday: ''
    },
    partnerData: {
      gender: Gender.BOYFRIEND,
      name: '',
      personality: PersonalityType.GENTLE,
      speechStyle: SpeechStyle.POLITE,
      prompt: '',
      nickname: '',
      appearance: {
        hairStyle: 'short',
        eyeColor: 'brown',
        bodyType: 'average',
        clothingStyle: 'casual',
        generatedImageUrl: undefined
      }
    },
    personalityAnswers: [],
    completed: false
  })

  // モックインジケーター表示
  useEffect(() => {
    showMockIndicator()
  }, [])

  // ステップの進行
  const nextStep = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1)
      setOnboardingData(prev => ({
        ...prev,
        currentStep: currentStep + 1,
        completedSteps: [...prev.completedSteps, currentStep]
      }))
    }
  }

  // ステップの戻り
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setOnboardingData(prev => ({
        ...prev,
        currentStep: currentStep - 1
      }))
    }
  }

  // データの更新
  const updateData = (data: Partial<OnboardingProgress>) => {
    setOnboardingData(prev => ({
      ...prev,
      ...data
    }))
  }

  // パートナー作成
  const createPartner = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const partnerData: PartnerCreate = {
        userId: user.id,
        name: onboardingData.partnerData.name,
        gender: onboardingData.partnerData.gender,
        personalityType: onboardingData.partnerData.personality,
        speechStyle: onboardingData.partnerData.speechStyle,
        appearance: {
          ...onboardingData.partnerData.appearance,
          generatedImageUrl: onboardingData.partnerData.appearance.generatedImageUrl || ''
        },
        systemPrompt: onboardingData.partnerData.prompt,
        avatarDescription: '',
        hobbies: [],
        intimacyLevel: 0,
        createdViaOnboarding: true
      }

      const response = await partnersService.createPartner(partnerData)
      
      if (response.success && response.data) {
        // パートナー作成成功
        router.push('/home')
      } else {
        console.error('パートナー作成に失敗しました:', response.error)
      }
    } catch (error) {
      console.error('パートナー作成エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // プログレスバーの進行率
  const progressPercentage = (currentStep / 10) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-pink-200">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 text-center shadow-md">
        <h1 className="text-2xl font-light">あなただけのパートナー作成</h1>
      </div>

      {/* プログレス表示 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600 mb-4">
          ステップ {currentStep} / 10
        </div>
        
        {/* プログレスバー */}
        <div className="bg-white rounded-full h-2 mb-8 overflow-hidden shadow-sm">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* ステップコンテンツ */}
        <div className="bg-white rounded-3xl shadow-xl p-8 min-h-[500px]">
          {currentStep === 1 && (
            <Step1Welcome 
              onNext={nextStep}
            />
          )}
          
          {currentStep === 2 && (
            <Step2Gender
              selectedGender={onboardingData.partnerData.gender}
              onSelect={(gender) => updateData({
                partnerData: { ...onboardingData.partnerData, gender }
              })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 3 && (
            <Step3UserInfo
              userData={onboardingData.userData}
              onUpdate={(userData) => updateData({ userData })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 4 && (
            <Step4PartnerName
              gender={onboardingData.partnerData.gender}
              selectedName={onboardingData.partnerData.name}
              onSelect={(name) => updateData({
                partnerData: { ...onboardingData.partnerData, name }
              })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 5 && (
            <Step5Personality
              answers={onboardingData.personalityAnswers}
              onAnswer={(answers) => updateData({ personalityAnswers: answers })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 6 && (
            <Step6PresetSelection
              userName={onboardingData.userData.firstName}
              partnerName={onboardingData.partnerData.name}
              personalityAnswers={onboardingData.personalityAnswers}
              selectedPreset={onboardingData.partnerData.personality}
              onSelect={(personality, speechStyle, prompt) => updateData({
                partnerData: { 
                  ...onboardingData.partnerData, 
                  personality,
                  speechStyle,
                  prompt
                }
              })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 7 && (
            <Step7Appearance
              partnerName={onboardingData.partnerData.name}
              gender={onboardingData.partnerData.gender}
              appearance={onboardingData.partnerData.appearance}
              onUpdate={(appearance) => updateData({
                partnerData: { ...onboardingData.partnerData, appearance }
              })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 8 && (
            <Step8Nickname
              partnerName={onboardingData.partnerData.name}
              userName={onboardingData.userData.firstName}
              selectedNickname={onboardingData.partnerData.nickname}
              onSelect={(nickname) => updateData({
                partnerData: { ...onboardingData.partnerData, nickname }
              })}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 9 && (
            <Step9InitialChat
              partnerData={onboardingData.partnerData}
              userName={onboardingData.userData.firstName}
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          
          {currentStep === 10 && (
            <Step10Complete
              userName={onboardingData.userData.firstName}
              partnerName={onboardingData.partnerData.name}
              onComplete={createPartner}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}