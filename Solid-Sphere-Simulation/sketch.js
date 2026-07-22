// --- GLOBAL VARIABLES ---
let SCREEN_CENTER;
let projectiles = [];
let hitMarks = []; 
let confettis = []; 

let currentTargetShape = 'sphere'; 
let isTargetHidden = false; 

// Fixed Physics Variables
const TARGET_RADIUS = 20; 
const FIXED_RADIUS = 240; 
const FIXED_VELOCITY = 10; 

// 5-Groove Emitter
const EMITTER_Y = 300;
const GROOVE_OFFSETS = [-24, -12, 0, 12, 24]; 
let currentSingleGroove = 0; 

// Telemetry
let telemetryData = [["Timestamp", "Target Shape", "Groove Number", "Scattering Angle (deg)"]];

let triV1, triV2, triV3, triEdges;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container'); 
  
  SCREEN_CENTER = createVector(500, 300);
  calculateTriangle();
}

function calculateTriangle() {
  let R = TARGET_RADIUS;
  let cos30 = sqrt(3) / 2;
  let sin30 = 0.5;
  triV1 = createVector(SCREEN_CENTER.x, SCREEN_CENTER.y - R); 
  triV3 = createVector(SCREEN_CENTER.x + R * cos30, SCREEN_CENTER.y + R * sin30); 
  triV2 = createVector(SCREEN_CENTER.x - R * cos30, SCREEN_CENTER.y + R * sin30); 
  triEdges = [ [triV1, triV3], [triV3, triV2], [triV2, triV1] ];
}

function draw() {
  background(248, 249, 250);

  let isContinuousFire = document.getElementById('continuousFireToggle').checked;
  if (isContinuousFire && frameCount % 9 === 0) { 
    fireBurst(); 
  }

  let gapCenterRad = PI; 
  let gapHalfRad = radians(25); 

  push();
  noFill();
  stroke(180); 
  strokeWeight(3);
  drawingContext.setLineDash([10, 10]); 
  arc(SCREEN_CENTER.x, SCREEN_CENTER.y, FIXED_RADIUS * 2, FIXED_RADIUS * 2, 
      gapCenterRad + gapHalfRad, 
      gapCenterRad - gapHalfRad + TWO_PI);
  drawingContext.setLineDash([]); 
  pop();


  if (!isTargetHidden) {
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0,0,0,0.3)';
    
    let gradRadius = TARGET_RADIUS;
    if (currentTargetShape === 'square') gradRadius = TARGET_RADIUS * 1.4;
    if (currentTargetShape === 'triangle') gradRadius = TARGET_RADIUS * 1.2;

    let gradient = drawingContext.createRadialGradient(
      SCREEN_CENTER.x - 6, SCREEN_CENTER.y - 6, 2, 
      SCREEN_CENTER.x, SCREEN_CENTER.y, gradRadius
    );
    gradient.addColorStop(0, '#8ab4f8'); 
    gradient.addColorStop(1, '#0d47a1'); 
    
    drawingContext.fillStyle = gradient;
    noStroke(); 

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
    textSize(60);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("?", SCREEN_CENTER.x, SCREEN_CENTER.y);
    pop();
  }

  for (let mark of hitMarks) {
    fill(200, 0, 0); 
    noStroke();
    circle(mark.x, mark.y, 8);
  }

  push();
  rectMode(CENTER);
  fill(160, 160, 165); 
  stroke(100);
  strokeWeight(2);
  rect(30, EMITTER_Y, 40, 80, 5); 

  for(let i = 0; i < 5; i++) {
      fill(30); 
      noStroke();
      rect(45, EMITTER_Y + GROOVE_OFFSETS[i], 15, 6); 

      if (isContinuousFire) {
        let pulseAlpha = 150 + 105 * sin(frameCount * 0.2);
        fill(255, 50, 50, pulseAlpha);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'red';
        rect(45, EMITTER_Y + GROOVE_OFFSETS[i], 15, 6); 
        drawingContext.shadowBlur = 0; 
      }
  }
  pop();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.update(SCREEN_CENTER); 
    p.show();

    if (p.state === 'HIT') {
      hitMarks.push(createVector(p.pos.x, p.pos.y));
      if (hitMarks.length > 50) hitMarks.splice(0, 1);
      projectiles.splice(i, 1); 
    } 
    else if (p.state === 'ESCAPED') {
      p.state = 'FLYING_AWAY'; 
    }
    else if (p.state === 'BLOCKED') {
      projectiles.splice(i, 1); 
    }
    else if (p.pos.x > width + 50 || p.pos.y < -50 || p.pos.y > height + 50 || p.pos.x < -50) {
      projectiles.splice(i, 1);
    }
  }

  drawConfetti();
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
    
    clearExperiment(); 
  }
}

function toggleHideTarget() {
  isTargetHidden = !isTargetHidden;
  let btn = document.getElementById('hideToggleBtn');
  let buttons = document.getElementsByClassName('element-tile');

  if (isTargetHidden) {
    let shapes = ['sphere', 'square', 'triangle'];
    let previousShape = currentTargetShape;
    while (currentTargetShape === previousShape) {
        currentTargetShape = random(shapes);
    }
    clearExperiment(); 
    btn.innerHTML = "🛑 GIVE UP & REVEAL";
    btn.style.backgroundColor = "#dc3545"; 
    for (let b of buttons) { b.classList.remove('active'); }
  } else {
    btn.innerHTML = "🙈 HIDE TARGET & GUESS";
    btn.style.backgroundColor = "#6c757d"; 
    for (let b of buttons) { 
      if (b.getAttribute('data-shape') === currentTargetShape) { b.classList.add('active'); }
    }
  }
}

