// --- TRUE PHYSICS CONSTANTS ---
const e_charge = 1.602e-19;       
const eta = 1.81e-5;              
const rho_oil = 900;              
const rho_air = 1.2;              
const g = 9.81;                   
const d_plates = 0.015;           // 1.5 cm for longer observation time

// --- SIMULATION GEOMETRY & SCALE ---
const CANVAS_W = 1050;
const CANVAS_H = 650;             
const PLATE_TOP_PX = 200;         
const PLATE_BOT_PX = 550;
const PX_PER_METER = (PLATE_BOT_PX - PLATE_TOP_PX) / d_plates; 
const TIME_SCALE = 8;             

// --- GLOBAL STATE ---
let currentPhase = 1;
let appliedVoltage = 0; 
let E_field = 0;
let mistParticles = [];           

// --- DROPLET OBJECT ---
let drop = {
  n: 0,           
  q: 0,           
  r: 0,           
  m: 0,           
  y_m: 0.0005,    
  v_m: 0,         
  
  v_term: 0,      
  v_fall_locked: null, 
  v_rise_locked: null, 
  v_locked_voltage: null
};

function setup() {
  let canvas = createCanvas(CANVAS_W, CANVAS_H);
  canvas.parent('canvas-container');
  spawnDroplet();
}

function spawnDroplet() {
  drop.n = floor(random(1, 6)); 
  drop.q = drop.n * e_charge;
  drop.r = random(1.5e-6, 2.5e-6); 
  
  let volume = (4/3) * Math.PI * Math.pow(drop.r, 3);
  drop.m = volume * rho_oil;
  
  drop.y_m = 0.0005; 
  drop.v_m = 0;
  drop.v_fall_locked = null;
  drop.v_rise_locked = null;
  drop.v_locked_voltage = null;
  
  // Generate Atomizer Mist
  mistParticles = [];
  let cx = CANVAS_W / 2;
  for(let i = 0; i < 40; i++) {
    mistParticles.push({
      x: cx + 220, 
      y: PLATE_TOP_PX - 80 + random(-10, 10),
      vx: random(-3, -6),
      vy: random(-1, 2),
      alpha: 255
    });
  }
  
  setPhase(1); 
}

function draw() {
  background(240, 242, 245);
  drawApparatus();
  updateDropletPhysics();
  drawDroplet();
  drawFBD(); 
  updateHUD();
}

