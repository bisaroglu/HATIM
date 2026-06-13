import type { AxiosError } from 'axios'

interface DotNetProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  message?: string
  errors?: Record<string, string | string[]>
}

type DotNetIdentityErrors = Array<{ code: string; description: string }>

const IDENTITY_ERROR_TR: Record<string, string> = {
  DuplicateEmail:               'Bu e-posta adresi zaten kayıtlı.',
  DuplicateUserName:            'Bu e-posta adresi zaten kullanılıyor.',
  InvalidEmail:                 'Geçerli bir e-posta adresi girin.',
  PasswordTooShort:             'Şifre en az 8 karakter olmalı.',
  PasswordRequiresDigit:        'Şifre en az bir rakam içermeli.',
  PasswordRequiresUpper:        'Şifre en az bir büyük harf içermeli.',
  PasswordRequiresLower:        'Şifre en az bir küçük harf içermeli.',
  PasswordRequiresNonAlphanumeric: 'Şifre en az bir özel karakter içermeli.',
  PasswordRequiresUniqueChars:  'Şifre daha fazla farklı karakter içermeli.',
  UserNotFound:                 'Bu e-posta adresine ait hesap bulunamadı.',
  InvalidToken:                 'Geçersiz ya da süresi dolmuş bağlantı.',
  LoginAlreadyAssociated:       'Bu hesap zaten bağlı.',
  UserAlreadyInRole:            'Kullanıcı zaten bu role sahip.',
}

const FIELD_NAME_MAP: Record<string, string> = {
  Email:     'email',
  email:     'email',
  Password:  'password',
  password:  'password',
  FirstName: 'firstName',
  firstName: 'firstName',
  LastName:  'lastName',
  lastName:  'lastName',
  UserName:  'email',
  username:  'email',
}

export interface ParsedApiError {
  message: string
  fieldErrors?: Record<string, string>
}

function isAxiosError(err: unknown): err is AxiosError<unknown> {
  return !!(err && typeof err === 'object' && (err as AxiosError).isAxiosError === true)
}

function extractTopLevelMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as DotNetProblemDetails
  return d.message ?? d.detail ?? d.title ?? null
}

export function parseApiError(err: unknown): ParsedApiError {

  if (!isAxiosError(err)) {
    return { message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' }
  }

  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return { message: 'Sunucu yanıt vermedi. Lütfen tekrar deneyin.' }
    }
    return { message: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.' }
  }

  const { status, data } = err.response

  if (status === 401) {
    const msg = extractTopLevelMessage(data)
    return { message: msg ?? 'E-posta adresi veya şifre hatalı.' }
  }

  if (status === 403) {
    return { message: 'Bu işlem için yetkiniz bulunmuyor.' }
  }

  if (status === 404) {
    const msg = extractTopLevelMessage(data)
    return { message: msg ?? 'İstenen kaynak bulunamadı.' }
  }

  if (status === 409) {
    const msg = extractTopLevelMessage(data)
    return { message: msg ?? 'Bu e-posta adresi zaten kullanılıyor.' }
  }

  if (status === 429) {
    return { message: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.' }
  }

  if (status === 400) {
    if (data && typeof data === 'object' && 'errors' in data) {
      const problem = data as DotNetProblemDetails
      const fieldErrors: Record<string, string> = {}

      if (problem.errors) {
        for (const [rawKey, rawMsgs] of Object.entries(problem.errors)) {
          const frontendKey = FIELD_NAME_MAP[rawKey] ?? rawKey.charAt(0).toLowerCase() + rawKey.slice(1)
          const firstMsg = Array.isArray(rawMsgs) ? rawMsgs[0] : String(rawMsgs)
          fieldErrors[frontendKey] = firstMsg
        }
      }

      return {
        message:
          Object.keys(fieldErrors).length > 0
            ? 'Lütfen form alanlarını kontrol edin.'
            : (problem.title ?? problem.message ?? 'Geçersiz istek.'),
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      }
    }

    if (Array.isArray(data)) {
      const identityErrors = data as DotNetIdentityErrors
      const messages = identityErrors.map((e) => IDENTITY_ERROR_TR[e.code] ?? e.description)
      const emailDuplicate = identityErrors.find(
        (e) => e.code === 'DuplicateEmail' || e.code === 'DuplicateUserName',
      )
      return {
        message: messages.join(' ') || 'Kayıt başarısız.',
        fieldErrors: emailDuplicate ? { email: IDENTITY_ERROR_TR[emailDuplicate.code] } : undefined,
      }
    }

    const msg = extractTopLevelMessage(data)
    return { message: msg ?? 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.' }
  }

  // 422 — FluentValidation hatalari
  if (status === 422) {
    if (data && typeof data === 'object' && 'errors' in data) {
      const problem = data as { errors?: Record<string, string[]>; title?: string }
      const firstError = problem.errors ? Object.values(problem.errors).flat()[0] : null
      return { message: firstError ?? problem.title ?? 'Girilen bilgiler işlenemedi. Lütfen kontrol edin.' }
    }
    const msg = extractTopLevelMessage(data)
    return { message: msg ?? 'Girilen bilgiler işlenemedi. Lütfen kontrol edin.' }
  }

  if (status >= 500) {
    return { message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' }
  }

  const msg = extractTopLevelMessage(data)
  return { message: msg ?? 'Bir hata oluştu. Lütfen tekrar deneyin.' }
}
