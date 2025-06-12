'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Container, 
  IconButton, 
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { LoginRequest } from '@/types'

// P-001: ログインページ
export default function LoginPage() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    login?: string
  }>({})

  // フォーム入力ハンドラー
  const handleInputChange = (field: keyof LoginRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください'
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ログイン処理
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // ログイン処理開始
      await authLogin(formData.email, formData.password)
      // AuthContextがリダイレクトを処理
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ login: error.message })
      } else {
        setErrors({ login: 'ログインに失敗しました' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >

      <Container maxWidth="xs">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            padding: 6,
            animation: 'fadeIn 0.5s ease-out',
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {/* ロゴ */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                color: '#667eea',
                fontWeight: 500,
                mb: 1,
              }}
            >
              AI彼氏彼女
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              あなたの理想のパートナーと出会う
            </Typography>
          </Box>


          {/* テストログイン情報 */}
          <Box
            sx={{
              bgcolor: '#e3f2fd',
              border: '1px solid #1976d2',
              borderRadius: 2,
              p: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}
            >
              🔧 テストログイン情報
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFormData({ email: 'test@example.com', password: 'password123' })}
                  sx={{ fontSize: '0.75rem' }}
                >
                  👤 ユーザー
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFormData({ email: 'admin@example.com', password: 'password123' })}
                  sx={{ fontSize: '0.75rem' }}
                >
                  👑 管理者
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ボタンクリックで自動入力されます（パスワード: password123）
              </Typography>
            </Box>
          </Box>

          {/* エラーメッセージ */}
          {errors.login && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.login}
            </Alert>
          )}

          {/* メールアドレス入力 */}
          <TextField
            fullWidth
            label="メールアドレス"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            placeholder="example@email.com"
            autoFocus
            sx={{ mb: 3 }}
          />

          {/* パスワード入力 */}
          <TextField
            fullWidth
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!errors.password}
            helperText={errors.password}
            placeholder="••••••••"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 4 }}
          />

          {/* ログインボタン */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'ログイン'
            )}
          </Button>

          {/* 新規登録リンク */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              アカウントをお持ちでない方は{' '}
              <Link
                href="/register"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                新規登録
              </Link>
            </Typography>
          </Box>

          {/* テスト用情報（開発環境のみ） */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              テスト用アカウント：
              <br />
              Email: test@example.com / admin@example.com
              <br />
              Password: password123
            </Typography>
          </Box>

        </Box>
      </Container>
    </Box>
  )
}