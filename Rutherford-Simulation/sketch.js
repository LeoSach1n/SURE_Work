// --- GLOBAL VARIABLES ---
// let is dynamic variable , can be changed
// const is permanently the same

let sessionLog = []; 
let sessionStartTime = Date.now(); //logs the session and activites performed in it
let nucleusPosition;
let particles = [];
let hitMarks = []; 
const SIMULATION_K = 45; 

// declaring k as a much lower value for convenience in the simulation and visualisation
// else the alpha particle would get deflected instantly 

// Data Tracking Variables (NEW)
let statFired = 0;
let statHits = 0;
let statEscaped = 0;

let radiusSlider;
const ALPHA_CHARGE = 2;   

// Z-> Properties 
// using dictionary instead of if/else statements

const ELEMENT_DATA = {
  79: { symbol: 'Au', name: 'Gold', color: [255, 215, 0], radius: 60 },
  47: { symbol: 'Ag', name: 'Silver', color: [210, 210, 210], radius: 45 },
  29: { symbol: 'Cu', name: 'Copper', color: [184, 115, 51], radius: 35 },
  13: { symbol: 'Al', name: 'Aluminum', color: [170, 170, 180], radius: 25 }
};

let currentTargetZ = 79; //default element : Gold
let boxY = 300; // default y coordinate of lead box
let isDraggingBox = false;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); // what is this?
  
  nucleusPosition = createVector(500, 300);

  // We comment these out because we built the sliders directly into the HTML UI!
  // createP('Detector Screen Radius:');
  // radiusSlider = createSlider(100, 280, 220);
  // the radius of the screen can be min 100px , max 280px and 220px by default
}

function draw() {
  background(248, 249, 250);

  // Grab the current element's visual data from our dictionary
  let targetData = ELEMENT_DATA[currentTargetZ];
  
  // --- NEW: Draw the Electric Field first so it sits behind the nucleus ---
  drawElectricField(targetData, currentTargetZ);

  // 1. Draw the Detector Screen (UPDATED TO ARC WITH GAP)
  let currentRadius = document.getElementById('radiusSlider').value;
  let gapAngleDeg = document.getElementById('gapSlider').value;
  
  // Convert angles to radians for p5.js
  let gapCenterRad = radians(gapAngleDeg);
  let gapHalfRad = radians(12); // 24 degree total gap

  push();
  noFill();
  stroke(180); // Lighter grey for the bright UI
  strokeWeight(3);
  drawingContext.setLineDash([10, 10]); 
  // arc() draws a curve from a start angle to an end angle, leaving the gap open
  arc(nucleusPosition.x, nucleusPosition.y, currentRadius * 2, currentRadius * 2, 
      gapCenterRad + gapHalfRad, 
      gapCenterRad - gapHalfRad + TWO_PI);
  drawingContext.setLineDash([]); 
  pop();

  // 2. Draw the Target Nucleus (Dynamic Size & Color & Point Toggle)
  let toggleEl = document.getElementById('pointNucleusToggle');
  let isPoint = toggleEl ? toggleEl.checked : false;
  let currentDrawRadius = isPoint ? 5 : targetData.radius;

  fill(targetData.color);
  stroke(100); 
  strokeWeight(2);
  circle(nucleusPosition.x, nucleusPosition.y, currentDrawRadius * 2);
  
  if (!isPoint) { // Only draw symbol text if it is NOT point-sized
    fill(0);
    noStroke();
    textSize(targetData.radius * 0.6); 
    textAlign(CENTER, CENTER);
    text(targetData.symbol, nucleusPosition.x, nucleusPosition.y);
  }

  // 3. Draw the Scintillation Marks (Darker for bright UI)
  for (let mark of hitMarks) {
    fill(200, 0, 0); // Dark red hits
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  // 4. Draw the Draggable Lead Box (Shiny Metallic)
  push();
  rectMode(CENTER);
  fill(160, 160, 165); // Lighter metallic grey
  stroke(100);
  strokeWeight(2);
  if (isDraggingBox) stroke(0, 150, 255); // Highlight blue when dragging
  rect(30, boxY, 40, 80, 5); 
  
  fill(30); // Dark slit
  noStroke();
  rect(45, boxY, 15, 8); 
  pop();

  // 5. Process Particles (UPDATED WITH STATE MACHINE)
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.applyRepulsion(nucleusPosition, currentTargetZ);
    p.update(nucleusPosition); 
    p.show();

    // --- THE UPDATED STATE MACHINE ROUTER ---
    if (p.state === 'HIT') {
      hitMarks.push(createVector(p.pos.x, p.pos.y));
      if (hitMarks.length > 50) hitMarks.splice(0, 1);
      
      statHits++;
      document.getElementById('statHits').innerText = statHits;
      particles.splice(i, 1); // Delete the particle because it hit a wall
    } 
    else if (p.state === 'ESCAPED') {
      statEscaped++;
      document.getElementById('statEscaped').innerText = statEscaped;
      
      // IMPORTANT: Do not splice (delete) it here!
      // Change state to FLYING_AWAY so we don't count it again.
      p.state = 'FLYING_AWAY'; 
    }
    else if (p.state === 'BLOCKED') {
      particles.splice(i, 1); // Delete instantly (crashed into outside of screen without hitting)
    }
    else if (p.pos.x > width + 50 || p.pos.y < -50 || p.pos.y > height + 50 || p.pos.x < -50) {
      // THE FAILSAFE: Deletes FLYING_AWAY particles once off screen.
      particles.splice(i, 1);
    }
  }
}

