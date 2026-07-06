// --- GLOBAL VARIABLES ---
let currentPhase = 1;
let valE = 0; 
let valB = 0; 
let deflectionY_cm = 0;
let viewMode = 'SIDE'; 

// True Physics Constants
const E_M_RATIO = 1.76e11; 
let V_X = 2e7; 

// Canvas Geometry & Scale
const PX_PER_METER = 2000; 
const CENTER_Y = 300; 
const GUN_X = 200; // Shifted left to perfectly center within the new 980px canvas

// Positions in Meters
const PLATE_START_M = 0.10; 
const PLATE_END_M = 0.20;   
const SCREEN_M = 0.35;      

// Positions in Pixels
const PLATE_START = GUN_X + (PLATE_START_M * PX_PER_METER);
const PLATE_END = GUN_X + (PLATE_END_M * PX_PER_METER);
const SCREEN_X = GUN_X + (SCREEN_M * PX_PER_METER);

function setup() {
  let canvas = createCanvas(980, 600); // Shrunk to 980px to safely fit inside the Bootstrap container
  canvas.parent('canvas-container');
  updatePhysics();
}

function draw() {
  background(240, 242, 245);

  // ==========================================
  // CAMERA: SIDE VIEW
  // ==========================================
  if (viewMode === 'SIDE') {
    
    // 1. Draw Cathode Ray Tube 
    stroke(0); strokeWeight(3); noFill();
    beginShape();
    vertex(60, CENTER_Y - 40); vertex(250, CENTER_Y - 40);
    vertex(SCREEN_X - 60, CENTER_Y - 230); vertex(SCREEN_X - 60, CENTER_Y + 230);
    vertex(250, CENTER_Y + 40); vertex(60, CENTER_Y + 40);
    endShape(CLOSE);

    noFill();
    stroke(50); strokeWeight(8); strokeCap(ROUND);
    arc(SCREEN_X - 60, CENTER_Y, 120, 460, -HALF_PI, HALF_PI);
    stroke(15, 40, 25); strokeWeight(4); strokeCap(ROUND);
    arc(SCREEN_X - 60, CENTER_Y, 120, 445, -HALF_PI, HALF_PI);

    // 2. Draw Electron Gun 
    push();
    fill(10,10,10, 40); stroke(0,0,0, 150); strokeWeight(2);
    rect(65, CENTER_Y - 35, 140, 70, 20); 
    stroke(255, 255, 255, 200); strokeWeight(3);
    line(75, CENTER_Y - 25, 185, CENTER_Y - 25);
    pop();

    push();
    stroke(255, 150, 0); strokeWeight(2); noFill();
    drawingContext.shadowBlur = 10; drawingContext.shadowColor = 'orange';
    beginShape(); vertex(75, CENTER_Y - 15); vertex(85, CENTER_Y - 5); vertex(75, CENTER_Y + 5); vertex(85, CENTER_Y + 15); endShape();
    pop();

    push(); fill(0, 100, 255); noStroke(); rect(98, CENTER_Y - 15, 6, 30, 2); fill(0, 100, 255); textSize(14); textStyle(BOLD); textAlign(CENTER); text("C (-)", 101, CENTER_Y - 50); pop();
    push(); stroke(220, 50, 50); strokeWeight(4); noFill(); ellipse(GUN_X, CENTER_Y, 10, 45); fill(220, 50, 50); noStroke(); textSize(14); textStyle(BOLD); textAlign(CENTER); text("A (+)", GUN_X, CENTER_Y - 50); pop();

    fill(255); textSize(15); textStyle(BOLD); textAlign(CENTER);
    text("ELECTRON GUN", 145, CENTER_Y - 85);

    // HIGH VOLTAGE CIRCUIT 
    push();
    stroke(80); strokeWeight(2); noFill();
    
    line(101, CENTER_Y + 15, 101, CENTER_Y + 120); 
    line(101, CENTER_Y + 120, 135, CENTER_Y + 120);
    
    line(GUN_X, CENTER_Y + 22, GUN_X, CENTER_Y + 120);
    line(GUN_X, CENTER_Y + 120, 165, CENTER_Y + 120);

    stroke(0); strokeCap(SQUARE);
    strokeWeight(4); line(135, CENTER_Y + 110, 135, CENTER_Y + 130); 
    strokeWeight(2); line(145, CENTER_Y + 105, 145, CENTER_Y + 135); 
    strokeWeight(4); line(155, CENTER_Y + 110, 155, CENTER_Y + 130); 
    strokeWeight(2); line(165, CENTER_Y + 105, 165, CENTER_Y + 135); 
    
    strokeWeight(2);
    line(135, CENTER_Y + 120, 165, CENTER_Y + 120);

    fill(0, 100, 255); noStroke(); textSize(18); textStyle(BOLD); textAlign(CENTER);
    text("-", 122, CENTER_Y + 135);
    fill(220, 50, 50);
    text("+", 178, CENTER_Y + 135);
    pop();

    // 3. Central Axis
    stroke(150); strokeWeight(2); drawingContext.setLineDash([8, 8]);
    line(GUN_X, CENTER_Y, SCREEN_X, CENTER_Y);
    drawingContext.setLineDash([]);

    // 4. Draw Magnetic Coils
    if (currentPhase == 2 || currentPhase == 3) {
      let alpha = (currentPhase == 2) ? 250 : 150;
      stroke(0, 86, 179, alpha); strokeWeight(5); drawingContext.setLineDash([15, 15]);
      noFill(); circle((PLATE_START + PLATE_END)/2, CENTER_Y, 150);
      drawingContext.setLineDash([]);
      noStroke(); fill(0, 86, 179, alpha); textAlign(CENTER);
      text("B-Field Coils", (PLATE_START + PLATE_END)/2, CENTER_Y + 90);
    }

    // 5. Draw Electric Plates
    let plateAlpha = (currentPhase==2)?50:255;
    fill(217, 83, 79,plateAlpha); rect(PLATE_START, CENTER_Y - 50, PLATE_END - PLATE_START, 8, 3);
    fill(50, 50, 50,plateAlpha); rect(PLATE_START, CENTER_Y + 42, PLATE_END - PLATE_START, 8, 3);

    // 6. Draw Continuous Beam
    noFill(); stroke(0, 255, 255, 100); strokeWeight(4);
    beginShape();
    for (let px = GUN_X; px <= SCREEN_X; px += 5) {
      vertex(px, getPixelY(px));
    }
    endShape();

    // 7. Dynamic Animation 
    let speed = 8; fill(255); noStroke();
    for (let i = 0; i < 12; i++) {
      let px = GUN_X + ((frameCount * speed + i * 60) % (SCREEN_X - GUN_X));
      let rawY = getPixelY(px);
      drawingContext.shadowBlur = 10; drawingContext.shadowColor = 'cyan';
      circle(px, rawY, 6); drawingContext.shadowBlur = 0; 
    }

    // 8. Measurement Visualization
    let finalRawY = getPixelY(SCREEN_X);
    deflectionY_cm = (CENTER_Y - finalRawY) / (PX_PER_METER / 100); 

    push();
    drawingContext.shadowBlur = 15; drawingContext.shadowColor = 'cyan';
    fill(150, 255, 255); noStroke();
    circle(SCREEN_X, finalRawY, 8); 
    fill(255); circle(SCREEN_X, finalRawY, 4); 
    pop();

    if (Math.abs(deflectionY_cm) > 0.05) {
      stroke(200, 50, 50); strokeWeight(2);
      line(SCREEN_X + 25, CENTER_Y, SCREEN_X + 25, finalRawY);
      
      push(); fill(200, 50, 50); noStroke();
      let dir = (finalRawY < CENTER_Y) ? -1 : 1;
      triangle(SCREEN_X + 25, finalRawY, SCREEN_X + 20, finalRawY - dir*6, SCREEN_X + 30, finalRawY - dir*6);
      triangle(SCREEN_X + 25, CENTER_Y, SCREEN_X + 20, CENTER_Y + dir*6, SCREEN_X + 30, CENTER_Y + dir*6);
      pop();

      fill(200, 50, 50); noStroke(); textAlign(LEFT, CENTER); textSize(14);
      text(`y = ${Math.abs(deflectionY_cm).toFixed(2)} cm`, SCREEN_X + 35, (CENTER_Y + finalRawY)/2);
    }
  } 

  // ==========================================
  // CAMERA: FRONT VIEW 
  // ==========================================
  else if (viewMode === 'FRONT') {
    let cx = width / 2;
    let cy = height / 2;

    fill(30); stroke(80); strokeWeight(15);
    circle(cx, cy, 460);

    fill(10, 25, 15); noStroke();
    circle(cx, cy, 445);

    // Grid Rings & Strict Vertical Axis
    stroke(0, 100, 50, 150); strokeWeight(2);
    for(let r = 20; r <= 220; r += 20) { 
      noFill(); circle(cx, cy, r*2);
    }
    line(cx, cy - 220, cx, cy + 220);

    // Tick Marks (Y-axis only)
    stroke(0, 150, 75, 200);
    for(let d = -220; d <= 220; d += 20) {
      line(cx - 5, cy + d, cx + 5, cy + d); 
    }

    let finalRawY = getPixelY(SCREEN_X);
    deflectionY_cm = (CENTER_Y - finalRawY) / (PX_PER_METER / 100); 

    // Pure 1D deflection
    let hitX_px = cx;
    let hitY_px = finalRawY - (CENTER_Y - cy); 

    drawingContext.shadowBlur = 25; drawingContext.shadowColor = 'cyan';
    fill(150, 255, 255); noStroke(); circle(hitX_px, hitY_px, 14);
    fill(255); circle(hitX_px, hitY_px, 6);
    drawingContext.shadowBlur = 0; 

    fill(0, 255, 0); textSize(14); textAlign(LEFT, TOP); textStyle(BOLD);
    text("TARGET METRICS", cx - 310, cy - 210);
    textStyle(NORMAL);
    text(`Deflection (y): ${deflectionY_cm.toFixed(2)} cm`, cx - 310, cy - 190);
  }

  // SHARED DOM UPDATES
  if(document.getElementById('readY')) {
    document.getElementById('readY').innerText = Math.abs(deflectionY_cm).toFixed(2) + ' cm';
  }
}

