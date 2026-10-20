/**
 * Empire Fourmi - Effets Visuels Spécialisés Canvas 2D (renderer-effects.js)
 * - Météo saisonnière dynamique (pollen de printemps, lucioles d'été, feuilles d'automne)
 * - Atmosphère souterraine organique (phéromones bioluminescentes & spores de champignonnière)
 * - Système de Textes Flottants (Floating Texts) & Secousses d'Écran (Screen Shake)
 * - Particules de combat (mandibules, sang et acide formique)
 * - Halos de sélection et infobulles contextuelles Canvas
 */

(function (root) {
  'use strict';

  // État local des effets
  const combatParticles = [];
  const floatingTexts = [];
  const seasonalParticles = [];
  let screenShakeTimer = 0;
  let screenShakeIntensity = 0;

  function getActiveCtx() {
    return (root.ctx) || (typeof document !== 'undefined' && document.getElementById('colonyCanvas') && document.getElementById('colonyCanvas').getContext('2d')) || null;
  }

  function getActiveConfig() {
    return root.GAME_CONFIG || {};
  }

  function getActiveState() {
    return root.gameState || {};
  }

  function getTranslation(key, params) {
    if (typeof root.t === 'function') return root.t(key, params);
    return key;
  }

  function getPixelPos(nodeId) {
    if (typeof root.getNodePixelPos === 'function') {
      return root.getNodePixelPos(nodeId);
    }
    const canvas = root.canvas || (typeof document !== 'undefined' ? document.getElementById('colonyCanvas') : null);
    const theme = getActiveConfig().CANVAS_THEME || {};
    const node = theme.nodes && theme.nodes[nodeId];
    if (!node || !canvas) return { x: 0, y: 0 };
    return { x: canvas.width * node.xRatio, y: canvas.height * node.yRatio };
  }

  /**
   * Initialise les particules saisonnières en surface.
   */
  function initSeasonalParticles() {
    seasonalParticles.length = 0;
    const theme = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.seasonalParticles) || {};
    const pCount = Math.max(theme.pollenCount || 20, theme.fireflyCount || 16, theme.leafCount || 18);

    for (let i = 0; i < pCount; i++) {
      seasonalParticles.push({
        xRatio: Math.random(),
        yRatio: Math.random(),
        vx: (Math.random() - 0.5) * 0.0015,
        vy: 0.001 + Math.random() * 0.002,
        size: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        colorIdx: i % 4
      });
    }
  }

  /**
   * Met à jour et dessine les particules météo saisonnières en surface.
   */
  function updateAndDrawSeasonalParticles(w, h, surfaceY, timestamp, season) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    const seasonId = (season && season.id) || 'summer';
    if (seasonId === 'winter') return; // L'hiver utilise les flocons de neige

    activeCtx.save();
    const theme = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.seasonalParticles) || {};

    seasonalParticles.forEach(p => {
      p.xRatio = (p.xRatio + p.vx + 1) % 1;
      p.yRatio = (p.yRatio + p.vy) % 1;

      const px = p.xRatio * w + Math.sin(timestamp * 0.002 + p.phase) * 8;
      const py = p.yRatio * surfaceY;

      if (seasonId === 'spring') {
        activeCtx.fillStyle = theme.pollenColor || 'rgba(236, 201, 75, 0.7)';
        activeCtx.beginPath();
        activeCtx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
        activeCtx.fill();
      } else if (seasonId === 'summer') {
        const glow = (Math.sin(timestamp * 0.004 + p.phase) + 1) * 0.5;
        activeCtx.fillStyle = `rgba(250, 240, 137, ${0.25 + glow * 0.65})`;
        activeCtx.beginPath();
        activeCtx.arc(px, py, p.size * (0.8 + glow * 0.5), 0, Math.PI * 2);
        activeCtx.fill();
      } else if (seasonId === 'autumn') {
        const leafColors = theme.leafColors || ['#dd6b20', '#c05621'];
        activeCtx.fillStyle = leafColors[p.colorIdx % leafColors.length];
        activeCtx.beginPath();
        activeCtx.ellipse(px, py, p.size * 2, p.size * 1.2, p.phase + timestamp * 0.002, 0, Math.PI * 2);
        activeCtx.fill();
      }
    });

    activeCtx.restore();
  }

  /**
   * Déclenche une secousse d'écran contrôlée (Screen Shake) lors des impacts violents.
   */
  function triggerScreenShake(intensity = 5.5, duration = 18) {
    screenShakeIntensity = intensity;
    screenShakeTimer = duration;
    root.screenShakeIntensity = intensity;
    root.screenShakeTimer = duration;
  }

  /**
   * Crée un texte flottant éphémère au-dessus d'un nœud ou d'une position libre.
   */
  function spawnCanvasFloatingText(nodeIdOrPos, text, color = '#f6ad55') {
    let x = 0;
    let y = 0;

    if (typeof nodeIdOrPos === 'string') {
      const pos = getPixelPos(nodeIdOrPos);
      x = pos.x;
      y = pos.y - 12;
    } else if (nodeIdOrPos && typeof nodeIdOrPos.x === 'number' && typeof nodeIdOrPos.y === 'number') {
      x = nodeIdOrPos.x;
      y = nodeIdOrPos.y;
    } else {
      return;
    }

    const cfg = getActiveConfig().CANVAS_INTERACTION || {};
    const duration = cfg.floatingTextDuration || 75;
    const speed = cfg.floatingTextSpeed || 0.65;

    floatingTexts.push({
      x: x + (Math.random() - 0.5) * 12,
      y,
      text: String(text),
      color,
      life: duration,
      maxLife: duration,
      vy: -speed
    });
  }

  function updateAndDrawFloatingTexts() {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, ft.life / (ft.maxLife * 0.35));
      activeCtx.save();
      activeCtx.globalAlpha = alpha;
      activeCtx.fillStyle = ft.color;
      activeCtx.font = '700 12px Outfit, sans-serif';
      activeCtx.textAlign = 'center';
      activeCtx.fillText(ft.text, ft.x, ft.y);
      activeCtx.restore();
    }
  }

  /**
   * Émet une particule de combat (mandibules ou acide formique).
   */
  function spawnCombatParticle(x, y, useAcid) {
    const cTheme = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.combat) || {
      acidColor: '#68d391',
      sparkColor: '#f6e05e',
      bloodColor: '#fc8181'
    };
    const isAcid = useAcid && Math.random() < 0.55;
    combatParticles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3.2,
      vy: (Math.random() - 0.5) * 3.2,
      radius: isAcid ? 3.5 : 2.2,
      color: isAcid ? cTheme.acidColor : (Math.random() < 0.5 ? cTheme.sparkColor : cTheme.bloodColor),
      alpha: 1.0
    });
  }

  function updateAndDrawCombatParticles() {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const state = getActiveState();
    const speed = state.speed !== undefined ? state.speed : 1;

    for (let i = combatParticles.length - 1; i >= 0; i--) {
      const p = combatParticles[i];
      if (speed > 0) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        p.alpha -= 0.04 * speed;
      }
      if (p.alpha <= 0) {
        combatParticles.splice(i, 1);
        continue;
      }
      activeCtx.save();
      activeCtx.globalAlpha = p.alpha;
      activeCtx.fillStyle = p.color;
      activeCtx.beginPath();
      activeCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      activeCtx.fill();
      activeCtx.restore();
    }
  }

  /**
   * Dessine les flux lumineux de phéromones le long des galeries.
   */
  function drawPheromoneTrails(timestamp, w, h) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    const state = getActiveState();
    const ants = state.ants || {};
    const scoutsCount = ants.scout || 0;
    const workersCount = ants.worker || 0;
    const totalExplorers = scoutsCount * 1.5 + workersCount * 0.5;
    if (totalExplorers <= 0) return;

    const alpha = Math.min(0.65, 0.12 + (totalExplorers / 40) * 0.45);
    const iCfg = getActiveConfig().CANVAS_INTERACTION || {};
    const pulseSpeed = iCfg.pheromonePulseSpeed || 0.0035;
    const pulse = (Math.sin(timestamp * pulseSpeed) + 1) * 0.5;

    activeCtx.save();
    const edges = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.edges) || [];
    edges.forEach(([a, b]) => {
      if ((a === 'fungus' || b === 'fungus') && (!state.rooms || !state.rooms.fungus || state.rooms.fungus <= 0)) {
        return;
      }
      const posA = getPixelPos(a);
      const posB = getPixelPos(b);

      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;

      const spacing = iCfg.pheromoneDotSpacing || 14;
      const dotsCount = Math.floor(dist / spacing);
      const speedOffset = (timestamp * 0.035) % spacing;

      for (let i = 0; i <= dotsCount; i++) {
        const offsetDist = i * spacing + speedOffset;
        if (offsetDist > dist) continue;
        const tRatio = offsetDist / dist;
        const dotX = posA.x + dx * tRatio;
        const dotY = posA.y + dy * tRatio;

        activeCtx.fillStyle = `rgba(246, 173, 85, ${alpha * (0.6 + pulse * 0.4)})`;
        activeCtx.beginPath();
        activeCtx.arc(dotX, dotY, 1.6 + pulse * 0.6, 0, Math.PI * 2);
        activeCtx.fill();
      }
    });
    activeCtx.restore();
  }

  /**
   * Dessine les spores flottantes bioluminescentes dans la Champignonnière.
   */
  function drawBioluminescentSpores(timestamp) {
    const state = getActiveState();
    if (!state.rooms || !state.rooms.fungus || state.rooms.fungus <= 0) return;
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    const fPos = getPixelPos('fungus');
    const theme = getActiveConfig().CANVAS_THEME || {};
    const sporeCount = (theme.seasonalParticles && theme.seasonalParticles.sporeCount) || 12;

    activeCtx.save();
    for (let i = 0; i < sporeCount; i++) {
      const seed = i * 47.13;
      const tProg = (timestamp * 0.001 + seed) % (Math.PI * 2);
      const sx = fPos.x + Math.cos(tProg + i) * (20 + (i % 5) * 6);
      const sy = fPos.y + Math.sin(tProg * 1.5 + i) * (12 + (i % 3) * 5);
      const glow = (Math.sin(timestamp * 0.003 + i) + 1) * 0.5;

      activeCtx.fillStyle = `rgba(183, 148, 244, ${0.35 + glow * 0.45})`;
      activeCtx.beginPath();
      activeCtx.arc(sx, sy, 1.5 + glow * 1.2, 0, Math.PI * 2);
      activeCtx.fill();
    }
    activeCtx.restore();
  }

  /**
   * Dessine le halo de sélection et l'infobulle contextuelle lors du survol d'un nœud.
   */
  function drawHoverHaloAndTooltip(w, h, targetHovered) {
    const currentHovered = targetHovered || root.hoveredNode;
    if (!currentHovered || !currentHovered.node) return;
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    const node = currentHovered.node;
    const nx = currentHovered.x || (node.xRatio * w);
    const ny = currentHovered.y || (node.yRatio * h);
    const pulse = Math.sin(performance.now() * 0.005) * 3;
    const iCfg = getActiveConfig().CANVAS_INTERACTION || {};

    activeCtx.save();

    // Halo lumineux
    activeCtx.strokeStyle = iCfg.haloColor || 'rgba(246, 173, 85, 0.55)';
    activeCtx.lineWidth = 2.5;
    activeCtx.beginPath();
    if (node.isChamber && node.rx && node.ry) {
      activeCtx.ellipse(nx, ny, node.rx + 6 + pulse, node.ry + 6 + pulse, 0, 0, Math.PI * 2);
    } else {
      const rad = (iCfg.nodeHitRadius || 28) + 4 + pulse;
      activeCtx.arc(nx, ny, rad, 0, Math.PI * 2);
    }
    activeCtx.stroke();

    // Boîte d'infobulle (Tooltip)
    const tooltipCfg = iCfg.tooltip || {};
    const tWidth = tooltipCfg.width || 170;
    const pad = tooltipCfg.padding || 10;
    let tx = nx + 30;
    let ty = ny - 45;
    if (tx + tWidth > w - 10) tx = nx - tWidth - 30;
    if (ty < 15) ty = 15;
    if (ty + 60 > h - 10) ty = h - 70;

    activeCtx.fillStyle = tooltipCfg.bg || 'rgba(20, 16, 12, 0.92)';
    activeCtx.strokeStyle = tooltipCfg.border || '#f6ad55';
    activeCtx.lineWidth = 1.2;
    activeCtx.beginPath();
    activeCtx.roundRect(tx, ty, tWidth, 54, 8);
    activeCtx.fill();
    activeCtx.stroke();

    // Titre
    const title = getTranslation(node.labelKey || 'canvas.room.queen');
    activeCtx.fillStyle = tooltipCfg.titleColor || '#ecc94b';
    activeCtx.font = '700 11px Outfit, sans-serif';
    activeCtx.textAlign = 'left';
    activeCtx.fillText(title, tx + pad, ty + 18);

    // Lignes descriptives
    activeCtx.fillStyle = tooltipCfg.textColor || '#e2e8f0';
    activeCtx.font = '500 10px Outfit, sans-serif';
    const state = getActiveState();
    if (node.interaction === 'room' && node.roomKey) {
      const lvl = (state.rooms && state.rooms[node.roomKey]) || 0;
      const roomCfg = getActiveConfig().ROOMS && getActiveConfig().ROOMS[node.roomKey];
      const cost = roomCfg && typeof roomCfg.cost === 'function' ? roomCfg.cost(lvl) : 0;
      activeCtx.fillText(`${getTranslation('canvas.tooltip.level', { lvl })} — ${getTranslation('canvas.tooltip.cost', { cost })}`, tx + pad, ty + 33);
      activeCtx.fillStyle = tooltipCfg.hintColor || '#a0aec0';
      activeCtx.font = 'italic 9px Outfit, sans-serif';
      activeCtx.fillText(getTranslation('canvas.tooltip.click_hint'), tx + pad, ty + 46);
    } else if (node.interaction === 'harvest') {
      activeCtx.fillText(`+${iCfg.manualHarvestFood || 5} 🍃`, tx + pad, ty + 33);
      activeCtx.fillStyle = tooltipCfg.hintColor || '#a0aec0';
      activeCtx.font = 'italic 9px Outfit, sans-serif';
      activeCtx.fillText(getTranslation('canvas.hint.harvest'), tx + pad, ty + 46);
    } else if (node.interaction === 'nursery') {
      activeCtx.fillText(`🥚 ${(state.eggs && state.eggs.length) || 0}`, tx + pad, ty + 33);
      activeCtx.fillStyle = tooltipCfg.hintColor || '#a0aec0';
      activeCtx.font = 'italic 9px Outfit, sans-serif';
      activeCtx.fillText(getTranslation('canvas.hint.nursery'), tx + pad, ty + 46);
    } else {
      activeCtx.fillStyle = tooltipCfg.hintColor || '#a0aec0';
      activeCtx.font = 'italic 9px Outfit, sans-serif';
      activeCtx.fillText(getTranslation('canvas.hint.entrance'), tx + pad, ty + 33);
    }

    activeCtx.restore();
  }

  function fillEllipse(x, y, rx, ry, color, angle = 0) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    activeCtx.save();
    activeCtx.fillStyle = color;
    activeCtx.beginPath();
    activeCtx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
    activeCtx.fill();
    activeCtx.restore();
  }

  function drawQueenChamberDetails(x, y, rx, ry) {
    const theme = getActiveConfig().CANVAS_THEME || {};
    const details = theme.chamberDetails || {};
    const antz = theme.antzStyle || {};
    const state = getActiveState();
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    fillEllipse(x, y - 3, rx * 0.68, ry * 0.48, details.royalRugColor || '#5a381e');
    if (state.bossesDefeated && state.bossesDefeated.mantis) {
      activeCtx.save();
      activeCtx.strokeStyle = antz.trophyGold || '#ecc94b';
      activeCtx.fillStyle = antz.trophyEmerald || '#38a169';
      activeCtx.lineWidth = 1.5;
      activeCtx.beginPath();
      activeCtx.moveTo(x - rx * 0.55, y - ry * 0.35);
      activeCtx.quadraticCurveTo(x - rx * 0.42, y - ry * 0.65, x - rx * 0.30, y - ry * 0.25);
      activeCtx.closePath();
      activeCtx.fill();
      activeCtx.stroke();
      activeCtx.restore();
    }

    // Trophallaxie Royale & Œufs Dorés Étincelants (Lot 5)
    if (state.queenDiet === 'royal_jelly') {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const pulse = 1 + Math.sin(now * 0.005) * 0.12;
      for (let g = 0; g < 3; g++) {
        const gx = x + rx * 0.32 + (g - 1) * 7.5;
        const gy = y + ry * 0.18 + (g % 2) * 3;
        // Halo doré rayonnant
        fillEllipse(gx, gy, 5.8 * pulse, 3.9 * pulse, 'rgba(246, 224, 94, 0.42)');
        // Œuf d'or ambré avec reflet spéculaire
        fillEllipse(gx, gy, 4.3, 2.9, '#f6e05e', -0.15);
        fillEllipse(gx - 0.8, gy - 0.8, 1.8, 1.2, '#ffffff', -0.15);
      }
    }
    if (typeof root.drawQueen === 'function') {
      root.drawQueen(x, y);
    }
  }

  function drawGranaryDetails(x, y, rx, ry) {
    const details = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.chamberDetails) || {};
    const state = getActiveState();
    const maxF = state.maxFood || 180;
    const fillRatio = Math.min(1, Math.max(0, (state.food || 0) / maxF));
    const itemCount = Math.floor(fillRatio * 22);
    for (let i = 0; i < itemCount; i++) {
      const row = Math.floor(i / 6), col = (i % 6) - 2.5;
      fillEllipse(x + col * (rx * 0.22), y + 6 - row * 6, 4.5, 2.8, i % 2 === 0 ? details.seedColor || '#ecc94b' : details.leafColor || '#48bb78', (i * 0.5) % Math.PI);
    }
  }

  function drawDormDetails(x, y, rx, ry, lvl = 1) {
    const details = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.chamberDetails) || {};
    const alcoves = Math.min(5, 2 + Math.floor(lvl / 2));
    for (let i = 0; i < alcoves; i++) {
      fillEllipse(x + (i - (alcoves - 1) / 2) * 20, y - 4, 8, 5, details.dormBunkColor || '#2d1b0e');
    }
  }

  function drawFungusDetails(x, y, rx, ry, lvl = 0) {
    const details = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.chamberDetails) || {};
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const count = Math.min(8, 2 + lvl * 2);
    fillEllipse(x, y - 2, rx * 0.65, ry * 0.45, details.mushroomGlow || 'rgba(183, 148, 244, 0.2)');
    activeCtx.save();
    for (let i = 0; i < count; i++) {
      const mx = x + (i - (count - 1) / 2) * 12, my = y + 2 - (i % 2) * 5;
      activeCtx.fillStyle = details.mushroomStem || '#e2e8f0';
      activeCtx.fillRect(mx - 1.5, my - 5, 3, 6);
      activeCtx.fillStyle = details.mushroomCap || '#b794f4';
      activeCtx.beginPath();
      activeCtx.arc(mx, my - 5, 5.5, Math.PI, 0);
      activeCtx.fill();
    }
    activeCtx.restore();
  }

  function drawNurseryDetails(x, y, rx, ry) {
    const details = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.chamberDetails) || {};
    const state = getActiveState();
    const activeEggsCount = state.eggs ? state.eggs.length : 0;
    const qLvl = (state.rooms && state.rooms.queen) || 1;
    const baseEggs = Math.min(14, 4 + qLvl * 2 + activeEggsCount);
    for (let i = 0; i < baseEggs; i++) {
      const angle = (i / baseEggs) * Math.PI * 2, dist = (i % 3) * 8 + 5;
      const ex = x + Math.cos(angle) * dist * 1.3, ey = y - 4 + Math.sin(angle) * dist * 0.6;
      const isInc = i < activeEggsCount;
      fillEllipse(ex, ey + 1, 4.5, 2.8, details.eggShadow || 'rgba(0,0,0,0.3)', angle * 0.2);
      fillEllipse(ex, ey, isInc ? 4.4 : 3.6, isInc ? 2.7 : 2.2, isInc ? details.eggActiveColor || '#f6e05e' : details.eggColor || '#fdfdfd', angle * 0.2);
    }
  }

  /**
   * Rendu Mobile AAA & Style Fourmiz de la Galerie à Pucerons (Lot 5)
   * Racines souterraines pendantes d'un vert sève translucide,
   * pucerons dodus 3D avec reflets spéculaires et yeux expressifs,
   * gouttelettes de Miellat ambrées pulsantes et scintillantes.
   */
  function drawAphidFarmDetails(x, y, rx, ry, lvl = 0) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    if (lvl <= 0) return; // Salle non creusée

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Racines végétales nourricières pendantes
    activeCtx.save();
    activeCtx.strokeStyle = 'rgba(72, 187, 120, 0.65)';
    activeCtx.lineWidth = 2.2;
    activeCtx.lineCap = 'round';
    for (let r = -2; r <= 2; r++) {
      const rootX = x + r * (rx * 0.28);
      const sway = Math.sin(now * 0.002 + r) * 1.5;
      activeCtx.beginPath();
      activeCtx.moveTo(rootX, y - ry * 0.65);
      activeCtx.quadraticCurveTo(rootX + r * 2, y, rootX + sway, y + ry * 0.45);
      activeCtx.stroke();
    }
    activeCtx.restore();

    // Pucerons dodus 3D stylisés (Antz style)
    const aphidCount = Math.min(5, 2 + lvl);
    for (let i = 0; i < aphidCount; i++) {
      const ax = x - rx * 0.45 + (i * (rx * 0.90) / Math.max(1, aphidCount - 1));
      const ay = y - 2 + (i % 2 === 0 ? -4 : 5);
      const pulse = 1 + Math.sin(now * 0.004 + i * 1.5) * 0.08;

      // Ombre portée du puceron
      fillEllipse(ax, ay + 2, 6.5, 4, 'rgba(10, 20, 10, 0.45)');

      // Abdomen dodu vert nacré 3D
      fillEllipse(ax - 2, ay, 5.5 * pulse, 4.2 * pulse, '#48bb78');
      fillEllipse(ax - 2.5, ay - 1.2, 3.2 * pulse, 2.0 * pulse, 'rgba(255, 255, 255, 0.55)', -0.2);

      // Tête et yeux expressifs
      fillEllipse(ax + 3.5, ay, 2.8, 2.4, '#2f855a');
      fillCircle(ax + 4.2, ay - 1, 0.9, '#1a202c');
      fillCircle(ax + 4.0, ay - 1.2, 0.4, '#ffffff');

      // Pattes graciles
      activeCtx.save();
      activeCtx.strokeStyle = '#276749';
      activeCtx.lineWidth = 1;
      [-1, 1].forEach(side => {
        activeCtx.beginPath();
        activeCtx.moveTo(ax - 1, ay + side * 2);
        activeCtx.lineTo(ax - 2, ay + side * 5);
        activeCtx.stroke();
      });
      activeCtx.restore();

      // Gouttelette de Miellat dorée 🍯 ambrée suintante
      const honeyPulse = 1 + Math.sin(now * 0.006 + i * 2) * 0.15;
      const dropX = ax - 8;
      const dropY = ay - 1;
      fillEllipse(dropX, dropY, 3.8 * honeyPulse, 2.8 * honeyPulse, 'rgba(246, 173, 85, 0.35)');
      fillEllipse(dropX, dropY, 2.6, 2.0, '#ecc94b');
      fillCircle(dropX - 0.7, dropY - 0.6, 0.65, '#ffffff');
    }
  }

  /**
   * Rendu Mobile AAA de la Chambre des Bâtisseuses (Lot 5)
   * Voûtes en rondins et brindilles tressées, échafaudages miniatures,
   * fagots de brindilles et fragments de chitine taillée.
   */
  function drawMasonryHallDetails(x, y, rx, ry, lvl = 0) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    if (lvl <= 0) return;

    activeCtx.save();
    // Charpente en rondins de soutènement croisés
    activeCtx.strokeStyle = '#8b5a2b';
    activeCtx.lineWidth = 2.4;
    activeCtx.beginPath();
    activeCtx.moveTo(x - rx * 0.6, y + ry * 0.3);
    activeCtx.lineTo(x, y - ry * 0.4);
    activeCtx.lineTo(x + rx * 0.6, y + ry * 0.3);
    activeCtx.stroke();

    // Traverse horizontale d'échafaudage
    activeCtx.strokeStyle = '#5a381e';
    activeCtx.lineWidth = 2;
    activeCtx.beginPath();
    activeCtx.moveTo(x - rx * 0.45, y - 2);
    activeCtx.lineTo(x + rx * 0.45, y - 2);
    activeCtx.stroke();

    // Cordages de soie blanche miniatures
    activeCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    activeCtx.lineWidth = 0.8;
    activeCtx.beginPath();
    activeCtx.moveTo(x - rx * 0.3, y - 2);
    activeCtx.lineTo(x - rx * 0.3, y + ry * 0.35);
    activeCtx.moveTo(x + rx * 0.3, y - 2);
    activeCtx.lineTo(x + rx * 0.3, y + ry * 0.35);
    activeCtx.stroke();

    // Fagots de brindilles stockées (gauche)
    for (let b = 0; b < 4; b++) {
      fillEllipse(x - rx * 0.35 + b * 2, y + ry * 0.35, 6, 2, '#d69e2e', b * 0.2);
    }

    // Plaques de chitine taillée brillante (droite)
    for (let c = 0; c < 3; c++) {
      fillEllipse(x + rx * 0.35 - c * 3, y + ry * 0.32, 5, 3, '#319795', -c * 0.15);
      fillCircle(x + rx * 0.35 - c * 3 - 1, y + ry * 0.32 - 1, 0.8, '#ffffff');
    }
    activeCtx.restore();
  }

  /**
   * Rendu de la Thermorégulation du Dôme en Surface (Lot 5)
   * Volutes thermiques ascendantes ('open') ou opercule protecteur ('sealed').
   */
  function drawSurfaceDomeVentilation(w, surfaceY, timestamp) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const state = getActiveState();
    const mode = state.domeVentilation || 'open';
    const centerX = w * 0.5;

    activeCtx.save();
    if (mode === 'open') {
      // Volutes thermiques d'aération qui ondulent vers le ciel
      activeCtx.strokeStyle = 'rgba(254, 240, 138, 0.22)';
      activeCtx.lineWidth = 1.4;
      activeCtx.lineCap = 'round';
      for (let v = -1; v <= 1; v++) {
        const vx = centerX + v * 9;
        const wave = Math.sin(timestamp * 0.003 + v * 2) * 5;
        activeCtx.beginPath();
        activeCtx.moveTo(vx, surfaceY - 6);
        activeCtx.quadraticCurveTo(vx + wave, surfaceY - 18, vx + wave * 0.5, surfaceY - 30);
        activeCtx.stroke();
      }
    } else {
      // Opercule hermétique isolant de boue et brindilles
      fillEllipse(centerX, surfaceY - 4, 18, 7, '#4a331c');
      activeCtx.strokeStyle = '#7b341e';
      activeCtx.lineWidth = 1.8;
      activeCtx.beginPath();
      activeCtx.ellipse(centerX, surfaceY - 4, 17, 6, 0, 0, Math.PI * 2);
      activeCtx.stroke();
    }
    activeCtx.restore();
  }

  /**
   * Rendu visuel d'Échafaudages et Anneaux de Progression sur les Chantiers Actifs (Lot 5)
   */
  function drawActiveChamberConstructions(nodes) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const state = getActiveState();
    const activeList = state.activeConstructions;
    if (!Array.isArray(activeList) || activeList.length === 0) return;

    const theme = getActiveConfig().CANVAS_THEME || {};
    const aaa = theme.worldAAA || {};
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    activeList.forEach(c => {
      const roomKey = c.roomKey;
      let targetNodeId = null;
      Object.keys(nodes).forEach(nId => {
        if (nodes[nId] && nodes[nId].roomKey === roomKey) targetNodeId = nId;
      });
      if (!targetNodeId) return;

      const pos = getPixelPos(targetNodeId);
      const ratio = c.totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - (c.remainingSeconds / c.totalSeconds))) : 0;

      activeCtx.save();
      // Mini-échafaudage au sommet de la chambre
      const topY = pos.y - ((nodes[targetNodeId].ry || 32) * 0.95);
      activeCtx.strokeStyle = '#d69e2e';
      activeCtx.lineWidth = 2.2;
      activeCtx.beginPath();
      activeCtx.moveTo(pos.x - 12, topY + 4);
      activeCtx.lineTo(pos.x, topY - 10);
      activeCtx.lineTo(pos.x + 12, topY + 4);
      activeCtx.stroke();

      // Anneau circulaire de progression doré
      activeCtx.fillStyle = aaa.cooldownRingBg || 'rgba(15, 12, 10, 0.75)';
      activeCtx.beginPath();
      activeCtx.arc(pos.x, topY - 14, 10, 0, Math.PI * 2);
      activeCtx.fill();

      activeCtx.strokeStyle = aaa.cooldownRingFg || '#f6ad55';
      activeCtx.lineWidth = 2.5;
      activeCtx.beginPath();
      activeCtx.arc(pos.x, topY - 14, 8, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
      activeCtx.stroke();

      // Étincelles dorées de creusement
      const sparkA = 0.4 + 0.5 * Math.sin(now * 0.008);
      activeCtx.fillStyle = `rgba(246, 224, 94, ${sparkA})`;
      activeCtx.beginPath();
      activeCtx.arc(pos.x + Math.sin(now * 0.005) * 6, topY - 8, 1.5, 0, Math.PI * 2);
      activeCtx.fill();

      activeCtx.restore();
    });
  }

  function fillCircle(x, y, r, color) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    activeCtx.save();
    activeCtx.fillStyle = color;
    activeCtx.beginPath();
    activeCtx.arc(x, y, r, 0, Math.PI * 2);
    activeCtx.fill();
    activeCtx.restore();
  }

  function drawSurfaceResources(w, surfaceY, season, timestamp = 0) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const theme = getActiveConfig().CANVAS_THEME || {};
    const aaa = theme.worldAAA || {};
    const nowSec = Date.now() / 1000;
    const cooldownMax = (getActiveConfig().CANVAS_INTERACTION && getActiveConfig().CANVAS_INTERACTION.manualHarvestCooldownSeconds) || 3;
    const state = getActiveState();
    const cdLeft = (state.manualHarvestCooldowns && state.manualHarvestCooldowns.left) || 0;
    const cdRight = (state.manualHarvestCooldowns && state.manualHarvestCooldowns.right) || 0;

    activeCtx.save();
    const nodes = theme.nodes || {};
    const leftX = w * ((nodes.surface_left && nodes.surface_left.xRatio) || 0.12);
    for (let i = -2; i <= 2; i++) {
      const lx = leftX + i * 7;
      const ly = surfaceY - 9 - Math.abs(i % 2) * 4;
      activeCtx.fillStyle = (season && season.leafDepositColor) || '#48bb78';
      activeCtx.beginPath();
      activeCtx.ellipse(lx, ly, 6.5, 3.8, i * 0.3, 0, Math.PI * 2);
      activeCtx.fill();
      activeCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      activeCtx.lineWidth = 0.8;
      activeCtx.beginPath();
      activeCtx.moveTo(lx - 4, ly);
      activeCtx.lineTo(lx + 4, ly);
      activeCtx.stroke();
    }

    const rightX = w * ((nodes.surface_right && nodes.surface_right.xRatio) || 0.88);
    for (let i = -2; i <= 2; i++) {
      const sx = rightX + i * 6;
      const sy = surfaceY - 7 - (i % 2) * 3;
      activeCtx.fillStyle = theme.seedCarryColor || '#ecc94b';
      activeCtx.beginPath();
      activeCtx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      activeCtx.fill();
      activeCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      activeCtx.beginPath();
      activeCtx.arc(sx - 1, sy - 1, 1.1, 0, Math.PI * 2);
      activeCtx.fill();
    }

    [[leftX, cdLeft], [rightX, cdRight]].forEach(([dx, cdEnd], idx) => {
      const rem = cdEnd - nowSec;
      if (rem > 0) {
        const ratio = Math.min(1, rem / cooldownMax);
        activeCtx.fillStyle = aaa.cooldownRingBg || 'rgba(15, 12, 10, 0.65)';
        activeCtx.beginPath();
        activeCtx.arc(dx, surfaceY - 12, 11, 0, Math.PI * 2);
        activeCtx.fill();
        activeCtx.strokeStyle = aaa.cooldownRingFg || '#f6ad55';
        activeCtx.lineWidth = 2.2;
        activeCtx.beginPath();
        activeCtx.arc(dx, surfaceY - 12, 9, -Math.PI / 2, -Math.PI / 2 + (1 - ratio) * Math.PI * 2);
        activeCtx.stroke();
      } else {
        const sparkAlpha = 0.35 + 0.45 * Math.sin(timestamp * 0.005 + idx * 2);
        activeCtx.fillStyle = aaa.readySparkleColor || `rgba(246, 224, 94, ${sparkAlpha})`;
        activeCtx.beginPath();
        activeCtx.arc(dx + Math.sin(timestamp * 0.003 + idx) * 8, surfaceY - 18, 1.8, 0, Math.PI * 2);
        activeCtx.fill();
      }
    });
    activeCtx.restore();
  }

  function drawBarricade() {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const state = getActiveState();
    const lvl = (state.rooms && state.rooms.barricade) || 0;
    const pos = getPixelPos('barricade');
    const bTheme = (getActiveConfig().CANVAS_THEME && getActiveConfig().CANVAS_THEME.barricadeVisual) || {};

    activeCtx.save();
    activeCtx.translate(pos.x, pos.y);
    if (lvl <= 0) {
      activeCtx.strokeStyle = 'rgba(166, 152, 136, 0.22)';
      if (typeof activeCtx.setLineDash === 'function') activeCtx.setLineDash([3, 3]);
      activeCtx.lineWidth = 1.5;
      activeCtx.beginPath();
      activeCtx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
      activeCtx.stroke();
      activeCtx.restore();
      return;
    }
    fillEllipse(0, 0, 22 + Math.min(10, lvl * 2), 12, bTheme.shieldGlow || 'rgba(246, 173, 85, 0.35)');
    const logsCount = Math.min(7, 2 + lvl);
    for (let i = 0; i < logsCount; i++) {
      activeCtx.save();
      activeCtx.translate(0, (i - (logsCount - 1) / 2) * 2.5);
      activeCtx.rotate((i % 2 === 0 ? 1 : -1) * 0.18);
      activeCtx.fillStyle = i % 2 === 0 ? (bTheme.woodDark || '#5a381e') : (bTheme.woodLight || '#8b5a2b');
      activeCtx.fillRect(-18, -2.5, 36, 5);
      activeCtx.restore();
    }
    fillCircle(-16, 2, 5, bTheme.stoneColor || '#718096');
    fillCircle(16, 2, 5, bTheme.stoneColor || '#718096');
    activeCtx.fillStyle = bTheme.badgeBg || 'rgba(20, 16, 12, 0.85)';
    activeCtx.strokeStyle = bTheme.badgeBorder || '#dd6b20';
    activeCtx.lineWidth = 1.2;
    activeCtx.beginPath();
    activeCtx.roundRect(22, -9, 54, 17, 6);
    activeCtx.fill();
    activeCtx.stroke();
    activeCtx.fillStyle = bTheme.badgeText || '#f6ad55';
    activeCtx.font = '700 9.5px Outfit, sans-serif';
    activeCtx.textAlign = 'center';
    activeCtx.fillText(`🧱 ${getTranslation('canvas.lvl.short')}${lvl}`, 49, 3);
    activeCtx.restore();
  }

  function drawLivingBridgeEffect(w, surfaceY) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const state = getActiveState();
    const exp = (state && state.exploration) || {};
    const bridges = exp.livingBridges || {};
    if (!bridges.surfaceHarvest) return;

    activeCtx.save();
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const startX = w * 0.38;
    const endX = w * 0.15;
    const midX = (startX + endX) / 2;
    const sagY = surfaceY - 14 + Math.sin(now * 0.003) * 3;

    // Ligne organique du pont
    activeCtx.strokeStyle = 'rgba(237, 137, 54, 0.75)';
    activeCtx.lineWidth = 3.2;
    activeCtx.beginPath();
    activeCtx.moveTo(startX, surfaceY - 5);
    activeCtx.quadraticCurveTo(midX, sagY - 10, endX, surfaceY - 5);
    activeCtx.stroke();

    // 5 fourmis maillons du pont vivant
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const y = (1 - t) * (1 - t) * (surfaceY - 5) + 2 * (1 - t) * t * (sagY - 10) + t * t * (surfaceY - 5);

      activeCtx.fillStyle = '#c05621';
      activeCtx.beginPath();
      activeCtx.ellipse(x, y, 4.5, 2.8, (i % 2 === 0 ? 0.2 : -0.2), 0, Math.PI * 2);
      activeCtx.fill();

      // Mandibules accrochées
      activeCtx.strokeStyle = '#ecc94b';
      activeCtx.lineWidth = 1.2;
      activeCtx.beginPath();
      activeCtx.arc(x, y, 2.5, 0, Math.PI);
      activeCtx.stroke();
    }

    activeCtx.restore();
  }

  function drawAbyssShaftDetails(x, y, rx, ry) {
    const activeCtx = getActiveCtx();
    if (!activeCtx) return;
    const state = getActiveState();
    const exp = (state && state.exploration) || {};
    const depth = Math.max(0, Number(exp.abyssDepth) || 0);
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    activeCtx.save();

    // Puits vertical sombre
    const shaftGrad = activeCtx.createLinearGradient(x, y - ry * 0.5, x, y + ry * 0.85);
    shaftGrad.addColorStop(0, '#1a100a');
    shaftGrad.addColorStop(0.65, '#0c0704');
    shaftGrad.addColorStop(1, depth > 0 ? '#dd6b20' : '#050302');
    activeCtx.fillStyle = shaftGrad;
    activeCtx.beginPath();
    activeCtx.ellipse(x, y + ry * 0.1, rx * 0.75, ry * 0.65, 0, 0, Math.PI * 2);
    activeCtx.fill();

    // Bordure rocheuse fracturée
    activeCtx.strokeStyle = 'rgba(221, 107, 32, 0.4)';
    activeCtx.lineWidth = 2.0;
    activeCtx.beginPath();
    activeCtx.ellipse(x, y + ry * 0.1, rx * 0.78, ry * 0.68, 0, 0, Math.PI * 2);
    activeCtx.stroke();

    // Fumerolles de chaleur géothermique ascendantes
    if (depth > 0) {
      activeCtx.fillStyle = 'rgba(237, 137, 54, 0.35)';
      for (let i = 0; i < 3; i++) {
        const offX = Math.sin(now * 0.003 + i * 2) * (rx * 0.35);
        const offY = -((now * 0.04 + i * 15) % (ry * 0.8));
        activeCtx.beginPath();
        activeCtx.arc(x + offX, y + ry * 0.3 + offY, 2.5 + i, 0, Math.PI * 2);
        activeCtx.fill();
      }
    }

    // Affichage de la strate atteinte
    activeCtx.fillStyle = '#fbd38d';
    activeCtx.font = '700 9px Outfit, sans-serif';
    activeCtx.textAlign = 'center';
    activeCtx.fillText(`⛏️ S.${depth}`, x, y + 3);

    activeCtx.restore();
  }

  // Exposition universelle
  const API = {
    combatParticles,
    floatingTexts,
    seasonalParticles,
    get screenShakeTimer() { return screenShakeTimer; },
    get screenShakeIntensity() { return screenShakeIntensity; },
    initSeasonalParticles,
    updateAndDrawSeasonalParticles,
    triggerScreenShake,
    spawnCanvasFloatingText,
    updateAndDrawFloatingTexts,
    spawnCombatParticle,
    updateAndDrawCombatParticles,
    drawPheromoneTrails,
    drawBioluminescentSpores,
    drawHoverHaloAndTooltip,
    drawQueenChamberDetails,
    drawGranaryDetails,
    drawDormDetails,
    drawFungusDetails,
    drawNurseryDetails,
    drawAphidFarmDetails,
    drawMasonryHallDetails,
    drawSurfaceDomeVentilation,
    drawActiveChamberConstructions,
    drawSurfaceResources,
    drawBarricade,
    drawLivingBridgeEffect,
    drawAbyssShaftDetails
  };

  Object.assign(root, API);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
