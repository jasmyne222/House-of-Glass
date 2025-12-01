export function createPanels({
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
}) {
	let currentChoices = [];
	let scenarioRevealStates = {}; // Track reveal state per slug

	function clearDynamicInfo(blankOnly = false) {
		if (infoDynamic) infoDynamic.innerHTML = blankOnly ? '' : '<p>Active une interaction dans cette pièce pour voir un exemple.</p>';
		currentChoices = [];
	}

	function renderDynamicResult(result) {
		if (!infoDynamic) return;
		if (!result) {
			clearDynamicInfo();
			return;
		}
		const { title, lines = [] } = result;
		infoDynamic.innerHTML = '';
		if (title) {
			const h = document.createElement('h3');
			h.textContent = title;
			infoDynamic.appendChild(h);
		}
		lines.forEach((line) => {
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

		choices.forEach((c) => {
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
				if (slug && Object.prototype.hasOwnProperty.call(gameState || {}, slug)) {
					gameState[slug] = {
						label: c.label,
						result: c.result
					};
				}
				renderDynamicResult({ title: 'Résultat', lines: c.result });
				if (speakLine) speakLine(c.result.join('. '));
			});

			wrap.appendChild(btn);
		});
		infoDynamic.appendChild(wrap);
	}

	function renderScenarioInteractive(slug) {
		if (!infoDynamic) return;
		const scenario = roomScenarios && roomScenarios[slug];
		if (!scenario) {
			clearDynamicInfo();
			return;
		}

		// Track state: 'neutral' | 'reality' | 'protections'
		if (!scenarioRevealStates[slug]) {
			scenarioRevealStates[slug] = 'neutral';
		}

		function render() {
			infoDynamic.innerHTML = '';
			const state = scenarioRevealStates[slug];

			if (state === 'neutral' && scenario.neutral) {
				// Step 1: Show neutral context with reveal button
				const neutralDiv = document.createElement('div');
				neutralDiv.className = 'scenario-neutral';
				neutralDiv.innerHTML = `
					<h4>${scenario.neutral.title}</h4>
					<p>${scenario.neutral.description}</p>
				`;
				infoDynamic.appendChild(neutralDiv);

				// Reveal button
				const btn = document.createElement('button');
				btn.className = 'scenario-reveal-btn';
				btn.textContent = 'Découvrir ce qui se cache';
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					scenarioRevealStates[slug] = 'reality';
					render();
				});
				infoDynamic.appendChild(btn);

			} else if (state === 'reality' && scenario.reality) {
				// Step 2: Show ONLY reality with impact + source + protection button
				const realityDiv = document.createElement('div');
				realityDiv.className = 'scenario-reality';
				
				const titleEl = document.createElement('h4');
				titleEl.textContent = scenario.reality.title;
				realityDiv.appendChild(titleEl);

				if (scenario.reality.subtitle) {
					const subtitleEl = document.createElement('p');
					subtitleEl.className = 'scenario-reality-subtitle';
					subtitleEl.textContent = scenario.reality.subtitle;
					realityDiv.appendChild(subtitleEl);
				}

				scenario.reality.lines.forEach((line) => {
					const p = document.createElement('p');
					p.textContent = line;
					realityDiv.appendChild(p);
				});

				infoDynamic.appendChild(realityDiv);

				// Impact section
				if (scenario.impact) {
					const impactEl = document.createElement('p');
					impactEl.style.marginTop = '12px';
					impactEl.style.padding = '8px';
					impactEl.style.background = 'rgba(255, 100, 100, 0.15)';
					impactEl.style.borderRadius = '6px';
					impactEl.style.borderLeft = '3px solid rgba(255, 100, 100, 0.5)';
					impactEl.style.fontSize = '12px';
					impactEl.style.color = '#ffcccc';
					impactEl.textContent = 'Impact : ' + scenario.impact;
					infoDynamic.appendChild(impactEl);
				}

				// Source
				if (scenario.source) {
					const sourceEl = document.createElement('p');
					sourceEl.style.marginTop = '10px';
					sourceEl.style.fontSize = '11px';
					sourceEl.style.color = '#7db3d1';
					
					// Parse URL from source string (format: "https://example.com — Description")
					const match = scenario.source.match(/^(https?:\/\/[^\s]+)\s*—\s*(.+)$/);
					if (match) {
						const url = match[1];
						const desc = match[2];
						const link = document.createElement('a');
						link.href = url;
						link.target = '_blank';
						link.textContent = desc;
						link.style.color = '#7db3d1';
						link.style.textDecoration = 'underline';
						link.style.cursor = 'pointer';
						sourceEl.textContent = 'Source : ';
						sourceEl.appendChild(link);
					} else {
						sourceEl.textContent = 'Source : ' + scenario.source;
					}
					infoDynamic.appendChild(sourceEl);
				}

				// Protection button
				if (scenario.protections && scenario.protections.length) {
					const protectBtn = document.createElement('button');
					protectBtn.className = 'scenario-reveal-btn';
					protectBtn.style.marginTop = '12px';
					protectBtn.style.background = 'linear-gradient(135deg, rgba(100, 200, 150, 0.4), rgba(80, 180, 130, 0.3))';
					protectBtn.style.borderColor = 'rgba(100, 200, 150, 0.5)';
					protectBtn.textContent = 'Comment se protéger';
					protectBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						scenarioRevealStates[slug] = 'protections';
						render();
					});
					infoDynamic.appendChild(protectBtn);
				}

				// Auto-speak when revealed
				if (speakLine && scenario.reality.lines) {
					const textToSpeak = [scenario.reality.title, ...scenario.reality.lines].join('. ');
					speakLine(textToSpeak);
				}

			} else if (state === 'protections' && scenario.protections) {
				// Step 3: Show ONLY protections
				const protectionsDiv = document.createElement('div');
				protectionsDiv.style.padding = '12px';
				protectionsDiv.style.background = 'rgba(100, 200, 150, 0.12)';
				protectionsDiv.style.borderRadius = '6px';
				protectionsDiv.style.borderLeft = '3px solid rgba(100, 200, 150, 0.6)';

				scenario.protections.forEach((protection) => {
					const protectionEl = document.createElement('p');
					protectionEl.style.margin = '8px 0';
					protectionEl.style.fontSize = '12px';
					protectionEl.style.color = '#aaffbb';
					protectionEl.style.lineHeight = '1.5';
					protectionEl.textContent = '• ' + protection;
					protectionsDiv.appendChild(protectionEl);
				});

				infoDynamic.appendChild(protectionsDiv);

				// Source for protections
				if (scenario.source) {
					const sourceEl = document.createElement('p');
					sourceEl.style.marginTop = '10px';
					sourceEl.style.fontSize = '11px';
					sourceEl.style.color = '#7db3d1';
					
					// Parse URL from source string (format: "https://example.com — Description")
					const match = scenario.source.match(/^(https?:\/\/[^\s]+)\s*—\s*(.+)$/);
					if (match) {
						const url = match[1];
						const desc = match[2];
						const link = document.createElement('a');
						link.href = url;
						link.target = '_blank';
						link.textContent = desc;
						link.style.color = '#7db3d1';
						link.style.textDecoration = 'underline';
						link.style.cursor = 'pointer';
						sourceEl.textContent = 'Source : ';
						sourceEl.appendChild(link);
					} else {
						sourceEl.textContent = 'Source : ' + scenario.source;
					}
					infoDynamic.appendChild(sourceEl);
				}

				// Back button
				const backBtn = document.createElement('button');
				backBtn.className = 'scenario-reveal-btn';
				backBtn.style.marginTop = '12px';
				backBtn.textContent = 'Retour';
				backBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					scenarioRevealStates[slug] = 'reality';
					render();
				});
				infoDynamic.appendChild(backBtn);
			}
		}

		render();
	}



	function setInfoBySlug(slug = null) {
		if (!infoTitle || !infoIntro || !infoList || !infoPanel) return;
		
		// Reset reveal state when changing rooms
		scenarioRevealStates = {};
		
		const piece = dataPieces.find((item) => item.slug === slug) || defaultInfo;
		infoTitle.textContent = piece.title;
		infoIntro.textContent = piece.intro;
		infoList.innerHTML = '';
		(piece.insights || []).forEach((text) => {
			const li = document.createElement('li');
			li.textContent = text;
			infoList.appendChild(li);
		});
		
		// For pièces with scenarios, render scenario instead of choices
		if (roomScenarios && roomScenarios[slug]) {
			renderScenarioInteractive(slug);
		} else {
			clearDynamicInfo();
			renderChoices(slug);
		}
		
		if (!slug && infoDynamic) {
			infoDynamic.innerHTML = '<p>Déplace-toi dans une pièce pour voir ses interactions.</p>';
		}
		if (infoPanel) {
			infoPanel.classList.toggle('info-panel--active', Boolean(slug));
		}
	}

	return {
		setInfoBySlug,
		renderDynamicResult,
		renderChoices,
		renderScenarioInteractive,
		clearDynamicInfo,
		getCurrentChoices: () => currentChoices
	};
}