// --- PHYSICS KINEMATICS ENGINE ---
function getPixelY(px) {
  let x_m = (px - GUN_X) / PX_PER_METER;
  
  let E_net = valE - (V_X * (valB * 1e-6));
  let a = E_M_RATIO * E_net;
  
  let y_m = 0;

  if (x_m <= PLATE_START_M) {
    y_m = 0;
  } 
  else if (x_m > PLATE_START_M && x_m <= PLATE_END_M) {
    let t = (x_m - PLATE_START_M) / V_X;
    y_m = 0.5 * a * t * t;
  } 
  else if (x_m > PLATE_END_M) {
    let t_plate = (PLATE_END_M - PLATE_START_M) / V_X;
    let v_y = a * t_plate;
    let y_plate = 0.5 * a * t_plate * t_plate;
    
    let t_after = (x_m - PLATE_END_M) / V_X;
    y_m = y_plate + (v_y * t_after);
  }

  return CENTER_Y - (y_m * PX_PER_METER);
}

// --- UI STATE MACHINE ---
function toggleView() {
  if (viewMode === 'SIDE') {
    viewMode = 'FRONT';
    document.getElementById('btnViewToggle').innerHTML = '<i class="bi bi-camera-fill"></i> SWITCH TO SIDE VIEW';
  } else {
    viewMode = 'SIDE';
    document.getElementById('btnViewToggle').innerHTML = '<i class="bi bi-camera"></i> SWITCH TO FRONT VIEW';
  }
}

