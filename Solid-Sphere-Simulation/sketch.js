// --- GLOBAL VARIABLES ---
let SCREEN_CENTER;
let projectiles = [];
let hitMarks = []; 

let currentTargetShape = 'sphere'; 

// Data Tracking Variables
let statFired = 0;
let statHits = 0;
let statEscaped = 0;

const BASE_BOX_Y = 300; 
const TARGET_RADIUS = 60; 

// Triangle Geometry Cache
let triV1, triV2, triV3, triEdges;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  SCREEN_CENTER = createVector(500, 300);

  // Pre-calculate triangle vertices (Equilateral pointing UP)
  let R = TARGET_RADIUS;
  let cos30 = sqrt(3) / 2;
  let sin30 = 0.5;
  triV1 = createVector(SCREEN_CENTER.x, SCREEN_CENTER.y - R); // Top
  triV2 = createVector(SCREEN_CENTER.x - R * cos30, SCREEN_CENTER.y + R * sin30); // Bottom Left
  triV3 = createVector(SCREEN_CENTER.x + R * cos30, SCREEN_CENTER.y + R * sin30); // Bottom Right
  triEdges = [ [triV1, triV2], [triV2, triV3], [triV3, triV1] ];
}

function draw() {
  background(248, 249, 250);

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

  // 2. Draw the Target Object (If not hidden)
  let hideTarget = document.getElementById('hideTargetToggle').checked;
  
  if (!hideTarget) {
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0,0,0,0.3)';
    fill('#4a90e2'); // Steel blue
    stroke('#0d47a1');
    strokeWeight(2);

    if (currentTargetShape === 'sphere') {
      let gradient = drawingContext.createRadialGradient(
        SCREEN_CENTER.x - 20, SCREEN_CENTER.y - 20, 5, 
        SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS
      );
      gradient.addColorStop(0, '#8ab4f8'); 
      gradient.addColorStop(1, '#0d47a1'); 
      drawingContext.fillStyle = gradient;
      noStroke();
      circle(SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS * 2); 
    } 
    else if (currentTargetShape === 'square') {
      rectMode(CENTER);
      rect(SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS * 2, TARGET_RADIUS * 2, 8);
    } 
    else if (currentTargetShape === 'triangle') {
      strokeJoin(ROUND);
      triangle(triV1.x, triV1.y, triV2.x, triV2.y, triV3.x, triV3.y);
    }
    pop();
  }

  // 3. Draw the Screen Hits
  for (let mark of hitMarks) {
    fill(200, 0, 0); 
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  // 4. Draw the Firing Box at the custom Y-Offset
  let yOffset = parseInt(document.getElementById('yOffsetSlider').value);
  let currentBoxY = BASE_BOX_Y + yOffset;

  push();
  rectMode(CENTER);
  fill(160, 160, 165); 
  stroke(100);
  strokeWeight(2);
  rect(30, currentBoxY, 40, 80, 5); 
  
  fill(30); 
  noStroke();
  rect(45, currentBoxY, 15, 8); 
  pop();

  // 5. Process Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    
    p.checkCollision();
    p.update(SCREEN_CENTER); 
    p.show();

    // State Machine routing
    if (p.state === 'HIT') {
      hitMarks.push(createVector(p.pos.x, p.pos.y));
      if (hitMarks.length > 50) hitMarks.splice(0, 1);
      
      statHits++;
      document.getElementById('statHits').innerText = statHits;
      projectiles.splice(i, 1); 
    } 
    else if (p.state === 'ESCAPED') {
      statEscaped++;
      document.getElementById('statEscaped').innerText = statEscaped;
      p.state = 'FLYING_AWAY'; 
    }
    else if (p.state === 'BLOCKED') {
      projectiles.splice(i, 1); 
    }
    else if (p.pos.x > width + 50 || p.pos.y < -50 || p.pos.y > height + 50 || p.pos.x < -50) {
      projectiles.splice(i, 1);
    }
  }
}

// --- HTML TRIGGER FUNCTIONS ---
function setTargetShape(shape, btnElement) {
  currentTargetShape = shape;
  let buttons = document.getElementsByClassName('element-tile');
  for (let b of buttons) { b.classList.remove('active'); }
  btnElement.classList.add('active');
}

