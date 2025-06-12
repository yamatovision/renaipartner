'use client'

// A-001: ユーザー管理ページ
import { useState, useEffect } from 'react'
import AdminLayout from '@/layouts/AdminLayout'
import { User, UserStatus, UserCreate, CreateUserRequest, PaginatedResponse } from '@/types'
import { adminService } from '@/services'

// ユーザー統計カードコンポーネント
function UserStatsCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string
  value: number
  icon: string
  color: string 
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`text-2xl mr-4 ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{(value || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

// ユーザー作成モーダルコンポーネント
function CreateUserModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: CreateUserRequest) => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    await onSubmit({ 
      email: email.trim(),
      password: 'aikakumei',
      surname: 'テスト',
      firstName: 'ユーザー',
      birthday: '2000-01-01'
    })
    setLoading(false)
    setEmail('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">新規ユーザー作成</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              初期パスワード: <span className="font-mono bg-gray-100 px-2 py-1 rounded">aikakumei</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)


  // データ取得
  const fetchData = async () => {
    setLoading(true)
    try {
      // 統計情報とユーザー一覧を並行取得
      const [statsResponse, usersResponse] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({
          search: search || undefined,
          status: statusFilter || undefined,
          page: currentPage,
          limit: 10
        })
      ])

      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data)
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [search, statusFilter, currentPage])

  // 検索・フィルター処理
  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: UserStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // ユーザー作成
  const handleCreateUser = async (userData: CreateUserRequest) => {
    const response = await adminService.createUser(userData)
    if (response.success) {
      fetchData() // データ再取得
    } else {
      alert(response.error)
    }
  }

  // ユーザーステータス変更
  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    setActionLoading(userId)
    try {
      const response = await adminService.updateUserStatus(userId, newStatus)
      if (response.success) {
        fetchData() // データ再取得
      } else {
        alert(response.error)
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // ステータス表示用のヘルパー
  const getStatusBadge = (status: UserStatus) => {
    const isActive = status === UserStatus.ACTIVE
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'アクティブ' : '無効'}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <main className="flex-1 bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <span>➕</span>
                新規ユーザー作成
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">データを読み込み中...</p>
              </div>
            ) : (
              <>
                {/* 統計情報カード */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <UserStatsCard
                      title="総ユーザー数"
                      value={stats.totalUsers}
                      icon="👥"
                      color="text-blue-600"
                    />
                    <UserStatsCard
                      title="アクティブユーザー"
                      value={stats.activeUsers}
                      icon="✅"
                      color="text-green-600"
                    />
                    <UserStatsCard
                      title="無効化ユーザー"
                      value={stats.inactiveUsers}
                      icon="❌"
                      color="text-red-600"
                    />
                    <UserStatsCard
                      title="今日の新規登録"
                      value={stats.todayRegistrations}
                      icon="🆕"
                      color="text-purple-600"
                    />
                  </div>
                )}

                {/* 検索・フィルター */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス検索
                      </label>
                      <input
                        id="search"
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="メールアドレスで検索"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        ステータスフィルター
                      </label>
                      <select
                        id="status"
                        value={statusFilter}
                        onChange={(e) => handleStatusFilter(e.target.value as UserStatus | '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">すべて</option>
                        <option value={UserStatus.ACTIVE}>アクティブ</option>
                        <option value={UserStatus.INACTIVE}>無効</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ユーザー一覧テーブル */}
                {users && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              メールアドレス
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              名前
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ステータス
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              登録日
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              アクション
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users?.items?.map((user: User) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.surname} {user.firstName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(user.status!)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {user.status === UserStatus.ACTIVE ? (
                                  <button
                                    onClick={() => handleStatusChange(user.id, UserStatus.INACTIVE)}
                                    disabled={actionLoading === user.id}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  >
                                    {actionLoading === user.id ? '処理中...' : '無効化'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                    disabled={actionLoading === user.id}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    {actionLoading === user.id ? '処理中...' : '有効化'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ページネーション */}
                    {users && users.totalPages > 1 && (
                      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            前へ
                          </button>
                          <span className="text-sm text-gray-700">
                            ページ {currentPage} / {users?.totalPages || 0} （全 {users?.total || 0} 件）
                          </span>
                          <button
                            onClick={() => setCurrentPage(Math.min(users?.totalPages || 1, currentPage + 1))}
                            disabled={currentPage === (users?.totalPages || 1)}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            次へ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* 新規ユーザー作成モーダル */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
      />
    </AdminLayout>
  )
}