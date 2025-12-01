// Content and configuration for the House of Glass experience.

export const moonRepliesDefault = {
	entries: [
		{
			triggers: ["qui es", "toi", "assistant"],
			response: "Je suis Moon, ton guide dans la Maison de Verre. Je t'aide à comprendre comment tes traces numériques se combinent pour dresser un profil de toi, et comment te protéger."
		},
		{
			triggers: ["achat", "panier", "commerce", "abonnement", "prix", "dynamic pricing"],
			response: "Le Dynamic Pricing utilise ton profil (appareil, historique d'achats, comportement) pour ajuster les prix. Si tu achètes en urgence ou sur MacBook, tu paies 15-30% plus cher. Protection : efface régulièrement tes cookies, utilise le mode privé, varie tes appareils et moyens de paiement."
		},
		{
			triggers: ["géoloc", "localisation", "gps", "strava", "trajet"],
			response: "Quelques jours de GPS suffisent pour retrouver ton domicile et tes lieux sensibles. C'est admissible au tribunal du travail. Protection : désactive la géolocalisation en arrière-plan, revois les permissions des apps, utilise des profils séparés (pro/perso)."
		},
		{
			triggers: ["pub", "publicité", "tracking", "traceur", "annonce"],
			response: "Tes recherches privées (grossesse, santé, IST) sont révélées par les pubs ciblées en temps réel. Protection : utilise Swisscows ou DuckDuckGo, limite les pubs ciblées dans Google/Meta, installe uBlock Origin ou Privacy Badger."
		},
		{
			triggers: ["social", "réseau", "réseaux", "algorithm", "radicali", "feed"],
			response: "L'algorithme amplifie le contenu inquiétant (peur, colère, conspiracy) parce que c'est plus rentable. Tu peux te radicaliser sans t'en rendre compte. Protection : désactive l'historique de navigation, diversifie tes sources (presse, podcasts, livres), prends des digital detox."
		},
		{
			triggers: ["réputation", "archives", "passé", "embauch", "candidature"],
			response: "Ton passé numérique te suit à jamais (archives web, Google Images). Un recruteur voit une vieille photo et tu n'es jamais appelée. Protection : demande ton droit d'accès RGPD (edoeb.admin.ch), teste haveibeenpwned.com, demande le déréférençage aux archives."
		},
		{
			triggers: ["rgpd", "droit", "accès", "effacement", "contrôle"],
			response: "Tes leviers RGPD : accès/portabilité (récupère tes données), rectification (corrige-les), effacement (supprime-les), opposition (bloque les pubs ciblées). Tu as aussi le droit de demander une copie et de connaître ce qui circule."
		},
		{
			triggers: ["protection", "se protéger", "conseil", "action"],
			response: "Les protections concrètes : limiter les traces (cookies, historique), utiliser des outils privés (Swisscows, navigateurs sécurisés), revoir tes permissions et paramètres, exercer tes droits RGPD. Chaque pièce propose des actions spécifiques."
		},
		{
			triggers: ["navig", "visiter", "guide", "déplacement", "bouton"],
			response: "Utilise la téléportation pour sauter entre pièces, ou marche avec ZQSD/flèches. Clique sur les panneaux pour voir les scénarios. Chaque pièce raconte une histoire vraie et propose des protections."
		}
	],
	default: "Pose-moi une question sur les achats, la géolocalisation, la publicité ciblée, les réseaux, ton passé numérique, tes droits RGPD, ou comment te protéger. Je t'aide à comprendre."
};

