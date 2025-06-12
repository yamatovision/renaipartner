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
  CircularProgress,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Collapse
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { RegisterRequest, UserRole, USER_VALIDATION_RULES } from '@/types'

// P-002: ユーザー登録ページ
export default function RegisterPage() {
  const router = useRouter()
  const { register: authRegister } = useAuth()
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    surname: '',
    firstName: '',
    birthday: '',
    role: UserRole.USER
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest, string>> & {
    terms?: string
    register?: string
  }>({})

  // パスワード強度を計算
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0
    
    let strength = 0
    
    // 長さチェック
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    
    // 文字種チェック
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    
    return Math.min(100, (strength / 6) * 100)
  }

  const getPasswordStrengthLabel = (strength: number): { label: string; color: string } => {
    if (strength <= 33) return { label: '弱い', color: 'error' }
    if (strength <= 66) return { label: '普通', color: 'warning' }
    return { label: '強い', color: 'success' }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)
  const strengthInfo = getPasswordStrengthLabel(passwordStrength)

  // フォーム入力ハンドラー
  const handleInputChange = (field: keyof RegisterRequest) => (
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
    } else if (formData.password.length < (USER_VALIDATION_RULES.password.minLength || 8)) {
      newErrors.password = `パスワードは${USER_VALIDATION_RULES.password.minLength || 8}文字以上で設定してください`
    }

    if (!formData.surname) {
      newErrors.surname = '姓を入力してください'
    }

    if (!formData.firstName) {
      newErrors.firstName = '名を入力してください'
    }

    if (!formData.birthday) {
      newErrors.birthday = '誕生日を入力してください'
    }

    if (!termsAccepted) {
      newErrors.terms = '利用規約への同意が必要です'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 登録処理
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // 登録処理開始
      const requestData: RegisterRequest = formData
      
      await authRegister(requestData)
      
      // 成功表示
      setShowSuccess(true)
      
      // AuthContextがログイン後に/homeへリダイレクトするため、
      // ここでは何もしない
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ register: error.message })
      } else {
        setErrors({ register: '登録に失敗しました' })
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
        py: 3,
      }}
    >

      <Container maxWidth="xs">
        <Box
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
            opacity: showSuccess ? 0.5 : 1,
            transition: 'opacity 0.3s',
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
              アカウントを作成して始めましょう
            </Typography>
          </Box>

          {/* 成功メッセージ */}
          <Collapse in={showSuccess}>
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                animation: 'slideDown 0.3s ease-out',
                '@keyframes slideDown': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(-10px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              登録が完了しました！パートナー作成画面へ移動します...
            </Alert>
          </Collapse>

          {/* エラーメッセージ */}
          {errors.register && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.register}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
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

            {/* 名前入力 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="姓"
                value={formData.surname}
                onChange={handleInputChange('surname')}
                error={!!errors.surname}
                helperText={errors.surname}
                placeholder="山田"
              />
              <TextField
                fullWidth
                label="名"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                placeholder="太郎"
              />
            </Box>

            {/* 誕生日入力 */}
            <TextField
              fullWidth
              label="誕生日"
              type="date"
              value={formData.birthday}
              onChange={handleInputChange('birthday')}
              error={!!errors.birthday}
              helperText={errors.birthday}
              InputLabelProps={{
                shrink: true,
              }}
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
              helperText={errors.password || `${USER_VALIDATION_RULES.password.minLength || 8}文字以上で設定`}
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
              sx={{ mb: 1 }}
            />

            {/* パスワード強度表示 */}
            {formData.password && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength}
                  color={strengthInfo.color as any}
                  sx={{ height: 4, borderRadius: 2 }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: `${strengthInfo.color}.main`,
                    mt: 0.5,
                    display: 'block'
                  }}
                >
                  パスワードの強度: {strengthInfo.label}
                </Typography>
              </Box>
            )}

            {/* 利用規約 */}
            <Box 
              sx={{ 
                bgcolor: 'grey.50', 
                borderRadius: 2, 
                p: 2,
                mb: 3
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked)
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: undefined }))
                      }
                    }}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        alert('利用規約の内容をここに表示')
                      }}
                      style={{ color: '#667eea' }}
                    >
                      利用規約
                    </Link>
                    および
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        alert('プライバシーポリシーの内容をここに表示')
                      }}
                      style={{ color: '#667eea' }}
                    >
                      プライバシーポリシー
                    </Link>
                    に同意します
                  </Typography>
                }
              />
              {errors.terms && (
                <Typography 
                  variant="caption" 
                  color="error"
                  sx={{ display: 'block', mt: 1, ml: 4 }}
                >
                  {errors.terms}
                </Typography>
              )}
            </Box>

            {/* 登録ボタン */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || showSuccess}
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
                'アカウントを作成'
              )}
            </Button>
          </Box>

          {/* ログインリンク */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              すでにアカウントをお持ちの方は{' '}
              <Link
                href="/login"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                ログイン
              </Link>
            </Typography>
          </Box>

        </Box>
      </Container>
    </Box>
  )
}