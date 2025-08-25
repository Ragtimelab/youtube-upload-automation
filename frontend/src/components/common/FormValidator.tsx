import React, { useState, useCallback, useMemo } from 'react'
import { z } from 'zod'

/**
 * Phase 10: Render Props 패턴 구현
 * FormValidator - 폼 검증을 Render Props로 전달하는 컴포넌트
 * 
 * React 19 최적화된 폼 검증 추상화:
 * - Zod 스키마 기반 검증
 * - 실시간 검증 및 피드백
 * - 타입 안전성 보장
 * - 재사용 가능한 폼 상태 관리
 */

interface FormValidatorProps<TSchema extends z.ZodSchema> {
  schema: TSchema
  initialValues: z.input<TSchema>
  onSubmit?: (_values: z.output<TSchema>) => Promise<void> | void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  children: (_renderProps: {
    values: z.input<TSchema>
    errors: Partial<Record<keyof z.input<TSchema>, string>>
    touched: Partial<Record<keyof z.input<TSchema>, boolean>>
    isValid: boolean
    isSubmitting: boolean
    isDirty: boolean
    handleChange: (_field: keyof z.input<TSchema>) => (_value: unknown) => void
    handleBlur: (_field: keyof z.input<TSchema>) => () => void
    handleSubmit: (_e?: React.FormEvent) => Promise<void>
    resetForm: () => void
    setFieldValue: (_field: keyof z.input<TSchema>, _value: unknown) => void
    setFieldError: (_field: keyof z.input<TSchema>, _error: string) => void
  }) => React.ReactNode
}

export function FormValidator<TSchema extends z.ZodSchema>({
  schema,
  initialValues,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  children
}: FormValidatorProps<TSchema>) {
  const [values, setValues] = useState<z.input<TSchema>>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof z.input<TSchema>, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof z.input<TSchema>, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼이 초기값에서 변경되었는지 확인
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [values, initialValues])

  // 전체 폼 유효성 검사
  const isValid = useMemo(() => {
    try {
      schema.parse(values)
      return Object.keys(errors).length === 0
    } catch {
      return false
    }
  }, [schema, values, errors])

  // 필드별 검증
  const validateField = useCallback((field: keyof z.input<TSchema>, value: unknown) => {
    try {
      // 전체 스키마로 임시 객체를 만들어 검증
      const testValues = { ...values, [field]: value }
      schema.parse(testValues)
      
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find(issue => 
          issue.path.length > 0 && issue.path[0] === field
        )
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message
          }))
        }
      }
    }
  }, [schema, values])

  // 필드 값 변경 핸들러
  const handleChange = useCallback((field: keyof z.input<TSchema>) => (value: unknown) => {
    setValues(prev => ({
      ...(prev as Record<string, unknown>),
      [field]: value
    }) as z.input<TSchema>)

    if (validateOnChange) {
      validateField(field, value)
    }
  }, [validateOnChange, validateField])

  // 필드 블러 핸들러
  const handleBlur = useCallback((field: keyof z.input<TSchema>) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))

    if (validateOnBlur) {
      validateField(field, values[field])
    }
  }, [validateOnBlur, validateField, values])

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)

    try {
      // 전체 폼 검증
      const validatedValues = schema.parse(values)
      
      // 모든 필드를 touched로 표시
      const allTouched = Object.keys(values as Record<string, unknown>).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {})
      setTouched(allTouched)

      // 에러 초기화
      setErrors({})

      // 제출 핸들러 실행
      if (onSubmit) {
        await onSubmit(validatedValues)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof z.input<TSchema>, string>> = {}
        
        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            const fieldName = issue.path[0] as keyof z.input<TSchema>
            fieldErrors[fieldName] = issue.message
          }
        })

        setErrors(fieldErrors)

        // 모든 필드를 touched로 표시
        const allTouched = Object.keys(values as Record<string, unknown>).reduce((acc, key) => ({
          ...acc,
          [key]: true
        }), {})
        setTouched(allTouched)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [schema, values, onSubmit])

  // 폼 초기화
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // 필드 값 직접 설정
  const setFieldValue = useCallback((field: keyof z.input<TSchema>, value: unknown) => {
    setValues(prev => ({
      ...(prev as Record<string, unknown>),
      [field]: value
    }) as z.input<TSchema>)
  }, [])

  // 필드 에러 직접 설정
  const setFieldError = useCallback((field: keyof z.input<TSchema>, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [])

  return (
    <>
      {children({
        values,
        errors,
        touched,
        isValid,
        isSubmitting,
        isDirty,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setFieldValue,
        setFieldError
      })}
    </>
  )
}

/**
 * 파일 업로드를 위한 특화된 FormValidator
 */
