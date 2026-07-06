// --- GLOBAL VARIABLES ---
let SCREEN_CENTER;
let projectiles = [];
let hitMarks = []; 
let confettis = []; 

let currentTargetShape = 'sphere'; 
let isTargetHidden = false; 

// Draggable Box Variables
let boxY = 300; 
let isDraggingBox = false;

// Data Tracking Variables
let statFired = 0;
let statHits = 0;
let statEscaped = 0;

const TARGET_RADIUS = 60; 

// Triangle Geometry Cache
let triV1, triV2, triV3, triEdges;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  SCREEN_CENTER = createVector(500, 300);

  // Pre-calculate triangle vertices (Clockwise layout)
  let R = TARGET_RADIUS;
  let cos30 = sqrt(3) / 2;
  let sin30 = 0.5;
  triV1 = createVector(SCREEN_CENTER.x, SCREEN_CENTER.y - R); // Top
  triV3 = createVector(SCREEN_CENTER.x + R * cos30, SCREEN_CENTER.y + R * sin30); // Bot-Right
  triV2 = createVector(SCREEN_CENTER.x - R * cos30, SCREEN_CENTER.y + R * sin30); // Bot-Left
  
  // Edges arranged clockwise to easily generate outward normals
  triEdges = [ [triV1, triV3], [triV3, triV2], [triV2, triV1] ];
}

function draw() {
  background(248, 249, 250);

  // --- CONTINUOUS FIRE LOGIC ---
  let isContinuousFire = document.getElementById('continuousFireToggle').checked;
  if (isContinuousFire && frameCount % 12 === 0) { 
    let velocity = document.getElementById('velocitySlider').value;
    projectiles.push(new Projectile(45, boxY, parseFloat(velocity)));
    statFired++;
    document.getElementById('statFired').innerText = statFired;
  }

  // 1. Draw the Detector Screen
  let currentRadius = document.getElementById('radiusSlider').value;
  let gapCenterRad = PI; 
  let gapHalfRad = radians(25); 

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

  // 2. Draw the Target Object OR the Question Mark
  if (!isTargetHidden) {
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0,0,0,0.3)';
    
    // Calculate a gradient radius that covers the specific shape properly
    let gradRadius = TARGET_RADIUS;
    if (currentTargetShape === 'square') gradRadius = TARGET_RADIUS * 1.4;
    if (currentTargetShape === 'triangle') gradRadius = TARGET_RADIUS * 1.2;

    // Create a universal 3D radial gradient for ALL shapes
    let gradient = drawingContext.createRadialGradient(
      SCREEN_CENTER.x - 20, SCREEN_CENTER.y - 20, 5, 
      SCREEN_CENTER.x, SCREEN_CENTER.y, gradRadius
    );
    gradient.addColorStop(0, '#8ab4f8'); // Highlight
    gradient.addColorStop(1, '#0d47a1'); // Deep shadow
    
    drawingContext.fillStyle = gradient;
    noStroke(); // Remove outlines to match the smooth 3D aesthetic

    if (currentTargetShape === 'sphere') {
      circle(SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS * 2); 
    } 
    else if (currentTargetShape === 'square') {
      rectMode(CENTER);
      rect(SCREEN_CENTER.x, SCREEN_CENTER.y, TARGET_RADIUS * 2, TARGET_RADIUS * 2, 8);
    } 
    else if (currentTargetShape === 'triangle') {
      triangle(triV1.x, triV1.y, triV2.x, triV2.y, triV3.x, triV3.y);
    }
    pop();
  } else {
    push();
    fill(40); 
    noStroke();
    textSize(80);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("?", SCREEN_CENTER.x, SCREEN_CENTER.y);
    pop();
  }

  // 3. Draw the Screen Hits
  for (let mark of hitMarks) {
    fill(200, 0, 0); 
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  // 4. Draw the Draggable Firing Box
  push();
  rectMode(CENTER);
  fill(160, 160, 165); 
  
  if (isDraggingBox) {
    stroke(0, 150, 255); 
    strokeWeight(3);
  } else {
    stroke(100);
    strokeWeight(2);
  }
  
  rect(30, boxY, 40, 80, 5); 
  
  fill(30); 
  noStroke();
  rect(45, boxY, 15, 8); 

  if (isContinuousFire) {
    let pulseAlpha = 150 + 105 * sin(frameCount * 0.2);
    fill(255, 50, 50, pulseAlpha);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'red';
    rect(45, boxY, 15, 8); 
    drawingContext.shadowBlur = 0; 
  }
  pop();

  // 5. Process Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    
    // update handles sub-stepping and checkCollision() internally
    p.update(SCREEN_CENTER); 
    p.show();

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

  // 6. Draw Confetti Overlay
  drawConfetti();
}

