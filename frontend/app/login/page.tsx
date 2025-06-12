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
        backgroundImage: 'url(/asset/Leonardo_Anime_XL_heart_shaped_fireworks_pink_and_gold_sparkle_1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1,
        },
      }}
    >

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
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
                color: '#ec4899',
                fontWeight: 500,
                mb: 1,
              }}
            >
              恋AIパートナー
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              あなたの理想のパートナーと出会う
            </Typography>
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
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)',
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
                  color: '#ec4899',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                新規登録
              </Link>
            </Typography>
          </Box>


        </Box>
      </Container>
    </Box>
  )
}