function drawApparatus() {
  let cx = CANVAS_W / 2;
  
  // 1. Draw Main Housing Chamber
  fill(235); stroke(150); strokeWeight(4);
  rect(cx - 220, PLATE_TOP_PX - 150, 440, PLATE_BOT_PX - PLATE_TOP_PX + 200, 10);
  
  // 2. Draw Microscope Circular Viewport Mask
  fill(250); noStroke(); 
  circle(cx, (PLATE_TOP_PX + PLATE_BOT_PX)/2, 380);
  stroke(200); strokeWeight(3); noFill(); 
  circle(cx, (PLATE_TOP_PX + PLATE_BOT_PX)/2, 380);

  // 3. Draw Atomizer
  push();
  fill(150, 200, 255); stroke(100); strokeWeight(2);
  rect(cx + 220, PLATE_TOP_PX - 50, 35, 45, 5); // Bottle
  fill(180); rect(cx + 230, PLATE_TOP_PX - 70, 15, 20); // Cap
  rect(cx + 210, PLATE_TOP_PX - 85, 30, 8); // Nozzle entering chamber
  fill('#198754'); ellipse(cx + 265, PLATE_TOP_PX - 60, 30, 25); // Squeeze Bulb
  pop();

  // 4. Animate Mist
  noStroke(); fill(218, 165, 32, 180);
  for (let i = mistParticles.length - 1; i >= 0; i--) {
    let p = mistParticles[i];
    fill(218, 165, 32, p.alpha);
    circle(p.x, p.y, random(2, 5));
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; 
    p.alpha -= 3; 
    if (p.alpha <= 0) mistParticles.splice(i, 1);
  }

  // 5. Draw Plates (With Hole in Top Plate)
  strokeWeight(8); strokeCap(SQUARE);
  stroke('#dc3545'); // Top plate (Positive)
  line(cx - 200, PLATE_TOP_PX, cx - 15, PLATE_TOP_PX); // Left half
  line(cx + 15, PLATE_TOP_PX, cx + 200, PLATE_TOP_PX); // Right half

  stroke('#0d6efd'); // Bottom plate (Negative)
  line(cx - 200, PLATE_BOT_PX, cx + 200, PLATE_BOT_PX);

  // 6. Draw Reticle (Grid Lines inside viewport)
  stroke(0, 0, 0, 30); strokeWeight(1);
  for(let y = PLATE_TOP_PX + 40; y < PLATE_BOT_PX; y += 40) {
    line(cx - 150, y, cx + 150, y);
  }

  // 7. Draw Battery Circuit
  drawCircuit(cx);

  // ==========================================
  // 8. TEXTBOOK DIAGRAM LABELS
  // ==========================================
  push();
  fill(80); noStroke(); textSize(12); textStyle(BOLD);

  // Atomizer Label & Pointer
  textAlign(CENTER, BOTTOM);
  text("ATOMIZER", cx + 258, PLATE_TOP_PX - 95);
  stroke(150); strokeWeight(2);
  line(cx + 245, PLATE_TOP_PX - 92, cx + 245, PLATE_TOP_PX - 75);

  // Plate Labels
  noStroke();
  textAlign(RIGHT, BOTTOM);
  fill('#dc3545');
  text("CHARGED PLATE (+)", cx - 260, PLATE_TOP_PX - 5);

  textAlign(RIGHT, TOP);
  fill('#0d6efd');
  text("CHARGED PLATE (-)", cx - 260, PLATE_BOT_PX + 5);

  // Microscope Label
  textAlign(LEFT, CENTER);
  fill(80);
  text("VIEWING\nMICROSCOPE", cx + 205, (PLATE_TOP_PX + PLATE_BOT_PX)/2);
  pop();
}

function drawCircuit(cx) {
  let bat_y = (PLATE_TOP_PX + PLATE_BOT_PX) / 2;
  let bat_x = cx - 280;

  stroke(100); strokeWeight(3); noFill();
  line(cx - 200, PLATE_TOP_PX, bat_x, PLATE_TOP_PX);
  line(bat_x, PLATE_TOP_PX, bat_x, bat_y - 25);
  line(cx - 200, PLATE_BOT_PX, bat_x, PLATE_BOT_PX);
  line(bat_x, PLATE_BOT_PX, bat_x, bat_y + 25);

  stroke(0);
  strokeWeight(2); line(bat_x - 15, bat_y - 15, bat_x + 15, bat_y - 15); 
  strokeWeight(5); line(bat_x - 8, bat_y - 5, bat_x + 8, bat_y - 5);   
  strokeWeight(2); line(bat_x - 15, bat_y + 5, bat_x + 15, bat_y + 5);   
  strokeWeight(5); line(bat_x - 8, bat_y + 15, bat_x + 8, bat_y + 15);   
  
  strokeWeight(2); line(bat_x, bat_y - 15, bat_x, bat_y + 15);

  fill('#dc3545'); noStroke(); textSize(20); textStyle(BOLD);
  text("+", bat_x + 25, bat_y - 10);
  fill('#0d6efd');
  text("-", bat_x + 25, bat_y + 25);
}