function fireNewProjectile() {
  let velocity = document.getElementById('velocitySlider').value;
  let yOffset = parseInt(document.getElementById('yOffsetSlider').value);
  
  // Fires exactly from the chosen gun position (No randomization)
  projectiles.push(new Projectile(45, BASE_BOX_Y + yOffset, parseFloat(velocity)));
  
  statFired++;
  document.getElementById('statFired').innerText = statFired;
}

function clearExperiment() {
  projectiles = [];
  hitMarks = [];
  statFired = 0; statHits = 0; statEscaped = 0;
  document.getElementById('statFired').innerText = 0;
  document.getElementById('statHits').innerText = 0;
  document.getElementById('statEscaped').innerText = 0;
}

// ---------------------------------------------------------
class Projectile {
  constructor(startX, startY, startSpeed) {
    this.pos = createVector(startX, startY);
    this.vel = createVector(startSpeed, 0); 
    this.radius = 6; 
    this.history = []; 
    this.state = 'OUTSIDE'; 
    this.hasBounced = false; 
  }

  checkCollision() {
    if (this.hasBounced) return; 

    if (currentTargetShape === 'sphere') {
      let rTotal = TARGET_RADIUS + this.radius;
      let d = p5.Vector.dist(this.pos, SCREEN_CENTER);
      if (d <= rTotal) {
        let n = p5.Vector.sub(this.pos, SCREEN_CENTER).normalize();
        this.executeReflection(n, rTotal - d);
      }
    } 
    else if (currentTargetShape === 'square') {
      // Axis-Aligned Bounding Box Collision
      let cx = constrain(this.pos.x, SCREEN_CENTER.x - TARGET_RADIUS, SCREEN_CENTER.x + TARGET_RADIUS);
      let cy = constrain(this.pos.y, SCREEN_CENTER.y - TARGET_RADIUS, SCREEN_CENTER.y + TARGET_RADIUS);
      let closest = createVector(cx, cy);
      let d = p5.Vector.dist(this.pos, closest);
      
      if (d <= this.radius) {
        let n;
        if (d === 0) n = createVector(-1, 0); // Fallback if deep inside
        else n = p5.Vector.sub(this.pos, closest).normalize();
        
        this.executeReflection(n, this.radius - d);
      }
    } 
    else if (currentTargetShape === 'triangle') {
      // Point-to-Line Segment Collision across all 3 edges
      let minDist = Infinity;
      let bestNormal = null;
      
      for(let edge of triEdges) {
        let A = edge[0];
        let B = edge[1];
        let AB = p5.Vector.sub(B, A);
        let AP = p5.Vector.sub(this.pos, A);
        
        // Find closest point on the segment
        let t = constrain(AP.dot(AB) / AB.magSq(), 0, 1);
        let closest = p5.Vector.add(A, p5.Vector.mult(AB, t));
        let d = p5.Vector.dist(this.pos, closest);
        
        if (d < minDist) {
          minDist = d;
          if (d > 0) bestNormal = p5.Vector.sub(this.pos, closest).normalize();
          else bestNormal = createVector(-1, 0);
        }
      }
      
      if (minDist <= this.radius) {
        this.executeReflection(bestNormal, this.radius - minDist);
      }
    }
  }

  executeReflection(normalVector, overlap) {
    let dot = this.vel.dot(normalVector);
    if (dot < 0) { 
      let reflection = p5.Vector.mult(normalVector, 2 * dot);
      this.vel.sub(reflection);
      this.hasBounced = true; 
      
      // Resolve overlap so it physically stops at the boundary
      this.pos.add(p5.Vector.mult(normalVector, overlap));
    }
  }

  update(centerPos) {
    this.pos.add(this.vel); 

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
        if (isInGap) this.state = 'INSIDE'; 
        else this.state = 'HIT'; 
      }
    } 
    else if (this.state === 'INSIDE') {
      if (distToCenter >= currentRadius) {
        if (isInGap) this.state = 'ESCAPED'; 
        else this.state = 'HIT'; 
      }
    }
  }

  show() {
    push();
    noFill();
    stroke(100, 150, 200, 150);
    strokeWeight(2);
    beginShape();
    for (let pt of this.history) { vertex(pt.x, pt.y); }
    endShape();
    pop();

    push();
    drawingContext.shadowBlur = 4;
    drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
    fill(255, 87, 34); 
    stroke(230, 74, 25);
    strokeWeight(1);
    circle(this.pos.x, this.pos.y, this.radius * 2);
    pop();
  }
}