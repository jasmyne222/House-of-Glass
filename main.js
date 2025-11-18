// The House of Glass — main.js
// Expose startExperience() which initializes the Three.js scene and audio
// only after a user gesture (Enter button). Import Three.js from CDN.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fallback replies shared with backend; we fetch the JSON version when available.
const moonRepliesDefault = {
	entries: [
		{
			triggers: ["qui es", "toi", "assistant"],
			response: "Je suis le guide de la Maison : je réponds avec les règles de l'expérience."
		},
		{
			triggers: ["social", "réseau", "story", "post", "like", "dm"],
			response: "Les signaux sociaux (likes, stories, DMs) servent à prédire humeur, opinions et influence. Réduis la géoloc et segmente tes audiences."
		},
		{
			triggers: ["achat", "panier", "commerce", "abonnement", "prix"],
			response: "Les paniers et abonnements calculent ton pouvoir d'achat et tes routines. Varie les moyens de paiement et purge l'historique d'achat."
		},
		{
			triggers: ["trajet", "gps", "locali", "déplacement"],
			response: "Quelques jours de GPS suffisent pour trouver domicile et lieux sensibles. Coupe la géoloc en tâche de fond et sépare profils pro/perso."
		},
		{
			triggers: ["santé", "sommeil", "humeur", "sensibl", "coeur", "spo2"],
			response: "Les données santé/sommeil sont sensibles : vérifie les permissions, désactive le partage tiers et conserve un export chiffré seulement si besoin."
		},
		{
			triggers: ["rgpd", "droit", "contrôle", "export", "effacement", "suppression"],
			response: "Tes leviers : accès/portabilité pour récupérer, rectification pour corriger, effacement pour supprimer, opposition pour bloquer la pub ciblée."
		},
		{
			triggers: ["navig", "visiter", "guide"],
			response: "Utilise la téléportation pour changer de pièce, ou marche avec ZQSD/flèches. Clique sur les panneaux pour déclencher les interactions."
		}
	],
	default: "Parle-moi de réseaux, achats, trajets, santé/sensibles ou contrôle et je te répondrai."
};
let moonReplies = moonRepliesDefault;
fetch('./moonReplies.json').then(r => r.ok ? r.json() : null).then(json => {
	if (json && json.entries) { moonReplies = json; }
}).catch(()=>{ /* reste sur la version embarquée */ });

// The House of Glass — interactive infographic core
// Exports: startExperience(opts) and speakLine(text)

let started = false;
let renderer, scene, camera, clock;
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let particleGeo, particleCount = 160;
const sections = [
	{
		id: 'hall',
		label: "Hall d'entrée",
		copy: "Traverse le hall d'entrée et choisis ta prochaine pièce à explorer.",
		slug: null,
		center: { x: 0, z: 0 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Hall d'entrée",
			body: "C'est ici que la Maison de Verre s'ouvre. Observe les reflets et choisis une pièce.",
			cta: "Entrer dans le salon des réseaux",
			target: 1
		}
	},
	{
		id: 'social',
		label: "Salon des Réseaux",
		copy: "Publier, liker, scroller : observe comment tes interactions dessinent ton double social.",
		slug: 'social',
		center: { x: -4.4, z: 0 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Salon des Réseaux",
			body: "Choisis 3 posts fictifs à publier et vois la fiche de profil marketing qui en résulte.",
			cta: "Passer à la cuisine des achats",
			target: 2
		}
	},
	{
		id: 'commerce',
		label: "Cuisine des Achats",
		copy: "Chaque panier ou abonnement révèle ton pouvoir d'achat, tes routines et tes priorités.",
		slug: 'commerce',
		center: { x: 4.4, z: 0 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Cuisine des Achats",
			body: "Compose un panier fictif et observe comment il se transforme en score socio-éco.",
			cta: "Explorer le couloir des déplacements",
			target: 3
		}
	},
	{
		id: 'mobility',
		label: "Couloir des Déplacements",
		copy: "Géolocalisations, trajets et check-ins cartographient ton territoire intime.",
		slug: 'mobility',
		center: { x: -4.4, z: -4.4 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Couloir des Déplacements",
			body: "Trace un trajet et vois ce qu'il révèle (domicile, habitudes, réseau).",
			cta: "Entrer dans la chambre des données sensibles",
			target: 4
		}
	},
	{
		id: 'sensibles',
		label: "Chambre des Données sensibles",
		copy: "Santé, humeur, messages privés : la loi les protège, mais ils circulent encore.",
		slug: 'sensibles',
		center: { x: 4.4, z: -4.4 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Chambre des Données sensibles",
			body: "Active/désactive les permissions (santé, sommeil, messages) et regarde ce que l'IA déduit.",
			cta: "Aller au bureau de contrôle",
			target: 5
		}
	},
	{
		id: 'control',
		label: "Bureau de contrôle",
		copy: "Synthèse : combine tes pièces et décide ce que tu veux garder, effacer, corriger.",
		slug: 'control',
		center: { x: 0, z: -4.4 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Bureau de contrôle",
			body: "Regarde ton profil marketing se stabiliser. Tu peux couper les sources ou exporter des actions concrètes.",
			cta: null,
			target: null
		}
	}
];
let currentSection = 0;
let audioCtxNode = null; // if we create WebAudio fallback
const moveState = { forward:false, back:false, left:false, right:false };
const heroBounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
const allowedZones = [];
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
let useProceduralSwing = false; // true if no GLTF animation available
let cameraOffset = { distance: 7, height: 3.5, lag: 0.12, min: 3, max: 12 };
const moveSpeeds = { walk: 3.0 };
let camYaw = -Math.PI/3.5;
let camYawTarget = 0;
let camDrag = false;
let camLastX = 0;
let camLastY = 0;
let camPitch = -0.05;
let camPitchTarget = -0.05;
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const zones = [];
const hoverPlanes = [];
let hoveredZoneIdx = null;
let lastLabelIdx = null;
let zoneLabelMesh = null;
let voiceEnabled = false;
let moonMixer = null;
let moonMesh = null;
const moonFollowOffset = new THREE.Vector3(0.8, 1.8, -1.2);
const moonTarget = new THREE.Vector3();
// Character presets (per-model overrides)
const characterOptions = {
	loup: {
		label: 'Loup',
		walk: './assets/loup.glb',
		idle: './assets/loup_statique.glb',
		scaleMultiplier: 1,
		walkLift: -0.9,
		idleLift: 0.02,
		idleRotationX: Math.PI / 2,
		meshYaw: 0
	},
	cameraman: {
		label: 'Cameraman',
		walk: './assets/cameraman_walking.glb',
		idle: './assets/cameraman_walking_statique.glb',
		scaleMultiplier: 2.2,   // bigger than loup
		walkLift: -0.6,          // lift animated mesh higher
		idleLift: 0.05,          // lift static mesh
		meshYaw: Math.PI // face forward instead of backwards
	}
};
const defaultCharacterId = 'cameraman';

const socialPosts = [
	{ label: "Story festival & amis", inference: "Profil culture + sociable", note: "Ciblage sorties nocturnes et partenariats événementiels." },
	{ label: "Thread coup de gueule politique", inference: "Positionnement engagé", note: "Peut déclencher du contenu polarisé ou du microciblage militant." },
	{ label: "VLOG routine sport + smoothies", inference: "Style de vie healthy premium", note: "Associe ta data à des marques fitness et compléments." },
	{ label: "Mèmes sur la procrastination", inference: "Catégorie 'étudiant stressé'", note: "Propension à consommer des apps de productivité payantes." },
	{ label: "Haul vêtements éthiques", inference: "Purchase intent mode responsable", note: "Proposition de cartes bancaires vertes et néobanques." }
];

