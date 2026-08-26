const WIDTH = 900
const HEIGHT = 600
const START_LIVES = 3
const HIGH_SCORE_KEY = 'pecas-highscore'
const FALL_KILL_DISTANCE = 260

window.__touch = { left: false, right: false, jump: false }

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0d1418',
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
}

let player
let stars
let bombs
let platforms
let cursors
let wasd
let spaceKey
let rKey
let score = 0
let lives = START_LIVES
let wave = 1
let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0)
let gameOver = false
let invulnerableUntil = 0
let hud
let hudHearts
let hudRecord
let hudBar
let overlay
let spark
let touchJumpWasDown = false
let jumpCut = false
let facing = 'right'
let airPeakY = null
let deathReason = 'gameOver'

window.__pecasGame = new Phaser.Game(config)

function preload() {
  this.load.image('sky', './assets/sky.png')
  this.load.image('ground', './assets/platform.png')
  this.load.image('star', './assets/star.png')
  this.load.image('bomb', './assets/bomb.png')
  this.load.image('tomb', './assets/TombStone (2).png')
  this.load.image('bush', './assets/Bush (2).png')
  this.load.image('crate', './assets/Crate.png')
  this.load.spritesheet('dude', './assets/dude.png', {
    frameWidth: 64,
    frameHeight: 47,
  })
}

function create() {
  score = 0
  lives = START_LIVES
  wave = 1
  gameOver = false
  invulnerableUntil = 0
  touchJumpWasDown = false
  jumpCut = false
  facing = 'right'
  airPeakY = null
  deathReason = 'gameOver'
  highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0)

  const sky = this.add.image(WIDTH / 2, HEIGHT / 2, 'sky')
  sky.setDisplaySize(WIDTH, HEIGHT)

  this.add.image(80, 564, 'tomb').setOrigin(0.5, 1).setScale(0.9).setDepth(1)
  this.add.image(560, 564, 'bush').setOrigin(0.5, 1).setScale(0.85).setDepth(0)
  this.add.image(850, 564, 'tomb').setOrigin(0.5, 1).setScale(0.8).setDepth(1)
  this.add.image(430, 128, 'bush').setOrigin(0.5, 1).setScale(0.7).setDepth(0)

  platforms = this.physics.add.staticGroup()
  platforms.create(450, 584, 'ground').setScale(2.3, 1).refreshBody()
  platforms.create(230, 509, 'crate').refreshBody()
  platforms.create(500, 367, 'ground')
  platforms.create(780, 252, 'ground')
  platforms.create(430, 147, 'ground')
  platforms.create(155, 123, 'crate').refreshBody()

  player = this.physics.add.sprite(180, 480, 'dude')
  player.setBounce(0)
  player.setCollideWorldBounds(true)
  player.setDepth(5)
  player.setScale(1.55)
  player.setFlipX(false)
  player.body.setSize(28, 32).setOffset(18, 8)

  if (!this.anims.exists('left')) {
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20,
    })
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  cursors = this.input.keyboard.createCursorKeys()
  wasd = this.input.keyboard.addKeys('W,A,S,D')
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)

  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 36, y: 0, stepX: 74 },
  })
  stars.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.35, 0.7))
    child.setScale(0.95)
    child.setDepth(3)
  })

  bombs = this.physics.add.group()

  spark = this.add.particles('star')
  this.sparkEmitter = spark.createEmitter({
    speed: { min: 40, max: 120 },
    scale: { start: 0.45, end: 0 },
    lifespan: 420,
    gravityY: 180,
    on: false,
  })

  hudBar = this.add.graphics().setScrollFactor(0).setDepth(19)
  hudBar.fillStyle(0x081018, 0.58)
  hudBar.fillRoundedRect(16, 12, 540, 44, 12)
  hudBar.lineStyle(1, 0xc4dce8, 0.22)
  hudBar.strokeRoundedRect(16, 12, 540, 44, 12)

  const hudStyle = {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: '17px',
    color: '#e8f2f7',
  }

  hud = this.add.text(28, 24, '', hudStyle).setScrollFactor(0).setDepth(20)
  hudHearts = this.add
    .text(28, 22, '', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '20px',
      color: '#ff2d3a',
    })
    .setScrollFactor(0)
    .setDepth(20)
  hudRecord = this.add.text(28, 24, '', hudStyle).setScrollFactor(0).setDepth(20)
  refreshHud()

  overlay = this.add
    .text(WIDTH / 2, HEIGHT / 2, '', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '32px',
      color: '#e8f2f7',
      align: 'center',
      stroke: '#0b1216',
      strokeThickness: 5,
    })
    .setOrigin(0.5)
    .setDepth(30)
    .setVisible(false)

  this.physics.add.collider(player, platforms)
  this.physics.add.collider(stars, platforms)
  this.physics.add.collider(bombs, platforms)
  this.physics.add.overlap(player, stars, collectStar, null, this)
  this.physics.add.collider(player, bombs, hitBomb, null, this)

  this.input.on('pointerdown', () => {
    if (gameOver) this.scene.restart()
  })

  if (!window.__touchBound) {
    window.__touchBound = true
    bindTouchButtons()
  }

  this.scale.refresh()
}