// --- INTERACTIVITY: DRAG BOX ---
function mousePressed() {
  if (mouseX > 10 && mouseX < 50 && mouseY > boxY - 40 && mouseY < boxY + 40) {
    isDraggingBox = true;
  }
}

function mouseDragged() {
  if (isDraggingBox) {
    boxY = constrain(mouseY, 50, height - 50); 
  }
}

function mouseReleased() {
  isDraggingBox = false;
}

// --- HTML TRIGGER FUNCTIONS & GAME LOGIC ---

function handleShapeSelection(shape, btnElement) {
  if (isTargetHidden) {
    if (shape === currentTargetShape) {
      triggerConfetti();
      isTargetHidden = false; 
      
      document.getElementById('continuousFireToggle').checked = false;

      let btn = document.getElementById('hideToggleBtn');
      btn.innerHTML = "🙈 HIDE TARGET & GUESS";
      btn.style.backgroundColor = "#6c757d"; 
      document.getElementById('shapeLabel').innerText = "Target Object Shape";
      
      let buttons = document.getElementsByClassName('element-tile');
      for (let b of buttons) { b.classList.remove('active'); }
      btnElement.classList.add('active');

    } else {
      let originalBg = btnElement.style.backgroundColor;
      let originalBorder = btnElement.style.borderColor;
      btnElement.style.backgroundColor = "#f8d7da"; 
      btnElement.style.borderColor = "#dc3545"; 
      
      setTimeout(() => {
        btnElement.style.backgroundColor = originalBg;
        btnElement.style.borderColor = originalBorder;
      }, 400); 
    }
  } else {
    currentTargetShape = shape;
    let buttons = document.getElementsByClassName('element-tile');
    for (let b of buttons) { b.classList.remove('active'); }
    btnElement.classList.add('active');
  }
}

function toggleHideTarget() {
  isTargetHidden = !isTargetHidden;
  let btn = document.getElementById('hideToggleBtn');
  let shapeLabel = document.getElementById('shapeLabel');
  let buttons = document.getElementsByClassName('element-tile');

  if (isTargetHidden) {
    let shapes = ['sphere', 'square', 'triangle'];
    let previousShape = currentTargetShape;
    
    // Force the engine to pick a completely new shape
    while (currentTargetShape === previousShape) {
        currentTargetShape = random(shapes);
    }
    
    clearExperiment(); 
    
    btn.innerHTML = "🛑 GIVE UP & REVEAL";
    btn.style.backgroundColor = "#dc3545"; 
    shapeLabel.innerText = "🤔 Guess the Hidden Shape!";
    
    for (let b of buttons) { b.classList.remove('active'); }

  } else {
    btn.innerHTML = "🙈 HIDE TARGET & GUESS";
    btn.style.backgroundColor = "#6c757d"; 
    shapeLabel.innerText = "Target Object Shape";
    
    for (let b of buttons) { 
      if (b.getAttribute('data-shape') === currentTargetShape) {
        b.classList.add('active');
      }
    }
  }
}

function fireNewProjectile() {
  let velocity = document.getElementById('velocitySlider').value;
  projectiles.push(new Projectile(45, boxY, parseFloat(velocity)));
  
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
  document.getElementById('statAngle').innerText = '---°';
}

function triggerConfetti() {
  for (let i = 0; i < 150; i++) {
    confettis.push({
      x: SCREEN_CENTER.x,
      y: SCREEN_CENTER.y,
      vx: random(-8, 8),
      vy: random(-10, -20), 
      c: color(random(255), random(255), random(255)), 
      size: random(6, 12),
      angle: random(TWO_PI),
      spin: random(-0.3, 0.3)
    });
  }
}

