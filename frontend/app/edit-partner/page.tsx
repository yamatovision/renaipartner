'use client'

// U-003: パートナー編集ページ
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import UserLayout from '@/layouts/UserLayout'
import { Partner, PartnerUpdate, PersonalityType, SpeechStyle, PresetPersonality, PERSONALITY_PRESETS, EpisodeMemory, HairStyle, EyeColor } from '@/types'
import { partnersService, memoryService, imagesService } from '@/services'

function EditPartnerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const partnerId = searchParams.get('id')

  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'personality' | 'appearance' | 'details' | 'memories'>('personality')
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple')
  const [presets, setPresets] = useState<PresetPersonality[]>([])
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [episodes, setEpisodes] = useState<EpisodeMemory[]>([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [imageGenerating, setImageGenerating] = useState(false)

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
        console.log('=== パートナー詳細取得開始 ===')
        console.log('Partner ID:', partnerId)
        
        const response = await partnersService.getPartnerDetail(partnerId)
        
        console.log('=== パートナー詳細取得結果 ===')
        console.log('Response Success:', response.success)
        console.log('Response Data:', response.data)
        console.log('Response Data Type:', typeof response.data)
        console.log('Response Data Keys:', response.data ? Object.keys(response.data) : 'null')
        
        // APIレスポンスから直接パートナーデータを取得
        const partnerData = response.data
        
        console.log('=== 最終パートナーデータ ===')
        console.log('Actual Partner Data:', partnerData)
        console.log('Partner Data Type:', typeof partnerData)
        console.log('Partner Data Keys:', partnerData ? Object.keys(partnerData) : 'null')
        console.log('Base Image URL:', partnerData?.baseImageUrl)
        console.log('Generated Image URL:', partnerData?.appearance?.generatedImageUrl)
        console.log('Appearance Object:', partnerData?.appearance)
        
        if (response.success && partnerData) {
          setPartner(partnerData)
          setFormData({
            name: partnerData.name,
            personalityType: partnerData.personalityType,
            speechStyle: partnerData.speechStyle,
            systemPrompt: partnerData.systemPrompt,
            avatarDescription: partnerData.avatarDescription,
            appearance: partnerData.appearance,
            hobbies: partnerData.hobbies
          })
        } else {
          console.error('パートナーが見つかりません:', response.error)
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
        // プリセットは型定義のPERSONALITY_PRESETSを使用
        setPresets(Object.values(PERSONALITY_PRESETS))
      } catch (error) {
        console.error('プリセット取得エラー:', error)
      }
    }

    loadPresets()
  }, [])

  // エピソード記憶読み込み
  const loadEpisodes = async () => {
    if (!partnerId) return

    try {
      setLoadingEpisodes(true)
      const response = await memoryService.getEpisodes(partnerId)
      if (response.success && response.data) {
        setEpisodes(response.data)
      }
    } catch (error) {
      console.error('エピソード記憶取得エラー:', error)
    } finally {
      setLoadingEpisodes(false)
    }
  }

  // memoriesタブが選択された時にエピソードを読み込む
  useEffect(() => {
    if (activeTab === 'memories' && partnerId) {
      loadEpisodes()
    }
  }, [activeTab, partnerId])

  // 保存処理
  const handleSave = async () => {
    if (!partnerId || !partner) return

    setSaving(true)
    try {
      const response = await partnersService.updatePartner(partnerId, formData)
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
      const response = await partnersService.validatePrompt({ systemPrompt: formData.systemPrompt })
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
      const response = await partnersService.previewPrompt({ systemPrompt: formData.systemPrompt })
      if (response.success && response.data?.response) {
        setPreview({ messages: [{ content: response.data.response }] })
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error)
    } finally {
      setGeneratingPreview(false)
    }
  }

  // アバター画像生成
  const generateAvatarImage = async () => {
    if (!partner) return

    setImageGenerating(true)
    try {
      // パートナー情報から画像生成用のコンテキストを作成
      const context = `${partner.gender}のパートナー、${partner.avatarDescription || '美しい'}`
      
      const imageRequest = {
        partnerId: partner.id,
        context: context,
        emotion: 'neutral',
        prompt: `beautiful ${partner.gender}, ${partner.avatarDescription || 'attractive'}, high quality portrait`,
        width: 1104,
        height: 1104,
        numImages: 1
      }

      const response = await imagesService.generateAvatar(imageRequest)
      
      if (response.success && response.data) {
        setFormData(prev => ({
          ...prev,
          appearance: {
            ...prev.appearance,
            generatedImageUrl: response.data!.imageUrl
          }
        }))
        setPartner(prev => prev ? {
          ...prev,
          appearance: {
            ...prev.appearance,
            generatedImageUrl: response.data!.imageUrl
          }
        } : null)
      } else {
        console.error('画像生成に失敗しました:', response.error)
        alert('画像生成に失敗しました')
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
      alert('画像生成中にエラーが発生しました')
    } finally {
      setImageGenerating(false)
    }
  }

  // プリセット適用
  const handleApplyPreset = async (presetId: string) => {
    if (!partnerId) return

    try {
      // プリセット適用のモック実装
      const preset = presets.find(p => p.id === presetId)
      if (preset) {
        const updatedPartner = {
          ...partner!,
          personalityType: preset.personality,
          speechStyle: preset.speechStyle,
          systemPrompt: preset.systemPrompt
        }
        const response = { success: true, data: updatedPartner }
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

      <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
        <main className="max-w-4xl mx-auto p-6">
          {/* パートナー情報カード */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-6">
              <img
                src={partner.appearance?.generatedImageUrl || partner.baseImageUrl || '/images/default-avatar.png'}
                alt={partner.name}
                className="w-32 h-32 rounded-full object-cover shadow-lg"
                onError={(e) => {
                  console.error('=== 画像読み込みエラー詳細 ===')
                  console.error('エラー発生URL:', e.currentTarget.src)
                  console.error('Partner Object:', partner)
                  console.error('Generated Image URL:', partner.appearance?.generatedImageUrl)
                  console.error('Base Image URL:', partner.baseImageUrl)
                  console.error('Fallback Image URL:', '/images/default-avatar.png')
                  
                  if (e.currentTarget.src !== '/images/default-avatar.png') {
                    console.log('フォールバック画像に切り替え中...')
                    e.currentTarget.src = '/images/default-avatar.png'
                  } else {
                    console.error('フォールバック画像も読み込めませんでした')
                  }
                }}
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
                { key: 'details', label: '趣味・詳細' },
                { key: 'memories', label: '思い出' }
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
                      
                      {/* アバター画像生成ボタン */}
                      <div className="mt-4 text-center">
                        <button
                          onClick={generateAvatarImage}
                          disabled={imageGenerating}
                          className="px-6 py-2 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {imageGenerating ? '画像生成中...' : 'アバター画像を生成'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          説明を基に新しいアバター画像を生成します
                        </p>
                      </div>

                      {/* 生成された画像のプレビュー */}
                      {(formData.appearance?.generatedImageUrl || partner?.appearance?.generatedImageUrl) && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">現在のアバター画像</p>
                          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-pink-500 bg-gray-100">
                            <img 
                              src={formData.appearance?.generatedImageUrl || partner?.appearance?.generatedImageUrl} 
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {/* 髪色選択 */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">髪の色</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { value: '#000000', label: 'black', japanese: '黒' },
                            { value: '#3B2F2F', label: 'dark brown', japanese: 'ダークブラウン' },
                            { value: '#8B4513', label: 'brown', japanese: 'ブラウン' },
                            { value: '#FFD700', label: 'blonde', japanese: 'ブロンド' },
                            { value: '#FF6B6B', label: 'pink', japanese: 'ピンク' },
                            { value: '#4ECDC4', label: 'light blue', japanese: '水色' },
                            { value: '#95E1D3', label: 'mint green', japanese: 'ミントグリーン' },
                            { value: '#C7CEEA', label: 'lavender', japanese: 'ラベンダー' },
                            { value: '#FFEAA7', label: 'light gold', japanese: 'ライトゴールド' },
                            { value: '#636E72', label: 'silver', japanese: 'シルバー' }
                          ].map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setFormData({ 
                                ...formData, 
                                appearance: { 
                                  ...formData.appearance, 
                                  hairColor: color.label 
                                } 
                              })}
                              className={`
                                relative w-full h-10 rounded-lg border-2 transition-all
                                ${formData.appearance?.hairColor === color.label 
                                  ? 'border-pink-500 scale-110 shadow-lg' 
                                  : 'border-gray-300 hover:scale-105'
                                }
                              `}
                              style={{ backgroundColor: color.value }}
                              title={color.japanese}
                            >
                              {formData.appearance?.hairColor === color.label && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white text-sm drop-shadow-md">✓</span>
                                </div>
                              )}
                              <span className="sr-only">{color.japanese}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 髪型選択 */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">髪型</label>
                        <select
                          value={formData.appearance?.hairStyle || 'medium'}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            appearance: { 
                              ...formData.appearance, 
                              hairStyle: e.target.value as HairStyle 
                            } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                        >
                          <option value="short">ショート</option>
                          <option value="medium">ミディアム</option>
                          <option value="long">ロング</option>
                        </select>
                      </div>

                      {/* 目の色選択 */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">目の色</label>
                        <select
                          value={formData.appearance?.eyeColor || 'brown'}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            appearance: { 
                              ...formData.appearance, 
                              eyeColor: e.target.value as EyeColor 
                            } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                        >
                          <option value="brown">ブラウン</option>
                          <option value="black">ブラック</option>
                          <option value="blue">ブルー</option>
                          <option value="green">グリーン</option>
                        </select>
                      </div>

                      <h4 className="text-sm font-medium text-gray-700 mb-3">外見プリセット</h4>
                      <div className="space-y-3">
                        {['体型', '服装スタイル'].map((item) => (
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

              {/* 思い出タブ */}
              {activeTab === 'memories' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center">
                      <span className="mr-2">💕</span>
                      {partner.name}との思い出
                    </h2>
                    <p className="text-gray-600 text-sm">
                      AIパートナーと共有した特別な記憶やエピソードです
                    </p>
                  </div>

                  {loadingEpisodes ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">思い出を読み込み中...</p>
                    </div>
                  ) : episodes.length > 0 ? (
                    <div className="space-y-4">
                      {episodes.map((episode, index) => (
                        <div 
                          key={episode.id || index} 
                          className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-800">{episode.title}</h3>
                            <span className="text-sm text-gray-500">
                              {new Date(episode.date).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-3 leading-relaxed">
                            {episode.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {episode.tags.map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex} 
                                  className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            <div className="flex items-center">
                              {/* 感情の重み表示 */}
                              <div className="flex items-center mr-3">
                                <span className="text-sm text-gray-600 mr-1">感情の強さ:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span 
                                      key={i} 
                                      className={`text-sm ${
                                        i < episode.emotionalWeight ? 'text-red-500' : 'text-gray-300'
                                      }`}
                                    >
                                      ❤️
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* 参加者表示 */}
                              {episode.participants && episode.participants.length > 0 && (
                                <div className="text-sm text-gray-600">
                                  👥 {episode.participants.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📖</div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        まだ思い出がありません
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        {partner.name}との会話を続けていくと、<br />
                        特別な瞬間が思い出として記録されます
                      </p>
                      <button
                        onClick={loadEpisodes}
                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        🔄 更新
                      </button>
                    </div>
                  )}

                  {/* 思い出の更新ボタン */}
                  {episodes.length > 0 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={loadEpisodes}
                        disabled={loadingEpisodes}
                        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {loadingEpisodes ? '更新中...' : '🔄 思い出を更新'}
                      </button>
                    </div>
                  )}
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

export default function EditPartnerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">読み込み中...</div>}>
      <EditPartnerContent />
    </Suspense>
  )
}