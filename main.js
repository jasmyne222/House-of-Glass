// The House of Glass — orchestrator
// Bootstraps the Three.js scene, UI bindings and moon chat.

import * as THREE from 'three';
import { addEnvironment, addGlitchOverlay } from './scene/environment.js';
import { createHouseStructure, attachZoneLabel } from './scene/house.js';
import { createCharacterAvatar } from './scene/characters.js';
import { createParticles, addMoon } from './scene/particles.js';
import { initMoonChat } from './ui/chat.js';
import { createPanels } from './ui/panels.js';
import {
	moonRepliesDefault,
	sections,
	roomAccent,
	dataPieces,
	roomActions,
	roomChoices,
	roomScenarios,
	defaultInfo,
	characterOptions,
	moveSpeeds,
	gameState
} from './data/content.js';

let started = false;
let renderer, scene, camera, clock;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let particleGeo;
const particleCount = 160;
const allowedZones = [];
const zones = [];
const hoverPlanes = [];
let hoveredZoneIdx = null;
let lastLabelIdx = null;
let zoneLabelMesh = null;
let currentSection = 0;
let audioCtxNode = null;

const moveState = { forward: false, back: false, left: false, right: false };
const heroBounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
const heroVelocity = new THREE.Vector3();
const heroDirection = new THREE.Vector3();
const lookTarget = new THREE.Vector3(0, 1.2, 0);
const desiredLook = new THREE.Vector3();
const heroStep = new THREE.Vector3();
const zeroVec = new THREE.Vector3();
let gltfCharacter = null;
let gltfMixer = null;
let gltfIdleAction = null;
let gltfCharacterIdle = null;
let useProceduralSwing = false;
let cameraOffset = { distance: 7, height: 3.5, lag: 0.12, min: 3, max: 12 };
let camYaw = -Math.PI / 3.5;
let camYawTarget = 0;
let camDrag = false;
let camLastX = 0;
let camLastY = 0;
let camPitch = -0.05;
let camPitchTarget = -0.05;
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
let voiceEnabled = false;
let moonMixer = null;
let moonMesh = null;
const moonFollowOffset = new THREE.Vector3(0.8, 1.8, -1.2);
const moonTarget = new THREE.Vector3();
let heroY = 0;
let heroYVel = 0;
const gravity = -9.8;
const jumpStrength = 4.2;
let jumpActive = false;
let lastBounce = 0;

const keyBindings = {
	ArrowUp: 'forward',
	ArrowDown: 'back',
	ArrowLeft: 'left',
	ArrowRight: 'right'
};

function isTypingTarget(target) {
	if (!target) return false;
	if (target.isContentEditable) return true;
	const tag = target.tagName || '';
	if (tag === 'TEXTAREA') return !target.readOnly && !target.disabled;
	if (tag === 'INPUT') {
		const type = (target.type || 'text').toLowerCase();
		const textLike = ['text', 'search', 'email', 'password', 'url', 'tel', 'number'];
		return !target.readOnly && !target.disabled && (textLike.includes(type) || type === '');
	}
	return false;
}

function handleMoveKey(e, isDown) {
	const dir = keyBindings[e.code];
	if (!dir) return;
	if (e.repeat) return;
	moveState[dir] = isDown;
	if (e.code.startsWith('Arrow')) e.preventDefault();
}

function resetMovement() {
	Object.keys(moveState).forEach((k) => (moveState[k] = false));
	heroVelocity.set(0, 0, 0);
}

function tryJump() {
	if (jumpActive || heroY > 0.01) return;
	jumpActive = true;
	heroYVel = jumpStrength;
}

export function speakLine(text, voice = null) {
	if (!voiceEnabled || !window.speechSynthesis) return;
	const utter = new SpeechSynthesisUtterance(text);
	utter.rate = 0.9;
	utter.volume = 0.9;
	utter.pitch = 1.0;
	if (voice) utter.voice = voice;
	window.speechSynthesis.speak(utter);
}

