import assert from 'node:assert/strict'
import test from 'node:test'

import { copyText } from './copy-text.js'

function textarea() {
  return {
    focused: false,
    selected: false,
    focus() {
      this.focused = true
    },
    select() {
      this.selected = true
    },
  }
}

test('copies with Clipboard API first', async () => {
  const field = textarea()
  let copied

  assert.equal(await copyText('Ready prompt', field, {
    writeText(value) {
      copied = value
    },
  }), true)
  assert.equal(copied, 'Ready prompt')
  assert.equal(field.selected, false)
})

test('selects textarea and uses execCommand after Clipboard API failure', async () => {
  const field = textarea()
  assert.equal(
    await copyText(
      'Ready prompt',
      field,
      {
        writeText() {
          throw new Error('denied')
        },
      },
      (command) => command === 'copy',
    ),
    true,
  )
  assert.equal(field.focused, true)
  assert.equal(field.selected, true)
})

test('leaves text selected when both copy methods fail', async () => {
  const field = textarea()
  assert.equal(await copyText('Ready prompt', field, null, () => false), false)
  assert.equal(field.selected, true)
})
