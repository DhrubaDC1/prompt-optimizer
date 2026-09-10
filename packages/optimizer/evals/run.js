import { optimize } from '../src/optimize.js'
import { cases } from './cases.js'

if (!process.env.GOOGLE_API_KEY) {
  console.error('Missing GOOGLE_API_KEY. Add it to the repo root .env file.')
  process.exit(1)
}

console.log(`Model: ${process.env.GOOGLE_MODEL || 'gemini-flash-lite-latest'}\n`)

let failed = 0

for (const [input, expectedStatus, check] of cases) {
  try {
    const result = await optimize(input)
    const passed = result.status === expectedStatus && (!check || check(result))
    if (!passed) failed += 1

    console.log(passed ? '✓' : '✗', input.slice(0, 40))
    console.log(
      result.optimizedPrompt ?? result.questions.map((question) => question.question).join(' | '),
      '\n',
    )
  } catch (error) {
    failed += 1
    console.log('✗', input.slice(0, 40))
    console.log(error.message, '\n')
  }
}

console.log(`${cases.length - failed}/${cases.length} passed`)
if (failed > 0) process.exitCode = 1
