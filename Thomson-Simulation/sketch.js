// --- GLOBAL VARIABLES ---
let currentPhase = 1;
let valE = 0; // V/m
let valB = 0; // microTesla
let deflectionY_cm = 0;

// True Physics Constants
const E_M_RATIO = 1.76e11; 
const V_X = 1e7; // Initial velocity of electrons: 10,000 km/s

// Canvas Geometry & Scale
// 1 meter = 2000 pixels (so 1 cm = 20 pixels)
const PX_PER_METER = 2000; 
const CENTER_Y = 250;
const GUN_X = 50;

// Positions in Meters
const PLATE_START_M = 0.10; // 10 cm from gun
const PLATE_END_M = 0.20;   // 20 cm from gun (Length = 10cm)
const SCREEN_M = 0.35;      // 35 cm from gun (Drift = 15cm)

// Positions in Pixels
const PLATE_START = GUN_X + (PLATE_START_M * PX_PER_METER);
const PLATE_END = GUN_X + (PLATE_END_M * PX_PER_METER);
const SCREEN_X = GUN_X + (SCREEN_M * PX_PER_METER);

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent('canvas-container');
  updatePhysics();
}

function draw() {
  background(240, 242, 245);

  // 1. Draw Cathode Ray Tube (Glass Outline)
  stroke(180); strokeWeight(3); noFill();
  beginShape();
  vertex(30, CENTER_Y - 40);
  vertex(200, CENTER_Y - 40);
  vertex(SCREEN_X, 20);
  vertex(SCREEN_X, height - 20);
  vertex(200, CENTER_Y + 40);
  vertex(30, CENTER_Y + 40);
  endShape(CLOSE);

  // Draw Screen Phosphor Coating (Cyan Glow)
  stroke(0, 200, 255); strokeWeight(8);
  line(SCREEN_X, 22, SCREEN_X, height - 22);

  // 2. Draw Electron Gun & Label
  fill(80); noStroke();
  rect(30, CENTER_Y - 20, 30, 40, 5); // Base
  fill(40);
  rect(60, CENTER_Y - 5, 10, 10); // Nozzle
  
  fill(100); textSize(12); textStyle(BOLD); textAlign(CENTER);
  text("CATHODE RAY TUBE", 80, CENTER_Y - 50);

  // 3. Central Axis (Dotted Line)
  stroke(150); strokeWeight(2); drawingContext.setLineDash([8, 8]);
  line(GUN_X, CENTER_Y, SCREEN_X, CENTER_Y);
  drawingContext.setLineDash([]);

  // 4. Draw Magnetic Coils
  if (currentPhase >= 2) {
    stroke(0, 86, 179, 80); strokeWeight(4); drawingContext.setLineDash([15, 15]);
    noFill(); circle((PLATE_START + PLATE_END)/2, CENTER_Y, 150);
    drawingContext.setLineDash([]);
    noStroke(); fill(0, 86, 179, 150); textAlign(CENTER);
    text("B-Field Coils", (PLATE_START + PLATE_END)/2, CENTER_Y + 90);
  }

  // 5. Draw Electric Plates (Wider Gap)
  fill(217, 83, 79); // Red (+)
  rect(PLATE_START, CENTER_Y - 50, PLATE_END - PLATE_START, 8, 3);
  fill(50, 50, 50); // Dark (-)
  rect(PLATE_START, CENTER_Y + 42, PLATE_END - PLATE_START, 8, 3);

  // 6. Draw Continuous Beam
  noFill(); stroke(0, 255, 255, 100); strokeWeight(4);
  beginShape();
  for (let px = GUN_X; px <= SCREEN_X; px += 5) {
    vertex(px, getPixelY(px));
  }
  endShape();

  // 7. Dynamic Animation (Moving Electrons)
  let speed = 8; 
  fill(255); noStroke();
  for (let i = 0; i < 12; i++) {
    // Space electrons out, move them based on frameCount
    let px = GUN_X + ((frameCount * speed + i * 60) % (SCREEN_X - GUN_X));
    let py = getPixelY(px);
    
    // Add a slight cyan glow to the dots
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'cyan';
    circle(px, py, 6);
    drawingContext.shadowBlur = 0; // reset
  }

  // 8. Measurement Visualization (The 'y' Arrow)
  let finalY = getPixelY(SCREEN_X);
  deflectionY_cm = (CENTER_Y - finalY) / (PX_PER_METER / 100); // pixels to cm

  if (Math.abs(deflectionY_cm) > 0.05) {
    stroke(200, 50, 50); strokeWeight(2);
    // Draw dimensional line beside the screen
    line(SCREEN_X + 25, CENTER_Y, SCREEN_X + 25, finalY);
    
    // Draw arrowheads
    push();
    fill(200, 50, 50); noStroke();
    let dir = (finalY < CENTER_Y) ? -1 : 1;
    // Top arrow
    triangle(SCREEN_X + 25, finalY, SCREEN_X + 20, finalY - dir*6, SCREEN_X + 30, finalY - dir*6);
    // Center Axis arrow
    triangle(SCREEN_X + 25, CENTER_Y, SCREEN_X + 20, CENTER_Y + dir*6, SCREEN_X + 30, CENTER_Y + dir*6);
    pop();

    // Text Label
    fill(200, 50, 50); noStroke(); textAlign(LEFT, CENTER); textSize(14);
    text(`y = ${Math.abs(deflectionY_cm).toFixed(2)} cm`, SCREEN_X + 35, (CENTER_Y + finalY)/2);
  }

  // Update UI Readouts
  document.getElementById('valE').innerText = valE;
  document.getElementById('valB').innerText = valB;
  document.getElementById('valY').innerText = Math.abs(deflectionY_cm).toFixed(2);
}

