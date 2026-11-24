'use strict';

const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const scene = $('#scene');
const ctx = scene.getContext('2d');
const finale = $('#together').getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hearts = [
  { x: 66, y: 241, message: 'Eu amo conhecer um pouquinho mais de você a cada dia.' },
  { x: 66, y: 161, message: 'Seu carinho e sua doçura me encantam.' },
  { x: 160, y: 174, message: 'Adoro a maneira como você torna meus dias mais especiais.' },
  { x: 251, y: 238, message: 'Entre tantas pessoas, que sorte a minha ter encontrado você.' },
  { x: 251, y: 154, message: 'E, se depender de mim, ainda temos muitas histórias para viver juntos.' },
];
const obstacles = [{ x: 105, y: 207 }, { x: 213, y: 210 }, { x: 159, y: 246 }];
const partner = { x: 160, y: 127 };
const player = { x: 160, y: 285 };
const keyDirections = new Map([
  ['ArrowUp', 'up'], ['w', 'up'], ['ArrowDown', 'down'], ['s', 'down'],
  ['ArrowLeft', 'left'], ['a', 'left'], ['ArrowRight', 'right'], ['d', 'right'],
]);
const input = new Map();
const buttons = [...document.querySelectorAll('[data-dir]')];
let state = 'intro';
let particles = [];
let meeting = 0;
let meetingStart;
let moving = false;
let lastFrame = 0;
let muted = false;
let audio;
let volume;
let nextBeat = 0;
let beat = 0;
const melody = [72, 76, 79, 83, 81, 79, 76, 79, 74, 77, 81, 84, 83, 81, 77, 74,
  72, 76, 81, 84, 83, 81, 76, 72, 71, 74, 79, 83, 81, 79, 74, 71];
const bass = [48, 50, 45, 43];

function tone(note, start, duration, level, wave = 'sine') {
  const voice = audio.createOscillator();
  const envelope = audio.createGain();
  voice.type = wave;
  voice.frequency.value = 440 * 2 ** ((note - 69) / 12);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(level, start + 0.025);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  voice.connect(envelope).connect(volume);
  voice.start(start);
  voice.stop(start + duration + 0.02);
}

function enableAudio() {
  if (muted) return;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  if (!audio) {
    audio = new AudioEngine();
    volume = audio.createGain();
    volume.gain.value = 0.7;
    volume.connect(audio.destination);
  }
  audio.resume().catch(() => {});
}

function music() {
  if (!audio || muted || audio.state !== 'running' || state === 'intro') return;
  if (nextBeat < audio.currentTime) nextBeat = audio.currentTime + 0.02;
  if (nextBeat > audio.currentTime + 0.08) return;
  tone(melody[beat % melody.length], nextBeat, 0.65, 0.07);
  if (beat % 4 === 0) tone(bass[Math.floor(beat / 8) % bass.length] + (beat % 8 ? 7 : 0), nextBeat, 1.6, 0.11, 'triangle');
  beat++;
  nextBeat += 0.36;
}

function chime(notes) {
  if (!audio || muted || audio.state !== 'running') return;
  notes.forEach((note, i) => tone(note, audio.currentTime + i * 0.11, 0.48, 0.15));
}

function rect(c, color, x, y, w, h) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

const heartShape = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
function heart(c, x, y, size, color = '#ff719f') {
  heartShape.forEach((row, dy) => {
    [...row].forEach((pixel, dx) => {
      if (pixel === '1') rect(c, color, x + (dx - 3) * size, y + dy * size, size, size);
    });
  });
}

function star(c, x, y, color) {
  rect(c, color, x - 3, y, 7, 1);
  rect(c, color, x, y - 3, 1, 7);
}