function updateDropletPhysics() {
  let dt = (1 / 60) * TIME_SCALE;
  
  let F_gravity = drop.m * g;
  let F_buoyancy = (4/3) * Math.PI * Math.pow(drop.r, 3) * rho_air * g;
  let F_electric = drop.q * E_field; 
  let F_net_const = F_gravity - F_buoyancy - F_electric;
  let k_drag = 6 * Math.PI * eta * drop.r;
  
  drop.v_term = F_net_const / k_drag;
  
  drop.v_m = drop.v_term + (drop.v_m - drop.v_term) * Math.exp(-(k_drag / drop.m) * dt);
  
  drop.y_m += drop.v_m * dt;
  
  if (drop.y_m <= 0) { drop.y_m = 0; drop.v_m = 0; }
  if (drop.y_m >= d_plates) { drop.y_m = d_plates; drop.v_m = 0; }
  
  let relativeError = Math.abs((drop.v_m - drop.v_term) / drop.v_term);
  if (relativeError < 0.01 && drop.y_m > 0 && drop.y_m < d_plates) {
    if (currentPhase === 1) drop.v_fall_locked = drop.v_m;
    if (currentPhase === 2) {
      drop.v_rise_locked = -drop.v_m; 
      drop.v_locked_voltage = appliedVoltage;
    }
  } else {
    if (currentPhase === 2) drop.v_rise_locked = null; 
  }
}

function drawDroplet() {
  let cx = CANVAS_W / 2;
  let y_px = PLATE_TOP_PX + (drop.y_m * PX_PER_METER);
  
  drawingContext.shadowBlur = 10; drawingContext.shadowColor = '#000000';
  fill('#ffd700'); noStroke();
  circle(cx, y_px, 12); 
  drawingContext.shadowBlur = 0;
}

function drawFBD() {
  let box_w = 160;
  let box_h = 240;
  let fbd_x = CANVAS_W - box_w - 30; 
  let fbd_y = 30;

  fill(255, 255, 255, 230); stroke(200); strokeWeight(2);
  rect(fbd_x, fbd_y, box_w, box_h, 8);

  fill(50); noStroke(); textSize(12); textStyle(BOLD); textAlign(CENTER, TOP);
  text("FREE-BODY DIAGRAM", fbd_x + box_w/2, fbd_y + 15);
  stroke(220); strokeWeight(1);
  line(fbd_x + 10, fbd_y + 35, fbd_x + box_w - 10, fbd_y + 35);

  let origin_x = fbd_x + box_w/2;
  let origin_y = fbd_y + 110;

  let F_gravity = drop.m * g;
  let F_electric = drop.q * E_field;
  let F_drag = -6 * Math.PI * eta * drop.r * drop.v_m; 
  
  let scale = 45 / F_gravity; 

  fill('#ffd700'); stroke(150); strokeWeight(1); circle(origin_x, origin_y, 10);

  drawCleanArrow(origin_x, origin_y, origin_x, origin_y + (F_gravity * scale), '#dc3545', "Fg");

  if (currentPhase === 2 && F_electric > 0) {
    drawCleanArrow(origin_x, origin_y, origin_x, origin_y - (F_electric * scale), '#0d6efd', "Fe");
  }

  if (Math.abs(F_drag * scale) > 2) { 
    drawCleanArrow(origin_x + 8, origin_y, origin_x + 8, origin_y + (F_drag * scale), '#198754', "Fd");
  }

  textAlign(LEFT, CENTER); textSize(12);
  fill('#dc3545'); text("Gravity (Fg)", fbd_x + 15, fbd_y + 180);
  fill('#0d6efd'); text("Electric (Fe)", fbd_x + 15, fbd_y + 200);
  fill('#198754'); text("Drag (Fd)", fbd_x + 15, fbd_y + 220);
}

function drawCleanArrow(x1, y1, x2, y2, clr, lbl) {
  stroke(clr); fill(clr); strokeWeight(3);
  line(x1, y1, x2, y2);
  push();
  translate(x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);
  rotate(angle);
  let arrowSize = 6;
  triangle(-arrowSize, arrowSize * 0.6, -arrowSize, -arrowSize * 0.6, 0, 0);
  pop();

  noStroke(); fill(clr); textSize(11); textStyle(BOLD);
  if (y2 > y1) {
    textAlign(LEFT, TOP); text(lbl, x2 + 5, y2);
  } else {
    textAlign(LEFT, BOTTOM); text(lbl, x2 + 5, y2);
  }
}

