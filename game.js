'use strict';

const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const scene = $('#scene');
const ctx = scene.getContext('2d');
const finale = $('#together').getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hearts = [
  { x: 66, y: 241, photo: '01', alt: 'Nós dois lado a lado com máscaras faciais.', message: 'Se nosso encontro fosse planejado, talvez eu não tivesse conhecido você.' },
  { x: 66, y: 161, photo: '02', alt: 'De óculos escuros, segurando um cachorro no colo.', message: 'E quem diria que conhecer você viria em dobro?' },
  { x: 160, y: 174, photo: '03', alt: 'À mesa, mostrando um prato com peixe e limão.', message: 'Podemos ter pouco tempo para nos ver, mas sempre aproveitamos cada minuto.' },
  { x: 251, y: 238, photo: '04', alt: 'Nós dois em uma selfie no espelho.', message: 'E, como você me disse, você não é qualquer cara.' },
  { x: 251, y: 154, photo: '05', alt: 'Nós dois sentados juntos à mesa perto da janela.', message: 'A cada encontro nosso, sinto como se fosse o primeiro.' },
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
  if ((!memoryVideo.paused && !memoryVideo.ended) || albumVideos.some(video => !video.paused && !video.ended)) return;
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
function heart(c, x, y, size, color = '#f4bd61') {
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
  const shirt = type ? '#e8e7d9' : '#548bd5';
  const hair = type ? '#26222a' : '#24242b';
  const skin = type ? '#cf916d' : '#f4b590';
  rect(c, '#17283b', x - 8, y + 1, 17, 3);
  rect(c, '#22334a', x - 5, y - 6, 10, 8);
  rect(c, '#101e32', x - 6, y + step, 5, 2);
  rect(c, '#101e32', x + 2, y - step, 5, 2);
  rect(c, shirt, x - 7, y - 15, 14, 10);
  rect(c, type ? '#9baead' : '#345c97', x - 7, y - 8, 14, 3);
  rect(c, skin, x - 8, y - 10, 3, 4);
  rect(c, skin, x + 5, y - 10, 3, 4);
  rect(c, hair, x - 7, y - 27, 14, 11);
  rect(c, hair, x - 4, y - 29, 9, 3);
  rect(c, skin, x - 5, y - 23, 11, 9);
  rect(c, hair, x - 6, y - 24, type ? 4 : 7, 3);
  rect(c, '#27232a', x - 3, y - 20, 1, 2);
  rect(c, '#27232a', x + 3, y - 20, 1, 2);
  rect(c, '#ab5f69', x, y - 16, 2, 1);
  if (!type) {
    rect(c, '#1e2a35', x - 6, y - 21, 4, 1);
    rect(c, '#1e2a35', x + 2, y - 21, 4, 1);
    rect(c, '#1e2a35', x - 2, y - 20, 4, 1);
  }
}

function tree(c, x, y, color) {
  rect(c, '#283739', x - 3, y - 22, 7, 24);
  rect(c, '#667254', x + 1, y - 15, 2, 16);
  rect(c, '#203b42', x - 22, y - 42, 44, 25);
  rect(c, '#203b42', x - 16, y - 51, 32, 39);
  rect(c, color, x - 19, y - 44, 38, 22);
  rect(c, color, x - 12, y - 51, 24, 31);
  rect(c, '#78a191', x - 14, y - 41, 9, 4);
  rect(c, '#a1bba0', x - 9, y - 46, 5, 3);
  rect(c, '#609389', x + 5, y - 35, 11, 5);
  rect(c, '#395f5b', x - 4, y - 24, 18, 5);
}

const garden = document.createElement('canvas');
garden.width = garden.height = 320;
function paintGarden(c) {
  const sky = c.createLinearGradient(0, 0, 0, 125);
  sky.addColorStop(0, '#132943');
  sky.addColorStop(1, '#546c80');
  c.fillStyle = sky;
  c.fillRect(0, 0, 320, 125);
  rect(c, '#e7cb93', 145, 22, 30, 32);
  rect(c, '#e7cb93', 141, 27, 38, 22);
  rect(c, '#fae8ba', 148, 25, 22, 23);
  rect(c, '#d6b985', 151, 43, 24, 3);
  for (let i = 0; i < 56; i++) {
    const x = (i * 71 + 9) % 320;
    const y = (i * 53 + 15) % 101;
    if (x > 136 && x < 184 && y > 18 && y < 57) continue;
    if (i % 7 === 0) star(c, x, y, '#f0dfb7');
    else rect(c, i % 2 ? '#7796a8' : '#a8bdc2', x, y, 1, 1);
  }
  for (let x = 0; x < 320; x += 8) {
    const y = 89 + Math.floor(12 * Math.sin(x / 26));
    rect(c, '#3d576b', x, y, 8, 125 - y);
    rect(c, '#344d61', x, 104 + Math.floor(5 * Math.sin(x / 13)), 8, 25);
  }
  rect(c, '#355e60', 0, 121, 320, 199);
  for (let y = 121; y < 320; y += 4) {
    const width = 47 + (y - 121) * 0.85;
    const shift = 13 * Math.sin(y / 24);
    rect(c, '#6b7869', 158 - width / 2 + shift, y, Math.round(width), 4);
  }
  for (let i = 0; i < 580; i++) {
    const x = (i * 127 + Math.floor(i / 41) * 7) % 320;
    const y = 122 + (i * 43 + Math.floor(i / 23) * 13) % 198;
    rect(c, ['#426868', '#608275', '#2d5559'][i % 3], x, y, 2 + i % 3, 1);
    if (i % 6 === 0) {
      rect(c, '#718d72', x, y - 1, 1, 4);
      rect(c, i % 4 ? '#a9ba89' : '#f1d299', x - 1, y - 3, 3, 2);
    }
  }
  for (const [x, y, color] of [
    [20, 145, '#467b74'], [300, 146, '#467b74'], [38, 179, '#59887b'], [282, 180, '#59887b'],
    [18, 247, '#48766c'], [301, 250, '#48766c'], [26, 305, '#59887b'], [294, 305, '#59887b'],
  ]) tree(c, x, y, color);
  for (const {x, y} of obstacles) {
    rect(c, '#2f4c56', x - 12, y + 3, 24, 5);
    rect(c, '#536976', x - 10, y - 3, 20, 8);
    rect(c, '#799094', x - 6, y - 8, 13, 7);
    rect(c, '#9bb0ad', x - 4, y - 7, 7, 2);
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
    if (i % 3) star(ctx, x, y, '#d4d6a5');
    else heart(ctx, x, y, 1, '#8dad9e');
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
    heart(ctx, x, y - 12 + bob, 2, '#504b39');
    heart(ctx, x, y - 14 + bob, 2);
    rect(ctx, '#fff0b7', x - 5, y - 12 + bob, 3, 2);
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
    heart(ctx, p.x, p.y, 1, '#ffe1a1');
  }
  ctx.globalAlpha = 1;
}

function drawFinale(time) {
  finale.drawImage(garden, 80, 10, 160, 80, 0, 0, 160, 80);
  rect(finale, '#36565f', 0, 70, 160, 10);
  person(finale, 72, 70, 0);
  person(finale, 88, 70, 1);
  for (let i = 0; i < 7; i++) {
    const drift = reduced ? 0 : Math.sin(time * 2.5 + i);
    heart(finale, 43 + i * 12, 27 + (i % 3) * 7 + drift * 5, i === 3 ? 2 : 1, '#f6c87d');
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
  chapterRun = null;
  $('#leave-chapter').hidden = true;
  completedChapters.clear();
  albumChoices.clear();
  resetAlbum();
  updateChapterMenu();
  $('#scene').setAttribute('aria-label', 'Jardim em pixel art sob a lua');
  $('#continue').textContent = 'Continuar';
  $('#memories').hidden = true;
  $('#open-memories').setAttribute('aria-expanded', 'false');
  $('#map-memory').hidden = true;
  resetMemoryGallery();
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
  const photo = $('#memory-photo');
  photo.alt = h.alt;
  photo.src = 'fotos/' + h.photo + '.jpg';
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
  const canMove = chapterRun ? validChapterPosition : valid;
  if (canMove(player.x + dx * distance, player.y)) player.x += dx * distance;
  if (canMove(player.x, player.y + dy * distance)) player.y += dy * distance;
  if (chapterRun) {
    checkChapterStop();
    return;
  }
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
  else if (chapterRun) drawChapter(timestamp / 1000);
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
// Keep the five memories from the original adventure at their known locations.
const originalLocations = [[53.775, 43.393], [62.039, 73.585], [70.082, 45.797],
  [49.315, 61.760], [70.556, 46.385]];
const allMemories = hearts.map((heart, index) => ({
  src: 'fotos/' + heart.photo + '.jpg',
  alt: heart.alt,
  message: heart.message,
  label: index === 1 ? 'Teatro Amazonas' : 'Foto ' + heart.photo,
  x: originalLocations[index][0],
  y: originalLocations[index][1],
})).concat(importedMemories);
const stops = [];
const withoutPoint = [];
allMemories.forEach(memory => {
  if (memory.x === undefined) {
    withoutPoint.push(memory);
    return;
  }
  const nearby = stops.find(stop => Math.hypot(stop.x - memory.x, stop.y - memory.y) < 16);
  if (nearby) nearby.items.push(memory);
  else stops.push({ x: memory.x, y: memory.y, items: [memory] });
});

let currentGallery = null;
let galleryIndex = 0;
const galleryButtons = new Map();
const memoryVideo = $('#map-video');

function stopMemoryVideo() {
  if (!memoryVideo.hasAttribute('src')) return;
  memoryVideo.pause();
  memoryVideo.removeAttribute('src');
  memoryVideo.load();
}

function resetMemoryGallery() {
  currentGallery = null;
  galleryIndex = 0;
  stopMemoryVideo();
  galleryButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
}

function showGalleryItem() {
  const memory = currentGallery[galleryIndex];
  const photo = $('#map-photo');
  stopMemoryVideo();
  photo.hidden = Boolean(memory.video);
  memoryVideo.hidden = !memory.video;
  if (memory.video) memoryVideo.src = memory.src;
  else {
    photo.src = memory.src;
    photo.alt = memory.alt || 'Foto da galeria de memórias';
  }
  $('#map-place').textContent = memory.label || (memory.video ? 'Vídeo' : 'Foto');
  $('#map-message').textContent = memory.message || '';
  $('#map-message').hidden = !memory.message;
  $('#memory-position').textContent = (galleryIndex + 1) + ' de ' + currentGallery.length;
  $('#previous-memory').disabled = galleryIndex === 0;
  $('#next-memory').disabled = galleryIndex === currentGallery.length - 1;
  $('#map-memory').hidden = false;
  updateAlbumSelection();
}

function openGallery(items, scroll = true) {
  albumVideos.forEach(video => video.pause());
  currentGallery = items;
  galleryIndex = 0;
  galleryButtons.forEach((button, gallery) => button.setAttribute('aria-pressed', String(gallery === items)));
  showGalleryItem();
  if (scroll) $('#map-memory').scrollIntoView({ block: 'nearest', behavior: reduced ? 'instant' : 'smooth' });
}

function addGalleryButton(items, label, parent) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', label);
  button.addEventListener('click', () => openGallery(items));
  galleryButtons.set(items, button);
  $(parent).append(button);
  return button;
}

stops.forEach(({ x, y, items }, index) => {
  const label = 'Ponto ' + (index + 1) + ', ' + items.length + (items.length === 1 ? ' lembrança' : ' lembranças');
  const pin = addGalleryButton(items, label, '#memory-pins');
  pin.className = 'memory-pin';
  pin.style.left = Math.max(8, Math.min(92, x)) + '%';
  pin.style.top = Math.max(8, Math.min(92, y)) + '%';
  pin.textContent = items.length === 1 ? '♥' : '♥ ' + items.length;
});

for (const [items, label] of [[allMemories, 'Todas'], [withoutPoint, 'Sem ponto no mapa']]) {
  if (!items.length) continue;
  const button = addGalleryButton(items, label, '#memory-choices');
  button.className = 'secondary memory-choice';
  button.textContent = label + ' (' + items.length + ')';
}

$('#previous-memory').addEventListener('click', () => {
  if (galleryIndex <= 0) return;
  galleryIndex--;
  showGalleryItem();
});
$('#next-memory').addEventListener('click', () => {
  if (!currentGallery || galleryIndex >= currentGallery.length - 1) return;
  galleryIndex++;
  showGalleryItem();
});

$('#open-memories').addEventListener('click', () => {
  $('#memories').hidden = false;
  $('#open-memories').setAttribute('aria-expanded', 'true');
  $('#memories-title').focus();
});

$('#start').addEventListener('click', start);
$('#replay').addEventListener('click', start);
$('#continue').addEventListener('click', () => {
  if (chapterRun && chapterRun.index === chapters[chapterRun.id].stops.length) {
    finishChapter();
    return;
  }
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
const chapters = [
  {
    title: 'O encontro que ninguém planejou',
    place: 'Teatro Amazonas',
    instruction: 'Siga as luzes da praça até o Teatro Amazonas.',
    stops: [
      { x: 76, y: 255 }, { x: 113, y: 208 }, { x: 210, y: 178 },
      { x: 160, y: 134, memory: 1 },
    ],
  },
  {
    title: 'Cada minuto com você',
    place: 'Passeio noturno',
    instruction: 'Caminhe até a próxima parada iluminada.',
    stops: [
      { x: 70, y: 242, memory: 0 },
      { x: 250, y: 196, memory: 3 },
      { x: 160, y: 132, memory: 2 },
    ],
  },
  {
    title: 'Como se fosse a primeira vez',
    place: 'Reencontro e álbum',
    instruction: 'Caminhe até ele para começar o álbum.',
    stops: [{ x: 160, y: 135, memory: 4 }],
  },
];
let chapterRun = null;
const completedChapters = new Set();
const chapterButtons = [...document.querySelectorAll('[data-chapter]')];
const albumChoices = new Set();
let albumMode = false;
let albumVideos = [];

function updateChapterMenu() {
  chapterButtons.forEach((button, index) => {
    button.querySelector('span').textContent = chapters[index].place +
      (completedChapters.has(index) ? ' · Concluída' : '');
  });
}

function updateChapterProgress() {
  const chapter = chapters[chapterRun.id];
  const count = chapterRun.index;
  $('#count').textContent = count + ' / ' + chapter.stops.length;
  $('.meter').textContent = chapter.stops.map((_, index) => index < count ? '♥' : '♡').join(' ');
  $('#hint').textContent = chapter.instruction;
}

function beginChapter(id) {
  resetMemoryGallery();
  resetAlbum();
  $('#map-memory').hidden = true;
  chapterRun = { id, index: 0 };
  player.x = 160;
  player.y = 286;
  particles = [];
  $('#scene').setAttribute('aria-label', chapters[id].title + ' em pixel art');
  $('#leave-chapter').hidden = false;
  $('#continue').textContent = 'Continuar';
  updateChapterProgress();
  show('playing');
  window.scrollTo(0, 0);
  buttons[0].focus({ preventScroll: true });
  enableAudio();
}

function validChapterPosition(x, y) {
  return x >= 26 && x <= 294 && y >= 124 && y <= 303;
}

function checkChapterStop() {
  const chapter = chapters[chapterRun.id];
  const stop = chapter.stops[chapterRun.index];
  if (Math.hypot(stop.x - player.x, stop.y - player.y) > 13) return;
  chapterRun.index++;
  updateChapterProgress();
  chime([76, 81, 88]);
  if (stop.memory === undefined) return;

  const memory = allMemories[stop.memory];
  const photo = $('#memory-photo');
  photo.alt = memory.alt;
  photo.src = memory.src;
  $('#message').textContent = memory.message;
  if (chapterRun.index === chapter.stops.length) {
    $('#continue').textContent = chapterRun.id === 2 ? 'Escolher lembranças' : 'Voltar às fases';
  }
  show('note');
  $('#continue').focus({ preventScroll: true });
}

function returnToChapters() {
  chapterRun = null;
  $('#leave-chapter').hidden = true;
  show('ending');
  $('#memories-title').focus();
}

function finishChapter() {
  const id = chapterRun.id;
  if (id !== 2) completedChapters.add(id);
  updateChapterMenu();
  returnToChapters();
  if (id === 2) editAlbum();
}

function drawChapter(time) {
  const id = chapterRun.id;
  const chapter = chapters[id];
  rect(ctx, '#142a44', 0, 0, 320, 320);
  rect(ctx, '#efd598', 245, 25, 24, 25);
  rect(ctx, '#142a44', 251, 21, 21, 20);
  for (let i = 0; i < 24; i++) {
    rect(ctx, i % 3 ? '#779aae' : '#e9d2a7', (i * 83 + 19) % 314, (i * 39 + 13) % 91, 2, 1);
  }

  rect(ctx, '#2b4b58', 0, 117, 320, 203);
  for (let y = 122; y < 320; y += 12) {
    for (let x = (y % 8) * 2 - 16; x < 320; x += 22) {
      rect(ctx, (x + y) % 3 ? '#355765' : '#42616d', x, y, 18, 8);
    }
  }
  if (id === 0) {
    // The stepped dome and lit colonnade mark the theater from the plaza.
    for (let row = 0; row < 6; row++) {
      rect(ctx, row % 2 ? '#547e72' : '#88a381', 146 - row * 4, 36 + row * 5, 28 + row * 8, 5);
    }
    rect(ctx, '#ead191', 157, 32, 6, 6);
    rect(ctx, '#c28b75', 79, 65, 162, 50);
    rect(ctx, '#f0d6a1', 73, 63, 174, 5);
    rect(ctx, '#f0d6a1', 73, 110, 174, 5);
    for (let x = 92; x < 232; x += 24) {
      rect(ctx, '#363d50', x, 77, 14, 31);
      rect(ctx, '#efd598', x + 3, 81, 8, 12);
      rect(ctx, '#eac9a0', x - 4, 73, 3, 37);
    }
    rect(ctx, '#a69b84', 120, 115, 80, 4);
    rect(ctx, '#6c7c77', 115, 119, 90, 5);
  } else {
    for (let x = 0; x < 320; x += 25) {
      const height = 22 + ((x * 13) % 36);
      rect(ctx, '#213b50', x, 115 - height, 23, height);
      for (let y = 122 - height; y < 108; y += 10) {
        rect(ctx, '#be9e65', x + 5, y, 4, 3);
        rect(ctx, '#5c8288', x + 13, y, 4, 3);
      }
    }
  }
  for (const [x, y] of [[33, 174], [285, 175], [32, 281], [288, 281]]) {
    rect(ctx, '#182b3c', x - 1, y - 28, 3, 30);
    rect(ctx, '#8c7551', x - 6, y - 34, 13, 10);
    rect(ctx, '#ffe5a5', x - 4, y - 32, 9, 6);
  }
  chapter.stops.forEach((stop, index) => {
    rect(ctx, index < chapterRun.index ? '#708779' : '#567980', stop.x - 8, stop.y - 2, 16, 4);
    if (index === chapterRun.index && id !== 2) {
      const bob = reduced ? 0 : Math.sin(time * 4) * 3;
      star(ctx, stop.x, stop.y - 12 + bob, '#fff0b7');
      if (stop.memory !== undefined) heart(ctx, stop.x, stop.y - 29 + bob, 2);
    }
  });
  if (id === 2) {
    person(ctx, 160, 126, 1);
    heart(ctx, 160, 88 + (reduced ? 0 : Math.sin(time * 4) * 3), 2);
  }
  person(ctx, player.x, player.y, 0, moving && !reduced ? Math.round(Math.sin(time * 24)) : 0);
}

function resetAlbum() {
  albumMode = false;
  albumVideos.forEach(video => video.pause());
  albumVideos = [];
  $('#album-pages').replaceChildren();
  $('#album').hidden = true;
  $('#album-select').hidden = true;
  updateAlbumSelection();
}

function updateAlbumSelection() {
  const current = currentGallery?.[galleryIndex];
  const chosen = albumChoices.has(current);
  const save = $('#save-memory');
  save.hidden = !albumMode || !current;
  save.disabled = !chosen && albumChoices.size === 3;
  save.setAttribute('aria-pressed', String(chosen));
  save.textContent = chosen ? 'Remover do álbum' : 'Guardar no álbum';
  $('#album-count').textContent = albumChoices.size + ' de 3 escolhidas';
  $('#build-album').disabled = albumChoices.size !== 3;
}

function editAlbum() {
  resetAlbum();
  albumMode = true;
  $('#album-select').hidden = false;
  openGallery(allMemories, false);
  $('#album-title').focus();
}

function buildAlbum() {
  if (albumChoices.size !== 3) return;
  resetAlbum();
  stopMemoryVideo();
  $('#map-memory').hidden = true;
  for (const memory of albumChoices) {
    const page = document.createElement('figure');
    const media = document.createElement(memory.video ? 'video' : 'img');
    if (memory.video) {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
      media.setAttribute('aria-label', 'Vídeo do nosso álbum');
      media.addEventListener('play', () => {
        stopMemoryVideo();
        albumVideos.forEach(video => { if (video !== media) video.pause(); });
      });
      albumVideos.push(media);
    } else {
      media.alt = memory.alt || 'Foto do nosso álbum';
    }
    media.src = memory.src;
    page.append(media);
    if (memory.message) {
      const caption = document.createElement('figcaption');
      caption.textContent = memory.message;
      page.append(caption);
    }
    $('#album-pages').append(page);
  }
  completedChapters.add(2);
  updateChapterMenu();
  $('#album').hidden = false;
  $('#album-heading').focus();
}

chapterButtons.forEach((button, index) => button.addEventListener('click', () => beginChapter(index)));
$('#leave-chapter').addEventListener('click', returnToChapters);
$('#save-memory').addEventListener('click', () => {
  const current = currentGallery?.[galleryIndex];
  if (!albumMode || !current) return;
  if (albumChoices.has(current)) albumChoices.delete(current);
  else if (albumChoices.size < 3) albumChoices.add(current);
  updateAlbumSelection();
});
$('#build-album').addEventListener('click', buildAlbum);
$('#edit-album').addEventListener('click', editAlbum);

requestAnimationFrame(frame);