function person(c, x, y, type, step = 0) {
  const shirt = type ? '#b9a0fc' : '#ff8ab8';
  const hair = type ? '#32213e' : '#573348';
  const skin = type ? '#cf916d' : '#f4b590';
  rect(c, '#281932', x - 8, y + 1, 17, 3);
  rect(c, '#332843', x - 5, y - 6, 10, 8);
  rect(c, '#1e1835', x - 6, y + step, 5, 2);
  rect(c, '#1e1835', x + 2, y - step, 5, 2);
  rect(c, shirt, x - 7, y - 15, 14, 10);
  rect(c, type ? '#8066be' : '#be527e', x - 7, y - 8, 14, 3);
  rect(c, skin, x - 8, y - 10, 3, 4);
  rect(c, skin, x + 5, y - 10, 3, 4);
  rect(c, hair, x - 7, y - 27, 14, 11);
  rect(c, hair, x - 4, y - 29, 9, 3);
  rect(c, skin, x - 5, y - 23, 11, 9);
  rect(c, hair, x - 6, y - 24, type ? 4 : 7, 3);
  rect(c, '#382037', x - 3, y - 20, 1, 2);
  rect(c, '#382037', x + 3, y - 20, 1, 2);
  rect(c, '#ab5f69', x, y - 16, 2, 1);
}

function tree(c, x, y, color) {
  rect(c, '#3d263c', x - 3, y - 22, 7, 24);
  rect(c, '#70485a', x + 1, y - 15, 2, 16);
  rect(c, '#372344', x - 22, y - 42, 44, 25);
  rect(c, '#372344', x - 16, y - 51, 32, 39);
  rect(c, color, x - 19, y - 44, 38, 22);
  rect(c, color, x - 12, y - 51, 24, 31);
  rect(c, '#f7aac0', x - 14, y - 41, 9, 4);
  rect(c, '#ffd2dc', x - 9, y - 46, 5, 3);
  rect(c, '#ec90b7', x + 5, y - 35, 11, 5);
  rect(c, '#a85a8b', x - 4, y - 24, 18, 5);
}

const garden = document.createElement('canvas');
garden.width = garden.height = 320;
function paintGarden(c) {
  const sky = c.createLinearGradient(0, 0, 0, 125);
  sky.addColorStop(0, '#261c49');
  sky.addColorStop(1, '#a15c90');
  c.fillStyle = sky;
  c.fillRect(0, 0, 320, 125);
  rect(c, '#f9c8db', 145, 22, 30, 32);
  rect(c, '#f9c8db', 141, 27, 38, 22);
  rect(c, '#ffdce5', 148, 25, 22, 23);
  rect(c, '#edafcc', 151, 43, 24, 3);
  for (let i = 0; i < 56; i++) {
    const x = (i * 71 + 9) % 320;
    const y = (i * 53 + 15) % 101;
    if (x > 136 && x < 184 && y > 18 && y < 57) continue;
    if (i % 7 === 0) star(c, x, y, '#efb8d8');
    else rect(c, i % 2 ? '#be8abb' : '#e6b4db', x, y, 1, 1);
  }
  for (let x = 0; x < 320; x += 8) {
    const y = 89 + Math.floor(12 * Math.sin(x / 26));
    rect(c, '#674370', x, y, 8, 125 - y);
    rect(c, '#52365d', x, 104 + Math.floor(5 * Math.sin(x / 13)), 8, 25);
  }
  rect(c, '#563c60', 0, 121, 320, 199);
  for (let y = 121; y < 320; y += 4) {
    const width = 47 + (y - 121) * 0.85;
    const shift = 13 * Math.sin(y / 24);
    rect(c, '#765478', 158 - width / 2 + shift, y, Math.round(width), 4);
  }
  for (let i = 0; i < 580; i++) {
    const x = (i * 127 + Math.floor(i / 41) * 7) % 320;
    const y = 122 + (i * 43 + Math.floor(i / 23) * 13) % 198;
    rect(c, ['#68476b', '#855e80', '#563b60'][i % 3], x, y, 2 + i % 3, 1);
    if (i % 6 === 0) {
      rect(c, '#977791', x, y - 1, 1, 4);
      rect(c, i % 4 ? '#e68fb2' : '#eec9bb', x - 1, y - 3, 3, 2);
    }
  }
  for (const [x, y, color] of [
    [20, 145, '#a85886'], [300, 146, '#a85886'], [38, 179, '#ca729b'], [282, 180, '#ca729b'],
    [18, 247, '#b55d8e'], [301, 250, '#b55d8e'], [26, 305, '#ca729b'], [294, 305, '#ca729b'],
  ]) tree(c, x, y, color);
  for (const {x, y} of obstacles) {
    rect(c, '#44314f', x - 12, y + 3, 24, 5);
    rect(c, '#634b69', x - 10, y - 3, 20, 8);
    rect(c, '#a585a0', x - 6, y - 8, 13, 7);
    rect(c, '#c3a2b7', x - 4, y - 7, 7, 2);
  }
}
paintGarden(garden.getContext('2d'));