export const sections = [
	{
		id: 'hall',
		label: "Hall d'entrée",
		copy: "Cette maison en verre représente ta vie numérique. Avance et choisis la première pièce à explorer.",
		slug: null,
		center: { x: 0, z: 0 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Hall d'entrée",
			body: "Bienvenue dans la House of Glass. Chaque pièce correspond à une famille de données (réseaux, achats, déplacements, données sensibles, contrôle). À toi d'explorer et de voir ce qu'on peut déduire de toi.",
			cta: "Entrer dans la cuisine des achats",
			target: 1
		}
	},
	{
		id: 'social',
		label: "Cuisine des Achats",
		copy: "Tes achats en ligne et ton profil permettent aux algorithmes de te cibler avec des prix différents selon ta willingness-to-pay estimée.",
		slug: 'social',
		center: { x: -4.4, z: 0 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Cuisine des Achats",
			body: "Découvre comment le Dynamic Pricing fonctionne : même produit, prix différents selon qui tu es.",
			cta: "Passer à la chambre des données sensibles",
			target: 2
		}
	},
	{
		id: 'commerce',
		label: "Chambre des Données sensibles",
		copy: "Ta géolocalisation et tes traces numériques publiques peuvent être utilisées pour prouver un mensonge, même au tribunal du travail.",
		slug: 'commerce',
		center: { x: 4.4, z: 0 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Chambre des Données sensibles",
			body: "Explore comment GPS et traces numériques peuvent te trahir au travail.",
			cta: "Aller au couloir des traces",
			target: 3
		}
	},
	{
		id: 'mobility',
		label: "Couloir des Traces",
		copy: "Tes recherches privées sont observées par les algorithmes publicitaires, et le secret est révélé sans que tu le saches.",
		slug: 'mobility',
		center: { x: -4.4, z: -4.4 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Couloir des Traces",
			body: "Découvre comment tes secrets sont révélés par les annonces ciblées.",
			cta: "Entrer dans le salon des réseaux",
			target: 4
		}
	},
	{
		id: 'sensibles',
		label: "Salon des Réseaux",
		copy: "Cliquer une fois sur du contenu anxiogène suffit pour déclencher une cascade d'algorithmes qui te radicalisent progressivement.",
		slug: 'sensibles',
		center: { x: 4.4, z: -4.4 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Salon des Réseaux",
			body: "Explore comment la radicalisation algorithmique fonctionne sans que tu t'en rendes compte.",
			cta: "Aller au grenier des souvenirs",
			target: 5
		}
	},
	{
		id: 'control',
		label: "Grenier des Souvenirs",
		copy: "Ton passé numérique te suit à jamais. Les archives web et les images conservées ferment des portes sans que tu le saches.",
		slug: 'control',
		center: { x: 0, z: -4.4 },
		size: { w: 4.6, h: 4.6 },
		story: {
			title: "Grenier des Souvenirs",
			body: "Découvre comment ton passé numérique détermine ton futur.",
			cta: null,
			target: null
		}
	}
];

export const characterOptions = {
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
		scaleMultiplier: 2.2,
		walkLift: -0.6,
		idleLift: 0.05,
		meshYaw: Math.PI
	}
};

export const roomAccent = {
	hall: 0xbee9ff,
	social: 0xffbfe9,
	commerce: 0xfff1bf,
	mobility: 0xbfe7ff,
	sensibles: 0xdcc7ff,
	control: 0xcaf7d7
};

export const dataPieces = [
	{
		slug: "social",
		title: "Cuisine des Achats",
		intro: "Tes achats en ligne et ton profil permettent aux algorithmes de te cibler avec des prix différents selon ta willingness-to-pay estimée.",
		insights: [
			"Le Dynamic Pricing (tarification dynamique) ajuste les prix en temps réel selon le profil de l'utilisateur (datanews.levif.be).",
		],
		color: "#ffb3ec"
	},
	{
		slug: "commerce",
		title: "Chambre des Données sensibles",
		intro: "Ta géolocalisation et tes traces numériques publiques peuvent être utilisées pour prouver un mensonge, même au tribunal du travail.",
		insights: [
			"Les données de localisation (GPS, Strava, géotags) sont admissibles comme preuve légale au tribunal du travail (village-justice.com).",
			"Une seule contradition entre la déclaration et la localisation réelle suffit pour licenciement pour fausse déclaration."
		],
		color: "#ffd68f"
	},
	{
		slug: "mobility",
		title: "Couloir des Traces",
		intro: "Tes recherches privées sont observées par les algorithmes publicitaires, et le secret est révélé sans que tu le saches.",
		insights: [
			"Les annonces ciblées révèlent les secrets personnels (santé, grossesse, IST) en temps réel (Mozilla Privacy Not Included).",
			"Le cross-référencement entre recherches + profil + âge crée des profils de risque ultra-précis pour le ciblage publicitaire."
		],
		color: "#aee6ff"
	},
	{
		slug: "sensibles",
		title: "Salon des Réseaux",
		intro: "Cliquer une fois sur du contenu anxiogène suffit pour déclencher une cascade d'algorithmes qui te radicalisent progressivement.",
		insights: [
			"Les algorithmes amplifient le contenu émotionnel (peur, colère, conspiracy) car ils génèrent plus d'engagement (swisspeace.ch).",
		],
		color: "#d0c5ff"
	},
	{
		slug: "control",
		title: "Grenier des Souvenirs",
		intro: "Ton passé numérique te suit à jamais. Les archives web et les images conservées ferment des portes sans que tu le saches.",
		insights: [
			"Aucune donnée n'est vraiment supprimée : archives (Wayback Machine), Google Images, anciens comptes restent accessibles (forbes.com).",
		],
		color: "#f1ffb5"
	}
];

