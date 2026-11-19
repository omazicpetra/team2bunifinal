const scenes = [
  {
    label: 'For Guild members only',
    title: 'Inside the Blend',
    text: 'Step into a cellar of roughly 300 barrels. Here, Rowan and Mark introduce Calypso’s Temptation — a stout shaped by whiskey-soaked oak and a surprising collection of vanillas. Pull the lever and follow its story.',
    art: 'cellar',
    focus: '44% 35%'
  },
  {
    label: 'Inside the barrel',
    title: 'Three whiskeys.\nOne beginning.',
    text: 'Look into the dark beer. The blend brings together stout aged in wheat whiskey, rye whiskey and Heaven Hill corn whiskey barrels. Each cask leaves its own trace. But the woody notes you will taste have another source, too.',
    art: 'barrel',
    focus: '69% 48%'
  },
  {
    label: 'At the vanilla table',
    title: 'A world\nof vanilla.',
    text: 'Around ten varieties became tinctures and beer infusions. Madagascar offered a familiar base. Papua New Guinea recalled soft-serve ice cream. Comoros brought wood and tobacco notes. The trial blend was so convincing that the brewers doubled the vanilla for the finished beer.',
    art: 'vanilla',
    focus: '65% 42%'
  },
  {
    label: 'From the cellar to your glass',
    title: 'Take your time.',
    text: 'At home, the story comes together. Pour Calypso’s Temptation, take in the aroma and follow the soft vanilla into the deeper woody notes. Is that the barrel, or the Comoros vanilla? Give the long finish a moment to unfold.',
    art: 'bar',
    focus: '67% 52%'
  }
];

const pages = document.querySelector('#pages');
const nav = document.querySelector('#scene-nav');
const lever = document.querySelector('#lever');
const shaft = document.querySelector('#shaft');
const grip = document.querySelector('#grip');
const hint = document.querySelector('#hint');
const count = document.querySelector('#count');
const passage = document.querySelector('#passage');
const passageCamera = passage.querySelector('.passage-camera');
passageCamera.innerHTML = storyArt.hall;

let current = 0;
let busy = false;
let pointer = null;
let startY = 0;
let leverProgress = 0;
let leverAnimation = null;
let suppressClick = false;
const cameraEasing = 'cubic-bezier(.45,0,.2,1)';



scenes.forEach((scene, index) => {
  const panel = document.createElement('section');
  panel.className = `scene scene-${scene.art}`;
  panel.setAttribute('aria-labelledby', `title-${index}`);
  panel.innerHTML = `<div class="camera"><div class="ambience">${storyArt[scene.art]}</div></div><div class="scene-shade"></div>`;
  const article = document.createElement('article');
  const label = document.createElement('small');
  label.textContent = scene.label;
  const title = document.createElement('h1');
  title.id = `title-${index}`;
  title.textContent = scene.title;
  const paragraph = document.createElement('p');
  paragraph.textContent = scene.text;
  article.append(label, title, paragraph);
  panel.append(article);
  pages.append(panel);

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', scene.title.replace('\n', ' '));
  button.title = scene.title.replace('\n', ' ');
  button.addEventListener('click', () => navigate(index, false));
  nav.append(button);
});
const panels = [...pages.children];

function setLever(value) {
  leverProgress = value;
  const distance = value * 112;
  shaft.setAttribute('y2', String(19 + distance));
  grip.setAttribute('transform', `translate(0 ${distance})`);
}

function moveLever(target, duration) {
  if (leverAnimation) cancelAnimationFrame(leverAnimation);
  const initial = leverProgress;
  const started = performance.now();
  return new Promise(resolve => {
    function tick(now) {
      const time = Math.min(1, (now - started) / duration);
      const eased = time * time * (3 - 2 * time);
      setLever(initial + (target - initial) * eased);
      if (time < 1) {
        leverAnimation = requestAnimationFrame(tick);
      } else {
        leverAnimation = null;
        resolve();
      }
    }
    leverAnimation = requestAnimationFrame(tick);
  });
}

function updateControls() {
  panels.forEach((panel, index) => {
    panel.setAttribute('aria-hidden', String(index !== current));
    panel.inert = index !== current;
  });
  [...nav.children].forEach((button, index) => {
    button.setAttribute('aria-current', String(index === current));
  });
  const instruction = current === scenes.length - 1 ? 'Pull to begin again' : 'Pull down or tap';
  lever.setAttribute('aria-label', instruction);
  hint.textContent = instruction;
  count.textContent = `${current + 1} / ${scenes.length}`;
}

function animate(element, keyframes, options) {
  return element.animate(keyframes, { easing: cameraEasing, fill: 'both', ...options });
}