function burst(x, y, total) {
  for (let i = 0; i < total; i++) {
    const angle = Math.PI * 2 * i / total;
    particles.push({ x, y, vx: Math.cos(angle) * 35, vy: Math.sin(angle) * 35 - 17, life: 0.85 });
  }
}

function drawScene(time, dt) {
  ctx.drawImage(garden, 0, 0);
  for (let i = 0; i < 10; i++) {
    const x = (37 * i + 19) % 320;
    const y = 65 + (43 * i) % 240 + (reduced ? 0 : Math.sin(time * 2 + i) * 4);
    if (i % 3) star(ctx, x, y, '#e8a8c9');
    else heart(ctx, x, y, 1, '#c681aa');
  }
  if (state === 'intro') {
    person(ctx, 139, 282, 0);
    person(ctx, 182, 282, 1);
    heart(ctx, 160, 240 + (reduced ? 0 : Math.sin(time * 3) * 3), 2);
    return;
  }
  hearts.forEach(({ x, y, taken }, i) => {
    if (taken) return;
    const bob = reduced ? 0 : Math.sin(time * 4 + i) * 2;
    heart(ctx, x, y - 12 + bob, 2, '#4d2d54');
    heart(ctx, x, y - 14 + bob, 2);
    rect(ctx, '#ffd0df', x - 5, y - 12 + bob, 3, 2);
  });
  const step = moving && !reduced ? Math.round(Math.sin(time * 24)) : 0;
  const people = [{...player, type: 0, step}, {...partner, type: 1, step: 0}];
  people.sort((a, b) => a.y - b.y).forEach(p => person(ctx, p.x, p.y, p.type, p.step));
  if (state === 'meeting') heart(ctx, 160, 89, 2);
  if (state === 'playing' && hearts.every(h => h.taken)) star(ctx, partner.x, 88, '#ffe5a9');
  if (reduced) return;
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    ctx.globalAlpha = Math.max(0, p.life);
    heart(ctx, p.x, p.y, 1, '#ffc3d7');
  }
  ctx.globalAlpha = 1;
}

function drawFinale(time) {
  finale.drawImage(garden, 80, 10, 160, 80, 0, 0, 160, 80);
  rect(finale, '#63456b', 0, 70, 160, 10);
  person(finale, 72, 70, 0);
  person(finale, 88, 70, 1);
  for (let i = 0; i < 7; i++) {
    const drift = reduced ? 0 : Math.sin(time * 2.5 + i);
    heart(finale, 43 + i * 12, 27 + (i % 3) * 7 + drift * 5, i === 3 ? 2 : 1, '#ff9fc5');
  }
}

function clearInput() {
  input.clear();
  buttons.forEach(button => button.classList.remove('held'));
  moving = false;
}

function show(next) {
  state = next;
  app.dataset.state = next;
  document.documentElement.classList.toggle('playing', ['playing', 'note', 'meeting'].includes(next));
  $('#intro').hidden = next !== 'intro';
  $('#credit').hidden = next !== 'intro';
  $('#hud').hidden = next === 'intro' || next === 'ending';
  $('#controls').hidden = next === 'intro' || next === 'ending';
  $('#note').hidden = next !== 'note';
  $('#ending').hidden = next !== 'ending';
  buttons.forEach(button => { button.disabled = next !== 'playing'; });
  $('#audio').inert = next === 'note';
  clearInput();
}

function start() {
  player.x = 160;
  player.y = 285;
  partner.x = 160;
  partner.y = 127;
  hearts.forEach(h => { h.taken = false; });
  particles = [];
  $('#count').textContent = '0 / 5';
  $('.meter').textContent = '♡ ♡ ♡ ♡ ♡';
  $('#hint').textContent = 'Encontre os cinco corações no jardim.';
  window.scrollTo(0, 0);
  show('playing');
  enableAudio();
  buttons[0].focus({ preventScroll: true });
}

