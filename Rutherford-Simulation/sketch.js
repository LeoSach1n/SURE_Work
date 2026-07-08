// --- GLOBAL VARIABLES ---
let sessionLog = []; 
let sessionStartTime = Date.now(); 
let SCREEN_CENTER;
let nucleiPositions = []; 
let particles = [];
const SIMULATION_K = 179.8; 

// Histogram Tracking
let histogramBins = [];
const TOTAL_BINS = 180; 
let histogramCache;
let needsHistogramUpdate = false;

// Data Tracking Variables
let statFired = 0;
let statHits = 0;
let statEscaped = 0;

const ALPHA_CHARGE = 2;   

// Z-> Properties 
const ELEMENT_DATA = {
  13: { symbol: 'Al', name: 'Aluminum', color: [170, 170, 180], radius: 25 },
  79: { symbol: 'Au', name: 'Gold', color: [255, 215, 0], radius: 60 },
  47: { symbol: 'Ag', name: 'Silver', color: [210, 210, 210], radius: 45 },
  29: { symbol: 'Cu', name: 'Copper', color: [184, 115, 51], radius: 35 }
};

let currentTargetZ = 13; 
const BOX_Y = 300; 

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  SCREEN_CENTER = createVector(500, 300);

  let spacing = 40;
  for (let i = -2; i <= 2; i++) {
    nucleiPositions.push(createVector(SCREEN_CENTER.x, SCREEN_CENTER.y + (i * spacing)));
  }

  for (let i = 0; i < TOTAL_BINS; i++) {
    histogramBins[i] = 0;
  }
}

// Helper function to return constant radius based on selected element
function getCurrentRadius() {
  if (currentTargetZ === 79 || currentTargetZ === 47) {
    return 265; // Constant value for Au and Ag
  } else {
    return 220; // Constant value for Al and Cu
  }
}

function draw() {
  background(248, 249, 250);

  let targetData = ELEMENT_DATA[currentTargetZ];
  let isSingleNucleus = document.getElementById('singleNucleusToggle').checked;
  let isContinuousBeam = document.getElementById('continuousBeamToggle').checked;
  
  if (isContinuousBeam && frameCount % 9 === 0) {
    let energy = document.getElementById('energySlider').value;
    particles.push(new AlphaParticle(45, BOX_Y + random(-30, 30), parseFloat(energy)));
    statFired++;
    document.getElementById('statFired').innerText = statFired;
  }
  
  let activeNuclei = isSingleNucleus ? [SCREEN_CENTER] : nucleiPositions;
  
  drawElectricFields(targetData, currentTargetZ, activeNuclei);

  // 1. Draw the Detector Screen Base Ring
  let currentRadius = getCurrentRadius();
  let gapCenterRad = PI; 
  let gapHalfRad = radians(12); 

  push();
  noFill();
  stroke(180); 
  strokeWeight(3);
  drawingContext.setLineDash([10, 10]); 
  arc(SCREEN_CENTER.x, SCREEN_CENTER.y, currentRadius * 2, currentRadius * 2, 
      gapCenterRad + gapHalfRad, 
      gapCenterRad - gapHalfRad + TWO_PI);
  drawingContext.setLineDash([]); 
  pop();

  // 2. Render the Optimized Histogram
  drawHistogram(currentRadius);

  // 3. Draw the Targets
  if (!isSingleNucleus) {
    push();
    rectMode(CENTER);
    fill(220, 220, 225, 150); 
    stroke(120);
    strokeWeight(1.5);
    rect(SCREEN_CENTER.x, SCREEN_CENTER.y, 40, 220, 4);
    pop();
  }

  for (let pos of activeNuclei) {
    fill(targetData.color);
    stroke(80); 
    strokeWeight(1.5);
    circle(pos.x, pos.y, 8); 
  }

  // 4. Draw Lead Firing Box
  push();
  rectMode(CENTER);
  fill(160, 160, 165); 
  stroke(100);
  strokeWeight(2);
  rect(30, BOX_Y, 40, 80, 5); 
  
  fill(30); 
  noStroke();
  rect(45, BOX_Y, 15, 8); 

  if (isContinuousBeam) {
    let pulseAlpha = 150 + 105 * sin(frameCount * 0.2);
    fill(255, 50, 50, pulseAlpha);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'red';
    rect(45, BOX_Y, 15, 8); 
    drawingContext.shadowBlur = 0; 
  }
  pop();

  // 5. Process Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.applyRepulsion(activeNuclei, currentTargetZ, isSingleNucleus);
    p.update(SCREEN_CENTER); 
    p.show();

    if (p.state === 'HIT') {
      let hitAngle = atan2(p.pos.y - SCREEN_CENTER.y, p.pos.x - SCREEN_CENTER.x);
      if (hitAngle < 0) hitAngle += TWO_PI;
      
      let binIndex = floor(map(hitAngle, 0, TWO_PI, 0, TOTAL_BINS));
      if (binIndex >= 0 && binIndex < TOTAL_BINS) {
        histogramBins[binIndex]++;
        needsHistogramUpdate = true; 
      }

      statHits++;
      document.getElementById('statHits').innerText = statHits;
      particles.splice(i, 1); 
    } 
    else if (p.state === 'ESCAPED') {
      statEscaped++;
      document.getElementById('statEscaped').innerText = statEscaped;
      p.state = 'FLYING_AWAY'; 
    }
    else if (p.pos.x > width + 50 || p.pos.y < -50 || p.pos.y > height + 50 || p.pos.x < -50) {
      particles.splice(i, 1);
    }
  }
}