function createDramaticAudio() {
	const ctx = new (window.AudioContext || window.webkitAudioContext)();
	const g = ctx.createGain();
	g.gain.value = 0.0;
	g.connect(ctx.destination);
	const freqs = [65, 92, 150];
	const oscillators = freqs.map((f) => {
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.value = f;
		return osc;
	});
	const lfo = ctx.createOscillator();
	lfo.frequency.value = 0.06;
	const lfoGain = ctx.createGain();
	lfoGain.gain.value = 15;
	const filter = ctx.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.value = 900;
	lfo.connect(lfoGain);
	lfoGain.connect(filter.frequency);
	oscillators.forEach((osc) => osc.connect(filter));
	filter.connect(g);
	oscillators.forEach((osc) => osc.start());
	lfo.start();

	audioCtxNode = { ctx, oscillators, lfo, gain: g };
	g.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);
}

function stopDramaticAudio() {
	if (!audioCtxNode) return;
	const { ctx, oscillators, lfo, gain } = audioCtxNode;
	gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.0);
	setTimeout(() => {
		try {
			oscillators.forEach((o) => o.stop());
			lfo.stop();
			ctx.close();
		} catch (e) {}
	}, 1200);
	audioCtxNode = null;
}

function setupRenderer() {
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.domElement.style.position = 'fixed';
	renderer.domElement.style.inset = '0';
	document.body.appendChild(renderer.domElement);
}

function setupCameraAndControls() {
	camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
	camera.position.set(0, cameraOffset.height, cameraOffset.distance);
	renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
	renderer.domElement.addEventListener('pointerdown', (e) => {
		if (e.button === 0 || e.button === 2) {
			camDrag = true;
			camLastX = e.clientX;
			camLastY = e.clientY;
		}
	});
	window.addEventListener('pointerup', () => {
		camDrag = false;
	});
	window.addEventListener('pointermove', (e) => {
		if (!camDrag) return;
		const dx = e.clientX - camLastX;
		const dy = e.clientY - camLastY;
		camYawTarget -= dx * 0.01;
		camPitchTarget = THREE.MathUtils.clamp(camPitchTarget - dy * 0.005, -0.3, 0.25);
		camLastX = e.clientX;
		camLastY = e.clientY;
		e.preventDefault();
	});
	window.addEventListener(
		'wheel',
		(e) => {
			cameraOffset.distance = THREE.MathUtils.clamp(cameraOffset.distance + e.deltaY * 0.002, cameraOffset.min, cameraOffset.max);
			cameraOffset.height = THREE.MathUtils.clamp(cameraOffset.height + e.deltaY * 0.0015, 1.0, 5.0);
		},
		{ passive: true }
	);
}

function onPointerMove(e) {
	pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
	pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onClick(e, sceneObjs, onSelect) {
	raycaster.setFromCamera(pointer, camera);
	const hits = raycaster.intersectObjects(sceneObjs, true);
	if (hits.length) {
		const hit = hits[0].object;
		if (typeof gsap !== 'undefined') {
			gsap.to(hit.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 0.18, yoyo: true, repeat: 1 });
		}
		const p = new THREE.PointLight(0xffe8ff, 0.8, 3);
		p.position.copy(hit.getWorldPosition(new THREE.Vector3()));
		scene.add(p);
		if (typeof gsap !== 'undefined') {
			gsap.to(p, { intensity: 0, duration: 0.8, onComplete: () => scene.remove(p) });
		}
		if (typeof onSelect === 'function') onSelect(hit);
	}
}