function fireNewProjectile() {
  let gIndex = currentSingleGroove % 5;
  let startY = EMITTER_Y + GROOVE_OFFSETS[gIndex];
  projectiles.push(new Projectile(45, startY, FIXED_VELOCITY, gIndex));
  currentSingleGroove++;
}

function fireBurst() {
  for (let i = 0; i < 5; i++) {
    let startY = EMITTER_Y + GROOVE_OFFSETS[i];
    projectiles.push(new Projectile(45, startY, FIXED_VELOCITY, i));
  }
}

function clearExperiment() {
  projectiles = [];
  hitMarks = [];
  
  for(let i=0; i<5; i++) {
      document.getElementById('angle' + i).innerText = '---°';
  }
}

function endSession() {
  clearExperiment();
  
  telemetryData = [["Timestamp", "Target Shape", "Groove Number", "Scattering Angle (deg)"]];
  
  alert("Session Ended: Previous telemetry data has been wiped and a fresh log has started.");
}

function exportCSV() {
  if (telemetryData.length <= 1) {
      alert("No data collected yet! Fire some projectiles first.");
      return;
  }
  let csvContent = "data:text/csv;charset=utf-8," + telemetryData.map(e => e.join(",")).join("\n");
  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "scattering_telemetry.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function triggerConfetti() {
  for (let i = 0; i < 150; i++) {
    confettis.push({
      x: SCREEN_CENTER.x, y: SCREEN_CENTER.y,
      vx: random(-8, 8), vy: random(-10, -20), 
      c: color(random(255), random(255), random(255)), 
      size: random(6, 12), angle: random(TWO_PI), spin: random(-0.3, 0.3)
    });
  }
}

function drawConfetti() {
  for (let i = confettis.length - 1; i >= 0; i--) {
    let c = confettis[i];
    c.vy += 0.4; c.x += c.vx; c.y += c.vy; c.angle += c.spin;
    push();
    translate(c.x, c.y); rotate(c.angle);
    fill(c.c); noStroke(); rectMode(CENTER); rect(0, 0, c.size, c.size);
    pop();
    if (c.y > height + 20) { confettis.splice(i, 1); }
  }
}

class Projectile {
  constructor(startX, startY, startSpeed, grooveIndex) {
    this.pos = createVector(startX, startY);
    this.vel = createVector(startSpeed, 0); 
    this.radius = 4; 
    this.history = []; 
    this.state = 'OUTSIDE'; 
    this.hasBounced = false; 
    this.grooveIndex = grooveIndex; 
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
        let edgeNormal = createVector(-1, 0); 
        if (cx === SCREEN_CENTER.x - TARGET_RADIUS) edgeNormal = createVector(-1, 0);
        else if (cx === SCREEN_CENTER.x + TARGET_RADIUS) edgeNormal = createVector(1, 0);
        else if (cy === SCREEN_CENTER.y - TARGET_RADIUS) edgeNormal = createVector(0, -1);
        else if (cy === SCREEN_CENTER.y + TARGET_RADIUS) edgeNormal = createVector(0, 1);

        let pc = p5.Vector.sub(this.pos, closest);
        let bestNormal = edgeNormal;
        
        if (pc.mag() > 0 && pc.dot(edgeNormal) > 0) { bestNormal = pc.normalize(); }
        this.executeReflection(bestNormal, this.radius - d);
      }
    } 
    else if (currentTargetShape === 'triangle') {
      let minDist = Infinity;
      let bestNormal = null;
      
      for(let edge of triEdges) {
        let A = edge[0]; let B = edge[1];
        let AB = p5.Vector.sub(B, A);
        let AP = p5.Vector.sub(this.pos, A);
        
        let t = constrain(AP.dot(AB) / AB.magSq(), 0, 1);
        let closest = p5.Vector.add(A, p5.Vector.mult(AB, t));
        let d = p5.Vector.dist(this.pos, closest);
        
        if (d < minDist) {
          minDist = d;
          let edgeNormal = createVector(AB.y, -AB.x).normalize();
          let pc = p5.Vector.sub(this.pos, closest);
          if (pc.mag() > 0 && pc.dot(edgeNormal) > 0) { bestNormal = pc.normalize(); } 
          else { bestNormal = edgeNormal; }
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
      this.pos.add(p5.Vector.mult(normalVector, overlap));
    }
  }

  recordHitAngle() {
    let speed = this.vel.mag();
    let scatterRad = Math.acos(this.vel.x / speed);
    let scatterAngle = degrees(scatterRad);
    
    let formattedAngle = scatterAngle.toFixed(1);
    
    document.getElementById('angle' + this.grooveIndex).innerText = formattedAngle + '°';
    
    let now = new Date();
    let timeStr = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
    let grooveName = "Groove " + (this.grooveIndex + 1);
    telemetryData.push([timeStr, currentTargetShape, grooveName, formattedAngle]);
  }

  update(centerPos) {
    let steps = 4;
    let subVel = p5.Vector.div(this.vel, steps);

    for(let s = 0; s < steps; s++) {
        this.pos.add(subVel); 
        this.checkCollision();
        if (this.hasBounced) { subVel = p5.Vector.div(this.vel, steps); }
    }

    this.history.push(createVector(this.pos.x, this.pos.y));
    if (this.history.length > 50) this.history.splice(0, 1);

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
      if (distToCenter < FIXED_RADIUS) {
        if (isInGap) { this.state = 'INSIDE'; } 
        else { 
            this.state = 'HIT'; 
            this.recordHitAngle(); 
        }
      }
    } 
    else if (this.state === 'INSIDE') {
      if (distToCenter >= FIXED_RADIUS) {
        this.recordHitAngle(); 
        if (isInGap) { this.state = 'ESCAPED'; } 
        else { this.state = 'HIT'; } 
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