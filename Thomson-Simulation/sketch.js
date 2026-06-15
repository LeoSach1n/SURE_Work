// --- GLOBAL VARIABLES ---
let currentPhase = 1;
let valE = 0; // V/m
let valB = 0; // microTesla
let valVoltage = 284; // Accelerating Voltage
let valRotation = 0; // Tube Rotation (degrees)
let deflectionY_cm = 0;
let viewMode = 'SIDE'; // 'SIDE' or 'FRONT'

// True Physics Constants
const E_M_RATIO = 1.76e11; 
let V_X = 1e7; 

// Canvas Geometry & Scale
const PX_PER_METER = 2000; 
const CENTER_Y = 300; 
const GUN_X = 150; // Shifted right from 90 to 150 to center the apparatus

// Positions in Meters
const PLATE_START_M = 0.10; 
const PLATE_END_M = 0.20;   
const SCREEN_M = 0.35;      

// Positions in Pixels
const PLATE_START = GUN_X + (PLATE_START_M * PX_PER_METER);
const PLATE_END = GUN_X + (PLATE_END_M * PX_PER_METER);
const SCREEN_X = GUN_X + (SCREEN_M * PX_PER_METER);

function setup() {
  let canvas = createCanvas(950, 600);
  canvas.parent('canvas-container');
  updatePhysics();
}