function onWindowResize() {
	if (!camera || !renderer) return;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function syncAvatarState(avatar) {
	const ud = avatar?.userData || {};
	gltfCharacter = ud.gltfCharacter || null;
	gltfCharacterIdle = ud.gltfCharacterIdle || null;
	gltfMixer = ud.gltfMixer || null;
	gltfIdleAction = ud.gltfIdleAction || null;
	useProceduralSwing = ud.useProceduralSwing ?? !ud.gltfCharacter;
	if (avatar) {
		avatar.userData.heading = avatar.userData.heading || 0;
	}
}

function updateGuide(idx, guideLabel, guideCopy) {
	const section = sections[idx] || sections[0];
	if (guideLabel) guideLabel.textContent = section.label;
	if (guideCopy) guideCopy.textContent = section.copy;
}

function updateStory(idx, storyTitleEl, storyBodyEl, storyCtaEl) {
	const section = sections[idx] || sections[0];
	const node = section.story || {};
	if (storyTitleEl) storyTitleEl.textContent = node.title || section.label;
	if (storyBodyEl) storyBodyEl.textContent = node.body || section.copy;
	if (!storyCtaEl) return;
	if (node.cta && node.target !== null && node.target !== undefined) {
		storyCtaEl.textContent = node.cta;
		storyCtaEl.dataset.target = node.target;
		storyCtaEl.disabled = false;
		storyCtaEl.style.display = 'inline-flex';
	} else {
		storyCtaEl.disabled = true;
		storyCtaEl.dataset.target = '';
		storyCtaEl.style.display = 'none';
	}
}

function setActiveNav(idx, navButtons) {
	navButtons.forEach((btn, i) => btn.classList.toggle('active', i === idx));
}

function buildNavQuick(navQuick, navButtons, goTo) {
	if (!navQuick) return;
	navQuick.innerHTML = '';
	navButtons.length = 0;
	sections.forEach((sec, idx) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = sec.label;
		btn.addEventListener('click', () => goTo(idx));
		navQuick.appendChild(btn);
		navButtons.push(btn);
	});
}

function buildTeleport(teleportGrid, teleportTo) {
	if (!teleportGrid) return;
	teleportGrid.innerHTML = '';
	sections.forEach((sec, idx) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = sec.label;
		btn.addEventListener('click', () => teleportTo(idx));
		teleportGrid.appendChild(btn);
	});
}

// Tutorial System
function showTutorial() {
	const tutorialSteps = [
		{
			title: 'Bienvenue au Hall !',
			text: 'Tu peux découvrir les pièces de 3 façons différentes :'
		},
		{
			title: 'Méthode 1 : Les flèches du clavier',
			text: 'Utilise les flèches pour te déplacer et explorer les pièces.'
		},
		{
			title: 'Méthode 2 : Cliquer sur les pièces',
			text: 'Clique directement sur une pièce dans la maison pour la visiter.'
		},
		{
			title: 'Méthode 3 : Le dashboard',
			text: 'Utilise les boutons en bas de l\'écran pour aller directement à une pièce.'
		},
		{
			title: 'Besoin d\'aide ?',
			text: 'Moon est ton assistant - celui qui vole à côté de toi. Clique dessus pour poser des questions sur tes données.'
		}
	];

	let currentStep = 0;

	function createModal() {
		const overlay = document.createElement('div');
		overlay.className = 'tutorial-overlay';
		
		const step = tutorialSteps[currentStep];
		
		const modal = document.createElement('div');
		modal.className = 'tutorial-modal';
		modal.innerHTML = `
			<h2>${step.title}</h2>
			<p>${step.text}</p>
			<div class="tutorial-buttons">
				<button class="tutorial-btn-next" id="tutorialNext">
					${currentStep === tutorialSteps.length - 1 ? 'Commencer !' : 'Suivant'}
				</button>
			</div>
		`;
		
		overlay.appendChild(modal);
		document.body.appendChild(overlay);

		document.getElementById('tutorialNext').addEventListener('click', () => {
			overlay.remove();
			currentStep++;
			if (currentStep < tutorialSteps.length) {
				setTimeout(showStep, 300);
			}
		});
	}

	function showStep() {
		createModal();
	}

	showStep();
}

