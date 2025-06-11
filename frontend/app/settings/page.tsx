'use client'

// U-004: 設定ページ
import { useState, useEffect } from 'react'
import UserLayout from '@/layouts/UserLayout'
import { mockSettingsService } from '@/services/mock/settings.mock'
import { NotificationSettings, UserSettings, BackgroundImage } from '@/types'

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBackgroundModal, setShowBackgroundModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const userId = 'user123' // TODO: 実際のユーザーIDを取得
      const [notifications, user, backgrounds] = await Promise.all([
        mockSettingsService.getNotificationSettings(userId),
        mockSettingsService.getUserSettings(userId),
        mockSettingsService.getBackgroundImages()
      ])
      
      setNotificationSettings(notifications)
      setUserSettings(user)
      setBackgroundImages(backgrounds)
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationToggle = async () => {
    if (!notificationSettings) return
    
    try {
      const updated = await mockSettingsService.updateNotificationSettings(
        'user123',
        { morningGreeting: !notificationSettings.morningGreeting }
      )
      setNotificationSettings(updated)
    } catch (error) {
      console.error('通知設定の更新に失敗しました:', error)
    }
  }

  const handleTimeChange = async (time: string) => {
    if (!notificationSettings) return
    
    try {
      const updated = await mockSettingsService.updateNotificationSettings(
        'user123',
        { morningTime: time }
      )
      setNotificationSettings(updated)
    } catch (error) {
      console.error('通知時刻の更新に失敗しました:', error)
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
      const result = await mockSettingsService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      )
      
      if (result.success) {
        alert(result.message)
        setShowPasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('パスワード変更に失敗しました:', error)
      alert('パスワード変更に失敗しました')
    }
  }

  const handleBackgroundSelect = async (backgroundId: string) => {
    try {
      await mockSettingsService.setBackground('user123', backgroundId)
      const selectedBg = backgroundImages.find(bg => bg.id === backgroundId)
      if (selectedBg) {
        alert(`背景を「${selectedBg.name}」に変更しました`)
      }
      setShowBackgroundModal(false)
    } catch (error) {
      console.error('背景設定に失敗しました:', error)
    }
  }

  const handleExportData = async (includeConversations: boolean) => {
    try {
      const blob = await mockSettingsService.exportData('user123', includeConversations)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${includeConversations ? 'full' : 'chat-only'}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const type = includeConversations ? 'すべてのデータ' : '会話履歴'
      alert(`${type}のエクスポートを開始しました`)
    } catch (error) {
      console.error('データエクスポートに失敗しました:', error)
    }
  }

  const handleDeleteAccount = async () => {
    const password = prompt('アカウント削除の確認のため、パスワードを入力してください：')
    if (!password) return
    
    try {
      const result = await mockSettingsService.deleteAccount('user123', password)
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
      {/* モック使用中の警告バナー */}
      <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
        ⚠️ モックデータ使用中 - 本番環境では使用不可
      </div>
      
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
              <div className="font-medium text-gray-800">[MOCK] user@example.com</div>
              <div className="text-sm text-gray-600 mt-1">2025年1月11日に登録</div>
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
              {backgroundImages.map((bg) => (
                <div
                  key={bg.id}
                  onClick={() => handleBackgroundSelect(bg.id)}
                  className="relative cursor-pointer rounded-lg overflow-hidden aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium hover:opacity-80 transition-opacity"
                >
                  [MOCK] {bg.name}
                </div>
              ))}
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