function collect(h) {
  h.taken = true;
  const count = hearts.filter(heart => heart.taken).length;
  $('#count').textContent = count + ' / 5';
  $('.meter').textContent = Array.from({ length: 5 }, (_, i) => i < count ? '♥' : '♡').join(' ');
  if (count === 5) $('#hint').textContent = 'Agora encontre seu neném perto da lua.';
  $('#message').textContent = h.message;
  burst(h.x, h.y - 12, 13);
  chime([76, 81, 88]);
  show('note');
  $('#continue').focus({ preventScroll: true });
}

function valid(x, y) {
  return x >= 36 && x <= 284 && y >= 123 && y <= 300
    && obstacles.every(o => Math.abs(o.x - x) >= 12 || Math.abs(o.y - y) >= 9);
}

function update(dt) {
  const directions = new Set(input.values());
  const dx = Number(directions.has('right')) - Number(directions.has('left'));
  const dy = Number(directions.has('down')) - Number(directions.has('up'));
  moving = Boolean(dx || dy);
  if (!moving) return;
  const distance = 81 * dt / (Math.hypot(dx, dy) || 1);
  if (valid(player.x + dx * distance, player.y)) player.x += dx * distance;
  if (valid(player.x, player.y + dy * distance)) player.y += dy * distance;
  const found = hearts.find(h => !h.taken && Math.hypot(h.x - player.x, h.y - player.y) < 12);
  if (found) collect(found);
  else if (hearts.every(h => h.taken) && Math.hypot(partner.x - player.x, partner.y - player.y) < 22) {
    meeting = 0;
    meetingStart = { ...player };
    show('meeting');
    burst(160, 101, 22);
    chime([72, 76, 79, 84]);
  }
}

function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;
  if (state === 'playing') update(dt);
  if (state === 'meeting') {
    meeting += dt;
    const progress = reduced ? 1 : Math.min(1, meeting / 1.25);
    const eased = 1 - (1 - progress) ** 2;
    player.x = meetingStart.x + (151 - meetingStart.x) * eased;
    player.y = meetingStart.y + (131 - meetingStart.y) * eased;
    partner.x = 160 + 9 * eased;
    partner.y = 127 + 4 * eased;
    if (meeting >= (reduced ? 0.5 : 1.9)) {
      show('ending');
      window.scrollTo(0, 0);
      $('#letter-title').focus({ preventScroll: true });
    }
  }
  if (state === 'ending') drawFinale(timestamp / 1000);
  else drawScene(timestamp / 1000, dt);
  music();
  requestAnimationFrame(frame);
}

function directionFor(event) {
  return keyDirections.get(event.key.length === 1 ? event.key.toLowerCase() : event.key);
}

window.addEventListener('keydown', event => {
  if (state === 'note' && event.key === 'Tab') {
    event.preventDefault();
    return;
  }
  const direction = directionFor(event);
  if (state !== 'playing' || !direction || event.ctrlKey || event.altKey || event.metaKey) return;
  event.preventDefault();
  if (!event.repeat) input.set('key:' + event.code, direction);
});
window.addEventListener('keyup', event => input.delete('key:' + event.code));
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInput();
    if (audio) audio.suspend().catch(() => {});
  } else if (audio && !muted && state !== 'intro') enableAudio();
});

for (const button of buttons) {
  button.addEventListener('pointerdown', event => {
    if (state !== 'playing' || event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    input.set(event.pointerId, button.dataset.dir);
    button.classList.add('held');
    enableAudio();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(name, event => {
      input.delete(event.pointerId);
      if (![...input.values()].includes(button.dataset.dir)) button.classList.remove('held');
    });
  }
}
$('#start').addEventListener('click', start);
$('#replay').addEventListener('click', start);
$('#continue').addEventListener('click', () => {
  show('playing');
  buttons[0].focus({ preventScroll: true });
  enableAudio();
});
$('#audio').addEventListener('click', (event) => {
  muted = !muted;
  event.currentTarget.textContent = muted ? 'Som silenciado' : 'Som ligado';
  event.currentTarget.setAttribute('aria-pressed', String(muted));
  if (volume) volume.gain.setTargetAtTime(muted ? 0 : 0.7, audio.currentTime, 0.02);
  if (!muted && state !== 'intro') enableAudio();
});
requestAnimationFrame(frame);