const commerceItems = [
	{ label: "Panier bio + livraison de paniers", insight: "Budget alimentation supérieur à la moyenne, appétence pour abonnements durables." },
	{ label: "Abonnement gaming + achats in-app", insight: "Profil gamer intensif, propension à accepter des offres de crédit rapide." },
	{ label: "Billets low-cost + hôtels week-end", insight: "Voyageur fréquent, ciblage assurance annulation + cartes multi-devises." },
	{ label: "Box beauté clean + parapharmacie", insight: "Soins haut de gamme, intérêt pour produits santé personnalisés." },
	{ label: "Commandes fast-food tardives", insight: "Rythme irrégulier, push de livraison express et offres nocturnes." }
];

const mobilityRoutes = [
	{ route: "Domicile → coworking → salle de sport → bar", deductions: ["Horaires 8h-22h", "Réseau social urbain", "Ciblage transports multimodes"] },
	{ route: "Campus → stage → bibliothèque", deductions: ["Statut étudiant·e", "Temps passé en zone académique", "Ciblage bourses et banques jeunes"] },
	{ route: "Maison → école → supermarché → maison", deductions: ["Probable parent", "Crénaux 7h30/16h30", "Ciblage assurances famille"] }
];

const sensitivePermissions = [
	{ label: "Suivi du sommeil (8h)", impact: "Indice de fatigue et productivité transmis aux partenaires bien-être." },
	{ label: "Journal humeur quotidien", impact: "Profil émotionnel exploitable pour scoring de stabilité." },
	{ label: "Historique messageries chiffrées", impact: "Métadonnées révélant relations intimes malgré chiffrement du contenu." },
	{ label: "Capteurs santé (coeur, SPO2)", impact: "Peut influencer primes assurance ou prêts santé." }
];

const controlActions = [
	{ action: "Télécharger tes données", impact: "Tu récupères un export complet pour vérifier ce qui circule." },
	{ action: "Activer l'authentification forte", impact: "Réduit les reprises de comptes et les doubles connexions suspectes." },
	{ action: "Programmer des rappels de nettoyage", impact: "Tous les 90 jours tu purges recherches, historiques et paniers." },
	{ action: "Segmenter tes identités (pseudo/email)", impact: "Évite la corrélation automatique entre achats, loisirs et santé." }
];

function alignMeshToGround(mesh, lift = 0){
	// Align a mesh so its lowest point sits on y=0, with an optional lift (can be negative).
	mesh.updateWorldMatrix(true, true);
	const box = new THREE.Box3().setFromObject(mesh);
	const minY = box.min.y;
	mesh.position.y = mesh.position.y - minY + lift;
}

const roomAccent = {
	hall: 0xbee9ff,
	social: 0xffbfe9,
	commerce: 0xfff1bf,
	mobility: 0xbfe7ff,
	sensibles: 0xdcc7ff,
	control: 0xcaf7d7
};

const dataPieces = [
	{
		slug: "social",
		title: "Salon des Réseaux",
		intro: "Stories, likes et temps de visionnage dressent ton profil social en continu.",
		insights: [
			"Les signaux faibles (emojis, rythme de scroll) révèlent humeur et opinions.",
			"La fréquence des échanges cartographie ton influence et tes cercles proches."
		],
		color: "#ffb3ec"
	},
	{
		slug: "commerce",
		title: "Cuisine des Achats",
		intro: "Chaque panier et abonnement laisse une empreinte économique.",
		insights: [
			"Les achats récurrents nourrissent un score socio-éco repris par la pub.",
			"Horaires et lieux de livraison révèlent tes contraintes quotidiennes."
		],
		color: "#ffd68f"
	},
	{
		slug: "mobility",
		title: "Couloir des Déplacements",
		intro: "Les traces GPS, trajets et bornes Wi-Fi dessinent ton territoire intime.",
		insights: [
			"Quelques jours de positions suffisent pour trouver domicile et lieux sensibles.",
			"Les horaires de trajets déduisent mode de vie (solo, coloc, famille)."
		],
		color: "#aee6ff"
	},
	{
		slug: "sensibles",
		title: "Chambre des Confidences",
		intro: "Santé, sommeil et journaling sont des données sensibles protégées.",
		insights: [
			"Le croisement humeur + achats + sommeil sert aux scores d'appétence ou d'assurance.",
			"Une fuite impacte réputation, assurance ou employabilité."
		],
		color: "#d0c5ff"
	},
	{
		slug: "control",
		title: "Bureau de Contrôle",
		intro: "Dernière étape : décider ce que tu coupes, exportes ou corriges.",
		insights: [
			"Droits RGPD : accès, rectification, portabilité et effacement.",
			"Désactive pubs ciblées, nettoie historiques et vérifie permissions."
		],
		color: "#f1ffb5"
	}
];

const roomChoices = {
	social: [
		{ label: "Publier stories géolocalisées", result: ["Profil social actif", "Ciblage lieu de vie + sorties"] },
		{ label: "Relayer un débat", result: ["Profil engagé", "Micro-ciblage politique/causes"] }
	],
	commerce: [
		{ label: "Panier bio + box beauté", result: ["Score socio-éco élevé", "Reco cosmétiques clean"] },
		{ label: "Gaming + fast-food tardif", result: ["Profil gamer nocturne", "Offres express/abonnements"] }
	],
	mobility: [
		{ label: "Domicile ↔ bureau ↔ salle", result: ["Routine 8h-22h", "Ciblage transports/mobilité douce"] },
		{ label: "Campus ↔ bibliothèque", result: ["Profil étudiant", "Banques jeunes/bourses"] }
	],
	sensibles: [
		{ label: "Activer sommeil + humeur", result: ["Profil émotionnel fin", "Risque fuite data sensible (assurances)"] },
		{ label: "Capteurs santé", result: ["Score bien-être", "Partage potentiel vers tiers"] }
	],
	control: [
		{ label: "Exporter mes données", result: ["Export complet", "Tu vérifies ce qui circule"] },
		{ label: "Couper pubs personnalisées", result: ["Ciblage générique", "Moins de profilage"] }
	]
};

const roomActions = {
	social: {
		label: "Générer la fiche sociale",
		handler: () => {
			return {
				title: "Lecture sociale",
				lines: [
					"Profil social actif + influence estimée.",
					"Publicités : sorties, événements, cercles proches."
				]
			};
		}
	},
	commerce: {
		label: "Analyser le panier",
		handler: () => {
			return {
				title: "Lecture achats",
				lines: [
					"Score socio-éco mis à jour.",
					"Tactiques : fidélité, cross-sell, rétention."
				]
			};
		}
	},
	mobility: {
		label: "Lire le trajet",
		handler: () => {
			return {
				title: "Lecture déplacements",
				lines: ["Routine géo détectée.", "Ciblage transports + lieux de vie."]
			};
		}
	},
	sensibles: {
		label: "Scanner les données sensibles",
		handler: () => {
			return {
				title: "Impact données sensibles",
				lines: [
					"Score bien-être/risque mis à jour.",
					"Attention : assurances et réputation impactées."
				]
			};
		}
	},
	control: {
		label: "Proposer une action",
		handler: () => {
			return {
				title: "Action rapide",
				lines: ["Exporter ou corriger tes données.", "Nettoyer historiques + pubs ciblées."]
			};
		}
	}
};

const defaultInfo = {
	title: "Choisis une trace",
	intro: "Clique sur une capsule de verre pour matérialiser ce que tu révèles.",
	insights: [
		"Chaque pièce correspond à une famille de données personnelles.",
		"Utilise la molette ou la navigation pour visiter toute la maison de verre."
	]
};

const keyBindings = {
	ArrowUp: "forward",
	ArrowDown: "back",
	ArrowLeft: "left",
	ArrowRight: "right"
};