// Unique scenarios for each room (new structure - no user choices)
export const roomScenarios = {
	social: {
		neutral: {
			title: "Vous faites vos achats en ligne",
			description: "C'est un dimanche matin. Vous êtes sur votre MacBook Pro, vous regardez des billets d'avion pour un départ urgent (dans 3 jours). Vous trouvez un bon prix : 450 CHF. Vous consultez aussi une montre connectée haut de gamme. Tout semble normal, non ?"
		},
		reality: {
			title: "Mais l'algorithme sait qui vous êtes",
			subtitle: "Ce qui se passe vraiment en arrière-plan",
			lines: [
				"L'algorithme détecte : MacBook Pro + achat urgent + catégories premium.",
				"Il calcule votre 'willingness-to-pay' (capacité/volonté de payer).",
				"Résultat : le même billet s'affiche à 517 CHF pour vous (+15%), mais à 450 CHF pour votre voisin sur PC.",
				"C'est le Dynamic Pricing. Vous payez plus parce que le système sait que vous pouvez payer plus."
			]
		},
		impact: "Surcoût estimé : 15-30% sur les achats urgents.",
		source: "https://datanews.levif.be — Dynamic pricing selon votre profil",
		protections: [
			"Effacez régulièrement vos cookies et historique dans paramètres > Confidentialité > Effacer les données",
			"Utilisez la navigation privée/incognito pour chaque achat sensible",
			"Alternez entre navigateurs, appareils, et moyens de paiement pour éviter la profilage"
		]
	},
	commerce: {
		neutral: {
			title: "Vous postez une story 'au lit'",
			description: "Lundi matin. Vous êtes malade, arrêt maladie. Vous postez une story avec le texte 'trop malade pour le bureau'. Votre géolocalisation est activée. Vos collègues peuvent vous voir sur la carte (fonction 'Amis à proximité'). Vous vous reposez, c'est normal."
		},
		reality: {
			title: "Mais votre empreinte numérique raconte une autre histoire",
			subtitle: "Les preuves numériques contre vous",
			lines: [
				"Pendant que vous postez 'au lit', votre GPS vous localise au restaurant à 15km de chez vous.",
				"Un collègue voit l'alerte et vérifie : vous n'êtes clairement pas malade.",
				"Strava (votre app fitness) affiche un entraînement de ce matin. Le tribunal du travail admet ce type de preuve.",
				"Vous êtes renvoyée pour mensonge. Pas même convoquée : juste licenciée."
			]
		},
		impact: "Licenciement pour fausse déclaration. Les données numériques sont admises au tribunal du travail.",
		source: "https://village-justice.com — Géolocalisation et responsabilité",
		protections: [
			"Désactivez la géolocalisation en arrière-plan : Paramètres > Applications > Permissions > Localisation",
			"Revoyez les permissions d'accès pour chaque app et limitez à 'En utilisant l'app'",
			"Utilisez des profils séparés (professionnel/personnel) sur chaque réseau social"
		]
	},
	mobility: {
		neutral: {
			title: "Vous ouvrez votre navigateur",
			description: "Vous êtes enceinte, vous avez un doute. Vous faites des recherches discrètes : 'test de grossesse', 'premiers symptômes', 'cliniques spécialisées'. C'est personnel, vous ne l'avez dit à personne. Votre mère est à côté de vous sur le canapé."
		},
		reality: {
			title: "Quelques secondes plus tard...",
			subtitle: "Le secret est révélé sans que vous le sachiez",
			lines: [
				"Une bannière publicitaire apparaît : 'Test de grossesse en promo'. Votre mère la voit.",
				"L'algorithme a cross-réferencé : vos recherches + votre âge + votre profil d'achat = acheteur potentiel.",
				"Il ne cherchait pas à vous nuire, il voulait juste vous vendre un produit.",
				"Mais votre secret de 2h a été révélé publiquement par le marketing en ligne."
			]
		},
		impact: "Perte d'intimité. Révélation de secrets personnels (santé, IST, grossesse) via les annonces ciblées.",
		source: "https://foundation.mozilla.org/en/privacynotincluded/ — Online tracking and targeted ads",
		protections: [
			"Utilisez Swisscows ou DuckDuckGo pour les recherches sensibles — aucun suivi, aucun historique",
			"Limitez les publicités ciblées dans Google Ads Settings et vos comptes Meta/Instagram",
			"Installez un bloqueur de traceurs : uBlock Origin, Privacy Badger (EFF)"
		]
	},
	sensibles: {
		neutral: {
			title: "Vous scrollez sur les réseaux",
			description: "Vous voyez un article anxiogène : une crise économique, une catastrophe naturelle, une polémique politique. Vous cliquez pour en savoir plus. C'est juste de la curiosité."
		},
		reality: {
			title: "Mais l'algorithme vous piège",
			subtitle: "La radicalisation commence",
			lines: [
				"L'algorithme a enregistré : vous aimez le contenu inquiétant. Il vous en propose plus.",
				"Demain : des contenus plus extrêmes, plus polarisés, plus colériques.",
				"Dans une semaine : votre feed n'est que contenu rage, peur, conspiration.",
				"Vous perdez vos amis modérés, vous radicalisez progressivement, sans vous en rendre compte. La peur et la colère font plus de clics que le bonheur."
			]
		},
		impact: "Radicalisation algorithmique. Dépression, perte d'amis, extrémisme, sans le réaliser.",
		source: "https://swisspeace.ch — Réseaux sociaux et polarisation",
		protections: [
			"Désactivez les recommandations algorithmiques : coupez l'historique de navigation",
			"Diversifiez vos sources : journaux, podcasts, livres, discussions en personne",
			"Prenez des pauses régulières sur les réseaux (digital detox hebdomadaire)"
		]
	},
	control: {
		neutral: {
			title: "Vous postulez pour un CDI",
			description: "C'est le poste de vos rêves. Vous êtes confiante : vous avez un bon CV, une belle lettre de motivation. Le recruteur vous dit 'On vous recontactera'. Quelques jours passent sans nouvelles."
		},
		reality: {
			title: "Vous ne saurez jamais pourquoi",
			subtitle: "Une vieille photo vous bloque",
			lines: [
				"Il y a 8 ans, vous aviez 19 ans. Une photo de soirée un peu 'limite'. Elle était censée disparaître.",
				"Mais elle existe encore sur un site d'archivage, un vieux compte Tumblr mal fermé, ou Google Images.",
				"Le recruteur tape votre nom. La photo ressort. Il ferme le mail sans lire votre CV.",
				"Vous ne serez jamais embauchée. Vous ne saurez jamais pourquoi. Votre réputation numérique vous précède et vous ferme des portes."
			]
		},
		impact: "Bloquée pour des opportunités sans le savoir. Votre passé numérique détermine votre futur.",
		source: "https://forbes.com — Online reputation affects hiring and referrals",
		protections: [
			"Vérifiez vos données : demandez votre droit d'accès RGPD auprès de Google, Meta, tout service (edoeb.admin.ch)",
			"Surveillez les fuites : testez votre email sur haveibeenpwned.com",
			"Supprimez votre passé : contactez les archives web pour déréférençage, demandez suppression Google Images"
		]
	}
};