// --- HIGH-PERFORMANCE HISTOGRAM GRAPHICS OVERLAY ---
function drawHistogram(radius) {
  if (!histogramCache) {
    histogramCache = createGraphics(width, height);
  }

  if (needsHistogramUpdate || frameCount === 1) {
    histogramCache.clear();
    histogramCache.push();
    histogramCache.translate(SCREEN_CENTER.x, SCREEN_CENTER.y);
    
    let angularWidth = TWO_PI / TOTAL_BINS;
    let maxBinValue = Math.max(...histogramBins, 1);

    for (let i = 0; i < TOTAL_BINS; i++) {
      if (histogramBins[i] === 0) continue;

      let angle = i * angularWidth;
      let barHeight = map(histogramBins[i], 0, maxBinValue, 2, 35);

      histogramCache.push();
      histogramCache.rotate(angle + angularWidth / 2);
      
      histogramCache.fill(220, 53, 69, 200);
      histogramCache.stroke(180, 20, 30);
      histogramCache.strokeWeight(1);
      
      histogramCache.rect(radius, -2, barHeight, 4, 1);
      histogramCache.pop();
    }
    histogramCache.pop();
    needsHistogramUpdate = false;
  }

  image(histogramCache, 0, 0);
}

// --- HTML TRIGGER FUNCTIONS ---
function setElement(z, btnElement) {
  currentTargetZ = z;
  let buttons = document.getElementsByClassName('element-tile');
  for (let b of buttons) { b.classList.remove('active'); }
  btnElement.classList.add('active');

  let eSlider = document.getElementById('energySlider');
  if (eSlider) {
    if (z === 13) eSlider.value = 25;      
    else if (z === 29) eSlider.value = 38; 
    else if (z === 47) eSlider.value = 45; 
    else if (z === 79) eSlider.value = 60; 
  }

  // Force histogram buffer to recalculate when screen radius shifts between elements
  needsHistogramUpdate = true;
  
  logEvent('CHANGED_ELEMENT'); 
}

function fireNewParticle() {
  let energy = document.getElementById('energySlider').value;
  particles.push(new AlphaParticle(45, BOX_Y + random(-25, 25), parseFloat(energy)));
  statFired++;
  document.getElementById('statFired').innerText = statFired;
  logEvent('FIRED_SINGLE'); 
}

function fireBurst() {
  let energy = document.getElementById('energySlider').value;
  for (let i = 0; i < 20; i++) { 
    let spreadY = BOX_Y + random(-25, 25);
    particles.push(new AlphaParticle(45, spreadY, parseFloat(energy)));
  }
  statFired += 20;
  document.getElementById('statFired').innerText = statFired;
  logEvent('FIRED_BURST'); 
}

function toggleContinuousBeam() {
  let isContinuous = document.getElementById('continuousBeamToggle').checked;
  logEvent(isContinuous ? 'CONTINUOUS_BEAM_STARTED' : 'CONTINUOUS_BEAM_STOPPED');
}

function clearExperiment() {
  particles = [];
  statFired = 0; statHits = 0; statEscaped = 0;
  
  for (let i = 0; i < TOTAL_BINS; i++) {
    histogramBins[i] = 0;
  }
  if (histogramCache) histogramCache.clear();
  
  document.getElementById('statFired').innerText = 0;
  document.getElementById('statHits').innerText = 0;
  document.getElementById('statEscaped').innerText = 0;
  logEvent('CLEARED_DATA'); 
}

