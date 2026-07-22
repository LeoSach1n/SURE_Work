// --- GLOBAL VARIABLES ---
let activeParticle = null;
let currentCameraView = 'SIDE'; // 'SIDE' or 'FRONT'

// Physics Constants
const B_FIELD = 1.5; 
const FORMULA_CONST = 0.3; 
const PIXELS_PER_METER = 12; // Massively reduced scale so max momentum fits in the cylinder

// Detector Geometry (Pixels)
const CYLINDER_RADIUS = 180; 
const CYLINDER_LENGTH = 600; 

let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 450;
let ORIGIN_X = 100;
let ORIGIN_Y = CANVAS_HEIGHT / 2;
let CENTER_X = CANVAS_WIDTH / 2;

function setup() {
  let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('canvas-container'); 
}

function draw() {
  background(248, 249, 250);
  
  if (currentCameraView === 'SIDE') {
      drawLongitudinalApparatus();
  } else {
      drawTransverseApparatus();
  }

  if (activeParticle) {
      activeParticle.update();
      activeParticle.show(currentCameraView);
  }
}

// --- APPARATUS RENDERING ---
function drawLongitudinalApparatus() {
  push();
  // Central Axis
  stroke(180);
  strokeWeight(2);
  drawingContext.setLineDash([10, 10]);
  line(ORIGIN_X, ORIGIN_Y, ORIGIN_X + CYLINDER_LENGTH, ORIGIN_Y);
  drawingContext.setLineDash([]);
  
  // Cylinder Bounds
  stroke(150);
  strokeWeight(2);
  noFill();
  
  // Top and Bottom walls
  line(ORIGIN_X, ORIGIN_Y - CYLINDER_RADIUS, ORIGIN_X + CYLINDER_LENGTH, ORIGIN_Y - CYLINDER_RADIUS);
  line(ORIGIN_X, ORIGIN_Y + CYLINDER_RADIUS, ORIGIN_X + CYLINDER_LENGTH, ORIGIN_Y + CYLINDER_RADIUS);
  
  // Entrance Face (Ellipse to simulate 3D cylinder opening)
  fill(220, 225, 230, 100);
  ellipse(ORIGIN_X, ORIGIN_Y, 40, CYLINDER_RADIUS * 2);
  
  // Exit Face
  ellipse(ORIGIN_X + CYLINDER_LENGTH, ORIGIN_Y, 40, CYLINDER_RADIUS * 2);
  
  // Injector Nozzle
  fill(50);
  noStroke();
  rectMode(CENTER);
  rect(ORIGIN_X - 15, ORIGIN_Y, 30, 10, 2);
  
  // Labels
  fill(100);
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text("LONGITUDINAL VIEW (Helical Path)", CANVAS_WIDTH / 2, 20);
  pop();
}

function drawTransverseApparatus() {
  push();
  // Crosshairs
  stroke(200);
  strokeWeight(1);
  drawingContext.setLineDash([5, 5]);
  line(CENTER_X, ORIGIN_Y - CYLINDER_RADIUS - 20, CENTER_X, ORIGIN_Y + CYLINDER_RADIUS + 20);
  line(CENTER_X - CYLINDER_RADIUS - 20, ORIGIN_Y, CENTER_X + CYLINDER_RADIUS + 20, ORIGIN_Y);
  drawingContext.setLineDash([]);
  
  // Cylinder Cross Section
  stroke(150);
  strokeWeight(3);
  fill(220, 225, 230, 80);
  circle(CENTER_X, ORIGIN_Y, CYLINDER_RADIUS * 2);
  
  // Injector Nozzle Front Profile
  fill(50);
  noStroke();
  circle(CENTER_X, ORIGIN_Y, 10);
  
  // Magnetic Field Indicators (X marks indicating field going into screen)
  stroke(180);
  strokeWeight(2);
  let spacing = 60;
  for (let x = CENTER_X - CYLINDER_RADIUS + 30; x < CENTER_X + CYLINDER_RADIUS; x += spacing) {
      for (let y = ORIGIN_Y - CYLINDER_RADIUS + 30; y < ORIGIN_Y + CYLINDER_RADIUS; y += spacing) {
          if (dist(x, y, CENTER_X, ORIGIN_Y) < CYLINDER_RADIUS - 10) {
              line(x-4, y-4, x+4, y+4);
              line(x+4, y-4, x-4, y+4);
          }
      }
  }
  
  // Labels
  noStroke();
  fill(100);
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text("TRANSVERSE VIEW (Circular Path)", CANVAS_WIDTH / 2, 20);
  text("B-Field Vector into Screen (x)", CANVAS_WIDTH / 2, 40);
  pop();
}