function setPhase(phase) {
  currentPhase = phase;
  
  let btn1 = document.getElementById('btnPhase1');
  let btn2 = document.getElementById('btnPhase2');
  let sV = document.getElementById('sliderV');
  
  btn1.className = "btn btn-secondary btn-sm w-100 mb-2 fw-bold";
  btn2.className = "btn btn-secondary btn-sm w-100 mb-2 fw-bold";

  if (phase === 1) {
    btn1.className = "btn btn-primary btn-sm w-100 mb-2 fw-bold";
    sV.disabled = true; 
    sV.value = 0; 
  } 
  else if (phase === 2) {
    btn2.className = "btn btn-primary btn-sm w-100 mb-2 fw-bold";
    sV.disabled = false;
  }
  updatePhysics();
}

function updatePhysics() {
  appliedVoltage = parseFloat(document.getElementById('sliderV').value);
  E_field = appliedVoltage / d_plates;
  
  if(document.getElementById('readV_slider')) {
    document.getElementById('readV_slider').innerText = appliedVoltage + " V";
  }
}

function updateHUD() {
  if(document.getElementById('hudVel')) {
    document.getElementById('hudVel').innerText = drop.v_m.toExponential(2) + " m/s";
  }
  if(document.getElementById('hudE')) {
    document.getElementById('hudE').innerText = E_field.toExponential(2) + " V/m";
  }
  if(document.getElementById('hudStatus')) {
    let statusEl = document.getElementById('hudStatus');
    let relativeError = Math.abs((drop.v_m - drop.v_term) / drop.v_term);
    
    if (drop.y_m <= 0 || drop.y_m >= d_plates) {
      statusEl.innerText = "Grounded";
      statusEl.className = "bg-white border rounded px-2 py-1 text-danger fw-bold fs-6";
    } else if (relativeError < 0.01) {
      statusEl.innerText = "Terminal Velocity";
      statusEl.className = "bg-white border rounded px-2 py-1 text-success fw-bold fs-6";
    } else {
      statusEl.innerText = "Accelerating...";
      statusEl.className = "bg-white border rounded px-2 py-1 text-warning fw-bold fs-6";
    }
  }

  let vfBox = document.getElementById('readVf');
  if (drop.v_fall_locked !== null) {
    vfBox.innerText = drop.v_fall_locked.toExponential(3) + " m/s";
    vfBox.className = "readout-box locked-value";
  } else {
    vfBox.innerText = "Waiting...";
    vfBox.className = "readout-box";
  }

  let vrBox = document.getElementById('readVr');
  if (drop.v_rise_locked !== null) {
    vrBox.innerText = drop.v_rise_locked.toExponential(3) + " m/s";
    vrBox.className = "readout-box locked-value";
  } else {
    vrBox.innerText = "Waiting...";
    vrBox.className = "readout-box";
  }
}

function calculateCharge() {
  if (drop.v_fall_locked === null || drop.v_rise_locked === null || drop.v_locked_voltage === null) {
    alert("Please wait for both Terminal Fall and Terminal Rise velocities to lock before calculating.");
    return;
  }

  let v_f = drop.v_fall_locked;
  let v_r = drop.v_rise_locked;
  let V = drop.v_locked_voltage;
  let E = V / d_plates;

  let r_calc = Math.sqrt( (9 * eta * v_f) / (2 * g * (rho_oil - rho_air)) );
  let q_calc = (6 * Math.PI * eta * r_calc * (v_f + v_r)) / E;
  let n_calc = Math.round(q_calc / e_charge);

  let output = document.getElementById('mathOutput');
  let exponent = Math.floor(Math.log10(q_calc));
  let base = (q_calc / Math.pow(10, exponent)).toFixed(3);
  
  output.innerHTML = `Charge (q): <b>${base} × 10^${exponent} C</b><br>Electrons (n): <b class="text-success fs-5">${n_calc}</b>`;
}