async function navigate(index, pullLever) {
  if (busy || index === current) return;
  busy = true;
  storyAudio.stopNarration();
  lever.setAttribute('aria-busy', 'true');
  const outgoing = panels[current];
  const incoming = panels[index];
  const animations = [];
  const oldCamera = outgoing.querySelector('.camera');
  const newCamera = incoming.querySelector('.camera');
  const oldArticle = outgoing.querySelector('article');
  const newArticle = incoming.querySelector('article');
  const throughDoor = (current === 0 && index === 1) || (current === 2 && index === 3);
  const duration = throughDoor ? 3600 : 2800;
  const previous = current;

  try {
    if (pullLever) await moveLever(1, 560);
    incoming.classList.add('visible');
    incoming.style.zIndex = '2';
    oldCamera.style.transformOrigin = scenes[current].focus;
    newCamera.style.transformOrigin = scenes[index].focus;
    animations.push(animate(oldArticle, [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-18px)' }
    ], { duration: 650 }));

    if (throughDoor) {
      outgoing.classList.add('departing');
      passage.classList.add('visible');
      animations.push(animate(oldCamera, [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(2.8)', opacity: 0 }
      ], { duration: duration * .78 }));
      animations.push(animate(passage, [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: .2 },
        { opacity: 1, offset: .82 },
        { opacity: 0, offset: 1 }
      ], { duration }));
      animations.push(animate(passageCamera, [
        { transform: 'scale(1)', offset: 0 },
        { transform: 'scale(2)', offset: .4 },
        { transform: 'scale(5)', offset: .72 },
        { transform: 'scale(11)', offset: 1 }
      ], { duration }));
      animations.push(animate(newCamera, [
        { transform: 'scale(.8) translateY(-5%)', opacity: 0, offset: 0 },
        { transform: 'scale(.88) translateY(-3%)', opacity: 0, offset: .52 },
        { transform: 'scale(1) translateY(0)', opacity: 1, offset: 1 }
      ], { duration }));
    } else {
      const direction = index > current ? 1 : -1;
      animations.push(animate(oldCamera, [
        { transform: 'scale(1) translate(0,0)', opacity: 1 },
        { transform: `scale(1.4) translate(${-direction * 22}%,8%)`, opacity: 0 }
      ], { duration }));
      animations.push(animate(newCamera, [
        { transform: `scale(1.18) translate(${direction * 20}%,-8%)`, opacity: 0 },
        { transform: 'scale(1) translate(0,0)', opacity: 1 }
      ], { duration }));
    }
    animations.push(animate(newArticle, [
      { opacity: 0, transform: 'translateY(24px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 1000, delay: duration * .68 }));

    // The destination starts its own continuous motion as it comes into view.
    incoming.classList.add('playing');
    current = index;
    updateControls();
    await Promise.all(animations.map(animation => animation.finished));
    storyAudio.playScene(index);
  } finally {
    // Set the resting state before releasing animation fills, avoiding a final-frame flash.
    outgoing.classList.remove('visible', 'playing', 'departing');
    incoming.classList.add('visible', 'playing');
    incoming.style.zIndex = '';
    passage.classList.remove('visible');
    animations.forEach(animation => animation.cancel());
    oldCamera.style.transformOrigin = '';
    newCamera.style.transformOrigin = '';
    if (current === previous) {
      current = index;
      updateControls();
    }
    if (pullLever) await moveLever(0, 680);
    busy = false;
    lever.removeAttribute('aria-busy');
  }
}

lever.addEventListener('pointerdown', event => {
  if (busy || !event.isPrimary || event.button !== 0) return;
  pointer = event.pointerId;
  startY = event.clientY;
  suppressClick = false;
  lever.setPointerCapture(pointer);
});
lever.addEventListener('pointermove', event => {
  if (!busy && event.pointerId === pointer) {
    setLever(Math.max(0, Math.min(1, (event.clientY - startY) / 105)));
  }
});
lever.addEventListener('pointerup', event => {
  if (event.pointerId !== pointer) return;
  const distance = event.clientY - startY;
  pointer = null;
  suppressClick = true;
  if (distance >= 40 || Math.abs(distance) < 7) {
    navigate((current + 1) % scenes.length, true);
  } else {
    busy = true;
    moveLever(0, 440).then(() => { busy = false; });
  }
});
lever.addEventListener('pointercancel', () => {
  if (pointer === null) return;
  pointer = null;
  busy = true;
  moveLever(0, 440).then(() => { busy = false; });
});
lever.addEventListener('click', event => {
  if (!suppressClick || event.detail === 0) navigate((current + 1) % scenes.length, true);
  suppressClick = false;
});
const storyAudio = new StoryAudio(
  document.querySelector('#music'),
  document.querySelector('#sound'),
  voiceoverConfig
);
const entryGate = document.querySelector('#entry-gate');
document.querySelector('#begin-story').addEventListener('click', () => {
  storyAudio.start();
  storyAudio.playScene(0);
  entryGate.remove();
  document.querySelector('#story-content').inert = false;
  lever.focus({ preventScroll: true });
});
panels[0].classList.add('visible', 'playing');
updateControls();
