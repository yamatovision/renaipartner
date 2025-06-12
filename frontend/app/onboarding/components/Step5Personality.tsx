'use client'

import { useState, useEffect } from 'react'
import { PersonalityQuestion } from '@/types'
import { onboardingService } from '@/services'

interface Step5PersonalityProps {
  answers: PersonalityQuestion[]
  onAnswer: (answers: PersonalityQuestion[]) => void
  onNext: () => void
  onPrevious: () => void
}

// フォールバック用の質問（APIが失敗した場合）
const fallbackQuestions: PersonalityQuestion[] = [
  {
    id: '1',
    question: 'どんな性格の人が好みですか？',
    options: [
      { value: 'gentle', label: '優しい' },
      { value: 'cool', label: 'クール' },
      { value: 'cheerful', label: '明るい' },
      { value: 'mysterious', label: 'ミステリアス' },
      { value: 'reliable', label: '頼れる' }
    ]
  },
  {
    id: '2',
    question: '年齢の好みは？',
    options: [
      { value: 'older', label: '年上（お兄さん/お姉さん系）' },
      { value: 'same', label: '同年代' },
      { value: 'younger', label: '年下（弟/妹系）' }
    ]
  },
  {
    id: '3',
    question: 'どんな話し方が心地良いですか？',
    options: [
      { value: 'polite', label: '丁寧語' },
      { value: 'casual', label: 'カジュアル' },
      { value: 'sweet', label: '甘い言葉多め' },
      { value: 'dialect', label: '方言' },
      { value: 'cool-tone', label: 'クール系' }
    ]
  }
]

export function Step5Personality({ answers, onAnswer, onNext, onPrevious }: Step5PersonalityProps) {
  const [questions, setQuestions] = useState<PersonalityQuestion[]>(fallbackQuestions)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await onboardingService.getPersonalityQuestions()
        if (response.success && response.data) {
          setQuestions(response.data)
        }
      } catch (error) {
        console.error('性格診断質問の取得に失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuestions()
  }, [])
  
  const isValid = answers.length === questions.length
  
  const handleAnswer = (questionId: string, answer: string) => {
    const newAnswers = answers.filter(a => a.id !== questionId)
    newAnswers.push({ id: questionId, question: '', answer })
    onAnswer(newAnswers)
  }
  
  const getAnswer = (questionId: string) => {
    const answer = answers.find(a => a.id === questionId)
    return answer?.answer || ''
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        どんなパートナーがお好みですか？
      </h2>
      
      <div className="space-y-6 mb-8">
        {questions.map((q) => (
          <div key={q.id} className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{q.question}</h3>
            <div className="flex flex-wrap gap-3">
              {q.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(q.id, option.value)}
                  className={`
                    px-5 py-2.5 rounded-full border-2 font-medium transition-all
                    ${getAnswer(q.id) === option.value
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white border-gray-300 hover:border-pink-500 hover:transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
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