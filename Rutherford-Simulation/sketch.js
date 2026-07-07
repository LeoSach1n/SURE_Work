// --- GLOBAL VARIABLES ---
let sessionLog = []; 
let sessionStartTime = Date.now(); 
let SCREEN_CENTER;
let nucleiPositions = []; 
let particles = [];
let hitMarks = []; 
const SIMULATION_K = 179.8; 

// Data Tracking Variables
let statFired = 0;
let statHits = 0;
let statEscaped = 0;

const ALPHA_CHARGE = 2;   

// Z-> Properties 
const ELEMENT_DATA = {
  79: { symbol: 'Au', name: 'Gold', color: [255, 215, 0], radius: 60 },
  47: { symbol: 'Ag', name: 'Silver', color: [210, 210, 210], radius: 45 },
  29: { symbol: 'Cu', name: 'Copper', color: [184, 115, 51], radius: 35 },
  13: { symbol: 'Al', name: 'Aluminum', color: [170, 170, 180], radius: 25 }
};

let currentTargetZ = 79; 
const BOX_Y = 300; 

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  SCREEN_CENTER = createVector(500, 300);

  let spacing = 40;
  for (let i = -2; i <= 2; i++) {
    nucleiPositions.push(createVector(SCREEN_CENTER.x, SCREEN_CENTER.y + (i * spacing)));
  }
}

function draw() {
  background(248, 249, 250);

  let targetData = ELEMENT_DATA[currentTargetZ];
  let isSingleNucleus = document.getElementById('singleNucleusToggle').checked;
  let isContinuousBeam = document.getElementById('continuousBeamToggle').checked;
  
  // --- CONTINUOUS BEAM LOGIC ---
  // Fires 1 particle roughly every 0.15 seconds (9 frames at 60 FPS)
  if (isContinuousBeam && frameCount % 9 === 0) {
    let energy = document.getElementById('energySlider').value;
    // Slightly tighter spread for continuous beam to look like a steady stream
    particles.push(new AlphaParticle(45, BOX_Y + random(-30, 30), parseFloat(energy)));
    statFired++;
    document.getElementById('statFired').innerText = statFired;
  }
  
  let activeNuclei = isSingleNucleus ? [SCREEN_CENTER] : nucleiPositions;
  
  drawElectricFields(targetData, currentTargetZ, activeNuclei);

  // 1. Draw the Detector Screen
  let currentRadius = document.getElementById('radiusSlider').value;
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

  // 2. Draw the Targets
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

  // 3. Draw the Scintillation Marks
  for (let mark of hitMarks) {
    fill(200, 0, 0); 
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  // 4. Draw the Fixed Lead Box & Beam Animation
  push();
  rectMode(CENTER);
  fill(160, 160, 165); 
  stroke(100);
  strokeWeight(2);
  rect(30, BOX_Y, 40, 80, 5); 
  
  // The default dark slit
  fill(30); 
  noStroke();
  rect(45, BOX_Y, 15, 8); 

  // Glowing red animation when the beam is actively firing
  if (isContinuousBeam) {
    // Math.sin creates a smooth pulsing visual effect
    let pulseAlpha = 150 + 105 * sin(frameCount * 0.2);
    fill(255, 50, 50, pulseAlpha);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'red';
    rect(45, BOX_Y, 15, 8); 
    drawingContext.shadowBlur = 0; // reset shadow
  }
  pop();

  // 5. Process Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.applyRepulsion(activeNuclei, currentTargetZ, isSingleNucleus);
    p.update(SCREEN_CENTER); 
    p.show();

    if (p.state === 'HIT') {
      hitMarks.push(createVector(p.pos.x, p.pos.y));
      if (hitMarks.length > 50) hitMarks.splice(0, 1);
      
      statHits++;
      document.getElementById('statHits').innerText = statHits;
      particles.splice(i, 1); 
    } 
    else if (p.state === 'ESCAPED') {
      statEscaped++;
      document.getElementById('statEscaped').innerText = statEscaped;
      p.state = 'FLYING_AWAY'; 
    }
    else if (p.state === 'BLOCKED') {
      particles.splice(i, 1); 
    }
    else if (p.pos.x > width + 50 || p.pos.y < -50 || p.pos.y > height + 50 || p.pos.x < -50) {
      particles.splice(i, 1);
    }
  }
}

// --- HTML TRIGGER FUNCTIONS ---
function setElement(z, btnElement) {
  currentTargetZ = z;
  let buttons = document.getElementsByClassName('element-tile');
  for (let b of buttons) { b.classList.remove('active'); }
  btnElement.classList.add('active');

  // Auto-adjust energy slider based on the chosen element
  let eSlider = document.getElementById('energySlider');
  if (eSlider) {
    if (z === 13) eSlider.value = 25;      // Al: Minimum
    else if (z === 29) eSlider.value = 31; // Cu: ~25% 
    else if (z === 47) eSlider.value = 38; // Ag: ~50%
    else if (z === 79) eSlider.value = 50; // Au: Maximum
  }

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
  hitMarks = [];
  statFired = 0; statHits = 0; statEscaped = 0;
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

    let currentRadius = document.getElementById('radiusSlider').value;
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

function drawElectricFields(targetData, zValue, activeNuclei) {
  let showField = document.getElementById('fieldToggle').checked;
  if (!showField) return; 

  push();
  noFill();
  
  let maxFieldReach = zValue * 3; 
  
  for (let pos of activeNuclei) {
    for (let r = 15; r < maxFieldReach; r += 20) {
      let opacity = map(r, 10, maxFieldReach, 80, 0); 
      
      stroke(targetData.color[0], targetData.color[1], targetData.color[2], opacity);
      strokeWeight(1);
      
      circle(pos.x, pos.y, r * 2);
    }
  }
  pop();
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
    labState: {
      targetZ: currentZ,
      beamEnergy: parseInt(currentEnergy),
      isSingleNucleus: isSingleMode
    },
    currentStats: {
      fired: statFired,
      hits: statHits,
      escaped: statEscaped
    }
  };

  sessionLog.push(eventPayload);
  console.log("Telemetry Logged:", eventPayload); 
}