// --- HTML TRIGGER FUNCTIONS ---
function toggleCamera() {
  let btn = document.getElementById('cameraBtn');
  if (currentCameraView === 'SIDE') {
      currentCameraView = 'FRONT';
      btn.innerHTML = "📸 SWITCH TO SIDE VIEW";
      btn.style.backgroundColor = "#0056b3";
  } else {
      currentCameraView = 'SIDE';
      btn.innerHTML = "📸 SWITCH TO FRONT VIEW";
      btn.style.backgroundColor = "#212529";
  }
}

function updatePreview() {
  document.getElementById('momReadout').innerText = document.getElementById('momentumSlider').value + ' GeV/c';
  document.getElementById('angReadout').innerText = document.getElementById('angleSlider').value + '°';
}

function updateChargeLabel() {
    let isNegative = document.getElementById('chargeToggle').checked;
    let label = document.getElementById('chargeLabel');
    if (isNegative) {
        label.innerText = "Negative (-e)";
        label.style.color = "#dc3545";
    } else {
        label.innerText = "Positive (+e)";
        label.style.color = "#0056b3";
    }
}

function fireParticle() {
  let momentum = parseFloat(document.getElementById('momentumSlider').value);
  let angleDeg = parseFloat(document.getElementById('angleSlider').value);
  let isNegative = document.getElementById('chargeToggle').checked;
  let charge = isNegative ? -1 : 1;
  
  activeParticle = new ChargedParticle(momentum, angleDeg, charge);
  
  document.getElementById('statPt').innerText = activeParticle.pT.toFixed(2) + ' GeV/c';
  document.getElementById('statPl').innerText = activeParticle.pL.toFixed(2) + ' GeV/c';
  document.getElementById('statR').innerText = activeParticle.R_meters.toFixed(2) + ' m';
}

function clearChamber() {
  activeParticle = null;
  document.getElementById('statPt').innerText = '--- GeV/c';
  document.getElementById('statPl').innerText = '--- GeV/c';
  document.getElementById('statR').innerText = '--- m';
}

// --- KINEMATICS ENGINE ---
class ChargedParticle {
  constructor(totalMomentum, angleDeg, charge) {
    this.charge = charge;
    this.color = charge > 0 ? color(0, 86, 179) : color(220, 53, 69);
    
    let angleRad = radians(angleDeg);
    this.pT = totalMomentum * Math.sin(angleRad);
    this.pL = totalMomentum * Math.cos(angleRad);
    
    // Physics Math based directly on whiteboard formula: pT = 0.3 * B * R
    this.R_meters = this.pT / (FORMULA_CONST * B_FIELD);
    this.R_pixels = this.R_meters * PIXELS_PER_METER;
    
    this.phaseAngle = 0; 
    this.angularSpeed = 0.015; // Slowed down the render speed for better observation
    
    this.x = 0;
    this.y = 0;
    this.z = 0;
    
    this.history = [];
    this.state = 'FLYING';
  }

  update() {
    if (this.state !== 'FLYING') return;

    this.phaseAngle += this.angularSpeed;
    
    // Calculate physical mapping in 3D Space
    // Pitch is the longitudinal distance traveled per radian of rotation
    let pitch_meters_per_rad = this.R_meters * (this.pL / this.pT);
    let x_meters = this.phaseAngle * pitch_meters_per_rad;
    
    this.x = x_meters * PIXELS_PER_METER;
    this.y = this.R_pixels * Math.sin(this.phaseAngle);
    this.z = this.charge * this.R_pixels * (1 - Math.cos(this.phaseAngle));
    
    // Wall and Bounds Collisions
    let radialDist = Math.sqrt(this.y * this.y + this.z * this.z);
    if (radialDist >= CYLINDER_RADIUS - 5) {
        this.state = 'WALL_HIT';
    } else if (this.x >= CYLINDER_LENGTH) {
        this.state = 'ESCAPED';
    } else {
        this.history.push({x: this.x, y: this.y, z: this.z});
    }
  }

  show(viewType) {
    push();
    noFill();
    stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2], 150);
    strokeWeight(2.5);
    
    beginShape();
    for (let pt of this.history) {
        if (viewType === 'SIDE') {
            vertex(ORIGIN_X + pt.x, ORIGIN_Y + pt.y);
        } else {
            vertex(CENTER_X + pt.y, ORIGIN_Y + pt.z);
        }
    }
    endShape();
    
    fill(this.color);
    noStroke();
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = this.color.toString();
    
    if (viewType === 'SIDE') {
        circle(ORIGIN_X + this.x, ORIGIN_Y + this.y, 10);
    } else {
        circle(CENTER_X + this.y, ORIGIN_Y + this.z, 10);
    }
    pop();
  }
}