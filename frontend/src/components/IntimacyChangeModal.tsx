'use client'

import { useEffect, useState } from 'react'

interface IntimacyChangeModalProps {
  isOpen: boolean
  previousLevel: number
  currentLevel: number
  onClose: () => void
}

export function IntimacyChangeModal({ 
  isOpen, 
  previousLevel, 
  currentLevel, 
  onClose 
}: IntimacyChangeModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const change = currentLevel - previousLevel
  const isIncrease = change > 0

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // アニメーション完了後にクローズ
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div 
        className={`
          bg-white rounded-lg shadow-xl p-6 text-center transform transition-all duration-300 pointer-events-auto
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="mb-3">
          <span className={`text-4xl ${isIncrease ? 'text-pink-500' : 'text-gray-500'}`}>
            {isIncrease ? '💕' : '💔'}
          </span>
        </div>
        
        <h3 className={`text-lg font-bold mb-2 ${isIncrease ? 'text-pink-600' : 'text-gray-600'}`}>
          {isIncrease ? '親密度が上がりました！' : '親密度が下がりました...'}
        </h3>
        
        <div className="flex items-center justify-center gap-3 text-2xl font-medium">
          <span className="text-gray-600">{previousLevel}</span>
          <span className={`${isIncrease ? 'text-pink-500' : 'text-gray-500'}`}>→</span>
          <span className={`${isIncrease ? 'text-pink-600' : 'text-gray-600'}`}>
            {currentLevel}
          </span>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          {isIncrease ? `+${change}` : `${change}`}
        </div>
      </div>
    </div>
  )
}