function setPhase(phase) {
  currentPhase = phase;
  
  let btn1 = document.getElementById('btnPhase1');
  let btn2 = document.getElementById('btnPhase2');
  let btn3 = document.getElementById('btnPhase3');
  let sE = document.getElementById('sliderE');
  let sB = document.getElementById('sliderB');
  
  btn1.className = "btn btn-secondary btn-sm w-100 mb-2 fw-bold";
  btn2.className = "btn btn-secondary btn-sm w-100 mb-2 fw-bold";
  btn3.className = "btn btn-secondary btn-sm w-100 fw-bold";

  if (phase === 1) {
    btn1.className = "btn btn-primary btn-sm w-100 mb-2 fw-bold";
    sE.disabled = false; sB.disabled = true; sB.value = 0; 
  } 
  else if (phase === 2) {
    btn2.className = "btn btn-primary btn-sm w-100 mb-2 fw-bold";
    sE.disabled = true; sE.value = 0; sB.disabled = false;
  } 
  else if (phase === 3) {
    btn3.className = "btn btn-primary btn-sm w-100 fw-bold";
    sE.disabled = false; sB.disabled = false;
  }
  
  updatePhysics();
}

function updatePhysics() {
  valE = parseFloat(document.getElementById('sliderE').value);
  valB = parseFloat(document.getElementById('sliderB').value);
  
  let rawV = parseFloat(document.getElementById('sliderVelocity').value);
  V_X = rawV * 1e7; 

  if(document.getElementById('readV')) document.getElementById('readV').innerText = rawV.toFixed(1) + 'e7 m/s';
  if(document.getElementById('readE')) document.getElementById('readE').innerText = valE + ' V/m';
  if(document.getElementById('readB')) document.getElementById('readB').innerText = valB + ' µT';
}

function calculateEM() {
  let y_cm = parseFloat(document.getElementById('inpY').value);
  let E3 = parseFloat(document.getElementById('inpE3').value);
  let B_uT = parseFloat(document.getElementById('inpB').value);

  if (isNaN(y_cm) || isNaN(E3) || isNaN(B_uT)) {
    alert("Please fill out all 3 measurement fields.");
    return;
  }

  let y_m = y_cm * 0.01;
  let B = B_uT * 1e-6;
  
  let L = 0.1; 
  let D = 0.15; 

  let v = E3 / B;
  let calculatedEM = (y_m * v * v) / (E3 * L * ((L / 2) + D));

  let output = document.getElementById('mathOutput');
  let exponent = Math.floor(Math.log10(calculatedEM));
  let base = (calculatedEM / Math.pow(10, exponent)).toFixed(2);
  
  let errorPct = (Math.abs(calculatedEM - E_M_RATIO) / E_M_RATIO) * 100;
  
  output.innerText = `${base} × 10^${exponent} C/kg   |   Error: ${errorPct.toFixed(2)}%`;
  output.style.color = (errorPct < 5.0) ? "#28a745" : "#dc3545";
}