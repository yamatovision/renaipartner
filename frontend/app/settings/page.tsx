'use client'

// U-004: 設定ページ
import { useState, useEffect } from 'react'
import UserLayout from '@/layouts/UserLayout'
import { usersService, authService, notificationsService, settingsService, imagesService } from '@/services'
import { NotificationSettings, UserSettings, BackgroundImage } from '@/types'

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBackgroundModal, setShowBackgroundModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [registrationDate, setRegistrationDate] = useState<string>('')
  const [userProfile, setUserProfile] = useState<{
    surname: string
    firstName: string
    nickname?: string
    birthday: string
  } | null>(null)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [profileForm, setProfileForm] = useState({
    surname: '',
    firstName: '',
    nickname: '',
    birthday: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  // 朝の挨拶スケジュール作成
  const createMorningGreetingSchedule = async (morningTime: string) => {
    try {
      // 今日の朝の挨拶時刻を設定（もし今日の時刻を過ぎていたら明日の同時刻）
      const now = new Date()
      const today = new Date()
      const [hours, minutes] = morningTime.split(':').map(Number)
      
      today.setHours(hours, minutes, 0, 0)
      
      // 今日の時刻を過ぎていたら明日にする
      if (today <= now) {
        today.setDate(today.getDate() + 1)
      }

      const scheduleRequest = {
        type: 'morning_greeting' as const,
        scheduledTime: today,
        recurring: true,
        recurringPattern: 'daily' as const,
        message: '朝の挨拶メッセージ'
      }

      const response = await notificationsService.createSchedule(scheduleRequest)
      
      if (response.success && response.data) {
        console.log('朝の挨拶スケジュールが作成されました:', response.data)
      } else {
        throw new Error(response.error || 'スケジュール作成に失敗しました')
      }
    } catch (error) {
      console.error('朝の挨拶スケジュール作成エラー:', error)
      throw error
    }
  }

  const loadSettings = async () => {
    try {
      // 現在のユーザー情報を取得
      const userResponse = await authService.getCurrentUser()
      if (!userResponse.success) {
        throw new Error('ユーザー情報の取得に失敗しました')
      }
      
      // ユーザーのメールアドレスと登録日を設定
      setUserEmail(userResponse.data?.email || '')
      const createdAt = userResponse.data?.createdAt
      if (createdAt) {
        const date = new Date(createdAt)
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
        setRegistrationDate(formattedDate)
      }
      
      // プロフィール情報を取得
      const profileResponse = await usersService.getProfile()
      if (!profileResponse.success) {
        throw new Error('プロフィール情報の取得に失敗しました')
      }
      
      // プロフィール情報をstateに保存
      if (profileResponse.data) {
        setUserProfile({
          surname: profileResponse.data.surname,
          firstName: profileResponse.data.firstName,
          nickname: profileResponse.data.nickname || '',
          birthday: profileResponse.data.birthday
        })
        // フォームの初期値も設定
        setProfileForm({
          surname: profileResponse.data.surname,
          firstName: profileResponse.data.firstName,
          nickname: profileResponse.data.nickname || '',
          birthday: profileResponse.data.birthday
        })
      }
      
      // 実装済みのユーザー情報を設定に反映
      setUserSettings({
        id: userResponse.data?.id || '',
        userId: userResponse.data?.id || '',
        theme: 'default',
        backgroundImage: 'default',
        soundEnabled: true,
        autoSave: true,
        dataRetentionDays: 365
      })
      
      // 通知設定をAPIから取得
      const notifResponse = await notificationsService.getSettings()
      if (notifResponse.success && notifResponse.data) {
        setNotificationSettings(notifResponse.data)
      } else {
        // デフォルト値を設定
        setNotificationSettings({
          id: '',
          userId: userResponse.data?.id || '',
          morningGreeting: true,
          morningTime: '08:00',
          reminderMessages: true,
          specialDays: true
        })
      }
      
      // 背景画像をAPIから取得
      try {
        const backgrounds = await imagesService.getBackgrounds()
        console.log('[SETTINGS] 背景画像APIレスポンス:', backgrounds)
        
        // 配列であることを確認
        if (Array.isArray(backgrounds) && backgrounds.length > 0) {
          setBackgroundImages(backgrounds)
        } else {
          console.log('[SETTINGS] 背景画像が空またはAPIエラー、フォールバックを使用')
          // フォールバック画像を設定
          setBackgroundImages([
            { id: 'default', name: 'デフォルト', url: '/chat-bg-1.jpg', category: 'default', isDefault: true },
            { id: 'nature1', name: '自然1', url: '/chat-bg-2.jpg', category: 'nature', isDefault: false },
            { id: 'city1', name: '都市1', url: '/chat-bg-3.jpg', category: 'city', isDefault: false }
          ])
        }
      } catch (error) {
        console.error('背景画像の取得に失敗しました:', error)
        // フォールバック画像を設定
        setBackgroundImages([
          { id: 'default', name: 'デフォルト', url: '/chat-bg-1.jpg', category: 'default', isDefault: true },
          { id: 'nature1', name: '自然1', url: '/chat-bg-2.jpg', category: 'nature', isDefault: false },
          { id: 'city1', name: '都市1', url: '/chat-bg-3.jpg', category: 'city', isDefault: false }
        ])
      }
      
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationToggle = async () => {
    if (!notificationSettings) return
    
    try {
      const updated = {
        ...notificationSettings,
        morningGreeting: !notificationSettings.morningGreeting
      }
      
      const response = await notificationsService.updateSettings(updated)
      if (response.success && response.data) {
        setNotificationSettings(response.data)
        
        // 朝の挨拶が有効になった場合、自動でスケジュールを作成
        if (updated.morningGreeting && !notificationSettings.morningGreeting) {
          try {
            await createMorningGreetingSchedule(updated.morningTime)
          } catch (scheduleError) {
            console.error('スケジュール作成に失敗しました:', scheduleError)
            // スケジュール作成エラーは通知設定自体は成功しているので警告のみ
            console.warn('朝の挨拶スケジュールの作成に失敗しましたが、設定は保存されました')
          }
        }
      } else {
        throw new Error(response.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('通知設定の更新に失敗しました:', error)
      // エラー時は元に戻す
      setNotificationSettings(prev => prev ? { ...prev, morningGreeting: !prev.morningGreeting } : prev)
    }
  }

  const handleTimeChange = async (time: string) => {
    if (!notificationSettings) return
    
    try {
      const updated = {
        ...notificationSettings,
        morningTime: time
      }
      
      const response = await notificationsService.updateSettings(updated)
      if (response.success && response.data) {
        setNotificationSettings(response.data)
        
        // 朝の挨拶が有効な場合、新しい時刻でスケジュールを再作成
        if (updated.morningGreeting) {
          try {
            await createMorningGreetingSchedule(time)
          } catch (scheduleError) {
            console.error('スケジュール再作成に失敗しました:', scheduleError)
            console.warn('朝の挨拶スケジュールの再作成に失敗しましたが、設定は保存されました')
          }
        }
      } else {
        throw new Error(response.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('通知時刻の更新に失敗しました:', error)
      // エラー時は元に戻す
      setNotificationSettings(prev => prev ? { ...prev, morningTime: time } : prev)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('新しいパスワードと確認用パスワードが一致しません')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      alert('パスワードは8文字以上で入力してください')
      return
    }
    
    try {
      const result = await usersService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      })
      
      if (result.success) {
        alert('パスワードが正常に変更されました')
        setShowPasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        // バリデーションエラーの詳細を表示
        if (result.meta?.details && Array.isArray(result.meta.details)) {
          const errorMessages = result.meta.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join('\n')
          alert(`入力エラー:\n${errorMessages}`)
        } else {
          alert(result.error || 'パスワード変更に失敗しました')
        }
      }
    } catch (error: any) {
      console.error('パスワード変更に失敗しました:', error)
      
      // APIエラーレスポンスの詳細を表示
      if (error.meta?.details && Array.isArray(error.meta.details)) {
        const errorMessages = error.meta.details.map((detail: any) => 
          `${detail.field}: ${detail.message}`
        ).join('\n')
        alert(`入力エラー:\n${errorMessages}`)
      } else {
        alert('パスワード変更に失敗しました')
      }
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await usersService.updateProfile({
        surname: profileForm.surname,
        firstName: profileForm.firstName,
        nickname: profileForm.nickname || undefined,
        birthday: profileForm.birthday
      })
      
      if (result.success && result.data) {
        setUserProfile({
          surname: result.data.surname,
          firstName: result.data.firstName,
          nickname: result.data.nickname || '',
          birthday: result.data.birthday
        })
        alert('プロフィールが正常に更新されました')
        setShowProfileModal(false)
      } else {
        alert(result.error || 'プロフィール更新に失敗しました')
      }
    } catch (error) {
      console.error('プロフィール更新に失敗しました:', error)
      alert('プロフィール更新に失敗しました')
    }
  }

  const handleBackgroundSelect = async (backgroundId: string) => {
    try {
      if (!userSettings) return
      
      const updated = {
        ...userSettings,
        backgroundImage: backgroundId
      }
      
      // 設定を更新
      const response = await settingsService.updateSettings({
        userSettings: updated
      })
      
      if (response.success && response.data) {
        setUserSettings(response.data.userSettings || updated)
        const selectedBg = backgroundImages.find(bg => bg.id === backgroundId)
        if (selectedBg) {
          alert(`背景を「${selectedBg.name}」に変更しました`)
        }
        setShowBackgroundModal(false)
      } else {
        throw new Error(response.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('背景設定に失敗しました:', error)
      alert('背景設定の更新に失敗しました')
    }
  }

  const handleExportData = async (includeConversations: boolean) => {
    try {
      const result = await usersService.exportUserData()
      
      if (result.success) {
        const data = result.data
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export-full-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        alert('データのエクスポートが完了しました')
      } else {
        alert(result.error || 'データエクスポートに失敗しました')
      }
    } catch (error) {
      console.error('データエクスポートに失敗しました:', error)
      alert('データエクスポートに失敗しました')
    }
  }

  const handleDeleteAccount = async () => {
    const password = prompt('アカウント削除の確認のため、パスワードを入力してください：')
    if (!password) return
    
    try {
      // TODO: 実際のAPIを実装するまでの仮実装
      const result = { success: true, message: 'アカウントが削除されました' }
      if (result.success) {
        alert(result.message)
        // TODO: ログアウト処理を実装
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('アカウント削除に失敗しました:', error)
      alert('アカウント削除に失敗しました')
    }
    setShowDeleteModal(false)
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <span className="material-icons mr-3 text-blue-500 text-4xl">⚙️</span>
            設定
          </h1>
          <p className="text-gray-600 mb-8">アプリの動作やアカウント情報を管理できます</p>

          {/* 通知設定 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="material-icons mr-2 text-blue-500">🔔</span>
              通知設定
            </h2>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">朝の挨拶通知</div>
                <div className="text-sm text-gray-600">毎朝、パートナーからの挨拶メッセージが届きます</div>
              </div>
              <button
                onClick={handleNotificationToggle}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  notificationSettings?.morningGreeting ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  notificationSettings?.morningGreeting ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {notificationSettings?.morningGreeting && (
              <div className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 mb-1">通知時刻</div>
                  <div className="text-sm text-gray-600">朝の挨拶が届く時間を設定します</div>
                </div>
                <input
                  type="time"
                  value={notificationSettings.morningTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}
          </section>

          {/* アカウント設定 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="material-icons mr-2 text-blue-500">👤</span>
              アカウント
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="font-medium text-gray-800">{userEmail || 'メールアドレスを取得中...'}</div>
              <div className="text-sm text-gray-600 mt-1">{registrationDate ? `${registrationDate}に登録` : '登録日を取得中...'}</div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">プロフィール編集</div>
                <div className="text-sm text-gray-600">
                  {userProfile ? `${userProfile.surname} ${userProfile.firstName}${userProfile.nickname ? ` (${userProfile.nickname})` : ''}` : '名前を取得中...'}
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
              >
                <span className="material-icons mr-2">✏️</span>
                編集
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">パスワード変更</div>
                <div className="text-sm text-gray-600">アカウントのセキュリティを保護するため、定期的に変更することを推奨します</div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
              >
                <span className="material-icons mr-2">✏️</span>
                変更
              </button>
            </div>
          </section>

          {/* 背景設定 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="material-icons mr-2 text-blue-500">🖼️</span>
              チャット背景
            </h2>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">現在の背景</div>
                <div className="text-sm text-gray-600">チャット画面の背景画像を変更できます</div>
              </div>
              <button
                onClick={() => setShowBackgroundModal(true)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
              >
                <span className="material-icons mr-2">🖼️</span>
                変更
              </button>
            </div>
          </section>

          {/* データ管理 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="material-icons mr-2 text-blue-500">💾</span>
              データ管理
            </h2>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">すべてのデータをエクスポート</div>
                <div className="text-sm text-gray-600">会話履歴、思い出、人間関係記録などをまとめてダウンロード</div>
              </div>
              <button
                onClick={() => handleExportData(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                <span className="material-icons mr-2">⬇️</span>
                完全エクスポート
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">会話履歴のみエクスポート</div>
                <div className="text-sm text-gray-600">メッセージのみを軽量でダウンロード</div>
              </div>
              <button
                onClick={() => handleExportData(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
              >
                <span className="material-icons mr-2">💬</span>
                会話のみ
              </button>
            </div>

            {/* 危険な操作 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4">
              <div className="text-red-700 font-semibold mb-2">危険な操作</div>
              <div className="text-gray-600 text-sm mb-4">
                以下の操作は元に戻すことができません。実行前によくご確認ください。
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <span className="material-icons mr-2">🗑️</span>
                アカウントを削除
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* パスワード変更モーダル */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold mb-4">パスワード変更</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-5">
                <label className="block font-medium text-gray-800 mb-2">現在のパスワード</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block font-medium text-gray-800 mb-2">新しいパスワード</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-gray-800 mb-2">新しいパスワード（確認）</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 背景選択モーダル */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBackgroundModal(false)}>
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold mb-4">背景画像を選択</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {backgroundImages && Array.isArray(backgroundImages) && backgroundImages.length > 0 ? (
                backgroundImages.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => handleBackgroundSelect(bg.id)}
                    className="relative cursor-pointer rounded-lg overflow-hidden aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium hover:opacity-80 transition-opacity"
                  >
                    {bg.name}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-500">
                  背景画像を読み込み中...
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowBackgroundModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プロフィール編集モーダル */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold mb-4">プロフィール編集</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-5">
                <label className="block font-medium text-gray-800 mb-2">姓</label>
                <input
                  type="text"
                  value={profileForm.surname}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, surname: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block font-medium text-gray-800 mb-2">名</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block font-medium text-gray-800 mb-2">ニックネーム（オプション）</label>
                <input
                  type="text"
                  value={profileForm.nickname}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="例：たっちゃん"
                />
              </div>
              <div className="mb-6">
                <label className="block font-medium text-gray-800 mb-2">誕生日</label>
                <input
                  type="date"
                  value={profileForm.birthday}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, birthday: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false)
                    // フォームをリセット
                    if (userProfile) {
                      setProfileForm({
                        surname: userProfile.surname,
                        firstName: userProfile.firstName,
                        nickname: userProfile.nickname || '',
                        birthday: userProfile.birthday
                      })
                    }
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* アカウント削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold mb-4">アカウント削除の確認</h3>
            <p className="text-gray-600 mb-4">
              アカウントを削除すると、以下のデータが完全に削除され、復元することができません：
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>プロフィール情報</li>
              <li>AIパートナーの設定</li>
              <li>すべての会話履歴</li>
              <li>関係性の記録</li>
              <li>人間関係マップ</li>
              <li>思い出やエピソード記録</li>
            </ul>
            <p className="text-gray-600 mb-6">
              本当にアカウントを削除しますか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}