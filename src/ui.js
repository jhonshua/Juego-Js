const EXPAND_KEY = 'pecas-expanded'

function isExpanded() {
  return document.body.classList.contains('is-expanded')
}

function t(key) {
  return window.PecasI18n ? window.PecasI18n.t(key) : key
}

function refreshGameScale() {
  const game = window.__pecasGame
  if (!game || !game.scale) return
  game.scale.refresh()
}

function syncExpandButton() {
  const expanded = isExpanded()
  const btn = document.getElementById('btn-expand')
  const label = document.getElementById('expand-label')
  if (!btn || !label) return

  btn.setAttribute('aria-pressed', String(expanded))
  btn.setAttribute('aria-label', t(expanded ? 'shrinkAria' : 'expandAria'))
  label.setAttribute('data-i18n', expanded ? 'shrink' : 'expand')
  label.textContent = t(expanded ? 'shrink' : 'expand')
}

function setExpanded(next) {
  document.body.classList.toggle('is-expanded', next)
  localStorage.setItem(EXPAND_KEY, next ? '1' : '0')
  syncExpandButton()
  requestAnimationFrame(() => {
    refreshGameScale()
    setTimeout(refreshGameScale, 80)
  })
}

function initExpand() {
  const btn = document.getElementById('btn-expand')
  if (!btn) return

  if (localStorage.getItem(EXPAND_KEY) === '1') {
    document.body.classList.add('is-expanded')
  }

  syncExpandButton()
  btn.addEventListener('click', () => setExpanded(!isExpanded()))
  window.addEventListener('resize', refreshGameScale)
  window.addEventListener('pecas-langchange', syncExpandButton)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExpand)
} else {
  initExpand()
}