function update(time) {
  if (Phaser.Input.Keyboard.JustDown(rKey)) {
    this.scene.restart()
    return
  }

  if (gameOver) return

  const left = cursors.left.isDown || wasd.A.isDown || window.__touch.left
  const right = cursors.right.isDown || wasd.D.isDown || window.__touch.right
  const jumpHeld =
    cursors.up.isDown || wasd.W.isDown || spaceKey.isDown || window.__touch.jump
  const jumpJustPressed =
    Phaser.Input.Keyboard.JustDown(cursors.up) ||
    Phaser.Input.Keyboard.JustDown(wasd.W) ||
    Phaser.Input.Keyboard.JustDown(spaceKey) ||
    (window.__touch.jump && !touchJumpWasDown)

  touchJumpWasDown = window.__touch.jump

  const onGround = player.body.blocked.down || player.body.touching.down

  if (left && !right) {
    player.setVelocityX(-200)
    facing = 'left'
  } else if (right && !left) {
    player.setVelocityX(200)
    facing = 'right'
  } else {
    player.setVelocityX(0)
  }

  player.setFlipX(false)

  if (onGround) {
    if (airPeakY != null && !gameOver) {
      const fall = player.y - airPeakY
      airPeakY = null
      if (fall >= FALL_KILL_DISTANCE) {
        endGame(this, 'fallDeath')
        return
      }
    }
    jumpCut = false
  } else if (!gameOver) {
    airPeakY = airPeakY == null ? player.y : Math.min(airPeakY, player.y)
  }

  if (left && !right) {
    player.anims.play('left', true)
  } else if (right && !left) {
    player.anims.play('right', true)
  } else {
    player.anims.stop()
    player.setFrame(facing === 'left' ? 0 : 4)
  }

  if (jumpJustPressed && onGround) {
    player.setVelocityY(-480)
    jumpCut = false
  }

  if (!jumpHeld && player.body.velocity.y < -90 && !jumpCut) {
    player.setVelocityY(-90)
    jumpCut = true
  }

  if (time < invulnerableUntil) {
    player.setAlpha(Math.sin(time / 70) > 0 ? 1 : 0.35)
  } else if (player.alpha !== 1) {
    player.setAlpha(1)
    player.clearTint()
  }
}

function collectStar(playerSprite, star) {
  star.disableBody(true, true)
  this.sparkEmitter.explode(8, star.x, star.y)

  score += 10
  if (score > highScore) {
    highScore = score
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore))
  }
  refreshHud()

  if (stars.countActive(true) === 0) {
    wave += 1
    stars.children.iterate((child) => {
      child.enableBody(true, child.x, 0, true, true)
    })

    const x =
      playerSprite.x < WIDTH / 2
        ? Phaser.Math.Between(WIDTH / 2, WIDTH - 40)
        : Phaser.Math.Between(40, WIDTH / 2)

    const bomb = bombs.create(x, 16, 'bomb')
    bomb.setBounce(1)
    bomb.setCollideWorldBounds(true)
    bomb.setVelocity(Phaser.Math.Between(-220 - wave * 12, 220 + wave * 12), 20)
    bomb.allowGravity = false
    bomb.setScale(1.05)
    bomb.setDepth(3)
    refreshHud()
  }
}

function t(key) {
  return window.PecasI18n ? window.PecasI18n.t(key) : key
}

function setGameOverText() {
  if (!overlay) return
  overlay.setText(
    `${t(deathReason)}\n${t('scoreWord')} ${score}  ·  ${t('record')} ${highScore}\n${t('gameOverHint')}`
  )
}

function endGame(scene, reason) {
  if (gameOver) return
  deathReason = reason || 'gameOver'
  lives = 0
  refreshHud()
  scene.physics.pause()
  player.setTint(0xff3b3b)
  player.anims.stop()
  player.setFrame(facing === 'left' ? 0 : 4)
  gameOver = true
  setGameOverText()
  overlay.setVisible(true)
}

function hitBomb(playerSprite, bomb) {
  if (this.time.now < invulnerableUntil || gameOver) return

  lives -= 1
  refreshHud()

  if (lives <= 0) {
    endGame(this, 'gameOver')
    return
  }

  invulnerableUntil = this.time.now + 1400
  playerSprite.setTint(0xff7a7a)
  playerSprite.setVelocity(playerSprite.x < bomb.x ? -220 : 220, -240)
}

function refreshHud() {
  if (!hud || !hudHearts || !hudRecord) return

  hud.setText(`${t('points')} ${score}    ${t('wave')} ${wave}`)
  hudHearts.setText(
    '♥'.repeat(Math.max(lives, 0)) + '♡'.repeat(Math.max(START_LIVES - lives, 0))
  )
  hudHearts.setColor('#ff2d3a')
  hudRecord.setText(`${t('record')} ${highScore}`)

  hudHearts.x = hud.x + hud.width + 18
  hudHearts.y = hud.y - 2
  hudRecord.x = hudHearts.x + hudHearts.width + 18
  hudRecord.y = hud.y
}

window.addEventListener('pecas-langchange', () => {
  refreshHud()
  if (gameOver) setGameOverText()
})

function bindTouchButtons() {
  const map = [
    ['btn-left', 'left'],
    ['btn-right', 'right'],
    ['btn-jump', 'jump'],
  ]

  map.forEach(([id, key]) => {
    const el = document.getElementById(id)
    if (!el) return
    const down = (event) => {
      event.preventDefault()
      window.__touch[key] = true
    }
    const up = (event) => {
      event.preventDefault()
      window.__touch[key] = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', up)
    el.addEventListener('pointercancel', up)
  })
}
