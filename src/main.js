import { k } from './kaplayCtx.js'
import { SCALE_FACTOR, DIALOGUE_DATA } from './constants.js'
import { displayDialogue, setCameraScale } from './utils.js'

k.loadSprite('spritesheet', './spritesheet.png', {
  sliceX: 39,
  sliceY: 31,
  // black hair
  anims: {
    'idle-down': 960,
    'walk-down': { from: 960, to: 963, loop: true, speed: 8 },
    'idle-side': 999,
    'walk-side': { from: 999, to: 1002, loop: true, speed: 8 },
    'idle-up': 1038,
    'walk-up': { from: 1038, to: 1041, loop: true, speed: 8 },
  },

  //   frog
  //   anims: {
  //     'idle-down': 788,
  //     'walk-down': { from: 788, to: 789, loop: true, speed: 3 },
  //     'idle-side': 790,
  //     'walk-side': { from: 790, to: 791, loop: true, speed: 3 },
  //     'idle-up': 827,
  //     'walk-up': { from: 827, to: 828, loop: true, speed: 3 },
  //   },

  // slime
  //   anims: {
  //     'idle-down': 858,
  //     'walk-down': { from: 858, to: 859, loop: true, speed: 5 },
  //     'idle-side': 860,
  //     'walk-side': { from: 860, to: 861, loop: true, speed: 5 },
  //     'idle-up': 897,
  //     'walk-up': { from: 897, to: 898, loop: true, speed: 5 },
  //   },
})

k.loadSprite('map', './map.png')

k.setBackground(k.Color.fromHex('#A94442'))

k.scene('main', async () => {
  const mapData = await (await fetch('./map.json')).json()
  const layers = mapData.layers

  const map = k.add([k.sprite('map'), k.pos(0), k.scale(SCALE_FACTOR)])

  const player = k.make([
    k.sprite('spritesheet', { anim: 'idle-down' }),
    k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
    k.body(),
    k.anchor('center'),
    k.pos(),
    k.scale(SCALE_FACTOR),
    {
      speed: 250,
      direction: 'down',
      isInDialogue: false,
    },
    'player',
  ])

  for (const layer of layers) {
    if (layer.name === 'boundaries') {
      for (const boundary of layer.objects) {
        map.add([
          k.area({ shape: new k.Rect(k.vec2(0), boundary.width, boundary.height) }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name,
        ])

        if (boundary.name) {
          player.onCollide(boundary.name, () => {
            player.isInDialogue = true
            displayDialogue(DIALOGUE_DATA[boundary.name], () => (player.isInDialogue = false))
          })
        }
      }
      continue
    }

    if (layer.name === 'spawnpoints') {
      for (const entity of layer.objects) {
        if (entity.name === 'player') {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * SCALE_FACTOR,
            (map.pos.y + entity.y) * SCALE_FACTOR,
          )
          k.add(player)
          continue
        }
      }
    }
  }

  setCameraScale(k)

  k.onResize(() => {
    setCameraScale(k)
  })

  k.onUpdate(() => {
    k.setCamPos(player.pos.x, player.pos.y + 100)
  })

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== 'left' || player.isInDialogue) {
      return
    }

    const worldMousePosition = k.toWorld(k.mousePos())
    player.moveTo(worldMousePosition, player.speed)

    const mouseAngle = player.pos.angle(worldMousePosition)

    const lowerBound = 50
    const upperBound = 125

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.getCurAnim().name !== 'walk-up'
    ) {
      player.play('walk-up')
      player.direction = 'up'
      return
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.getCurAnim().name !== 'walk-down'
    ) {
      player.play('walk-down')
      player.direction = 'down'
      return
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false

      if (player.getCurAnim().name !== 'walk-side') {
        player.play('walk-side')
      }

      player.direction = 'right'
      return
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true

      if (player.getCurAnim().name !== 'walk-side') {
        player.play('walk-side')
      }

      player.direction = 'left'
      return
    }
  })

  const stopAnimation = () => {
    if (player.direction === 'down') {
      player.play('idle-down')
      return
    }
    if (player.direction === 'up') {
      player.play('idle-up')
      return
    }

    player.play('idle-side')
  }

  k.onMouseRelease(stopAnimation)

  k.onKeyRelease(() => {
    stopAnimation()
  })
  k.onKeyDown((key) => {
    const keyMap = [
      k.isKeyDown('right'),
      k.isKeyDown('left'),
      k.isKeyDown('up'),
      k.isKeyDown('down'),
    ]

    let nbOfKeyPressed = 0
    for (const key of keyMap) {
      if (key) {
        nbOfKeyPressed++
      }
    }

    if (nbOfKeyPressed > 1) return

    if (player.isInDialogue) return
    if (keyMap[0]) {
      player.flipX = false
      if (player.getCurAnim().name !== 'walk-side') player.play('walk-side')
      player.direction = 'right'
      player.move(player.speed, 0)
      return
    }

    if (keyMap[1]) {
      player.flipX = true
      if (player.getCurAnim().name !== 'walk-side') player.play('walk-side')
      player.direction = 'left'
      player.move(-player.speed, 0)
      return
    }

    if (keyMap[2]) {
      if (player.getCurAnim().name !== 'walk-up') player.play('walk-up')
      player.direction = 'up'
      player.move(0, -player.speed)
      return
    }

    if (keyMap[3]) {
      if (player.getCurAnim().name !== 'walk-down') player.play('walk-down')
      player.direction = 'down'
      player.move(0, player.speed)
    }
  })
})

k.go('main')