export const roomChoices = {
	social: [],
	commerce: [],
	mobility: [],
	sensibles: [],
	control: []
};

export const roomChoices_OLD = {
	social: [
		{
			label: "Poster des stories géolocalisées avec tes amis",
			result: [
				"On peut en déduire un profil social actif et très visible.",
				"La géolocalisation répétée permet de repérer tes lieux de vie et de sortie."
			]
		},
		{
			label: "Partager souvent des débats et opinions",
			result: [
				"Ton profil peut être classé comme engagé sur certains sujets.",
				"Des contenus plus polarisés ou ciblés politiquement peuvent t’être proposés."
			]
		}
	],
	commerce: [
		{
			label: "Composer un panier bio + box beauté mensuelle",
			result: [
				"Tes achats suggèrent un budget plutôt élevé pour l’alimentation et les soins.",
				"Tu peux être ciblé·e par des offres premium liées au bien-être ou aux produits éthiques."
			]
		},
		{
			label: "S’abonner à un service gaming + commandes de fast-food tardives",
			result: [
				"On peut te classer comme gros·se utilisateur·trice de divertissement nocturne.",
				"Des offres d’abonnements prolongés, de livraison rapide ou de snacks peuvent être accentuées."
			]
		}
	],
	mobility: [
		{
			label: "Trajet domicile ↔ bureau ↔ salle de sport",
			result: [
				"Les données indiquent un rythme de vie régulier avec déplacements quotidiens.",
				"Tu peux être ciblé·e pour des services de transport, de mobilité douce ou des abonnements de fitness."
			]
		},
		{
			label: "Trajet campus ↔ bibliothèque ↔ job étudiant",
			result: [
				"Les lieux et horaires suggèrent un statut d’étudiant·e.",
				"Des offres bancaires jeunes, de logement étudiant ou de réductions culturelles peuvent être privilégiées."
			]
		}
	],
	sensibles: [
		{
			label: "Activer suivi du sommeil + journal d’humeur",
			result: [
				"Ces données donnent une vision fine de ton rythme et de ton état émotionnel.",
				"Mal encadrées, elles pourraient peser dans des décisions liées au bien-être ou à l’assurance."
			]
		},
		{
			label: "Partager des données de capteurs santé",
			result: [
				"Les informations biométriques sont particulièrement sensibles.",
				"Leur usage doit être strictement limité au contexte médical ou bien-être clairement explicité."
			]
		}
	],
	control: [
		{
			label: "Demander une copie de mes données",
			result: [
				"Tu exerces ton droit d’accès et de portabilité.",
				"Tu peux vérifier ce qui est stocké et décider ensuite de ce que tu souhaites effacer ou corriger."
			]
		},
		{
			label: "Limiter la publicité personnalisée",
			result: [
				"Tu réduis l’usage de ton profil pour du ciblage marketing.",
				"Les publicités restent présentes mais moins liées à ton historique et à tes habitudes."
			]
		}
	]
};

