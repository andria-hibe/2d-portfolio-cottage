import kaplay from 'kaplay'

export const k = kaplay({
  global: false,
  touch: true,
  canvas: document.getElementById('gameCanvas'),
})
