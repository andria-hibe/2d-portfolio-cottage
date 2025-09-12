import { DIALOGUE_TYPING_SPEED } from './constants.js'

export const displayDialogue = (text, onDisplayEnd) => {
  const dialogueContainer = document.getElementById('textbox-container')
  const dialogueText = document.getElementById('dialogue')

  dialogueContainer.style.display = 'block'

  let index = 0
  let currentText = ''
  let isTypingComplete = false

  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index]
      dialogueText.innerHTML = currentText
      index++
      return
    }

    clearInterval(intervalRef)
    isTypingComplete = true
  }, DIALOGUE_TYPING_SPEED)

  const completeTyping = () => {
    if (!isTypingComplete) {
      clearInterval(intervalRef)
      dialogueText.innerHTML = text
      isTypingComplete = true
    }
  }

  const closeButton = document.getElementById('close-button')

  const onCloseButtonClick = () => {
    onDisplayEnd()
    dialogueContainer.style.display = 'none'
    dialogueText.innerHTML = ''
    clearInterval(intervalRef)
    closeButton.removeEventListener('click', onCloseButtonClick)
    document.removeEventListener('keydown', onKeyPress)
    dialogueContainer.removeEventListener('click', onDialogueClick)
  }

  const onKeyPress = (event) => {
    if (isTypingComplete) {
      onCloseButtonClick()
    } else if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      completeTyping()
    }
  }

  const onDialogueClick = (event) => {
    if (event.target.tagName === 'A' || event.target.id === 'close-button') {
      return
    }
    if (isTypingComplete) {
      onCloseButtonClick()
    } else {
      completeTyping()
    }
  }

  closeButton.addEventListener('click', onCloseButtonClick)
  document.addEventListener('keydown', onKeyPress)
  dialogueContainer.addEventListener('click', onDialogueClick)
}

export const setCameraScale = (k) => {
  const resizeFactor = k.width() / k.height()

  if (resizeFactor < 1) {
    k.camScale(k.vec2(1))
  } else {
    k.camScale(k.vec2(1.5))
  }
}

export const createDebouncedCameraScale = (k, delay = 100) => {
  let timeoutId
  return () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => setCameraScale(k), delay)
  }
}