// --- PHYSICS KINEMATICS ENGINE ---
// Maps a pixel X coordinate to a pixel Y coordinate based on exact force equations
function getPixelY(px) {
  let x_m = (px - GUN_X) / PX_PER_METER;
  
  // F_net = Eq - Bqv -> a = (e/m)(E - Bv)
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

  // Convert meters back to canvas pixels (Subtract because canvas Y goes down)
  return CENTER_Y - (y_m * PX_PER_METER);
}

// --- UI STATE MACHINE ---
function setPhase(phase) {
  currentPhase = phase;
  
  let btn1 = document.getElementById('btnPhase1');
  let btn2 = document.getElementById('btnPhase2');
  let btn3 = document.getElementById('btnPhase3');
  let sE = document.getElementById('sliderE');
  let sB = document.getElementById('sliderB');
  
  btn1.style.backgroundColor = "#6c757d"; btn2.style.backgroundColor = "#6c757d"; btn3.style.backgroundColor = "#6c757d";
  document.getElementById('mathOutput').innerText = "---";

  if (phase === 1) {
    btn1.style.backgroundColor = "#0056b3"; 
    sE.disabled = false; sB.disabled = true; sB.value = 0; 
  } 
  else if (phase === 2) {
    btn2.style.backgroundColor = "#0056b3";
    sE.disabled = true; sE.value = 0; sB.disabled = false;
  } 
  else if (phase === 3) {
    btn3.style.backgroundColor = "#0056b3";
    sE.disabled = false; sB.disabled = false;
  }
  updatePhysics();
}

function updatePhysics() {
  valE = parseInt(document.getElementById('sliderE').value);
  valB = parseInt(document.getElementById('sliderB').value);
}

// --- EXPERIMENTAL MATH VALIDATOR ---
function calculateEM() {
  let y_cm = parseFloat(document.getElementById('inpY').value);
  let E1 = parseFloat(document.getElementById('inpE1').value);
  let E3 = parseFloat(document.getElementById('inpE3').value);
  let B_uT = parseFloat(document.getElementById('inpB').value);

  if (isNaN(y_cm) || isNaN(E1) || isNaN(E3) || isNaN(B_uT)) {
    alert("Please fill out all measurement fields.");
    return;
  }

  // Convert to Standard SI Units
  let y_m = y_cm * 0.01;
  let B = B_uT * 1e-6;
  
  // Constants from Apparatus
  let L = 0.1; // 10cm plate
  let D = 0.15; // 15cm drift to screen

  // 1. Calculate Velocity from Phase 3 Balance
  let v = E3 / B;

  // 2. Calculate e/m from Phase 1 Deflection
  // Formula: Y_total = (e*E*L / m*v^2) * (L/2 + D)
  let calculatedEM = (y_m * v * v) / (E1 * L * ((L / 2) + D));

  // Output formatting
  let output = document.getElementById('mathOutput');
  let exponent = Math.floor(Math.log10(calculatedEM));
  let base = (calculatedEM / Math.pow(10, exponent)).toFixed(2);
  
  output.innerText = `${base} × 10^${exponent} C/kg`;
  
  // Color code based on accuracy to true 1.76e11
  let error = Math.abs(calculatedEM - 1.76e11) / 1.76e11;
  output.style.color = (error < 0.05) ? "#28a745" : "#dc3545";
}