const uploadSchema = z.object({
  file: z.instanceof(File, { message: '파일을 선택해주세요.' }),
  scriptId: z.number({ message: '스크립트를 선택해주세요.' }),
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자를 초과할 수 없습니다.'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  privacyStatus: z.enum(['private', 'public', 'unlisted']).default('private'),
  scheduledAt: z.date().optional()
})

interface UploadFormValidatorProps {
  initialValues?: Partial<z.input<typeof uploadSchema>>
  onSubmit?: (_values: z.output<typeof uploadSchema>) => Promise<void>
  children: (_renderProps: {
    values: z.input<typeof uploadSchema>
    errors: Partial<Record<keyof z.input<typeof uploadSchema>, string>>
    isValid: boolean
    isSubmitting: boolean
    handleChange: (_field: keyof z.input<typeof uploadSchema>) => (_value: unknown) => void
    handleSubmit: (_e?: React.FormEvent) => Promise<void>
    resetForm: () => void
  }) => React.ReactNode
}

export function UploadFormValidator({ 
  initialValues = {
    privacyStatus: 'private' as const
  }, 
  onSubmit, 
  children 
}: UploadFormValidatorProps) {
  return (
    <FormValidator
      schema={uploadSchema}
      initialValues={initialValues as z.input<typeof uploadSchema>}
      onSubmit={onSubmit}
    >
      {({ values: _values, errors, isValid, isSubmitting, handleChange, handleSubmit, resetForm }) => 
        children({ values: _values, errors, isValid, isSubmitting, handleChange, handleSubmit, resetForm })
      }
    </FormValidator>
  )
}

/**
 * 스크립트 업로드를 위한 특화된 FormValidator
 */
const scriptUploadSchema = z.object({
  file: z.instanceof(File, { message: '마크다운 파일을 선택해주세요.' })
    .refine(file => file.type === 'text/markdown' || file.name.endsWith('.md'), {
      message: '.md 확장자를 가진 마크다운 파일만 업로드 가능합니다.'
    })
    .refine(file => file.size <= 10 * 1024 * 1024, {
      message: '파일 크기는 10MB를 초과할 수 없습니다.'
    }),
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자를 초과할 수 없습니다.').optional(),
  description: z.string().max(500, '설명은 500자를 초과할 수 없습니다.').optional(),
  tags: z.array(z.string()).max(10, '태그는 10개까지만 추가할 수 있습니다.').optional()
})

interface ScriptUploadFormValidatorProps {
  onSubmit?: (_values: z.output<typeof scriptUploadSchema>) => Promise<void>
  children: (_renderProps: {
    values: z.input<typeof scriptUploadSchema>
    errors: Partial<Record<keyof z.input<typeof scriptUploadSchema>, string>>
    isValid: boolean
    isSubmitting: boolean
    handleChange: (_field: keyof z.input<typeof scriptUploadSchema>) => (_value: unknown) => void
    handleSubmit: (_e?: React.FormEvent) => Promise<void>
    resetForm: () => void
  }) => React.ReactNode
}

export function ScriptUploadFormValidator({ onSubmit, children }: ScriptUploadFormValidatorProps) {
  return (
    <FormValidator
      schema={scriptUploadSchema}
      initialValues={{} as z.input<typeof scriptUploadSchema>}
      onSubmit={onSubmit}
    >
      {({ values: _values, errors, isValid, isSubmitting, handleChange, handleSubmit, resetForm }) => 
        children({ values: _values, errors, isValid, isSubmitting, handleChange, handleSubmit, resetForm })
      }
    </FormValidator>
  )
}

/**
 * 검색 폼을 위한 특화된 FormValidator
 */
const searchSchema = z.object({
  query: z.string().min(1, '검색어를 입력해주세요.').max(100, '검색어는 100자를 초과할 수 없습니다.'),
  filters: z.object({
    status: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
})

interface SearchFormValidatorProps {
  initialValues?: Partial<z.input<typeof searchSchema>>
  onSearch?: (_values: z.output<typeof searchSchema>) => void
  children: (_renderProps: {
    values: z.input<typeof searchSchema>
    errors: Partial<Record<keyof z.input<typeof searchSchema>, string>>
    isValid: boolean
    handleChange: (_field: keyof z.input<typeof searchSchema>) => (_value: unknown) => void
    handleSubmit: (_e?: React.FormEvent) => Promise<void>
    resetForm: () => void
  }) => React.ReactNode
}

export function SearchFormValidator({ 
  initialValues = { query: '' }, 
  onSearch, 
  children 
}: SearchFormValidatorProps) {
  return (
    <FormValidator
      schema={searchSchema}
      initialValues={initialValues as z.input<typeof searchSchema>}
      onSubmit={async (values) => {
        if (onSearch) {
          onSearch(values)
        }
      }}
      validateOnChange={true}
    >
      {({ values: _values, errors, isValid, handleChange, handleSubmit, resetForm }) => 
        children({ values: _values, errors, isValid, handleChange, handleSubmit, resetForm })
      }
    </FormValidator>
  )
}