function handleMoveKey(e, isDown){
	const dir = keyBindings[e.code];
	if (!dir) return;
	if (e.repeat) return;
	moveState[dir] = isDown;
	if (e.code.startsWith("Arrow")) e.preventDefault();
}

function resetMovement(){
	Object.keys(moveState).forEach(k => moveState[k] = false);
	heroVelocity.set(0,0,0);
}

export function speakLine(text, voice = null) {
	if (!voiceEnabled || !window.speechSynthesis) return; // optional
	const utter = new SpeechSynthesisUtterance(text);
	utter.rate = 0.9;
	utter.volume = 0.9;
	utter.pitch = 1.0;
	if (voice) utter.voice = voice;
	window.speechSynthesis.speak(utter);
}

function createDramaticAudio() {
	// layered pad using WebAudio as fallback if <audio> not provided
	const ctx = new (window.AudioContext || window.webkitAudioContext)();
	const g = ctx.createGain(); g.gain.value = 0.0; g.connect(ctx.destination);
	const freqs = [65, 92, 150];
	const oscillators = freqs.map(f => {
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.value = f;
		return osc;
	});
	const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
	const lfoGain = ctx.createGain(); lfoGain.gain.value = 15;
	const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900;
	lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
	oscillators.forEach(osc => osc.connect(filter));
	filter.connect(g);
	oscillators.forEach(osc => osc.start());
	lfo.start();

	audioCtxNode = { ctx, oscillators, lfo, gain: g };
	g.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);
}

function stopDramaticAudio(){
	if (!audioCtxNode) return;
	const { ctx, oscillators, lfo, gain } = audioCtxNode;
	gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.0);
	setTimeout(()=>{ try{ oscillators.forEach(o=>o.stop()); lfo.stop(); ctx.close(); }catch(e){} }, 1200);
	audioCtxNode=null;
}

