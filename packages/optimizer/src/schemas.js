import { z } from 'zod'

export const questionTypeSchema = z.enum([
  'single_select',
  'multi_select',
  'text',
  'textarea',
  'yes_no',
])

export const clarificationSchema = z.object({
  questionId: z.string().min(1),
  answer: z.union([
    z.string().max(1_000),
    z.array(z.string().max(1_000)).max(8),
  ]),
})

export const optimizeRequestSchema = z
  .object({
    prompt: z.string().min(1).max(8_000),
    clarifications: z.array(clarificationSchema).max(8).default([]),
  })
  .superRefine((value, ctx) => {
    if (JSON.stringify(value).length > 20_000) {
      ctx.addIssue({
        code: 'custom',
        message: 'Request body is too large',
      })
    }
  })

export const questionSchema = z
  .object({
    id: z.string().min(1),
    question: z.string().min(1),
    type: questionTypeSchema,
    options: z.array(z.string().min(1)).min(2).max(8).nullable(),
    allowOther: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const isSelect = value.type === 'single_select' || value.type === 'multi_select'

    if (isSelect && !value.options?.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Select questions require options',
      })
    }

    if (!isSelect && value.options !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Non-select questions must use null options',
      })
    }

    if (!isSelect && value.allowOther) {
      ctx.addIssue({
        code: 'custom',
        path: ['allowOther'],
        message: 'allowOther is only valid for select questions',
      })
    }

    if (value.options) {
      const normalized = value.options.map((option) => option.trim().toLowerCase())

      if (new Set(normalized).size !== normalized.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Question options must be unique',
        })
      }

      if (normalized.includes('other')) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Use allowOther instead of an Other option',
        })
      }
    }
  })

export const openModelResponseSchema = z
  .object({
    status: z.enum(['needs_clarification', 'ready']),
    questions: z.array(questionSchema).min(1).max(5).nullable(),
    optimizedPrompt: z.string().min(1).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'needs_clarification') {
      if (!value.questions?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions'],
          message: 'Clarification questions are required',
        })
      }

      if (value.optimizedPrompt !== null) {
        ctx.addIssue({
          code: 'custom',
          path: ['optimizedPrompt'],
          message: 'optimizedPrompt must be null while asking questions',
        })
      }

      const ids = value.questions?.map((question) => question.id) ?? []
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions'],
          message: 'Question ids must be unique',
        })
      }

      const freeTextCount =
        value.questions?.filter(
          (question) => question.type === 'text' || question.type === 'textarea',
        ).length ?? 0

      if (freeTextCount > 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions'],
          message: 'At most one free-text question is allowed',
        })
      }
    }

    if (value.status === 'ready') {
      if (!value.optimizedPrompt) {
        ctx.addIssue({
          code: 'custom',
          path: ['optimizedPrompt'],
          message: 'Optimized prompt is required',
        })
      }

      if (value.questions !== null) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions'],
          message: 'questions must be null when the prompt is ready',
        })
      }
    }
  })

export const finalModelResponseSchema = z
  .object({
    optimizedPrompt: z.string().min(1),
  })
  .strict()

// Keep the provider-facing schema intentionally simple. Groq strict mode enforces
// shape; the richer Zod schemas below enforce semantic rules after parsing.
const openModelWireSchema = z.object({
  status: z.enum(['needs_clarification', 'ready']),
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        type: questionTypeSchema,
        options: z.array(z.string()).nullable(),
        allowOther: z.boolean(),
      }),
    )
    .nullable(),
  optimizedPrompt: z.string().nullable(),
})

const finalModelWireSchema = z.object({
  optimizedPrompt: z.string(),
})

export const openModelJsonSchema = z.toJSONSchema(openModelWireSchema)
export const finalModelJsonSchema = z.toJSONSchema(finalModelWireSchema)

export function parseOpenModelResponse(value) {
  const parsed = openModelResponseSchema.parse(value)

  if (parsed.status === 'needs_clarification') {
    return {
      status: 'needs_clarification',
      questions: parsed.questions,
    }
  }

  return {
    status: 'ready',
    optimizedPrompt: parsed.optimizedPrompt,
  }
}

export function parseFinalModelResponse(value) {
  return finalModelResponseSchema.parse(value)
}
