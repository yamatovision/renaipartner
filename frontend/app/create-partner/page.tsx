'use client'

// U-002: パートナー作成ページ（上級者向け）
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/layouts/UserLayout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Gender,
  PersonalityType,
  SpeechStyle,
  PartnerCreate,
  AppearanceSettings
} from '@/types'
import { partnersService } from '@/services'
import { showMockIndicator } from '@/services/mock'
import {
  FavoriteRounded,
  AcUnitRounded,
  WbSunnyRounded,
  FlashOnRounded,
  CheckRounded
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'

export default function CreatePartnerPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [imageGenerating, setImageGenerating] = useState(false)
  
  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    gender: Gender.GIRLFRIEND,
    selectedKeywords: [] as string[],
    personality: '' as PersonalityType | '',
    speechStyle: SpeechStyle.CASUAL,
    appearance: {
      hairStyle: 'medium',
      eyeColor: 'brown',
      bodyType: 'average',
      clothingStyle: 'casual',
      generatedImageUrl: ''
    } as AppearanceSettings
  })

  // モックインジケーター表示
  useEffect(() => {
    showMockIndicator()
  }, [])

  // キーワードのオプション
  const visualKeywords = [
    '可愛い', 'クール', '優しい雰囲気', '大人っぽい',
    '爽やか', 'ミステリアス', '元気', '知的'
  ]

  // 性格オプション
  const personalityOptions = [
    { 
      value: PersonalityType.GENTLE, 
      label: '優しい', 
      icon: <FavoriteRounded />,
      description: '思いやり深く温かい'
    },
    { 
      value: PersonalityType.COOL, 
      label: 'クール', 
      icon: <AcUnitRounded />,
      description: '落ち着いていて知的'
    },
    { 
      value: PersonalityType.CHEERFUL, 
      label: '明るい', 
      icon: <WbSunnyRounded />,
      description: '元気で前向き'
    },
    { 
      value: PersonalityType.TSUNDERE, 
      label: 'ツンデレ', 
      icon: <FlashOnRounded />,
      description: '素直じゃないけど愛情深い'
    }
  ]

  // キーワードの選択/解除
  const toggleKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      selectedKeywords: prev.selectedKeywords.includes(keyword)
        ? prev.selectedKeywords.filter(k => k !== keyword)
        : [...prev.selectedKeywords, keyword]
    }))
  }

  // ステップ1のバリデーション
  const validateStep1 = () => {
    if (!formData.name.trim()) {
      alert('名前を入力してください')
      return false
    }
    if (formData.selectedKeywords.length === 0) {
      alert('見た目のイメージを選択してください')
      return false
    }
    return true
  }

  // ステップ2のバリデーション
  const validateStep2 = () => {
    if (!formData.personality) {
      alert('性格を選択してください')
      return false
    }
    return true
  }

  // ステップ遷移
  const goToStep = (step: number) => {
    if (step === 2 && currentStep === 1) {
      if (!validateStep1()) return
      // 画像生成のシミュレーション
      setImageGenerating(true)
      setTimeout(() => {
        setImageGenerating(false)
        setFormData(prev => ({
          ...prev,
          appearance: {
            ...prev.appearance,
            generatedImageUrl: '/api/placeholder/200/200'
          }
        }))
      }, 2000)
    } else if (step === 3 && currentStep === 2) {
      if (!validateStep2()) return
    }
    setCurrentStep(step)
  }

  // パートナー作成
  const createPartner = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 性格に基づいたシステムプロンプトの生成
      const personalityPrompts: Record<PersonalityType, string> = {
        [PersonalityType.GENTLE]: '優しく思いやり深い性格で、常に相手の気持ちを大切にします。',
        [PersonalityType.COOL]: '落ち着いていて知的な性格。普段はクールだが、愛情深い一面を持つ。',
        [PersonalityType.CHEERFUL]: '明るく元気な性格で、いつも前向き。相手を笑顔にすることが大好き。',
        [PersonalityType.TSUNDERE]: '素直じゃないけど、本当は愛情深い。照れ隠しが可愛い。',
        [PersonalityType.SWEET]: 'とても優しく、甘えん坊で、常に愛情表現が豊か。',
        [PersonalityType.RELIABLE]: '落ち着いていて、包容力があり、頼りになる年上の恋人。',
        [PersonalityType.CLINGY]: 'いつもあなたのそばにいたい甘えん坊。',
        [PersonalityType.GENIUS]: '知的で頭脳明晰、論理的思考で様々な知識を持つ天才的な性格。',
        [PersonalityType.CHILDHOOD]: '昔から知っている幼なじみ。気さくで親しみやすく、自然体で接する。',
        [PersonalityType.SPORTS]: '健康的で活動的、スポーツを愛し体を動かすことが好きな性格。',
        [PersonalityType.ARTIST]: '芸術的センスに溢れ、美しいものを愛し創造性豊かな性格。',
        [PersonalityType.COOKING]: '料理上手で家庭的、相手のために美味しい料理を作ることを愛する性格。',
        [PersonalityType.MYSTERIOUS]: '謎めいた魅力を持ち、深い秘密を抱えながらも魅力的な性格。',
        [PersonalityType.PRINCE]: '上品で紳士的、エレガントで礼儀正しい王子様のような性格。',
        [PersonalityType.OTAKU]: '趣味に情熱的で、専門知識が豊富。好きなことには熱心に取り組む性格。',
        [PersonalityType.YOUNGER]: '元気で可愛らしく、甘えん坊で愛らしい年下の性格。',
        [PersonalityType.BAND]: '音楽を愛し、クールでアーティスティックなミュージシャンの性格。'
      }

      const partnerData: PartnerCreate = {
        userId: user.id,
        name: formData.name,
        gender: formData.gender,
        personalityType: formData.personality as PersonalityType,
        speechStyle: formData.speechStyle,
        systemPrompt: personalityPrompts[formData.personality as PersonalityType] || '',
        avatarDescription: formData.selectedKeywords.join('、'),
        appearance: formData.appearance,
        hobbies: [],
        intimacyLevel: 0
      }

      const response = await partnersService.createPartner(partnerData)
      
      if (response.success && response.data) {
        // 作成成功
        router.push('/home')
      } else {
        alert('パートナーの作成に失敗しました')
      }
    } catch (error) {
      console.error('パートナー作成エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 性格表示用テキスト
  const getPersonalityText = () => {
    const selected = personalityOptions.find(p => p.value === formData.personality)
    return selected ? selected.label + '性格' : ''
  }

  return (
    <UserLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-pink-50">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 text-center shadow-md">
          <h1 className="text-2xl font-light">パートナー作成（上級者向け）</h1>
          <p className="text-sm mt-2 opacity-90">
            初回の方は
            <Link href="/onboarding" className="underline hover:opacity-80">
              ガイド付き作成
            </Link>
            をおすすめします
          </p>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          {/* ステップインジケーター */}
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all
                  ${step < currentStep 
                    ? 'bg-green-500 text-white' 
                    : step === currentStep 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }
                `}
              >
                {step < currentStep ? <CheckRounded /> : step}
              </div>
            ))}
          </div>

          {/* コンテンツエリア */}
          <div className="bg-white rounded-2xl shadow-lg p-8 min-h-[400px]">
            {/* Step 1: 名前とビジュアル */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-bold text-center mb-8">基本情報</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パートナーの名前
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={20}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                    placeholder="例：結愛、蓮"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, gender: Gender.GIRLFRIEND }))}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${formData.gender === Gender.GIRLFRIEND
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                        }
                      `}
                    >
                      <span className="text-2xl">👩</span>
                      <p className="mt-2">彼女</p>
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, gender: Gender.BOYFRIEND }))}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${formData.gender === Gender.BOYFRIEND
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                        }
                      `}
                    >
                      <span className="text-2xl">👨</span>
                      <p className="mt-2">彼氏</p>
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">見た目のイメージ</h3>
                  <p className="text-sm text-gray-600 mb-4">好きなキーワードを選んでください（複数選択可）</p>
                  <div className="flex flex-wrap gap-2">
                    {visualKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => toggleKeyword(keyword)}
                        className={`
                          px-4 py-2 rounded-full border-2 transition-all
                          ${formData.selectedKeywords.includes(keyword)
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-gray-100 border-gray-300 hover:border-pink-300'
                          }
                        `}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => goToStep(2)}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  次へ
                </button>
              </div>
            )}

            {/* Step 2: ビジュアル確認と性格 */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-bold text-center mb-8">ビジュアル確認</h2>
                
                {/* ビジュアルプレビュー */}
                <div className="w-48 h-48 mx-auto mb-8 rounded-full overflow-hidden border-4 border-pink-500 bg-gray-100 flex items-center justify-center">
                  {imageGenerating ? (
                    <div className="text-center">
                      <CircularProgress className="text-pink-500 mb-2" />
                      <p className="text-sm text-gray-600">生成中...</p>
                    </div>
                  ) : (
                    <div className="text-6xl">
                      {formData.gender === Gender.BOYFRIEND ? '👨' : '👩'}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-4">性格を選んでください</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {personalityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, personality: option.value }))}
                      className={`
                        p-4 border-2 rounded-xl text-center transition-all
                        ${formData.personality === option.value
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                        }
                      `}
                    >
                      <div className="text-3xl text-pink-500 mb-2">{option.icon}</div>
                      <div className="font-semibold">{option.label}</div>
                      <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => goToStep(1)}
                    className="flex-1 border-2 border-pink-500 text-pink-500 py-3 rounded-full font-medium hover:bg-pink-50 transition-colors"
                  >
                    戻る
                  </button>
                  <button
                    onClick={() => goToStep(3)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: 確認 */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-bold text-center mb-8">作成確認</h2>
                
                {/* ビジュアルプレビュー */}
                <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-pink-500 bg-gray-100 flex items-center justify-center">
                  <div className="text-6xl">
                    {formData.gender === Gender.BOYFRIEND ? '👨' : '👩'}
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-pink-500 mb-2">{formData.name}</h3>
                  <p className="text-gray-600">{getPersonalityText()}</p>
                </div>

                <div className="bg-pink-50 p-4 rounded-xl mb-6">
                  <p className="text-center text-gray-700">
                    <span className="inline-block mr-2">ℹ️</span>
                    作成後も詳細な設定は変更できます
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => goToStep(2)}
                    className="flex-1 border-2 border-pink-500 text-pink-500 py-3 rounded-full font-medium hover:bg-pink-50 transition-colors"
                  >
                    戻る
                  </button>
                  <button
                    onClick={createPartner}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} className="text-white mr-2" />
                        作成中...
                      </>
                    ) : (
                      '作成する'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}