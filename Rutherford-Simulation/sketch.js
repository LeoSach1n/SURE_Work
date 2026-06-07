// --- GLOBAL VARIABLES ---
// let is dynamic variable , can be changed
// const is permanently the same

let nucleusPosition;
let particles = [];
let hitMarks = []; 
const SIMULATION_K = 200; 

// declaring k as a much lower value for convenience in the simulation and visualisation
// else the alpha particle would get deflected instantly 

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

  createP('Detector Screen Radius:');
  radiusSlider = createSlider(100, 280, 220);
  // the radius of the screen can be min 100px , max 280px and 220px by default
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
}

function fireNewParticle() {
  let energy = document.getElementById('energySlider').value;
  // energy slider defined in index.html , the min value is 2 , max is 15 , and default is 8
  particles.push(new AlphaParticle(45, boxY, parseFloat(energy)));
  // the particles original x,y coord , the KE with which it is shot
}

function fireBurst() {
  let energy = document.getElementById('energySlider').value;
  for (let i = 0; i < 20; i++) { // 20 alpha particles are fired at once in a random 51px range 
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
    // acceleration is 0 , the alpha particle only has KE at the start , and starts to feel a 
    // repulsive force which gives it a negative acceleration
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

    let distToNucleus = p5.Vector.dist(this.pos, nucleusPos); // updating the dist b/w nucleas and alpha
    
    if (distToNucleus < radiusSlider.value()) this.enteredDetector = true;
    if (this.enteredDetector === true && distToNucleus >= radiusSlider.value()) {
      this.hasHitScreen = true;
      // if it has entered inside the detector screen radius
      // and then the distance increases so much so that dist b/w alpha and nucleas is more than 
      // detector screen radius , it means it entered the screen R but then it went outside also 
      // so it has definitely hit the screen , now we update it and make a scintillation mark 
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