function draw() {
  background(240, 242, 245);

  // ==========================================
  // CAMERA: SIDE VIEW
  // ==========================================
  if (viewMode === 'SIDE') {
    
    // 1. Draw Cathode Ray Tube (Glass Funnel)
    stroke(0); // Changed to black outline
    strokeWeight(3); noFill();
    beginShape();
    vertex(30, CENTER_Y - 40); vertex(200, CENTER_Y - 40);
    vertex(SCREEN_X - 60, CENTER_Y - 230); vertex(SCREEN_X - 60, CENTER_Y + 230);
    vertex(200, CENTER_Y + 40); vertex(30, CENTER_Y + 40);
    endShape(CLOSE);

    // 2. Draw CRT Curved Face Profile
    noFill();
    stroke(50); strokeWeight(8); strokeCap(ROUND);
    arc(SCREEN_X - 60, CENTER_Y, 120, 460, -HALF_PI, HALF_PI);
    
    stroke(15, 40, 25); strokeWeight(4); strokeCap(ROUND);
    arc(SCREEN_X - 60, CENTER_Y, 120, 445, -HALF_PI, HALF_PI);

    // 3. Draw Authentic Electron Gun 
    push();
    fill(10,10,10, 40); stroke(0,0,0, 150); strokeWeight(2);
    rect(10, CENTER_Y - 35, GUN_X - 5, 70, 20); 
    stroke(255, 255, 255, 200); strokeWeight(3);
    line(20, CENTER_Y - 25, GUN_X - 15, CENTER_Y - 25);
    pop();

    push();
    stroke(255, 150, 0); strokeWeight(2); noFill();
    drawingContext.shadowBlur = 10; drawingContext.shadowColor = 'orange';
    beginShape(); vertex(20, CENTER_Y - 15); vertex(30, CENTER_Y - 5); vertex(20, CENTER_Y + 5); vertex(30, CENTER_Y + 15); endShape();
    pop();

    push(); fill(0, 100, 255); noStroke(); rect(45, CENTER_Y - 15, 6, 30, 2); fill(0, 100, 255); textSize(14); textStyle(BOLD); textAlign(CENTER); text("C (-)", 48, CENTER_Y - 50); pop();
    push(); stroke(220, 50, 50); strokeWeight(4); noFill(); ellipse(GUN_X, CENTER_Y, 10, 45); fill(220, 50, 50); noStroke(); textSize(14); textStyle(BOLD); textAlign(CENTER); text("A (+)", GUN_X, CENTER_Y - 50); pop();

    fill(240); textSize(12); textStyle(BOLD); textAlign(CENTER);
    text("ELECTRON GUN", 80, CENTER_Y + 70);

    // 4. Central Axis
    stroke(150); strokeWeight(2); drawingContext.setLineDash([8, 8]);
    line(GUN_X, CENTER_Y, SCREEN_X, CENTER_Y);
    drawingContext.setLineDash([]);

    // 5. Draw Magnetic Coils
    if (currentPhase == 2 || currentPhase == 3) {
      let alpha = (currentPhase == 2) ? 250 : 150;
      stroke(0, 86, 179, alpha); strokeWeight(5); drawingContext.setLineDash([15, 15]);
      noFill(); circle((PLATE_START + PLATE_END)/2, CENTER_Y, 150);
      drawingContext.setLineDash([]);
      noStroke(); fill(0, 86, 179, alpha); textAlign(CENTER);
      text("B-Field Coils", (PLATE_START + PLATE_END)/2, CENTER_Y + 90);
    }

    // 6. Draw Electric Plates
    let plateAlpha = (currentPhase==2)?50:255;
    fill(217, 83, 79,plateAlpha); rect(PLATE_START, CENTER_Y - 50, PLATE_END - PLATE_START, 8, 3);
    fill(50, 50, 50,plateAlpha); rect(PLATE_START, CENTER_Y + 42, PLATE_END - PLATE_START, 8, 3);

    // --- BEAM RENDERING MATH ---
    let rad = radians(valRotation); 
    
    // 7. Draw Continuous Beam
    noFill(); stroke(0, 255, 255, 100); strokeWeight(4);
    beginShape();
    for (let px = GUN_X; px <= SCREEN_X; px += 5) {
      let rawY = getPixelY(px);
      let rotatedY = CENTER_Y - ((CENTER_Y - rawY) * Math.cos(rad));
      vertex(px, rotatedY);
    }
    endShape();

    // 8. Dynamic Animation (Moving Electrons)
    let speed = 8; fill(255); noStroke();
    for (let i = 0; i < 12; i++) {
      let px = GUN_X + ((frameCount * speed + i * 60) % (SCREEN_X - GUN_X));
      let rawY = getPixelY(px);
      let rotatedY = CENTER_Y - ((CENTER_Y - rawY) * Math.cos(rad));
      drawingContext.shadowBlur = 10; drawingContext.shadowColor = 'cyan';
      circle(px, rotatedY, 6); drawingContext.shadowBlur = 0; 
    }

    // 9. Measurement Visualization (The 'y' Arrow)
    let finalRawY = getPixelY(SCREEN_X);
    deflectionY_cm = (CENTER_Y - finalRawY) / (PX_PER_METER / 100); 
    let displayY = CENTER_Y - ((CENTER_Y - finalRawY) * Math.cos(rad));

    push();
    drawingContext.shadowBlur = 15; 
    drawingContext.shadowColor = 'cyan';
    fill(150, 255, 255); noStroke();
    circle(SCREEN_X, displayY, 8); 
    fill(255); circle(SCREEN_X, displayY, 4); 
    pop();

    if (Math.abs(deflectionY_cm) > 0.05) {
      stroke(200, 50, 50); strokeWeight(2);
      line(SCREEN_X + 25, CENTER_Y, SCREEN_X + 25, displayY);
      
      push(); fill(200, 50, 50); noStroke();
      let dir = (displayY < CENTER_Y) ? -1 : 1;
      triangle(SCREEN_X + 25, displayY, SCREEN_X + 20, displayY - dir*6, SCREEN_X + 30, displayY - dir*6);
      triangle(SCREEN_X + 25, CENTER_Y, SCREEN_X + 20, CENTER_Y + dir*6, SCREEN_X + 30, CENTER_Y + dir*6);
      pop();

      fill(200, 50, 50); noStroke(); textAlign(LEFT, CENTER); textSize(14);
      text(`y = ${Math.abs(deflectionY_cm).toFixed(2)} cm`, SCREEN_X + 35, (CENTER_Y + displayY)/2);
    }
    
    fill(80); noStroke(); textAlign(LEFT, BOTTOM); textStyle(NORMAL); textSize(12);
    let textBaseY = height - 15;
    text("e/m = 2yE / (B²L²)", 20, textBaseY);
    text("v = E / B", 20, textBaseY - 20);
    text("Fm = evB  (Fleming's Left-Hand Rule)", 20, textBaseY - 40);
    text("Fe = eE", 20, textBaseY - 60);
    textStyle(BOLD); fill(50);
    text("Governing Formulas:", 20, textBaseY - 80);
  } 

  // ==========================================
  // CAMERA: FRONT VIEW (OSCILLOSCOPE)
  // ==========================================
  else if (viewMode === 'FRONT') {
    let cx = width / 2;
    let cy = height / 2;

    fill(30); stroke(80); strokeWeight(15);
    circle(cx, cy, 460);

    fill(10, 25, 15); noStroke();
    circle(cx, cy, 445);

    stroke(0, 100, 50, 150); strokeWeight(2);
    for(let r = 20; r <= 220; r += 20) { 
      noFill(); circle(cx, cy, r*2);
    }
    line(cx - 220, cy, cx + 220, cy);
    line(cx, cy - 220, cx, cy + 220);

    stroke(0, 150, 75, 200);
    for(let d = -220; d <= 220; d += 20) {
      line(cx + d, cy - 5, cx + d, cy + 5); 
      line(cx - 5, cy + d, cx + 5, cy + d); 
    }

    let finalRawY = getPixelY(SCREEN_X);
    deflectionY_cm = (CENTER_Y - finalRawY) / (PX_PER_METER / 100); 

    let rad = radians(valRotation);
    let hitX_cm = deflectionY_cm * Math.sin(rad);
    let hitY_cm = deflectionY_cm * Math.cos(rad);

    let hitX_px = cx + (hitX_cm * 20);
    let hitY_px = cy - (hitY_cm * 20);

    drawingContext.shadowBlur = 25; drawingContext.shadowColor = 'cyan';
    fill(150, 255, 255); noStroke(); circle(hitX_px, hitY_px, 14);
    fill(255); circle(hitX_px, hitY_px, 6);
    drawingContext.shadowBlur = 0; 

    fill(0, 255, 0); textSize(14); textAlign(LEFT, TOP); textStyle(BOLD);
    text("TARGET METRICS", cx - 310, cy - 210);
    textStyle(NORMAL);
    text(`X Offset: ${hitX_cm.toFixed(2)} cm`, cx - 310, cy - 190);
    text(`Y Offset: ${hitY_cm.toFixed(2)} cm`, cx - 310, cy - 170);
    text(`Tube Rotation: ${valRotation}°`, cx - 310, cy - 150);
  }

  // ==========================================
  // SHARED UI ELEMENTS (Updates HTML DOM)
  // ==========================================
  if(document.getElementById('valE')) document.getElementById('valE').innerText = valE;
  if(document.getElementById('valB')) document.getElementById('valB').innerText = valB;
  
  if(document.getElementById('readE')) document.getElementById('readE').innerText = valE;
  if(document.getElementById('readB')) document.getElementById('readB').innerText = valB;
  if(document.getElementById('readY')) document.getElementById('readY').innerText = Math.abs(deflectionY_cm).toFixed(2);
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
    document.getElementById('btnViewToggle').innerHTML = '<i class="bi bi-camera"></i> SWITCH TO FRONT OSCILLOSCOPE VIEW';
  }
}

