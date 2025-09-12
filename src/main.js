import { k } from './kaplayCtx.js'
import {
  SCALE_FACTOR,
  DIALOGUE_DATA,
  PLAYER_SPEED,
  CAMERA_OFFSET_Y,
  MOVEMENT_ANGLES,
} from './constants.js'
import { displayDialogue, setCameraScale, createDebouncedCameraScale } from './utils.js'

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

  // white hair
  //   anims: {
  //     'idle-down': 964,
  //     'walk-down': { from: 964, to: 967, loop: true, speed: 8 },
  //     'idle-side': 1003,
  //     'walk-side': { from: 1003, to: 1006, loop: true, speed: 8 },
  //     'idle-up': 1042,
  //     'walk-up': { from: 1042, to: 1045, loop: true, speed: 8 },
  //   },

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
  let mapData
  try {
    const response = await fetch('./map.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch map: ${response.status} ${response.statusText}`)
    }
    mapData = await response.json()
  } catch (error) {
    console.error('Error loading map data:', error)
    mapData = { layers: [] }
  }

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
      speed: PLAYER_SPEED,
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

  const debouncedCameraScale = createDebouncedCameraScale(k)
  k.onResize(debouncedCameraScale)

  k.onUpdate(() => {
    k.setCamPos(player.pos.x, player.pos.y + CAMERA_OFFSET_Y)
  })

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== 'left' || player.isInDialogue) return

    const worldMousePosition = k.toWorld(k.mousePos())
    player.moveTo(worldMousePosition, player.speed)

    const mouseAngle = player.pos.angle(worldMousePosition)

    const currentAnim = player.getCurAnim()?.name

    if (
      mouseAngle > MOVEMENT_ANGLES.LOWER_BOUND &&
      mouseAngle < MOVEMENT_ANGLES.UPPER_BOUND &&
      currentAnim !== 'walk-up'
    ) {
      player.play('walk-up')
      player.direction = 'up'
      return
    }

    if (
      mouseAngle < -MOVEMENT_ANGLES.LOWER_BOUND &&
      mouseAngle > -MOVEMENT_ANGLES.UPPER_BOUND &&
      currentAnim !== 'walk-down'
    ) {
      player.play('walk-down')
      player.direction = 'down'
      return
    }

    if (Math.abs(mouseAngle) > MOVEMENT_ANGLES.UPPER_BOUND) {
      player.flipX = false

      if (currentAnim !== 'walk-side') {
        player.play('walk-side')
      }

      player.direction = 'right'
      return
    }

    if (Math.abs(mouseAngle) < MOVEMENT_ANGLES.LOWER_BOUND) {
      player.flipX = true

      if (currentAnim !== 'walk-side') {
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
    const directions = ['right', 'left', 'up', 'down']
    if (!directions.includes(key)) return

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

    const currentAnim = player.getCurAnim()?.name

    if (keyMap[0]) {
      player.flipX = false
      if (currentAnim !== 'walk-side') player.play('walk-side')
      player.direction = 'right'
      player.move(player.speed, 0)
      return
    }

    if (keyMap[1]) {
      player.flipX = true
      if (currentAnim !== 'walk-side') player.play('walk-side')
      player.direction = 'left'
      player.move(-player.speed, 0)
      return
    }

    if (keyMap[2]) {
      if (currentAnim !== 'walk-up') player.play('walk-up')
      player.direction = 'up'
      player.move(0, -player.speed)
      return
    }

    if (keyMap[3]) {
      if (currentAnim !== 'walk-down') player.play('walk-down')
      player.direction = 'down'
      player.move(0, player.speed)
    }
  })
})

k.go('main')