// ---------------------------------------------------------
class AlphaParticle {
  constructor(startX, startY, startSpeed) {
    this.pos = createVector(startX, startY);
    this.vel = createVector(startSpeed, 0); 
    this.acc = createVector(0, 0); 
    this.history = []; 
    this.state = 'OUTSIDE'; 
  }

  applyRepulsion(nucleiArray, targetZ, isSingle) {
    for (let nucPos of nucleiArray) {
      let force = p5.Vector.sub(this.pos, nucPos);
      let distance = force.mag();
      
      let physicsRadius = 4; 
      distance = constrain(distance, physicsRadius, 1000); 

      let forceMagnitude = (SIMULATION_K * ALPHA_CHARGE * targetZ) / (distance * distance);
      if (!isSingle) {
        forceMagnitude *= 0.4; 
      }
      
      force.setMag(forceMagnitude);
      this.acc.add(force); 
    }
  }

  update(centerPos) {
    this.vel.add(this.acc); 
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.history.push(createVector(this.pos.x, this.pos.y));
    if (this.history.length > 50) this.history.splice(0, 1);

    let currentRadius = getCurrentRadius();
    let distToCenter = p5.Vector.dist(this.pos, centerPos); 
    
    let angle = atan2(this.pos.y - centerPos.y, this.pos.x - centerPos.x); 
    let angleDeg = degrees(angle);
    if (angleDeg < 0) angleDeg += 360; 

    let gapCenter = 180; 
    let gapHalfWidth = 12; 
    let diff = Math.abs(angleDeg - gapCenter) % 360;
    let shortestDiff = diff > 180 ? 360 - diff : diff;
    let isInGap = shortestDiff <= gapHalfWidth;

    if (this.state === 'OUTSIDE') {
      if (distToCenter < currentRadius) {
        if (isInGap) {
          this.state = 'INSIDE'; 
        } else {
          this.state = 'HIT'; 
        }
      }
    } 
    else if (this.state === 'INSIDE') {
      if (distToCenter >= currentRadius) {
        if (isInGap) {
          this.state = 'ESCAPED'; 
        } else {
          this.state = 'HIT'; 
        }
      }
    }
  }

  show() {
    noFill();
    stroke(220, 50, 50, 150);
    strokeWeight(2);
    beginShape();
    for (let pt of this.history) { vertex(pt.x, pt.y); }
    endShape();

    noStroke();
    fill(200, 30, 30);
    circle(this.pos.x, this.pos.y, 14);

    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text('α', this.pos.x, this.pos.y);
  }
}

let fieldCache;
let lastFieldZ = -1;
let lastNucleiCount = -1;

function drawElectricFields(targetData, zValue, activeNuclei) {
  let showField = document.getElementById('fieldToggle').checked;
  if (!showField) return; 

  if (!fieldCache) {
    fieldCache = createGraphics(width, height);
  }

  if (zValue !== lastFieldZ || activeNuclei.length !== lastNucleiCount) {
    fieldCache.clear(); 
    fieldCache.noFill();
    
    let maxFieldReach = zValue * 3; 
    
    for (let pos of activeNuclei) {
      for (let r = 15; r < maxFieldReach; r += 20) {
        let opacity = map(r, 10, maxFieldReach, 80, 0); 
        
        fieldCache.stroke(targetData.color[0], targetData.color[1], targetData.color[2], opacity);
        fieldCache.strokeWeight(1);
        
        fieldCache.circle(pos.x, pos.y, r * 2);
      }
    }
    lastFieldZ = zValue;
    lastNucleiCount = activeNuclei.length;
  }
  image(fieldCache, 0, 0);
}

function logEvent(eventName) {
  let currentZ = currentTargetZ;
  let currentEnergy = document.getElementById('energySlider').value;
  let singleToggle = document.getElementById('singleNucleusToggle');
  let isSingleMode = singleToggle ? singleToggle.checked : false;

  let eventPayload = {
    timestamp: new Date().toISOString(),
    timeSinceStartMs: Date.now() - sessionStartTime,
    action: eventName,
    labState: { targetZ: currentZ, beamEnergy: parseInt(currentEnergy), isSingleNucleus: isSingleMode },
    currentStats: { fired: statFired, hits: statHits, escaped: statEscaped }
  };
  sessionLog.push(eventPayload);
}