// --- INTERACTIVITY ---
function mousePressed() {
  if (mouseX > 10 && mouseX < 50 && mouseY > boxY - 40 && mouseY < boxY + 40) isDraggingBox = true;
  // if the x coord of the mouse click is between box x range and similarly for y coord , then box is
  // being dragged
}
function mouseDragged() {
  if (isDraggingBox) boxY = constrain(mouseY, 50, height - 50); 
  // where is this height defined? i assume that in the line: boxY = constrain(mouseY,50,height-50)
  // the mouseY is telling the new y coord , 50 and height-50 are the limits that boxY cant go beyond these limits
  // on both sides
}
function mouseReleased() {
  isDraggingBox = false;
}

// --- HTML TRIGGER FUNCTIONS ---
function setElement(z, btnElement) {
  currentTargetZ = z;
  let buttons = document.getElementsByClassName('element-tile');
  for (let b of buttons) { b.classList.remove('active'); }
  btnElement.classList.add('active');

  logEvent('CHANGED_ELEMENT'); // Log this element change event for analytics
}

function fireNewParticle() {
  let energy = document.getElementById('energySlider').value;
  // energy slider defined in index.html , the min value is 2 , max is 15 , and default is 8
  particles.push(new AlphaParticle(45, boxY, parseFloat(energy)));
  // the particles original x,y coord , the KE with which it is shot
  
  // UPDATE LIVE STATS
  statFired++;
  document.getElementById('statFired').innerText = statFired;

  logEvent('FIRED_SINGLE'); // Log this firing event for analytics
}

function fireBurst() {
  let energy = document.getElementById('energySlider').value;
  for (let i = 0; i < 20; i++) { // 20 alpha particles are fired at once in a random 51px range 
    let spreadY = boxY + random(-25, 25);
    particles.push(new AlphaParticle(45, spreadY, parseFloat(energy)));
  }
  
  // UPDATE LIVE STATS
  statFired += 20;
  document.getElementById('statFired').innerText = statFired;
  logEvent('FIRED_BURST'); // Log this burst event for analytics
}

// NEW: Function to reset the lab
function clearExperiment() {
  particles = [];
  hitMarks = [];
  statFired = 0; statHits = 0; statEscaped = 0;
  document.getElementById('statFired').innerText = 0;
  document.getElementById('statHits').innerText = 0;
  document.getElementById('statEscaped').innerText = 0;
  logEvent('CLEARED_DATA'); // Log this event for analytics
}

// ---------------------------------------------------------
class AlphaParticle {
  constructor(startX, startY, startSpeed) {
    this.pos = createVector(startX, startY);
    this.vel = createVector(startSpeed, 0); 
    this.acc = createVector(0, 0); 
    // acceleration is 0 , the alpha particle only has KE at the start , and starts to feel a 
    // repulsive force which gives it a negative acceleration
    this.history = []; 
    
    // We start outside the detector screen using a State Machine
    this.state = 'OUTSIDE'; 
  }

  applyRepulsion(targetVector, targetZ) {
    let force = p5.Vector.sub(this.pos, targetVector);
    let distance = force.mag();
    
    // Check if nucleus is point-sized to determine how close particle can get
    let toggleEl = document.getElementById('pointNucleusToggle');
    let isPoint = toggleEl ? toggleEl.checked : false;
    let physicsRadius = isPoint ? 5 : (targetVector.radius || 15);
    
    distance = constrain(distance, physicsRadius, 1000); 

    let forceMagnitude = (SIMULATION_K * ALPHA_CHARGE * targetZ) / (distance * distance);
    force.setMag(forceMagnitude);
    this.acc.add(force);
    // didnt understand whats happening here other than the force mag calculation
  }

