// --- GLOBAL VARIABLES ---
let SCREEN_CENTER;
let projectiles = [];
let hitMarks = []; 

// Data Tracking Variables
let statFired = 0;
let statHits = 0;
let statEscaped = 0;

const BOX_Y = 300; 
const TARGET_RADIUS = 60; // Hardcoded fixed radius for the central sphere

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  SCREEN_CENTER = createVector(500, 300);
}

function draw() {
  background(248, 249, 250);

  // 1. Draw the Detector Screen (Fixed Gap)
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

  // 2. Draw the Target Solid Sphere (with 3D Radial Gradient)
  push();
  let gradient = drawingContext.createRadialGradient(
    SCREEN_CENTER.x - 20, SCREEN_CENTER.y - 20, 5, 
    SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS
  );
  gradient.addColorStop(0, '#8ab4f8'); // Highlight
  gradient.addColorStop(1, '#0d47a1'); // Deep shadow
  
  // Force p5 out of any inherited noFill() states before applying the raw canvas gradient
  fill(255); 
  drawingContext.fillStyle = gradient;
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
  noStroke();
  circle(SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS * 2); 
  pop();

  // 3. Draw the Screen Hits
  for (let mark of hitMarks) {
    fill(200, 0, 0); 
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  // 4. Draw the Firing Box
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

  // 5. Process Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    
    // Check for physical elastic collision
    p.checkCollision(SCREEN_CENTER, TARGET_RADIUS);
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
function fireNewProjectile() {
  let velocity = document.getElementById('velocitySlider').value;
  // Fire single ball with a randomized Y offset of -30 to 30 pixels
  projectiles.push(new Projectile(45, BOX_Y + random(-30, 30), parseFloat(velocity)));
  
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

  // Pure Kinematic Elastic Collision
  checkCollision(targetPos, targetRadius) {
    if (this.hasBounced) return; // Only allow one bounce to prevent clipping

    let rTotal = targetRadius + this.radius;
    let distance = p5.Vector.dist(this.pos, targetPos);
    
    // If overlapping
    if (distance <= rTotal) {
      // 1. Find the normal vector (perpendicular to surface at impact point)
      let n = p5.Vector.sub(this.pos, targetPos).normalize();
      
      // 2. Calculate dot product of velocity and normal
      let dot = this.vel.dot(n);
      
      // 3. Reflect the velocity vector across the normal
      if (dot < 0) { 
        let reflection = p5.Vector.mult(n, 2 * dot);
        this.vel.sub(reflection);
        this.hasBounced = true; 
        
        // 4. Resolve overlap (push projectile out so it doesn't clip into the sphere)
        let overlap = rTotal - distance;
        this.pos.add(p5.Vector.mult(n, overlap));
      }
    }
  }

  update(centerPos) {
    this.pos.add(this.vel); 

    // Store trail history
    this.history.push(createVector(this.pos.x, this.pos.y));
    if (this.history.length > 50) this.history.splice(0, 1);

    // Detector collision logic
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
    // Wrapped in push/pop to prevent state leaking!
    push();
    noFill();
    stroke(100, 150, 200, 150);
    strokeWeight(2);
    beginShape();
    for (let pt of this.history) { vertex(pt.x, pt.y); }
    endShape();
    pop();

    // Draw the 3D-styled solid ball
    push();
    drawingContext.shadowBlur = 4;
    drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
    fill(255, 87, 34); // Vibrant orange
    stroke(230, 74, 25);
    strokeWeight(1);
    circle(this.pos.x, this.pos.y, this.radius * 2);
    pop();
  }
}