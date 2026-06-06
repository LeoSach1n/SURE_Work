// --- GLOBAL VARIABLES ---
let nucleusPosition;
let particles = [];
let hitMarks = []; 
const SIMULATION_K = 200; 
let radiusSlider;
const ALPHA_CHARGE = 2;   

// Z-> Properties 
const ELEMENT_DATA = {
  79: { symbol: 'Au', name: 'Gold', color: [255, 215, 0], radius: 60 },
  47: { symbol: 'Ag', name: 'Silver', color: [210, 210, 210], radius: 45 },
  29: { symbol: 'Cu', name: 'Copper', color: [184, 115, 51], radius: 35 },
  13: { symbol: 'Al', name: 'Aluminum', color: [170, 170, 180], radius: 25 }
};

let currentTargetZ = 79;
let boxY = 300;
let isDraggingBox = false;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  nucleusPosition = createVector(500, 300);

  createP('Detector Screen Radius:');
  radiusSlider = createSlider(100, 280, 220);
}

function draw() {
  background(248, 249, 250);

  // Grab the current element's visual data from our dictionary
  let targetData = ELEMENT_DATA[currentTargetZ];

  // 1. Draw the Detector Screen
  push();
  noFill();
  stroke(180); // Lighter grey for the bright UI
  strokeWeight(3);
  drawingContext.setLineDash([10, 10]); 
  circle(nucleusPosition.x, nucleusPosition.y, radiusSlider.value() * 2);
  drawingContext.setLineDash([]); 
  pop();

  // 2. Draw the Target Nucleus (Dynamic Size & Color)
  fill(targetData.color);
  stroke(100); 
  strokeWeight(2);
  circle(nucleusPosition.x, nucleusPosition.y, targetData.radius * 2);
  
  fill(0);
  noStroke();
  textSize(targetData.radius * 0.6); 
  textAlign(CENTER, CENTER);
  text(targetData.symbol, nucleusPosition.x, nucleusPosition.y);

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

  // 5. Process Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.applyRepulsion(nucleusPosition, currentTargetZ);
    p.update(nucleusPosition); 
    p.show();

    if (p.hasHitScreen) {
      hitMarks.push(createVector(p.pos.x, p.pos.y));
      if (hitMarks.length > 50) hitMarks.splice(0, 1);
      particles.splice(i, 1);
    } 
    else if (p.pos.x > width + 50 || p.pos.y < -50 || p.pos.y > height + 50 || p.pos.x < -50) {
      particles.splice(i, 1);
    }
  }
}

// --- INTERACTIVITY ---
function mousePressed() {
  if (mouseX > 10 && mouseX < 50 && mouseY > boxY - 40 && mouseY < boxY + 40) isDraggingBox = true;
}
function mouseDragged() {
  if (isDraggingBox) boxY = constrain(mouseY, 50, height - 50); 
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
}

function fireNewParticle() {
  let energy = document.getElementById('energySlider').value;
  particles.push(new AlphaParticle(45, boxY, parseFloat(energy)));
}

function fireBurst() {
  let energy = document.getElementById('energySlider').value;
  for (let i = 0; i < 20; i++) {
    let spreadY = boxY + random(-25, 25);
    particles.push(new AlphaParticle(45, spreadY, parseFloat(energy)));
  }
}

// ---------------------------------------------------------
class AlphaParticle {
  constructor(startX, startY, startSpeed) {
    this.pos = createVector(startX, startY);
    this.vel = createVector(startSpeed, 0); 
    this.acc = createVector(0, 0); 
    this.history = []; 
    this.enteredDetector = false;
    this.hasHitScreen = false;
  }

  applyRepulsion(targetVector, targetZ) {
    let force = p5.Vector.sub(this.pos, targetVector);
    let distance = force.mag();
    distance = constrain(distance, targetVector.radius || 15, 1000); 

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

    let distToNucleus = p5.Vector.dist(this.pos, nucleusPos);
    
    if (distToNucleus < radiusSlider.value()) this.enteredDetector = true;
    if (this.enteredDetector === true && distToNucleus >= radiusSlider.value()) {
      this.hasHitScreen = true;
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