  update(nucleusPos) {
    this.vel.add(this.acc); 
    this.pos.add(this.vel); 
    this.acc.mult(0); 
    // velocity changes as the particle experiences an acc
    // position changes as the vel changes
    // acc is initialised to 0 at each frame so it doesnt compound through the experiment

    this.history.push(createVector(this.pos.x, this.pos.y));
    if (this.history.length > 50) this.history.splice(0, 1);

    let currentRadius = document.getElementById('radiusSlider').value;
    let distToNucleus = p5.Vector.dist(this.pos, nucleusPos); // updating the dist b/w nucleas and alpha
    
    // Calculate current angle relative to the nucleus
    let angle = atan2(this.pos.y - nucleusPos.y, this.pos.x - nucleusPos.x); 
    let angleDeg = degrees(angle);
    if (angleDeg < 0) angleDeg += 360; 

    // Calculate gap boundaries
    let gapCenter = parseInt(document.getElementById('gapSlider').value);
    let gapHalfWidth = 12; // 24 degree wide opening
    let diff = Math.abs(angleDeg - gapCenter) % 360;
    let shortestDiff = diff > 180 ? 360 - diff : diff;
    let isInGap = shortestDiff <= gapHalfWidth;

    // --- THE FINITE STATE MACHINE ---
    if (this.state === 'OUTSIDE') {
      // Is it crossing the boundary moving INWARDS?
      if (distToNucleus < currentRadius) {
        if (isInGap) {
          this.state = 'INSIDE'; // Safely entered through the gap
        } else {
          this.state = 'HIT'; // BACKSCATTERING HIT: Crashed into outer wall and leaves a mark!
        }
      }
    } 
    else if (this.state === 'INSIDE') {
      // Is it crossing the boundary moving OUTWARDS?
      if (distToNucleus >= currentRadius) {
        if (isInGap) {
          this.state = 'ESCAPED'; // Found the exit hole
        } else {
          this.state = 'HIT'; // Hit inner wall (Scintillation!)
        }
      }
    }
  }

  show() {
    // Red trails
    noFill();
    stroke(220, 50, 50, 150);
    strokeWeight(2);
    beginShape();
    for (let pt of this.history) { vertex(pt.x, pt.y); }
    endShape();

    // Solid red particle
    noStroke();
    fill(200, 30, 30);
    circle(this.pos.x, this.pos.y, 14);

    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text('α', this.pos.x, this.pos.y);
  }
}

// where is particles elements input being given , what is it even storing? the x,y coords of alpha particle?
// how does hasHitScreen know that the particle has hit the screen?
// what is p.update(nucleasPosition) doing

// --- NEW VISUALIZATION FUNCTION ---
function drawElectricField(targetData, zValue) {
  // 1. Check if the user turned the toggle off
  let showField = document.getElementById('fieldToggle').checked;
  if (!showField) return; // If off, exit the function immediately

  push();
  noFill();
  
  // 2. Calculate the visual reach of the field based on the element's charge (Z)
  // Gold (79) will reach out ~316 pixels. Aluminum (13) will only reach ~52 pixels.
  let maxFieldReach = zValue * 4; 
  
  // 3. Draw concentric rings starting just outside the nucleus
  for (let r = targetData.radius + 15; r < maxFieldReach; r += 20) {
    
    // 4. Calculate Opacity: Strong near the center, fading to 0 at the edge
    // map() takes a value (r) within a current range, and translates it to a new range (opacity)
    let opacity = map(r, targetData.radius, maxFieldReach, 120, 0);
    
    // Use the color of the target element, but apply our calculated fading opacity
    stroke(targetData.color[0], targetData.color[1], targetData.color[2], opacity);
    strokeWeight(1.5);
    
    // Draw the ring
    circle(nucleusPosition.x, nucleusPosition.y, r * 2);
  }
  pop();
}

//logging function to track user interactions and lab state changes for analytics and debugging purposes
function logEvent(eventName) {
  let currentZ = currentTargetZ;
  let currentEnergy = document.getElementById('energySlider').value;
  let currentGap = document.getElementById('gapSlider').value;
  
  let toggleEl = document.getElementById('pointNucleusToggle');
  let isPointSizedChecked = toggleEl ? toggleEl.checked : false;

  let eventPayload = {
    timestamp: new Date().toISOString(),
    timeSinceStartMs: Date.now() - sessionStartTime,
    action: eventName,
    labState: {
      targetZ: currentZ,
      beamEnergy: parseInt(currentEnergy),
      detectorGapAngle: parseInt(currentGap),
      isPointSized: isPointSizedChecked // Logs if the point nucleus toggle is active
    },
    currentStats: {
      fired: statFired,
      hits: statHits,
      escaped: statEscaped
    }
  };

  sessionLog.push(eventPayload);
  console.log("Telemetry Logged:", eventPayload); // Prints to your browser console
}