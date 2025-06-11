'use client'

// U-003: パートナー編集ページ
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import UserLayout from '@/layouts/UserLayout'
import { Partner, PartnerUpdate, PersonalityType, SpeechStyle, PresetPersonality } from '@/types'
import { mockPartnersService } from '@/services/mock/partners.mock'

export default function EditPartnerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const partnerId = searchParams.get('id')

  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'personality' | 'appearance' | 'details'>('personality')
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple')
  const [presets, setPresets] = useState<PresetPersonality[]>([])
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)

  // フォームデータ
  const [formData, setFormData] = useState<PartnerUpdate>({})

  // パートナー情報の読み込み
  useEffect(() => {
    if (!partnerId) {
      router.push('/home')
      return
    }

    const loadPartner = async () => {
      try {
        const response = await mockPartnersService.getPartner(partnerId)
        if (response.success && response.data) {
          setPartner(response.data)
          setFormData({
            name: response.data.name,
            personalityType: response.data.personalityType,
            speechStyle: response.data.speechStyle,
            systemPrompt: response.data.systemPrompt,
            avatarDescription: response.data.avatarDescription,
            appearance: response.data.appearance,
            hobbies: response.data.hobbies
          })
        } else {
          alert('パートナーが見つかりません')
          router.push('/home')
        }
      } catch (error) {
        console.error('パートナー取得エラー:', error)
        alert('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadPartner()
  }, [partnerId, router])

  // プリセット読み込み
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const response = await mockPartnersService.getPersonalityPresets()
        if (response.success && response.data) {
          setPresets(response.data)
        }
      } catch (error) {
        console.error('プリセット取得エラー:', error)
      }
    }

    loadPresets()
  }, [])

  // 保存処理
  const handleSave = async () => {
    if (!partnerId || !partner) return

    setSaving(true)
    try {
      const response = await mockPartnersService.updatePartner(partnerId, formData)
      if (response.success) {
        alert('保存しました！')
        router.push('/home')
      } else {
        alert('保存に失敗しました: ' + response.error)
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // プロンプト検証
  const handleValidatePrompt = async () => {
    if (!formData.systemPrompt) return

    setValidating(true)
    try {
      const response = await mockPartnersService.validatePrompt(formData.systemPrompt)
      if (response.success) {
        setValidationResult(response.data)
      }
    } catch (error) {
      console.error('検証エラー:', error)
    } finally {
      setValidating(false)
    }
  }

  // プレビュー生成
  const handleGeneratePreview = async () => {
    if (!formData.systemPrompt) return

    setGeneratingPreview(true)
    try {
      const response = await mockPartnersService.generatePreview(formData.systemPrompt)
      if (response.success) {
        setPreview(response.data)
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error)
    } finally {
      setGeneratingPreview(false)
    }
  }

  // プリセット適用
  const handleApplyPreset = async (presetId: string) => {
    if (!partnerId) return

    try {
      const response = await mockPartnersService.applyPreset(partnerId, presetId)
      if (response.success && response.data) {
        setPartner(response.data)
        setFormData({
          ...formData,
          personalityType: response.data.personalityType,
          speechStyle: response.data.speechStyle,
          systemPrompt: response.data.systemPrompt
        })
        alert('プリセットを適用しました')
      }
    } catch (error) {
      console.error('プリセット適用エラー:', error)
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">パートナー情報を読み込み中...</p>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (!partner) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-gray-600">パートナーが見つかりません</p>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      {/* モック使用バナー */}
      <div className="bg-red-500 text-white text-center py-2 text-sm">
        ⚠️ モックデータ使用中 - 本番環境では使用不可
      </div>

      <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
        <main className="max-w-4xl mx-auto p-6">
          {/* パートナー情報カード */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-6">
              <img
                src={partner.baseImageUrl || '/images/default-avatar.png'}
                alt={partner.name}
                className="w-32 h-32 rounded-full object-cover shadow-lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {partner.name}
                  </h1>
                  <button
                    onClick={() => setShowNameEdit(true)}
                    className="p-1 text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    <span className="material-icons text-lg">edit</span>
                  </button>
                </div>
                <p className="text-gray-600">
                  {partner.personalityType} • {partner.speechStyle}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  親密度: {partner.intimacyLevel}%
                </p>
              </div>
            </div>
          </div>

          {/* 編集タブ */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* タブヘッダー */}
            <div className="flex border-b">
              {[
                { key: 'personality', label: '性格・口調' },
                { key: 'appearance', label: '見た目' },
                { key: 'details', label: '趣味・詳細' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-6 py-4 text-center transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-pink-500 border-b-2 border-pink-500 font-medium'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* タブコンテンツ */}
            <div className="p-6">
              {/* 性格・口調タブ */}
              {activeTab === 'personality' && (
                <div>
                  {/* モード切り替え */}
                  <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button
                      onClick={() => setEditMode('simple')}
                      className={`flex-1 py-3 px-4 rounded-md transition-all ${
                        editMode === 'simple'
                          ? 'bg-white text-pink-500 shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      簡単設定
                    </button>
                    <button
                      onClick={() => setEditMode('advanced')}
                      className={`flex-1 py-3 px-4 rounded-md transition-all ${
                        editMode === 'advanced'
                          ? 'bg-white text-pink-500 shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      詳細設定
                    </button>
                  </div>

                  {/* 簡単設定モード */}
                  {editMode === 'simple' && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">性格プリセット</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {presets.map((preset) => (
                          <div
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              partner.personalityType === preset.personality
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-pink-300'
                            }`}
                          >
                            <div className="text-2xl mb-2">{preset.icon}</div>
                            <h4 className="font-medium mb-1">{preset.name}</h4>
                            <p className="text-sm text-gray-600">{preset.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 詳細設定モード */}
                  {editMode === 'advanced' && (
                    <div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          システムプロンプト
                        </label>
                        <textarea
                          value={formData.systemPrompt || ''}
                          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                          className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none resize-none"
                          placeholder="パートナーの性格や話し方を詳しく記述してください..."
                        />
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                          <span>{formData.systemPrompt?.length || 0} / 1000文字</span>
                          <div className="flex gap-2">
                            <button
                              onClick={handleValidatePrompt}
                              disabled={validating || !formData.systemPrompt}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                              {validating ? '検証中...' : '検証'}
                            </button>
                            <button
                              onClick={handleGeneratePreview}
                              disabled={generatingPreview || !formData.systemPrompt}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              {generatingPreview ? '生成中...' : 'プレビュー'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 検証結果 */}
                      {validationResult && (
                        <div className={`p-4 rounded-lg mb-4 ${
                          validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                          <h4 className="font-medium mb-2">
                            {validationResult.isValid ? '✅ 検証OK' : '⚠️ 改善提案'}
                          </h4>
                          {validationResult.warnings?.map((warning: string, index: number) => (
                            <p key={index} className="text-sm text-gray-700">{warning}</p>
                          ))}
                        </div>
                      )}

                      {/* プレビュー */}
                      {preview && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-3">💬 会話プレビュー</h4>
                          <div className="space-y-2">
                            {preview.messages.map((msg: any, index: number) => (
                              <div key={index} className="bg-white p-3 rounded-lg">
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 見た目タブ */}
              {activeTab === 'appearance' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">外見設定</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        アバター説明
                      </label>
                      <textarea
                        value={formData.avatarDescription || ''}
                        onChange={(e) => setFormData({ ...formData, avatarDescription: e.target.value })}
                        className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                        placeholder="外見の特徴を記述してください..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">外見プリセット</h4>
                      <div className="space-y-3">
                        {['髪型', '目の色', '体型', '服装スタイル'].map((item) => (
                          <div key={item}>
                            <label className="block text-xs text-gray-600 mb-1">{item}</label>
                            <select className="w-full p-2 border border-gray-300 rounded focus:border-pink-500">
                              <option>選択してください</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 趣味・詳細タブ */}
              {activeTab === 'details' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">趣味・詳細情報</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      趣味・特技
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.hobbies?.map((hobby, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm flex items-center gap-1"
                        >
                          {hobby}
                          <button
                            onClick={() => {
                              const newHobbies = formData.hobbies?.filter((_, i) => i !== index)
                              setFormData({ ...formData, hobbies: newHobbies })
                            }}
                            className="ml-1 text-pink-500 hover:text-pink-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="趣味を入力してEnterキーで追加..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement
                          const value = input.value.trim()
                          if (value && !formData.hobbies?.includes(value)) {
                            setFormData({
                              ...formData,
                              hobbies: [...(formData.hobbies || []), value]
                            })
                            input.value = ''
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => router.push('/home')}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </main>
      </div>

      {/* 名前編集モーダル */}
      {showNameEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">名前を編集</h3>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none mb-4"
              placeholder="パートナーの名前"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameEdit(false)}
                className="flex-1 py-2 px-4 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={() => setShowNameEdit(false)}
                className="flex-1 py-2 px-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}