function drawConfetti() {
  for (let i = confettis.length - 1; i >= 0; i--) {
    let c = confettis[i];
    c.vy += 0.4; 
    c.x += c.vx;
    c.y += c.vy;
    c.angle += c.spin;
    
    push();
    translate(c.x, c.y);
    rotate(c.angle);
    fill(c.c);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, c.size, c.size);
    pop();
    
    if (c.y > height + 20) {
      confettis.splice(i, 1);
    }
  }
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
        let n;
        if (d === 0) n = createVector(-1, 0); 
        else n = p5.Vector.sub(this.pos, SCREEN_CENTER).normalize();
        this.executeReflection(n, rTotal - d);
      }
    } 
    else if (currentTargetShape === 'square') {
      let cx = constrain(this.pos.x, SCREEN_CENTER.x - TARGET_RADIUS, SCREEN_CENTER.x + TARGET_RADIUS);
      let cy = constrain(this.pos.y, SCREEN_CENTER.y - TARGET_RADIUS, SCREEN_CENTER.y + TARGET_RADIUS);
      let closest = createVector(cx, cy);
      let d = p5.Vector.dist(this.pos, closest);
      
      if (d <= this.radius) {
        let edgeNormal = createVector(-1, 0); // Default pointing left
        if (cx === SCREEN_CENTER.x - TARGET_RADIUS) edgeNormal = createVector(-1, 0);
        else if (cx === SCREEN_CENTER.x + TARGET_RADIUS) edgeNormal = createVector(1, 0);
        else if (cy === SCREEN_CENTER.y - TARGET_RADIUS) edgeNormal = createVector(0, -1);
        else if (cy === SCREEN_CENTER.y + TARGET_RADIUS) edgeNormal = createVector(0, 1);

        let pc = p5.Vector.sub(this.pos, closest);
        let bestNormal = edgeNormal;
        
        // If particle center is outside the square boundary, use radial normal for rounded corners
        if (pc.mag() > 0 && pc.dot(edgeNormal) > 0) {
          bestNormal = pc.normalize();
        }
        
        this.executeReflection(bestNormal, this.radius - d);
      }
    } 
    else if (currentTargetShape === 'triangle') {
      let minDist = Infinity;
      let bestNormal = null;
      
      for(let edge of triEdges) {
        let A = edge[0];
        let B = edge[1];
        let AB = p5.Vector.sub(B, A);
        let AP = p5.Vector.sub(this.pos, A);
        
        let t = constrain(AP.dot(AB) / AB.magSq(), 0, 1);
        let closest = p5.Vector.add(A, p5.Vector.mult(AB, t));
        let d = p5.Vector.dist(this.pos, closest);
        
        if (d < minDist) {
          minDist = d;
          
          // Since vertices are clockwise, (AB.y, -AB.x) ALWAYS points strictly outwards
          let edgeNormal = createVector(AB.y, -AB.x).normalize();
          
          let pc = p5.Vector.sub(this.pos, closest);
          // If the particle is outside the triangle edge, use radial normal for rounded corners
          if (pc.mag() > 0 && pc.dot(edgeNormal) > 0) {
            bestNormal = pc.normalize();
          } else {
            // If it tunneled inside, forcefully use the outward-facing edge normal
            bestNormal = edgeNormal;
          }
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
      
      // Push particle perfectly back to the boundary surface
      this.pos.add(p5.Vector.mult(normalVector, overlap));
    }
  }

  recordHitAngle(centerPos) {
    let angle = atan2(this.pos.y - centerPos.y, this.pos.x - centerPos.x);
    let deg = degrees(angle);
    let cartesianDeg = -deg;
    if (cartesianDeg < 0) cartesianDeg += 360;
    document.getElementById('statAngle').innerText = cartesianDeg.toFixed(1) + '°';
  }

  update(centerPos) {
    // SUB-STEPPING: Slice the velocity into 4 micro-frames per frame to completely prevent tunneling
    let steps = 4;
    let subVel = p5.Vector.div(this.vel, steps);

    for(let s = 0; s < steps; s++) {
        this.pos.add(subVel); 
        this.checkCollision();
        
        // If a collision happened during this micro-step, update the velocity for the remaining micro-steps
        if (this.hasBounced) {
            subVel = p5.Vector.div(this.vel, steps);
        }
    }

    this.history.push(createVector(this.pos.x, this.pos.y));
    if (this.history.length > 50) this.history.splice(0, 1);

    let currentRadius = document.getElementById('radiusSlider').value;
    let distToCenter = p5.Vector.dist(this.pos, centerPos); 
    
    let angle = atan2(this.pos.y - centerPos.y, this.pos.x - centerPos.x); 
    let angleDeg = degrees(angle);
    if (angleDeg < 0) angleDeg += 360; 

    let gapCenter = 180; 
    let gapHalfWidth = 25; 
    let diff = Math.abs(angleDeg - gapCenter) % 360;
    let shortestDiff = diff > 180 ? 360 - diff : diff;
    let isInGap = shortestDiff <= gapHalfWidth;

    if (this.state === 'OUTSIDE') {
      if (distToCenter < currentRadius) {
        if (isInGap) {
            this.state = 'INSIDE'; 
        } else {
            this.state = 'HIT'; 
            this.recordHitAngle(centerPos);
        }
      }
    } 
    else if (this.state === 'INSIDE') {
      if (distToCenter >= currentRadius) {
        if (isInGap) {
            this.state = 'ESCAPED'; 
        } else {
            this.state = 'HIT'; 
            this.recordHitAngle(centerPos);
        }
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