export async function startExperience(opts = {}) {
	if (started) return;
	started = true;
	const audioEl = opts.audioEl || null;
	let audioDriver = 'none';

	if (!audioEl) {
		createDramaticAudio();
		audioDriver = 'synth';
	} else {
		try {
			await audioEl.play();
			audioDriver = 'element';
		} catch (e) {
			if (!audioCtxNode) createDramaticAudio();
			audioDriver = 'synth';
		}
	}

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xeef8ff, 0.02);
	addEnvironment(scene);
	setupRenderer();
	setupCameraAndControls();

	const hemi = new THREE.HemisphereLight(0xfff6fb, 0xdfefff, 0.7);
	scene.add(hemi);
	const main = new THREE.PointLight(0xdff6ff, 1.2, 20);
	main.position.set(0, 3.6, 0);
	scene.add(main);
	sections.forEach((sec) => {
		const bar = new THREE.PointLight(roomAccent[sec.id] || 0xc8f0ff, 0.5, 7);
		bar.position.set(sec.center.x, 2.5, sec.center.z);
		scene.add(bar);
		const spot = new THREE.SpotLight(roomAccent[sec.id] || 0xc8f0ff, 0.45, 6, Math.PI / 3, 0.4, 1);
		spot.position.set(sec.center.x, 2.8, sec.center.z);
		spot.target.position.set(sec.center.x, 0, sec.center.z);
		scene.add(spot);
		scene.add(spot.target);
	});

	const interactiveObjects = [];
	const house = new THREE.Group();
	createHouseStructure(house, { sections, roomAccent, dataPieces }, interactiveObjects, allowedZones, zones, hoverPlanes);
	scene.add(house);

	const characterSelect = document.getElementById('characterSelect');
	const storedChoice = typeof localStorage !== 'undefined' ? localStorage.getItem('hog.character') : null;
	const initialChoice =
		storedChoice && characterOptions[storedChoice]
			? storedChoice
			: characterSelect && characterOptions[characterSelect.value]
			? characterSelect.value
			: Object.keys(characterOptions)[0];
	if (characterSelect && characterSelect.value !== initialChoice) characterSelect.value = initialChoice;

	let humanoid = await createCharacterAvatar(house, characterOptions[initialChoice], sections[0]?.center?.z || 0);
	syncAvatarState(humanoid);

	async function swapCharacter(choice) {
		const opt = characterOptions[choice] || characterOptions[initialChoice];
		if (typeof localStorage !== 'undefined') localStorage.setItem('hog.character', choice);
		const prevPos = humanoid ? humanoid.position.clone() : new THREE.Vector3();
		const prevHeading = humanoid?.userData.heading || 0;
		if (humanoid && house) house.remove(humanoid);
		gltfMixer = null;
		gltfCharacter = null;
		gltfCharacterIdle = null;
		useProceduralSwing = false;
		const newAvatar = await createCharacterAvatar(house, opt, prevPos.z);
		newAvatar.position.copy(prevPos);
		newAvatar.userData.heading = prevHeading;
		humanoid = newAvatar;
		syncAvatarState(newAvatar);
	}
	if (characterSelect) {
		characterSelect.addEventListener('change', (e) => {
			swapCharacter(e.target.value);
		});
	}

	const particles = createParticles(scene, particleCount);
	particleGeo = particles.particleGeo;
	const moonResult = await addMoon(scene, interactiveObjects);
	moonMixer = moonResult.moonMixer;
	moonMesh = moonResult.moonMesh;
	const glitchEl = addGlitchOverlay();

	const guideLabel = document.getElementById('sectionLabel');
	const guideCopy = document.getElementById('sectionCopy');
	const infoPanel = document.getElementById('infoPanel');
	const infoTitle = document.getElementById('infoTitle');
	const infoIntro = document.getElementById('infoIntro');
	const infoList = document.getElementById('infoList');
	const infoDynamic = document.getElementById('infoDynamic');
	const teleportGrid = document.getElementById('teleportGrid');
	const storyTitleEl = document.getElementById('storyTitle');
	const storyBodyEl = document.getElementById('storyBody');
	const storyCtaEl = document.getElementById('storyCta');
	const hudBar = document.getElementById('hudBar');
	const navQuick = document.getElementById('navQuick');
	const muteToggle = document.getElementById('muteToggle');
	const moonBubble = document.getElementById('moonBubble');
	const moonBubbleClose = document.getElementById('moonBubbleClose');
	const moonChatMessages = document.getElementById('moonChatMessages');
	const moonChatForm = document.getElementById('moonChatForm');
	const moonChatInput = document.getElementById('moonChatInput');
	const moonApiEndpoint = document.body?.dataset?.moonApi ? document.body.dataset.moonApi : '/api/moon';
	const voiceToggleBtn = document.getElementById('voiceToggle');
	const navButtons = [];
	let uiShown = false;

	const panels = createPanels({
		infoPanel,
		infoTitle,
		infoIntro,
		infoList,
		infoDynamic,
		dataPieces,
		defaultInfo,
		roomChoices,
		roomScenarios,
		speakLine,
		gameState
	});

	const chat = initMoonChat({
		moonRepliesDefault,
		moonApiEndpoint,
		moonChatForm,
		moonChatInput,
		moonChatMessages,
		moonBubble,
		moonBubbleClose
	});

	const muteButtons = [voiceToggleBtn, muteToggle];
	muteButtons.forEach((btn) => {
		if (!btn) return;
		btn.addEventListener('click', () => {
			voiceEnabled = !voiceEnabled;
			if (voiceToggleBtn) {
				voiceToggleBtn.textContent = voiceEnabled ? '🔊 Voix ON' : '🔇 Voix OFF';
				voiceToggleBtn.setAttribute('aria-pressed', voiceEnabled ? 'true' : 'false');
			}
			if (muteToggle) {
				muteToggle.textContent = voiceEnabled ? '🔊' : '🔇';
				muteToggle.setAttribute('aria-pressed', voiceEnabled ? 'true' : 'false');
			}
			if (!voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
		});
	});

	function teleportTo(idx) {
		idx = THREE.MathUtils.clamp(idx, 0, sections.length - 1);
		const sec = sections[idx];
		if (sec && sec.center) {
			humanoid.position.set(sec.center.x, humanoid.position.y, sec.center.z);
			humanoid.userData.heading = 0;
			humanoid.rotation.y = 0;
			focusZone(idx);
		}
	}

	function showUIOnce() {
		if (uiShown) return;
		[infoPanel, hudBar].forEach((el) => {
			if (!el) return;
			el.style.opacity = '1';
			el.style.pointerEvents = 'auto';
		});
		uiShown = true;
	}

	function focusZone(idx, opts = {}) {
		idx = THREE.MathUtils.clamp(idx, 0, sections.length - 1);
		const section = sections[idx] || sections[0];
		const changed = idx !== currentSection || opts.force;
		currentSection = idx;
		zoneLabelMesh = attachZoneLabel(section, zones[idx], zoneLabelMesh);
		lastLabelIdx = idx;
		zones.forEach((z, i) => {
			if (z) z.visible = i === idx;
		});
		updateGuide(idx, guideLabel, guideCopy);
		updateStory(idx, storyTitleEl, storyBodyEl, storyCtaEl);
		setActiveNav(idx, navButtons);
		if (!opts.keepInfo || changed) {
			panels.setInfoBySlug(section.slug || null);
			if (section.copy) speakLine(section.copy);
		}
		if (section.fog !== undefined && typeof gsap !== 'undefined') {
			gsap.to(scene.fog, { density: section.fog, duration: 1.2 });
		}
	}

	function goTo(idx) {
		focusZone(idx);
		const section = sections[currentSection] || sections[0];
		resetMovement();
		if (section.center && typeof gsap !== 'undefined') {
			gsap.to(humanoid.position, { x: section.center.x, z: section.center.z, duration: 1.2, ease: 'power2.inOut' });
		} else if (section.center) {
			humanoid.position.set(section.center.x, humanoid.position.y, section.center.z);
		}
	}

	buildTeleport(teleportGrid, teleportTo);
	buildNavQuick(navQuick, navButtons, goTo);
	focusZone(0, { force: true });
	showUIOnce();

	// Show tutorial after UI is ready
	setTimeout(() => {
		showTutorial();
	}, 500);

	if (storyCtaEl) {
		storyCtaEl.addEventListener('click', () => {
			const target = Number(storyCtaEl.dataset.target);
			if (!Number.isNaN(target)) goTo(target);
		});
	}

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('click', (e) =>
		onClick(e, interactiveObjects, (hit) => {
			if (hit && hit.userData) {
				let n = hit;
				let isMoon = false;
				while (n) {
					if (n.userData && n.userData.type === 'moon') {
						isMoon = true;
						break;
					}
					n = n.parent;
				}
				if (isMoon) {
					chat.toggleMoonBubble(true);
					return;
				}
				if (hit.userData.zoneHover !== undefined) {
					goTo(hit.userData.zoneHover);
					return;
				}
				if (hit.userData.slug) {
					panels.setInfoBySlug(hit.userData.slug);
					const piece = dataPieces.find((p) => p.slug === hit.userData.slug);
					if (piece && piece.intro) speakLine(piece.intro);
				}
			}
		})
	);
	window.addEventListener('keydown', (e) => {
		if (isTypingTarget(e.target)) return;
		if (e.code === 'Space') {
			e.preventDefault();
			tryJump();
			return;
		}
		handleMoveKey(e, true);
	});
	window.addEventListener('keyup', (e) => {
		if (isTypingTarget(e.target)) return;
		if (e.code === 'Space') {
			e.preventDefault();
			return;
		}
		handleMoveKey(e, false);
	});

	camera.lookAt(lookTarget);
	clock = new THREE.Clock();
	function animate() {
		const dt = clock.getDelta();
		const t = clock.getElapsedTime();
		if (gltfMixer) gltfMixer.update(dt);
		if (moonMixer) moonMixer.update(dt);

		camYaw += (camYawTarget - camYaw) * 0.18;
		camPitch += (camPitchTarget - camPitch) * 0.18;

		const inputX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
		const inputZ = (moveState.forward ? 1 : 0) - (moveState.back ? 1 : 0);
		tmpForward.subVectors(lookTarget, camera.position);
		tmpForward.y = 0;
		tmpForward.normalize();
		tmpRight.crossVectors(tmpForward, new THREE.Vector3(0, 1, 0)).normalize();
		heroDirection.copy(tmpForward).multiplyScalar(inputZ).add(tmpRight.clone().multiplyScalar(inputX));

		let moving = false;
		if (heroDirection.lengthSq() > 0) {
			heroDirection.normalize().multiplyScalar(moveSpeeds.walk);
			moving = true;
		} else {
			heroDirection.set(0, 0, 0);
		}
		heroVelocity.lerp(heroDirection, 0.2);
		heroStep.copy(heroVelocity).multiplyScalar(dt);

		const nextPos = new THREE.Vector3(
			THREE.MathUtils.clamp(humanoid.position.x + heroStep.x, heroBounds.minX, heroBounds.maxX),
			humanoid.position.y,
			THREE.MathUtils.clamp(humanoid.position.z + heroStep.z, heroBounds.minZ, heroBounds.maxZ)
		);

		let allowed = false;
		for (const zone of allowedZones) {
			if (nextPos.x >= zone.minX && nextPos.x <= zone.maxX && nextPos.z >= zone.minZ && nextPos.z <= zone.maxZ) {
				allowed = true;
				break;
			}
		}
		if (!allowed) {
			if (
				nextPos.x >= heroBounds.minX &&
				nextPos.x <= heroBounds.maxX &&
				nextPos.z >= heroBounds.minZ &&
				nextPos.z <= heroBounds.maxZ
			) {
				allowed = true;
			}
		}

		let bounce = 0;
		if (allowed) {
			humanoid.position.copy(nextPos);
			if (moving) {
				if (gltfCharacter && gltfCharacterIdle) {
					gltfCharacter.visible = true;
					gltfCharacterIdle.visible = false;
				}
				const heading = Math.atan2(heroVelocity.x, heroVelocity.z);
				const currentHeading = humanoid.userData.heading || 0;
				const nextHeading = THREE.MathUtils.lerp(currentHeading, heading, 0.25);
				humanoid.userData.heading = nextHeading;
				humanoid.rotation.y = nextHeading;
				bounce = 0.008 * Math.sin(t * 8);
				if (!gltfCharacter || useProceduralSwing) {
					const speed = heroVelocity.length();
					const legAmp = Math.min(0.6, 0.2 + speed * 0.2);
					if (humanoid.userData.legs) {
						humanoid.userData.legs.forEach((leg, i) => {
							leg.rotation.x = Math.sin(t * 8 + i * Math.PI) * legAmp;
						});
					}
				}
			} else {
				if (gltfCharacter && gltfCharacterIdle) {
					gltfCharacter.visible = false;
					gltfCharacterIdle.visible = true;
				}
				if (!gltfCharacter || useProceduralSwing) {
					if (humanoid.userData.legs) humanoid.userData.legs.forEach((l) => (l.rotation.x = 0));
				}
				heroVelocity.lerp(zeroVec, 0.1);
			}
		} else {
			heroVelocity.multiplyScalar(0.6);
		}
		lastBounce = bounce;

		heroYVel += gravity * dt;
		heroY += heroYVel * dt;
		if (heroY <= 0) {
			heroY = 0;
			heroYVel = 0;
			jumpActive = false;
		}
		const visualY = heroY + (!jumpActive ? lastBounce : 0);
		humanoid.position.y = visualY;

		const zoneIdx = sections.findIndex((sec) => {
			if (!sec.bounds) return false;
			return (
				humanoid.position.x >= sec.bounds.minX &&
				humanoid.position.x <= sec.bounds.maxX &&
				humanoid.position.z >= sec.bounds.minZ &&
				humanoid.position.z <= sec.bounds.maxZ
			);
		});
		if (zoneIdx !== -1 && zoneIdx !== currentSection) {
			focusZone(zoneIdx);
		} else if (zoneIdx === -1 && currentSection !== -1) {
			currentSection = -1;
		}

		desiredLook.set(humanoid.position.x, humanoid.position.y + 1.2, humanoid.position.z);
		lookTarget.lerp(desiredLook, 0.15);

		if (moonMesh) {
			moonTarget.copy(humanoid.position).add(moonFollowOffset);
			moonMesh.position.lerp(moonTarget, 0.1);
			moonMesh.lookAt(humanoid.position.x, humanoid.position.y + 1.4, humanoid.position.z);
		}

		const camTarget = new THREE.Vector3(humanoid.position.x, humanoid.position.y + 0.2, humanoid.position.z);
		const backVecPitch = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch)).multiplyScalar(
			cameraOffset.distance
		);
		const camPos = camTarget.clone().add(backVecPitch);
		camPos.y += cameraOffset.height;
		camera.position.lerp(camPos, cameraOffset.lag);
		camera.lookAt(camTarget);

		raycaster.setFromCamera(pointer, camera);
		const hits = raycaster.intersectObjects(interactiveObjects, true);
		hoveredZoneIdx = null;
		interactiveObjects.forEach((o) => {
			if (hits.length && hits[0].object === o) {
				if (typeof gsap !== 'undefined') gsap.to(o.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.18 });
			} else if (typeof gsap !== 'undefined') {
				gsap.to(o.scale, { x: 1, y: 1, z: 1, duration: 0.6 });
			}
		});
		if (hits.length) {
			const hoverHit = hits.find((h) => h.object && h.object.userData && h.object.userData.zoneHover !== undefined);
			if (hoverHit) hoveredZoneIdx = hoverHit.object.userData.zoneHover;
		}
		const desiredLabelIdx = hoveredZoneIdx !== null ? hoveredZoneIdx : currentSection !== -1 ? currentSection : null;
		if (desiredLabelIdx !== null && desiredLabelIdx !== lastLabelIdx && zones[desiredLabelIdx]) {
			zoneLabelMesh = attachZoneLabel(sections[desiredLabelIdx], zones[desiredLabelIdx], zoneLabelMesh);
			lastLabelIdx = desiredLabelIdx;
		}
		zones.forEach((z, i) => {
			if (!z) return;
			const shouldShow = (currentSection !== -1 && i === currentSection) || hoveredZoneIdx === i;
			z.visible = shouldShow;
		});
		if (particleGeo) {
			const arr = particleGeo.attributes.position.array;
			for (let i = 0; i < particleCount; i++) {
				const idx = i * 3 + 1;
				arr[idx] += Math.sin(t * 0.4 + i) * 0.0008;
				if (arr[idx] < 0.1) arr[idx] = 0.9 + Math.random() * 2.4;
			}
			particleGeo.attributes.position.needsUpdate = true;
		}
		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}
	animate();
	window.addEventListener('resize', onWindowResize, { passive: true });
}

export default { startExperience };