export const gameState = {
	social: null,
	commerce: null,
	mobility: null,
	sensibles: null
};

export const roomActions = {
	social: {
		label: "Générer la fiche sociale",
		handler: () => {
			const choice = gameState.social;
			return {
				title: "Lecture sociale",
				lines: choice
					? [
							"Résumé réseaux : " + choice.label,
							...choice.result
						]
					: [
							"Aucun scénario réseaux sociaux n’a encore été testé.",
							"Explore le Salon des Réseaux pour voir comment tes interactions peuvent être interprétées."
						]
			};
		}
	},
	commerce: {
		label: "Analyser le panier",
		handler: () => {
			const choice = gameState.commerce;
			return {
				title: "Lecture achats",
				lines: choice
					? [
							"Résumé achats : " + choice.label,
							...choice.result
						]
					: [
							"Aucun panier n’a encore été simulé.",
							"Compose un panier fictif dans la Cuisine des Achats pour voir ce qu’il peut révéler."
						]
			};
		}
	},
	mobility: {
		label: "Lire le trajet",
		handler: () => {
			const choice = gameState.mobility;
			return {
				title: "Lecture déplacements",
				lines: choice
					? [
							"Résumé déplacements : " + choice.label,
							...choice.result
						]
					: [
							"Aucun trajet n’a encore été sélectionné.",
							"Teste un itinéraire dans le Couloir des Déplacements pour voir les hypothèses possibles."
						]
			};
		}
	},
	sensibles: {
		label: "Scanner les données sensibles",
		handler: () => {
			const choice = gameState.sensibles;
			return {
				title: "Impact données sensibles",
				lines: choice
					? [
							"Résumé données sensibles : " + choice.label,
							...choice.result
						]
					: [
							"Aucun scénario de données sensibles n’a été exploré.",
							"Passe par la Chambre des Données sensibles pour tester des autorisations fictives."
						]
			};
		}
	},
	control: {
		label: "Voir la synthèse",
		handler: () => {
			const lines = [];

			if (gameState.social) {
				lines.push("Réseaux : " + gameState.social.label);
			} else {
				lines.push("Réseaux : aucune interaction testée.");
			}

			if (gameState.commerce) {
				lines.push("Achats : " + gameState.commerce.label);
			} else {
				lines.push("Achats : aucun panier simulé.");
			}

			if (gameState.mobility) {
				lines.push("Déplacements : " + gameState.mobility.label);
			} else {
				lines.push("Déplacements : aucun trajet choisi.");
			}

			if (gameState.sensibles) {
				lines.push("Données sensibles : " + gameState.sensibles.label);
			} else {
				lines.push("Données sensibles : aucun scénario testé.");
			}

			lines.push("");
			lines.push("Rappels de contrôle :");
			lines.push("• Tu peux demander l’accès et une copie de tes données aux services concernés.");
			lines.push("• Tu peux corriger ou effacer certaines informations quand elles ne sont plus nécessaires.");
			lines.push("• Tu peux limiter la publicité personnalisée et revoir les autorisations de géolocalisation et de suivi.");

			return {
				title: "Synthèse de ton passage dans la Maison",
				lines
			};
		}
	}
};

