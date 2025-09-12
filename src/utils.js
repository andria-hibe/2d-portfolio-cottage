export const displayDialogue = (text, onDisplayEnd) => {
  const dialogueContainer = document.getElementById('textbox-container')
  const dialogueText = document.getElementById('dialogue')

  dialogueContainer.style.display = 'block'

  let index = 0
  let currentText = ''

  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index]
      dialogueText.innerHTML = currentText
      index++
      return
    }

    clearInterval(intervalRef)
  }, 5)

  const closeButton = document.getElementById('close-button')

  const onCloseButtonClick = () => {
    onDisplayEnd()
    dialogueContainer.style.display = 'none'
    dialogueText.innerHTML = ''
    clearInterval(intervalRef)
    closeButton.removeEventListener('click', onCloseButtonClick)
  }

  closeButton.addEventListener('click', onCloseButtonClick)
}

export const setCameraScale = (k) => {
  const resizeFactor = k.width() / k.height()

  if (resizeFactor < 1) {
    k.camScale(k.vec2(1))
  } else {
    k.camScale(k.vec2(1.5))
  }
}