function setPhase(phase) {
  currentPhase = phase;
  
  let btn1 = document.getElementById('btnPhase1');
  let btn2 = document.getElementById('btnPhase2');
  let btn3 = document.getElementById('btnPhase3');
  let sE = document.getElementById('sliderE');
  let sB = document.getElementById('sliderB');
  
  // Reset all buttons to the "unselected" outline style
  btn1.className = "btn btn-outline-secondary btn-sm w-100 mb-2 fw-bold";
  btn2.className = "btn btn-outline-secondary btn-sm w-100 mb-2 fw-bold";
  btn3.className = "btn btn-outline-secondary btn-sm w-100 fw-bold";

  // Apply the "selected" solid primary style to the active button
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
  valE = parseInt(document.getElementById('sliderE').value);
  valB = parseInt(document.getElementById('sliderB').value);
  
  let sliderV = document.getElementById('sliderVoltage');
  if (sliderV) {
    valVoltage = parseInt(sliderV.value);
    if(document.getElementById('valVoltage')) {
      document.getElementById('valVoltage').innerText = valVoltage;
    }
    V_X = Math.sqrt(2 * E_M_RATIO * valVoltage);
  }

  let sliderRot = document.getElementById('sliderRotation');
  if (sliderRot) {
    valRotation = parseInt(sliderRot.value);
    if(document.getElementById('valRotation')) {
      document.getElementById('valRotation').innerText = valRotation;
    }
  }
}

// --- EXPERIMENTAL MATH VALIDATOR ---
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