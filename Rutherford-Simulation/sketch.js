// --- GLOBAL VARIABLES ---
let sessionLog = []; 
let sessionStartTime = Date.now(); 
let nucleusPosition;
let particles = [];
let hitMarks = []; 
const SIMULATION_K = 45; 

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
const BOX_Y = 300; // Fixed Y coordinate for the lead box

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  nucleusPosition = createVector(500, 300);
}

function draw() {
  background(248, 249, 250);

  let targetData = ELEMENT_DATA[currentTargetZ];
  
  // Draw the Electric Field first so it sits behind the nucleus
  drawElectricField(targetData, currentTargetZ);

  // 1. Draw the Detector Screen (Fixed Gap)
  let currentRadius = document.getElementById('radiusSlider').value;
  
  // Hardcode the gap to face the lead box (180 degrees / PI radians)
  let gapCenterRad = PI; 
  let gapHalfRad = radians(12); // 24 degree total gap

  push();
  noFill();
  stroke(180); 
  strokeWeight(3);
  drawingContext.setLineDash([10, 10]); 
  arc(nucleusPosition.x, nucleusPosition.y, currentRadius * 2, currentRadius * 2, 
      gapCenterRad + gapHalfRad, 
      gapCenterRad - gapHalfRad + TWO_PI);
  drawingContext.setLineDash([]); 
  pop();

  // 2. Draw the Target Nucleus
  let toggleEl = document.getElementById('pointNucleusToggle');
  let isPoint = toggleEl ? toggleEl.checked : false;
  let currentDrawRadius = isPoint ? 5 : targetData.radius;

  fill(targetData.color);
  stroke(100); 
  strokeWeight(2);
  circle(nucleusPosition.x, nucleusPosition.y, currentDrawRadius * 2);
  
  if (!isPoint) { 
    fill(0);
    noStroke();
    textSize(targetData.radius * 0.6); 
    textAlign(CENTER, CENTER);
    text(targetData.symbol, nucleusPosition.x, nucleusPosition.y);
  }

  // 3. Draw the Scintillation Marks
  for (let mark of hitMarks) {
    fill(200, 0, 0); 
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  // 4. Draw the Fixed Lead Box
  push();
  rectMode(CENTER);
  fill(160, 160, 165); 
  stroke(100);
  strokeWeight(2);
  rect(30, BOX_Y, 40, 80, 5); 
  
  fill(30); 
  noStroke();
  rect(45, BOX_Y, 15, 8); 
  pop();

  // 5. Process Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.applyRepulsion(nucleusPosition, currentTargetZ);
    p.update(nucleusPosition); 
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

  logEvent('CHANGED_ELEMENT'); 
}

function fireNewParticle() {
  let energy = document.getElementById('energySlider').value;
  particles.push(new AlphaParticle(45, BOX_Y + random(-30,30), parseFloat(energy)));
  
  statFired++;
  document.getElementById('statFired').innerText = statFired;
  logEvent('FIRED_SINGLE'); 
}

function fireBurst() {
  let energy = document.getElementById('energySlider').value;
  for (let i = 0; i < 20; i++) { 
    let spreadY = BOX_Y + random(-30, 30);
    particles.push(new AlphaParticle(45, spreadY, parseFloat(energy)));
  }
  
  statFired += 20;
  document.getElementById('statFired').innerText = statFired;
  logEvent('FIRED_BURST'); 
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

  applyRepulsion(targetVector, targetZ) {
    let force = p5.Vector.sub(this.pos, targetVector);
    let distance = force.mag();
    
    let toggleEl = document.getElementById('pointNucleusToggle');
    let isPoint = toggleEl ? toggleEl.checked : false;
    let physicsRadius = isPoint ? 5 : (targetVector.radius || 15);
    
    distance = constrain(distance, physicsRadius, 1000); 

    let forceMagnitude = (SIMULATION_K * ALPHA_CHARGE * targetZ) / (distance * distance);
    force.setMag(forceMagnitude);
    this.acc.add(force);
  }

  update(nucleusPos) {
    this.vel.add(this.acc); 
    this.pos.add(this.vel); 
    this.acc.mult(0); 

    this.history.push(createVector(this.pos.x, this.pos.y));
    if (this.history.length > 50) this.history.splice(0, 1);

    let currentRadius = document.getElementById('radiusSlider').value;
    let distToNucleus = p5.Vector.dist(this.pos, nucleusPos); 
    
    let angle = atan2(this.pos.y - nucleusPos.y, this.pos.x - nucleusPos.x); 
    let angleDeg = degrees(angle);
    if (angleDeg < 0) angleDeg += 360; 

    // Hardcode gap logic to exactly 180 degrees
    let gapCenter = 180; 
    let gapHalfWidth = 12; 
    let diff = Math.abs(angleDeg - gapCenter) % 360;
    let shortestDiff = diff > 180 ? 360 - diff : diff;
    let isInGap = shortestDiff <= gapHalfWidth;

    if (this.state === 'OUTSIDE') {
      if (distToNucleus < currentRadius) {
        if (isInGap) {
          this.state = 'INSIDE'; 
        } else {
          this.state = 'HIT'; 
        }
      }
    } 
    else if (this.state === 'INSIDE') {
      if (distToNucleus >= currentRadius) {
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

function drawElectricField(targetData, zValue) {
  let showField = document.getElementById('fieldToggle').checked;
  if (!showField) return; 

  push();
  noFill();
  
  let maxFieldReach = zValue * 4; 
  
  for (let r = targetData.radius + 15; r < maxFieldReach; r += 20) {
    let opacity = map(r, targetData.radius, maxFieldReach, 120, 0);
    
    stroke(targetData.color[0], targetData.color[1], targetData.color[2], opacity);
    strokeWeight(1.5);
    
    circle(nucleusPosition.x, nucleusPosition.y, r * 2);
  }
  pop();
}

function logEvent(eventName) {
  let currentZ = currentTargetZ;
  let currentEnergy = document.getElementById('energySlider').value;
  
  let toggleEl = document.getElementById('pointNucleusToggle');
  let isPointSizedChecked = toggleEl ? toggleEl.checked : false;

  let eventPayload = {
    timestamp: new Date().toISOString(),
    timeSinceStartMs: Date.now() - sessionStartTime,
    action: eventName,
    labState: {
      targetZ: currentZ,
      beamEnergy: parseInt(currentEnergy),
      isPointSized: isPointSizedChecked 
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