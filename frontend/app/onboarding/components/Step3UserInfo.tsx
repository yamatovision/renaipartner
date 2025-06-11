'use client'

interface UserData {
  surname: string
  firstName: string
  birthday: string
}

interface Step3UserInfoProps {
  userData: UserData
  onUpdate: (data: UserData) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step3UserInfo({ userData, onUpdate, onNext, onPrevious }: Step3UserInfoProps) {
  const isValid = userData.surname && userData.firstName && userData.birthday
  
  const handleChange = (field: keyof UserData, value: string) => {
    onUpdate({
      ...userData,
      [field]: value
    })
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        まずはあなたについて教えてください
      </h2>
      
      <div className="space-y-6 mb-8">
        <div>
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
            苗字
          </label>
          <input
            id="surname"
            type="text"
            value={userData.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            maxLength={10}
            placeholder="白石"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            名前
          </label>
          <input
            id="firstName"
            type="text"
            value={userData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            maxLength={10}
            placeholder="達也"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
            誕生日
          </label>
          <input
            id="birthday"
            type="date"
            value={userData.birthday}
            onChange={(e) => handleChange('birthday', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
          />
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