export const defaultInfo = {
	title: "Commence par une pièce",
	intro: "Déplace-toi dans une pièce et clique sur une capsule de verre pour tester un scénario.",
	insights: [
		"Chaque pièce correspond à une famille de données personnelles (réseaux, achats, déplacements, données sensibles, contrôle).",
		"Tes choix ne sont pas enregistrés en vrai, ils servent uniquement à illustrer ce qu’un système pourrait déduire."
	]
};

export const moveSpeeds = { walk: 3.0 };

// Legacy content kept for potential future use.
export const socialPosts = [
	{ label: "Story festival & amis", inference: "Profil culture + sociable", note: "Ciblage sorties nocturnes et partenariats événementiels." },
	{ label: "Thread coup de gueule politique", inference: "Positionnement engagé", note: "Peut déclencher du contenu polarisé ou du microciblage militant." },
	{ label: "VLOG routine sport + smoothies", inference: "Style de vie healthy premium", note: "Associe ta data à des marques fitness et compléments." },
	{ label: "Mèmes sur la procrastination", inference: "Catégorie 'étudiant stressé'", note: "Propension à consommer des apps de productivité payantes." },
	{ label: "Haul vêtements éthiques", inference: "Purchase intent mode responsable", note: "Proposition de cartes bancaires vertes et néobanques." }
];

export const commerceItems = [
	{ label: "Panier bio + livraison de paniers", insight: "Budget alimentation supérieur à la moyenne, appétence pour abonnements durables." },
	{ label: "Abonnement gaming + achats in-app", insight: "Profil gamer intensif, propension à accepter des offres de crédit rapide." },
	{ label: "Billets low-cost + hôtels week-end", insight: "Voyageur fréquent, ciblage assurance annulation + cartes multi-devises." },
	{ label: "Box beauté clean + parapharmacie", insight: "Soins haut de gamme, intérêt pour produits santé personnalisés." },
	{ label: "Commandes fast-food tardives", insight: "Rythme irrégulier, push de livraison express et offres nocturnes." }
];

export const mobilityRoutes = [
	{ route: "Domicile → coworking → salle de sport → bar", deductions: ["Horaires 8h-22h", "Réseau social urbain", "Ciblage transports multimodes"] },
	{ route: "Campus → stage → bibliothèque", deductions: ["Statut étudiant·e", "Temps passé en zone académique", "Ciblage bourses et banques jeunes"] },
	{ route: "Maison → école → supermarché → maison", deductions: ["Probable parent", "Crénaux 7h30/16h30", "Ciblage assurances famille"] }
];

export const sensitivePermissions = [
	{ label: "Suivi du sommeil (8h)", impact: "Indice de fatigue et productivité transmis aux partenaires bien-être." },
	{ label: "Journal humeur quotidien", impact: "Profil émotionnel exploitable pour scoring de stabilité." },
	{ label: "Historique messageries chiffrées", impact: "Métadonnées révélant relations intimes malgré chiffrement du contenu." },
	{ label: "Capteurs santé (coeur, SPO2)", impact: "Peut influencer primes assurance ou prêts santé." }
];

export const controlActions = [
	{ action: "Télécharger tes données", impact: "Tu récupères un export complet pour vérifier ce qui circule." },
	{ action: "Activer l'authentification forte", impact: "Réduit les reprises de comptes et les doubles connexions suspectes." },
	{ action: "Programmer des rappels de nettoyage", impact: "Tous les 90 jours tu purges recherches, historiques et paniers." },
	{ action: "Segmenter tes identités (pseudo/email)", impact: "Évite la corrélation automatique entre achats, loisirs et santé." }
];