function makeCanvasTexture(text, opts = {}){
	const w = opts.w||512, h = opts.h||256; const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,w,h);
	// background translucent
	ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.02)'; ctx.fillRect(0,0,w,h);
	ctx.fillStyle = opts.color || '#e2f9ff'; ctx.font = `${opts.fontSize||36}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text, w/2, h/2);
	const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true; return tex;
}

function makeTiledTexture(opts = {}){
	// Dark purple ground matching the scene background (sans motifs)
	const size = opts.size || 512;
	const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
	const ctx = canvas.getContext('2d');

	// Base radial gradient (deep violet)
	const grd = ctx.createRadialGradient(size*0.5, size*0.5, size*0.05, size*0.5, size*0.5, size*0.9);
	grd.addColorStop(0, '#140c18');
	grd.addColorStop(1, '#0b0610');
	ctx.fillStyle = grd;
	ctx.fillRect(0,0,size,size);

	const tex = new THREE.CanvasTexture(canvas);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(opts.repeatU || 1, opts.repeatV || 1);
	tex.needsUpdate = true;
	return tex;
}

function createHouseStructure(group, interactiveCollector = []){
	const base = new THREE.MeshPhysicalMaterial({ transmission: 0.6, transparent:true, opacity:0.9, roughness:0.15, ior:1.45, clearcoat:0.35 });
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ color:0x24162d, roughness:0.3, metalness:0.35 }));
	floor.rotation.x = -Math.PI/2;
	floor.position.z = -2;
	group.add(floor);

	sections.forEach((section, idx) => {
		const zone = new THREE.Group();
		zone.position.set(section.center.x, 0, section.center.z);
		const w = section.size.w;
		const h = section.size.h;
		section.bounds = {
			minX: section.center.x - w/2,
			maxX: section.center.x + w/2,
			minZ: section.center.z - h/2,
			maxZ: section.center.z + h/2
		};
		allowedZones.push(section.bounds);

	const padColor = roomAccent[section.id] || 0xffffff;
		const pad = new THREE.Mesh(new THREE.PlaneGeometry(w-0.4, h-0.4), new THREE.MeshBasicMaterial({ color: padColor, transparent:true, opacity:0.35 }));
		pad.rotation.x = -Math.PI/2;
		pad.position.set(0,0.01,0);
		zone.add(pad);

		const doorHeight = 2.2;
		const doorWidth = 1.3;
	// Open-plan layout: no per-wall glass panels/doors

		if (section.slug){
			addHotspotsForSection(section, zone, interactiveCollector);
		}else if (section.id === 'hall'){
			addHallInstallations(zone);
		}else if (section.id === 'control'){
			addControlDesk(zone);
		}
		addRoomProps(section, zone);
		group.add(zone);
		zones[idx] = zone;

		// Hover plane (independant de la visibilité de la zone)
		const hoverPlane = new THREE.Mesh(
			new THREE.PlaneGeometry(w-0.2, h-0.2),
			new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.0, depthWrite:false })
		);
		hoverPlane.rotation.x = -Math.PI/2;
		hoverPlane.position.set(section.center.x, 0.05, section.center.z);
		hoverPlane.userData = { zoneHover: idx };
		group.add(hoverPlane);
		hoverPlanes[idx] = hoverPlane;
		interactiveCollector.push(hoverPlane);
	});

	// corridors / portes entre pièces pour navigation fluide
	const connectors = [
		['hall','social'], ['hall','commerce'], ['hall','control'],
		['hall','mobility'], ['hall','sensibles'],
		['social','mobility'], ['commerce','sensibles'], ['control','mobility'], ['control','sensibles']
	];
	connectors.forEach(pair => {
		const a = sections.find(s=>s.id===pair[0]);
		const b = sections.find(s=>s.id===pair[1]);
		if (!a || !b) return;
		// rectangle entre les centres
		const cx = (a.center.x + b.center.x)/2;
		const cz = (a.center.z + b.center.z)/2;
		const w = Math.abs(a.center.x - b.center.x) > 0.1 ? 1.6 : Math.max(a.size.w, b.size.w) * 0.28;
		const h = Math.abs(a.center.z - b.center.z) > 0.1 ? 1.6 : Math.max(a.size.h, b.size.h) * 0.28;
		allowedZones.push({
			minX: cx - w/2,
			maxX: cx + w/2,
			minZ: cz - h/2,
			maxZ: cz + h/2
		});
	});
}

function attachZoneLabel(section, zone){
	if (!section || !zone) return;
	if (!zoneLabelMesh){
		const labelTex = makeCanvasTexture(section.label.toUpperCase(), { fontSize: 28, color: '#ffffff' });
		const labelMat = new THREE.MeshPhysicalMaterial({ map: labelTex, transparent:true, opacity:0.9, transmission:0.4, side: THREE.FrontSide });
		labelMat.map.encoding = THREE.sRGBEncoding;
		zoneLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), labelMat);
		zoneLabelMesh.name = 'zoneLabel';
	}
	const newTex = makeCanvasTexture(section.label.toUpperCase(), { fontSize: 28, color: '#ffffff' });
	newTex.encoding = THREE.sRGBEncoding;
	if (zoneLabelMesh.material.map) zoneLabelMesh.material.map.dispose();
	zoneLabelMesh.material.map = newTex;
	zoneLabelMesh.material.needsUpdate = true;
	zoneLabelMesh.position.set(0, 1.6, 0);
	zoneLabelMesh.rotation.set(0, 0, 0);
	if (zoneLabelMesh.parent) zoneLabelMesh.parent.remove(zoneLabelMesh);
	zone.add(zoneLabelMesh);
}

function addHallInstallations(zone){
	const words = ['TRACE','PIRATAGE','PHISHING','CYBER','EMPREINTE','NUMERIQUE'];
	for (let i =0; i<6; i++){
		const tex = makeCanvasTexture(words[i], { fontSize: 48, color: '#cfefff' });
		const mat = new THREE.MeshPhysicalMaterial({ map: tex, transmission:0.5, transparent:true, opacity:0.8 });
		mat.map.encoding = THREE.sRGBEncoding;
		const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.0), mat);
		plane.position.set(i%2? -1.6:1.6, 1.4, -1.5 - i*0.6);
		plane.rotation.y = i%2? 0.25 : -0.25;
		zone.add(plane);
	}
}

function addControlDesk(zone){
	const base = new THREE.MeshPhysicalMaterial({ color:0xf7f9ff, transmission:0.6, transparent:true, opacity:0.9 });
	const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 1.2), base);
	desk.position.set(0, 0.4, 0);
	zone.add(desk);
	const holo = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.8), new THREE.MeshStandardMaterial({ color:0x9fe8ff, emissive:0x7fd8ff, transparent:true, opacity:0.8 }));
	holo.position.set(0, 0.9, 0);
	zone.add(holo);
	const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,0.65,24), new THREE.MeshPhysicalMaterial({ color:0xeef9ff, transmission:0.5, transparent:true }));
	chair.position.set(0,0.35,0.85);
	zone.add(chair);
}

function addHotspotsForSection(section, zone, interactiveCollector){
	const piece = dataPieces.find(p => p.slug === section.slug);
	if (!piece) return;
	// Hide textual label (avoid duplicate banners); keep panel for interaction hitbox
	const tex = makeCanvasTexture(' ', { fontSize: 1, color: 'rgba(0,0,0,0)', bg: 'rgba(0,0,0,0)' });
	const mat = new THREE.MeshPhysicalMaterial({ map: tex, transparent:true, opacity:0.01, transmission:0.0, side:THREE.DoubleSide });
	mat.map.encoding = THREE.sRGBEncoding;
	const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), mat);
	panel.position.set(0, 1.45, -0.2);
	panel.userData = { slug: piece.slug };
	zone.add(panel);
	interactiveCollector.push(panel);

}

function addRoomProps(){
	// Decorative 3D props removed for cleaner, open rooms.
}

function createHumanoid(){
	const g = new THREE.Group();
	const skinMat = new THREE.MeshPhysicalMaterial({
		color: 0xff7abf,
		emissive: 0xff92d0,
		emissiveIntensity: 0.08,
		transmission: 0.4,
		transparent: true,
		roughness: 0.25
	});
	const fabricMat = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		roughness: 0.9,
		transmission: 0,
		metalness: 0
	});
	const fluffMat = new THREE.MeshStandardMaterial({
		color: 0xfff2df,
		roughness: 0.95,
		metalness: 0.05
	});

	const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22,0.7,8,16), skinMat);
	torso.position.y = 1.05;
	g.add(torso);

	const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.18,32), fabricMat);
	top.position.set(0, 1.33, 0);
	g.add(top);

	const midriff = new THREE.Mesh(new THREE.TorusGeometry(0.33,0.04,16,48,Math.PI), fabricMat);
	midriff.rotation.x = Math.PI/2;
	midriff.position.set(0,1.22,0);
	g.add(midriff);

		const head = new THREE.Mesh(new THREE.SphereGeometry(0.3,32,32), skinMat);
	head.position.y = 1.8;
	g.add(head);

	const earGeo = new THREE.CapsuleGeometry(0.08,0.45,6,12);
	const earLeft = new THREE.Mesh(earGeo, skinMat);
	earLeft.rotation.x = Math.PI/16;
	earLeft.position.set(0.15,2.2,0);
	g.add(earLeft);
	const earRight = earLeft.clone();
	earRight.position.x = -0.15;
	g.add(earRight);

	const hornGeo = new THREE.ConeGeometry(0.05,0.2,16);
	const horn1 = new THREE.Mesh(hornGeo, skinMat);
	horn1.position.set(0.08,2.05,0.06);
	g.add(horn1);
	const horn2 = horn1.clone();
	horn2.position.x = -0.08;
	g.add(horn2);

	const hairRing = new THREE.Mesh(new THREE.TorusGeometry(0.4,0.12,24,60), fluffMat);
	hairRing.position.set(0,1.85,0);
	hairRing.rotation.x = Math.PI/2.4;
	g.add(hairRing);
	const hairRing2 = hairRing.clone();
	hairRing2.scale.set(0.8,0.8,0.8);
	hairRing2.position.y = 1.95;
	g.add(hairRing2);

	const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.32,24,24,0,Math.PI*2,0,Math.PI/1.2), fluffMat);
	hairBack.position.set(0,1.8,-0.15);
	g.add(hairBack);

	const armGeo = new THREE.CylinderGeometry(0.05,0.045,0.8,16);
	const armL = new THREE.Mesh(armGeo, skinMat);
	armL.position.set(-0.35,1.05,0);
	armL.rotation.z = Math.PI/7;
	g.add(armL);
	const armR = armL.clone();
	armR.position.x = 0.35;
	armR.rotation.z = -Math.PI/7;
	g.add(armR);

	const glove = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.16,16), fabricMat);
	glove.position.set(-0.35,0.72,0);
	g.add(glove);
	const gloveR = glove.clone();
	gloveR.position.x = 0.35;
	g.add(gloveR);

	const legGeo = new THREE.CylinderGeometry(0.07,0.06,1.0,18);
	const legL = new THREE.Mesh(legGeo, fabricMat);
	legL.position.set(-0.14,0.1,0);
	g.add(legL);
	const legR = legL.clone();
	legR.position.x = 0.14;
	g.add(legR);

	const thighBand = new THREE.Mesh(new THREE.TorusGeometry(0.15,0.02,16,32), fabricMat);
	thighBand.rotation.x = Math.PI/2;
	thighBand.position.set(-0.15,0.72,0);
	g.add(thighBand);
	const thighBandR = thighBand.clone();
	thighBandR.position.x = 0.15;
	g.add(thighBandR);

	const bootMat = new THREE.MeshStandardMaterial({ color:0xffefcc, roughness:0.95, metalness:0.05 });
	const bootGeo = new THREE.BoxGeometry(0.32,0.3,0.5);
	const bootL = new THREE.Mesh(bootGeo, bootMat);
	bootL.position.set(-0.15,-0.3,0.1);
	g.add(bootL);
	const bootR = bootL.clone();
	bootR.position.x = 0.15;
	g.add(bootR);

	g.userData.legs = [legL, legR];
	g.userData.arms = [armL, armR];

	return g;
}

async function createCharacterAvatar(parent, characterOpt = characterOptions[defaultCharacterId]){
	const loader = new GLTFLoader();
	const modelURL = characterOpt?.walk || characterOptions[defaultCharacterId].walk;
	const idleModelURL = characterOpt?.idle || characterOptions[defaultCharacterId].idle;
	let avatar = null;
	try{
		const [gltf, gltfIdle] = await Promise.all([
			loader.loadAsync(modelURL),
			loader.loadAsync(idleModelURL).catch(()=>null)
		]);

		// root container to ease switching between animated & idle meshes
		const avatarRoot = new THREE.Group();
		avatarRoot.position.set(0,0,sections[0].center ? sections[0].center.z : 0);
		parent.add(avatarRoot);

		gltfCharacter = gltf.scene;
		gltfCharacter.traverse((child) => {
			if (child.isMesh){
				child.castShadow = false;
				child.receiveShadow = false;
				if (child.material) child.material.transparent = true;
			}
		});
		const box = new THREE.Box3().setFromObject(gltfCharacter);
		const size = new THREE.Vector3();
		box.getSize(size);
		const scaleBase = 2.1 / Math.max(size.x, size.y, size.z);
		const scaleMult = characterOpt?.scaleMultiplier || 1.0;
		const finalScale = scaleBase * scaleMult;
		gltfCharacter.scale.setScalar(finalScale);
		gltfCharacter.rotation.y = characterOpt?.meshYaw || 0;
		// Recenter vertically so the feet sit on the ground
		gltfCharacter.position.set(0, 0, 0);
		const walkLift = (characterOpt && typeof characterOpt.walkLift === 'number') ? characterOpt.walkLift : -0.1;
		alignMeshToGround(gltfCharacter, walkLift);
		avatarRoot.add(gltfCharacter);

		// optional static idle mesh (e.g. T-pose fix) reuses same scale & offset
		if (gltfIdle && gltfIdle.scene){
			gltfCharacterIdle = gltfIdle.scene;
			gltfCharacterIdle.traverse((child) => {
				if (child.isMesh){
					child.castShadow = false;
					child.receiveShadow = false;
					if (child.material) child.material.transparent = true;
				}
			});
			gltfCharacterIdle.scale.setScalar(finalScale);
			// Many static exports come in Z-up; rotate to stand upright (override per model)
			gltfCharacterIdle.rotation.x = (characterOpt && typeof characterOpt.idleRotationX === 'number') ? characterOpt.idleRotationX : Math.PI / 2;
			gltfCharacterIdle.rotation.y = characterOpt?.meshYaw || 0;
			gltfCharacterIdle.position.set(0, 0, 0);
			const idleLift = (characterOpt && typeof characterOpt.idleLift === 'number') ? characterOpt.idleLift : 0.02;
			alignMeshToGround(gltfCharacterIdle, idleLift);
			gltfCharacterIdle.visible = false; // start hidden until idle
			avatarRoot.add(gltfCharacterIdle);
		}

		if (gltf.animations && gltf.animations.length){
			gltfMixer = new THREE.AnimationMixer(gltfCharacter);
			gltfIdleAction = gltfMixer.clipAction(gltf.animations[0]);
			gltfIdleAction.play();
			useProceduralSwing = false;
		}else{
			// pas d'animation : on appliquera un swing procédural
			useProceduralSwing = true;
		}
		avatar = avatarRoot;
	}catch(err){
		console.warn('GLTF model not found or failed to load, using procedural avatar.', err);
		avatar = createHumanoid();
		avatar.position.set(0,0,sections[0].center ? sections[0].center.z : 0);
		parent.add(avatar);
	}
	avatar.userData.heading = 0;
	return avatar;
}

function createParticles(scene){
	particleGeo = new THREE.BufferGeometry();
	const arr = new Float32Array(particleCount*3);
	for (let i=0;i<particleCount;i++){ const r = 0.8 + Math.random()*4.0; const theta = Math.random()*Math.PI*2; arr[i*3] = Math.cos(theta)*r; arr[i*3+1] = 0.5 + Math.random()*2.4; arr[i*3+2] = Math.sin(theta)*r; }
	particleGeo.setAttribute('position', new THREE.BufferAttribute(arr,3));
	const mat = new THREE.PointsMaterial({ color:0xcff6ff, size:0.035, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending });
	const pts = new THREE.Points(particleGeo, mat); scene.add(pts);
}

async function addMoon(scene, interactiveCollector = []){
	const loader = new GLTFLoader();
	try{
		const gltf = await loader.loadAsync('./assets/moon.glb');
		const moon = gltf.scene;
		moonMesh = moon;
		moon.traverse((c)=>{ 
			if (c.isMesh){ c.castShadow = false; c.receiveShadow = false; }
			c.userData.type = 'moon';
		});
		moon.userData.type = 'moon';
		moon.scale.setScalar(15); // back to previous size
		moon.position.set(0, 2.4, -2);
		moon.rotation.y = Math.PI / 30;
		scene.add(moon);
		moon.userData = { type:'moon' };
		interactiveCollector.push(moon);

		// play moon animation if available
		if (gltf.animations && gltf.animations.length){
			moonMixer = new THREE.AnimationMixer(moon);
			const action = moonMixer.clipAction(gltf.animations[0]);
			action.clampWhenFinished = true;
			action.play();
		}
		scene.add(moon);
	}catch(err){
		console.warn('Moon GLB missing or failed to load:', err);
	}
}

function addGlitchOverlay(){
	const div = document.createElement('div'); div.className='glitch'; div.style.pointerEvents='none'; div.style.mixBlendMode='overlay'; document.body.appendChild(div);
	return div;
}

function addEnvironment(scene){
	// gradient skydome teinté néon
	const skyGeo = new THREE.SphereGeometry(80, 32, 32);
	const skyMat = new THREE.ShaderMaterial({
		side: THREE.BackSide,
		uniforms: {
			topColor: { value: new THREE.Color(0x1b1230) },
			bottomColor: { value: new THREE.Color(0x2c143d) },
			offset: { value: 10 },
			exponent: { value: 1.2 }
		},
		vertexShader: `
			varying vec3 vWorldPosition;
			void main() {
				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		`,
		fragmentShader: `
			uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;
			varying vec3 vWorldPosition;
			void main() {
				float h = normalize( vWorldPosition + offset ).y;
				float mixVal = max( pow( max(h, 0.0), exponent ), 0.0 );
				vec3 col = mix( bottomColor, topColor, mixVal );
				gl_FragColor = vec4( col, 1.0 );
			}
		`
	});
	const sky = new THREE.Mesh(skyGeo, skyMat);
	scene.add(sky);

	// Ground matches the deep purple background (flat, sans fog ni éclairage)
	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry(200, 200),
		new THREE.MeshBasicMaterial({ color: '#120b1d', fog: false })
	);
	ground.rotation.x = -Math.PI/2;
	ground.position.y = -0.02;
	scene.add(ground);
}

function setupRenderer(){
	renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true }); renderer.setPixelRatio(window.devicePixelRatio); renderer.setSize(window.innerWidth, window.innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.domElement.style.position='fixed'; renderer.domElement.style.inset='0'; document.body.appendChild(renderer.domElement);
}

// Third-person follow camera (no orbit)
function setupCameraAndControls(){
	camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
	camera.position.set(0, cameraOffset.height, cameraOffset.distance);
	renderer.domElement.addEventListener('contextmenu', (e)=> e.preventDefault());
	renderer.domElement.addEventListener('pointerdown', (e)=> {
		// clic gauche ou droit pour orienter la caméra
		if (e.button === 0 || e.button === 2){ camDrag = true; camLastX = e.clientX; camLastY = e.clientY; }
	});
	window.addEventListener('pointerup', ()=>{ camDrag = false; });
	window.addEventListener('pointermove', (e)=> {
		if (!camDrag) return;
		const dx = e.clientX - camLastX;
		const dy = e.clientY - camLastY;
		camYawTarget -= dx * 0.01;
		// Clamp vertical pitch so camera cannot flip vertically
		camPitchTarget = THREE.MathUtils.clamp(camPitchTarget - dy * 0.005, -0.3, 0.25);
		camLastX = e.clientX;
		camLastY = e.clientY;
		e.preventDefault();
	});
	window.addEventListener('wheel', (e)=> {
		cameraOffset.distance = THREE.MathUtils.clamp(cameraOffset.distance + e.deltaY*0.002, cameraOffset.min, cameraOffset.max);
		cameraOffset.height = THREE.MathUtils.clamp(cameraOffset.height + e.deltaY*0.0015, 1.0, 5.0);
	}, { passive: true });
}

function onPointerMove(e){ pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = - (e.clientY / window.innerHeight) * 2 + 1; }

function onClick(e, sceneObjs, onSelect){
	raycaster.setFromCamera(pointer, camera);
	const hits = raycaster.intersectObjects(sceneObjs, true);
	if (hits.length){ const hit = hits[0].object;
		gsap.to(hit.scale, { x:1.12, y:1.12, z:1.12, duration:0.18, yoyo:true, repeat:1 });
		const p = new THREE.PointLight(0xffe8ff, 0.8, 3); p.position.copy(hit.getWorldPosition(new THREE.Vector3())); scene.add(p); gsap.to(p, { intensity:0, duration:0.8, onComplete: ()=> scene.remove(p) });
		if (typeof onSelect === 'function') onSelect(hit);
	}
}

function onWindowResize(){ if (!camera || !renderer) return; camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

export async function startExperience(opts = {}){
	if (started) return; started = true;
	const audioEl = opts.audioEl || null;
	let audioDriver = 'none';
	if (!audioEl){
		createDramaticAudio();
		audioDriver = 'synth';
	}
	else {
		try{
			await audioEl.play();
			audioDriver = 'element';
		}catch(e){
			if (!audioCtxNode) createDramaticAudio();
			audioDriver = 'synth';
		}
	}

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xeef8ff, 0.02);
	addEnvironment(scene);
	setupRenderer();
	setupCameraAndControls();

	const hemi = new THREE.HemisphereLight(0xfff6fb, 0xdfefff, 0.7); scene.add(hemi);
	const main = new THREE.PointLight(0xdff6ff, 1.2, 20); main.position.set(0,3.6,0); scene.add(main);
		sections.forEach(sec => {
			const bar = new THREE.PointLight(roomAccent[sec.id] || 0xc8f0ff, 0.5, 7);
			bar.position.set(sec.center.x, 2.5, sec.center.z);
			scene.add(bar);
			const spot = new THREE.SpotLight(roomAccent[sec.id] || 0xc8f0ff, 0.45, 6, Math.PI/3, 0.4, 1);
			spot.position.set(sec.center.x, 2.8, sec.center.z);
			spot.target.position.set(sec.center.x, 0, sec.center.z);
			scene.add(spot);
			scene.add(spot.target);
		});

	const interactiveObjects = [];
	const house = new THREE.Group(); createHouseStructure(house, interactiveObjects); scene.add(house);

	const characterSelect = document.getElementById('characterSelect');
	const storedChoice = (typeof localStorage !== 'undefined') ? localStorage.getItem('hog.character') : null;
	const initialChoice = (storedChoice && characterOptions[storedChoice]) ? storedChoice : (characterSelect && characterOptions[characterSelect.value] ? characterSelect.value : defaultCharacterId);
	if (characterSelect && characterSelect.value !== initialChoice) characterSelect.value = initialChoice;

	let humanoid = await createCharacterAvatar(house, characterOptions[initialChoice]);

	async function swapCharacter(choice){
		const opt = characterOptions[choice] || characterOptions[defaultCharacterId];
		if (typeof localStorage !== 'undefined') localStorage.setItem('hog.character', choice);
		const prevPos = humanoid ? humanoid.position.clone() : new THREE.Vector3();
		const prevHeading = humanoid?.userData.heading || 0;
		if (humanoid && house) house.remove(humanoid);
		// reset GLTF state
		gltfMixer = null;
		gltfCharacter = null;
		gltfCharacterIdle = null;
		useProceduralSwing = false;
		const newAvatar = await createCharacterAvatar(house, opt);
		newAvatar.position.copy(prevPos);
		newAvatar.userData.heading = prevHeading;
		humanoid = newAvatar;
	}
	if (characterSelect){
		characterSelect.addEventListener('change', (e)=> {
			swapCharacter(e.target.value);
		});
	}

	createParticles(scene);
	addMoon(scene, interactiveObjects);
	const glitchEl = addGlitchOverlay();

	const guideLabel = document.getElementById('sectionLabel');
	const guideCopy = document.getElementById('sectionCopy');
	const infoPanel = document.getElementById('infoPanel');
	const infoTitle = document.getElementById('infoTitle');
	const infoIntro = document.getElementById('infoIntro');
	const infoList = document.getElementById('infoList');
	const infoDynamic = document.getElementById('infoDynamic');
	const primaryActionBtn = document.getElementById('primaryAction');
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
	const moonApiEndpoint = (document.body && document.body.dataset && document.body.dataset.moonApi) ? document.body.dataset.moonApi : '/api/moon';
	let moonChatTypingNode = null;
	const navButtons = [];
	let uiShown = false;
	let currentChoices = [];
	let moonBubbleVisible = false;

	function toggleMoonBubble(show){
		if (!moonBubble) return;
		moonBubbleVisible = (show !== undefined) ? show : !moonBubbleVisible;
		if (moonBubbleVisible){
			moonBubble.classList.add('visible');
			if (moonChatInput){ setTimeout(() => moonChatInput.focus(), 50); }
		}else{
			moonBubble.classList.remove('visible');
		}
	}
	if (moonBubbleClose){
		moonBubbleClose.addEventListener('click', ()=> toggleMoonBubble(false));
	}

	function setInfoBySlug(slug = null){
		if (!infoTitle || !infoIntro || !infoList || !infoPanel) return;
		const piece = dataPieces.find(item => item.slug === slug) || defaultInfo;
		infoTitle.textContent = piece.title;
		infoIntro.textContent = piece.intro;
		infoList.innerHTML = '';
		(piece.insights || []).forEach(text => {
			const li = document.createElement('li');
			li.textContent = text;
			infoList.appendChild(li);
		});
		clearDynamicInfo();
		updateActionButton(slug);
		renderChoices(slug);
		if (!slug && infoDynamic){
			infoDynamic.innerHTML = '<p>Déplace-toi dans une pièce pour voir ses interactions.</p>';
		}
		if (infoPanel){
			infoPanel.classList.toggle('info-panel--active', Boolean(slug));
		}
	}

	function clearDynamicInfo(blankOnly = false){
		if (infoDynamic) infoDynamic.innerHTML = blankOnly ? '' : '<p>Active une interaction dans cette pièce pour voir un exemple.</p>';
		currentChoices = [];
	}

	function renderDynamicResult(result){
		if (!infoDynamic) return;
		if (!result){
			clearDynamicInfo();
			return;
		}
		const { title, lines = [] } = result;
		infoDynamic.innerHTML = '';
		if (title){
			const h = document.createElement('h3');
			h.textContent = title;
			infoDynamic.appendChild(h);
		}
		lines.forEach(line => {
			const p = document.createElement('p');
			p.textContent = line;
			infoDynamic.appendChild(p);
		});
	}

	function renderChoices(slug){
		if (!infoDynamic) return;
		const choices = roomChoices[slug];
		currentChoices = choices || [];
		if (!choices){ clearDynamicInfo(); return; }
		infoDynamic.innerHTML = '';
		const wrap = document.createElement('div');
		wrap.style.display = 'flex';
		wrap.style.flexDirection = 'column';
		wrap.style.gap = '6px';
		choices.forEach((c, idx) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.textContent = c.label;
			btn.style.padding = '8px 10px';
			btn.style.borderRadius = '10px';
			btn.style.border = '1px solid rgba(255,255,255,0.2)';
			btn.style.background = 'rgba(255,255,255,0.05)';
			btn.style.color = '#f4fbff';
			btn.style.cursor = 'pointer';
			btn.addEventListener('click', ()=> {
				renderDynamicResult({ title: 'Résultat', lines: c.result });
				speakLine(c.result.join('. '));
			});
			wrap.appendChild(btn);
		});
		infoDynamic.appendChild(wrap);
	}

function updateActionButton(slug){
	if (!primaryActionBtn) return;
	const action = roomActions[slug];
	if (action){
		primaryActionBtn.disabled = false;
		primaryActionBtn.textContent = action.label;
		primaryActionBtn.style.display = '';
	}else{
		primaryActionBtn.disabled = true;
		primaryActionBtn.textContent = 'Interagir';
		primaryActionBtn.style.display = 'none';
	}
}

	function updateGuide(idx){
		const section = sections[idx] || sections[0];
		if (guideLabel) guideLabel.textContent = section.label;
		if (guideCopy) guideCopy.textContent = section.copy;
	}

	function updateStory(idx){
		const section = sections[idx] || sections[0];
		const node = section.story || {};
		if (storyTitleEl) storyTitleEl.textContent = node.title || section.label;
		if (storyBodyEl) storyBodyEl.textContent = node.body || section.copy;
		if (!storyCtaEl) return;
		if (node.cta && node.target !== null && node.target !== undefined){
			storyCtaEl.textContent = node.cta;
			storyCtaEl.dataset.target = node.target;
			storyCtaEl.disabled = false;
			storyCtaEl.style.display = 'inline-flex';
		}else{
			storyCtaEl.disabled = true;
			storyCtaEl.dataset.target = '';
			storyCtaEl.style.display = 'none';
		}
	}

	function setActiveNav(idx){
		navButtons.forEach((btn, i) => btn.classList.toggle('active', i === idx));
	}

	function buildNavQuick(){
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

	function buildTeleport(){
		if (!teleportGrid) return;
		teleportGrid.innerHTML = '';
		sections.forEach((sec, idx) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.textContent = sec.label;
			btn.addEventListener('click', () => {
				teleportTo(idx);
			});
			teleportGrid.appendChild(btn);
		});
	}

	function teleportTo(idx){
		idx = THREE.MathUtils.clamp(idx, 0, sections.length-1);
		const sec = sections[idx];
		if (sec && sec.center){
			humanoid.position.set(sec.center.x, humanoid.position.y, sec.center.z);
			humanoid.userData.heading = 0;
			humanoid.rotation.y = 0;
			focusZone(idx);
		}
	}

	function showUIOnce(){
		if (uiShown) return;
		const voiceToggle = document.getElementById('voiceToggle');
		[infoPanel, hudBar].forEach(el=>{
			if (!el) return;
			el.style.opacity = '1';
			el.style.pointerEvents = 'auto';
		});
		uiShown = true;
	}

	buildTeleport();
	buildNavQuick();
	focusZone(0, { force: true });
	showUIOnce();

	if (storyCtaEl){
		storyCtaEl.addEventListener('click', () => {
			const target = Number(storyCtaEl.dataset.target);
			if (!Number.isNaN(target)) goTo(target);
		});
	}
	if (primaryActionBtn){
		primaryActionBtn.addEventListener('click', () => {
			const section = sections[currentSection] || sections[0];
			if (!section || !section.slug) return;
			const action = roomActions[section.slug];
			if (action && typeof action.handler === 'function'){
				const result = action.handler();
				renderDynamicResult(result);
				if (result && result.lines) speakLine(result.lines.join('. '));
			}
		});
	}
	const voiceToggleBtn = document.getElementById('voiceToggle');
	if (voiceToggleBtn){
		voiceToggleBtn.addEventListener('click', ()=>{
			voiceEnabled = !voiceEnabled;
			voiceToggleBtn.textContent = voiceEnabled ? '🔊 Voix ON' : '🔇 Voix OFF';
			voiceToggleBtn.setAttribute('aria-pressed', voiceEnabled ? 'true' : 'false');
			if (!voiceEnabled && window.speechSynthesis){ window.speechSynthesis.cancel(); }
		});
	}
	if (muteToggle){
		muteToggle.addEventListener('click', ()=>{
			voiceEnabled = !voiceEnabled;
			muteToggle.textContent = voiceEnabled ? '🔊' : '🔇';
			muteToggle.setAttribute('aria-pressed', voiceEnabled ? 'true' : 'false');
			if (!voiceEnabled && window.speechSynthesis){ window.speechSynthesis.cancel(); }
		});
	}
	function addMoonMessage(sender, text){
		if (!moonChatMessages) return;
		const div = document.createElement('div');
		div.className = 'moon-chat__message' + (sender === 'user' ? ' moon-chat__message--user' : '');
		div.textContent = text;
		moonChatMessages.appendChild(div);
		moonChatMessages.scrollTop = moonChatMessages.scrollHeight;
	}
	function setMoonTyping(isTyping){
		if (!moonChatMessages) return;
		if (isTyping){
			if (!moonChatTypingNode){
				const div = document.createElement('div');
				div.className = 'moon-chat__message';
				div.textContent = '…';
				moonChatTypingNode = div;
				moonChatMessages.appendChild(div);
			}
		}else if (moonChatTypingNode){
			moonChatMessages.removeChild(moonChatTypingNode);
			moonChatTypingNode = null;
		}
	}
	function generateMoonReply(question = ''){
		const q = (question || '').toLowerCase();
		if (!moonReplies || !moonReplies.entries) return moonReplies?.default || moonRepliesDefault.default;
		for (const entry of moonReplies.entries){
			if (!entry || !entry.triggers || !entry.response) continue;
			for (const trig of entry.triggers){
				if (q.includes(trig.toLowerCase())) return entry.response;
			}
		}
		return moonReplies.default || moonRepliesDefault.default;
	}
	async function askMoon(question){
		// If no endpoint is provided (or set to "local"), stay fully offline.
		const endpoint = moonApiEndpoint || null;
		if (!endpoint || endpoint === 'local'){
			return generateMoonReply(question);
		}
		try{
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question })
			});
			const payload = await res.json().catch(()=> ({}));
			// Even on non-OK responses, prefer any provided "answer" to keep UX smooth.
			if (payload && payload.answer){ return payload.answer; }
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			throw new Error('No answer');
		}catch(err){
			console.warn('Moon API fallback (réponse locale):', err?.message || err);
			// On échec, reste silencieux côté utilisateur et répond en local.
			return generateMoonReply(question);
		}
	}

	if (moonChatForm){
		moonChatForm.addEventListener('submit', async (e)=>{
			e.preventDefault();
			if (!moonChatInput) return;
			const text = moonChatInput.value.trim();
			if (!text) return;
			addMoonMessage('user', text);
			moonChatInput.value = '';
			setMoonTyping(true);
			const reply = await askMoon(text);
			setMoonTyping(false);
			addMoonMessage('assistant', reply);
		});
	}

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('click', (e)=> onClick(e, interactiveObjects, (hit)=> {
		if (hit && hit.userData){
			// climb parents to detect moon
			let n = hit;
			let isMoon = false;
			while (n){
				if (n.userData && n.userData.type === 'moon'){ isMoon = true; break; }
				n = n.parent;
			}
			if (isMoon){ toggleMoonBubble(true); return; }
			// click sur une zone = téléportation
			if (hit.userData.zoneHover !== undefined){
				goTo(hit.userData.zoneHover);
				return;
			}
			if (hit.userData.slug){
				setInfoBySlug(hit.userData.slug);
				const piece = dataPieces.find(p=>p.slug===hit.userData.slug);
				if (piece && piece.intro) speakLine(piece.intro);
			}
		}
	}));
	window.addEventListener('keydown', (e)=> handleMoveKey(e, true));
	window.addEventListener('keyup', (e)=> handleMoveKey(e, false));

	function focusZone(idx, opts = {}){
		idx = THREE.MathUtils.clamp(idx, 0, sections.length-1);
		const section = sections[idx] || sections[0];
		const changed = idx !== currentSection || opts.force;
		currentSection = idx;
		attachZoneLabel(section, zones[idx]);
		lastLabelIdx = idx;
		// isoler la pièce (visibilité)
		zones.forEach((z, i)=>{ if (z) z.visible = (i === idx); });
		updateGuide(idx);
		updateStory(idx);
		setActiveNav(idx);
		if (!opts.keepInfo || changed){
			setInfoBySlug(section.slug || null);
			if (section.copy) speakLine(section.copy);
		}
		if (section.fog !== undefined){
			gsap.to(scene.fog, { density: section.fog, duration: 1.2 });
		}
	}

	function goTo(idx){
		focusZone(idx);
		const section = sections[currentSection] || sections[0];
		resetMovement();
		if (section.center){
			gsap.to(humanoid.position, { x: section.center.x, z: section.center.z, duration:1.2, ease:'power2.inOut' });
		}
	}

	camera.lookAt(lookTarget);
	clock = new THREE.Clock();
	function animate(){ const dt = clock.getDelta(); const t = clock.getElapsedTime();
		if (gltfMixer) gltfMixer.update(dt);
		if (moonMixer) moonMixer.update(dt);

		camYaw += (camYawTarget - camYaw) * 0.18;
		camPitch += (camPitchTarget - camPitch) * 0.18;

		const inputX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
		const inputZ = (moveState.forward ? 1 : 0) - (moveState.back ? 1 : 0);
		// mouvement relatif à la caméra
		// direction depuis la caméra vers le personnage pour éviter l'inversion
		tmpForward.subVectors(lookTarget, camera.position);
		tmpForward.y = 0; tmpForward.normalize();
		tmpRight.crossVectors(tmpForward, new THREE.Vector3(0,1,0)).normalize();
		heroDirection.copy(tmpForward).multiplyScalar(inputZ).add(tmpRight.clone().multiplyScalar(inputX));

		let moving = false;
		if (heroDirection.lengthSq() > 0){
			heroDirection.normalize().multiplyScalar(moveSpeeds.walk);
			moving = true;
		} else {
			heroDirection.set(0,0,0);
		}
		heroVelocity.lerp(heroDirection, 0.2);
	heroStep.copy(heroVelocity).multiplyScalar(dt);

	const nextPos = new THREE.Vector3(
		THREE.MathUtils.clamp(humanoid.position.x + heroStep.x, heroBounds.minX, heroBounds.maxX),
		humanoid.position.y,
			THREE.MathUtils.clamp(humanoid.position.z + heroStep.z, heroBounds.minZ, heroBounds.maxZ)
		);

		let allowed = false;
		for (const zone of allowedZones){
			if (nextPos.x >= zone.minX && nextPos.x <= zone.maxX &&
				nextPos.z >= zone.minZ && nextPos.z <= zone.maxZ){
					allowed = true; break;
				}
		}
		if (!allowed){
			// fallback global showroom bounds
			if (nextPos.x >= heroBounds.minX && nextPos.x <= heroBounds.maxX &&
				nextPos.z >= heroBounds.minZ && nextPos.z <= heroBounds.maxZ){
				allowed = true;
			}
		}

		if (allowed){
			humanoid.position.copy(nextPos);
			if (moving){
				if (gltfCharacter && gltfCharacterIdle){
					gltfCharacter.visible = true;
					gltfCharacterIdle.visible = false;
				}
				const heading = Math.atan2(heroVelocity.x, heroVelocity.z);
				const currentHeading = humanoid.userData.heading || 0;
				const nextHeading = THREE.MathUtils.lerp(currentHeading, heading, 0.25);
				humanoid.userData.heading = nextHeading;
				humanoid.rotation.y = nextHeading;
				// léger bounce corps
				const bounce = 0.008 * Math.sin(t * 8);
				humanoid.position.y = bounce;
				// swing des jambes uniquement si pas d'animation GLTF
				if (!gltfCharacter || useProceduralSwing){
					const speed = heroVelocity.length();
					const legAmp = Math.min(0.6, 0.2 + speed * 0.2);
					if (humanoid.userData.legs){
						humanoid.userData.legs.forEach((leg, i)=>{
							leg.rotation.x = Math.sin(t*8 + i*Math.PI) * legAmp;
						});
					}
				}
			} else {
				if (gltfCharacter && gltfCharacterIdle){
					gltfCharacter.visible = false;
					gltfCharacterIdle.visible = true;
				}
				humanoid.position.y = 0;
				if (!gltfCharacter || useProceduralSwing){
					if (humanoid.userData.legs){ humanoid.userData.legs.forEach(l=> l.rotation.x = 0); }
				}
				heroVelocity.lerp(zeroVec, 0.1);
			}
		} else {
			heroVelocity.multiplyScalar(0.6);
		}

		const zoneIdx = sections.findIndex((sec) => {
			if (!sec.bounds) return false;
			return humanoid.position.x >= sec.bounds.minX && humanoid.position.x <= sec.bounds.maxX &&
				humanoid.position.z >= sec.bounds.minZ && humanoid.position.z <= sec.bounds.maxZ;
		});
		if (zoneIdx !== -1 && zoneIdx !== currentSection){
			focusZone(zoneIdx);
		}

		desiredLook.set(humanoid.position.x, humanoid.position.y + 1.2, humanoid.position.z);
		lookTarget.lerp(desiredLook, 0.15);

		// Moon follows the avatar as a small companion
		if (moonMesh){
			moonTarget.copy(humanoid.position).add(moonFollowOffset);
			moonMesh.position.lerp(moonTarget, 0.1);
			moonMesh.lookAt(humanoid.position.x, humanoid.position.y + 1.4, humanoid.position.z);
		}

		const camTarget = new THREE.Vector3(
			humanoid.position.x,
			humanoid.position.y + 0.2,
			humanoid.position.z
		);
		const backVecPitch = new THREE.Vector3(
			Math.sin(camYaw) * Math.cos(camPitch),
			Math.sin(camPitch),
			Math.cos(camYaw) * Math.cos(camPitch)
		).multiplyScalar(cameraOffset.distance);
		const camPos = camTarget.clone().add(backVecPitch);
		camPos.y += cameraOffset.height;
		camera.position.lerp(camPos, cameraOffset.lag);
		camera.lookAt(camTarget);

		raycaster.setFromCamera(pointer, camera);
		const hits = raycaster.intersectObjects(interactiveObjects, true);
		hoveredZoneIdx = null;
		interactiveObjects.forEach(o=>{ if (hits.length && hits[0].object===o){ gsap.to(o.scale, { x:1.08, y:1.08, z:1.08, duration:0.18 }); } else { gsap.to(o.scale, { x:1, y:1, z:1, duration:0.6 }); } });
		if (hits.length){
			const hoverHit = hits.find(h => h.object && h.object.userData && h.object.userData.zoneHover !== undefined);
			if (hoverHit) hoveredZoneIdx = hoverHit.object.userData.zoneHover;
		}
		const desiredLabelIdx = (hoveredZoneIdx !== null) ? hoveredZoneIdx : currentSection;
		if (desiredLabelIdx !== lastLabelIdx && zones[desiredLabelIdx]){
			attachZoneLabel(sections[desiredLabelIdx], zones[desiredLabelIdx]);
			lastLabelIdx = desiredLabelIdx;
		}
		zones.forEach((z, i)=> {
			if (!z) return;
			const shouldShow = (i === currentSection) || (hoveredZoneIdx === i);
			z.visible = shouldShow;
		});
		if (particleGeo){ const arr = particleGeo.attributes.position.array; for (let i=0;i<particleCount;i++){ const idx=i*3+1; arr[idx] += Math.sin(t*0.4 + i)*0.0008; if (arr[idx] < 0.1) arr[idx] = 0.9 + Math.random()*2.4; } particleGeo.attributes.position.needsUpdate = true; }
		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}
	animate();
	window.addEventListener('resize', onWindowResize, { passive:true });
}

export default { startExperience };
