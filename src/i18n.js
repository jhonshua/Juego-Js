const LANG_KEY = 'pecas-lang'

const strings = {
  es: {
    title: 'Pecas — Julio Cesar Llinas | Juego Phaser',
    description:
      'Pecas, juego 2D en Phaser creado por Julio Cesar Llinas. Recoge huesos, esquiva bombas y sobrevive cada oleada.',
    tagline: 'Recoge los huesos. Esquiva las bombas. Sobrevive cada oleada.',
    or: 'o',
    move: 'mover',
    jump: 'saltar',
    restart: 'reiniciar',
    points: 'Puntos',
    wave: 'Oleada',
    record: 'Récord',
    gameOver: 'Fin del juego',
    fallDeath: 'Caída fatal',
    gameOverHint: 'Pulsa R o haz clic para reiniciar',
    scoreWord: 'Puntuación',
    langLabel: 'Idioma',
    expand: 'Pantalla grande',
    shrink: 'Pantalla normal',
    expandAria: 'Agrandar el juego',
    shrinkAria: 'Volver al tamaño normal',
    createdBy: 'Creado por',
  },
  en: {
    title: 'Pecas — Julio Cesar Llinas | Phaser game',
    description:
      'Pecas, a Phaser 2D game by Julio Cesar Llinas. Collect bones, dodge bombs, and survive each wave.',
    tagline: 'Collect the bones. Dodge the bombs. Survive each wave.',
    or: 'or',
    move: 'move',
    jump: 'jump',
    restart: 'restart',
    points: 'Score',
    wave: 'Wave',
    record: 'Best',
    gameOver: 'Game over',
    fallDeath: 'Fatal fall',
    gameOverHint: 'Press R or click to restart',
    scoreWord: 'Score',
    langLabel: 'Language',
    expand: 'Larger view',
    shrink: 'Normal view',
    expandAria: 'Enlarge the game',
    shrinkAria: 'Back to normal size',
    createdBy: 'Created by',
  },
}

function detectLang() {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'en' || saved === 'es') return saved
  return navigator.language && navigator.language.toLowerCase().startsWith('en')
    ? 'en'
    : 'es'
}

let currentLang = detectLang()

function t(key) {
  return strings[currentLang][key] || strings.es[key] || key
}

function applyDom() {
  document.documentElement.lang = currentLang
  document.title = t('title')

  const description = t('description')
  const descEl = document.querySelector('meta[name="description"]')
  if (descEl) descEl.setAttribute('content', description)
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) ogTitle.setAttribute('content', t('title'))
  const ogDesc = document.querySelector('meta[property="og:description"]')
  if (ogDesc) ogDesc.setAttribute('content', description)
  const ogLocale = document.querySelector('meta[property="og:locale"]')
  if (ogLocale) ogLocale.setAttribute('content', currentLang === 'en' ? 'en_US' : 'es_ES')

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = t(key)
  })

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')
    if (key) el.setAttribute('aria-label', t(key))
  })

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const active = btn.getAttribute('data-lang') === currentLang
    btn.classList.toggle('is-active', active)
    btn.setAttribute('aria-pressed', String(active))
  })
}

function setLang(lang) {
  if (lang !== 'en' && lang !== 'es') return
  currentLang = lang
  localStorage.setItem(LANG_KEY, lang)
  applyDom()
  window.dispatchEvent(new CustomEvent('pecas-langchange', { detail: lang }))
}

function bindSwitcher() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')))
  })
}

window.PecasI18n = {
  t,
  getLang: () => currentLang,
  setLang,
  applyDom,
}

function init() {
  applyDom()
  bindSwitcher()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
