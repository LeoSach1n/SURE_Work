// --- TRUE PHYSICS CONSTANTS ---
const e_charge = 1.602e-19;       
const eta = 1.81e-5;              
const rho_oil = 900;              
const rho_air = 1.2;              
const g = 9.81;                   
const d_plates = 0.015;           

// --- SIMULATION GEOMETRY & SCALE ---
const CANVAS_W = 1050;
const CANVAS_H = 650;             
const PLATE_TOP_PX = 200;         
const PLATE_BOT_PX = 550;
const PX_PER_METER = (PLATE_BOT_PX - PLATE_TOP_PX) / d_plates; 
const TIME_SCALE = 8;             

// --- GLOBAL STATE ---
let appliedVoltage = 0; 
let E_field = 0;
let mistParticles = [];           

// --- INTERACTIVE ASSETS ---
let droplets = [];
let targetedDrop = null;

function setup() {
  let canvas = createCanvas(CANVAS_W, CANVAS_H);
  canvas.parent('canvas-container');
  
  // Spray an initial batch automatically
  sprayDropletBatch();
}

function draw() {
  background(240, 242, 245);
  drawApparatus();
  updateDropletsPhysics();
  drawDroplets();
  drawFBD(); 
  updateHUD();
}

function mousePressed() {
  let cx = CANVAS_W / 2;
  let atomX = cx + 215;
  let atomY = PLATE_TOP_PX - 95;
  
  // Check if Atomizer was clicked
  if (mouseX > atomX && mouseX < atomX + 60 && mouseY > atomY && mouseY < atomY + 70) {
    sprayDropletBatch();
  }
}

function sprayDropletBatch() {
  let shared_n = floor(random(1, 6)); 
  let shared_q = shared_n * e_charge;
  let shared_r = random(1.5e-6, 2.5e-6); 
  let volume = (4/3) * Math.PI * Math.pow(shared_r, 3);
  let shared_m = volume * rho_oil;
  
  droplets = [];
  targetedDrop = null;

  for (let i = 0; i < 6; i++) {
    droplets.push({
      n: shared_n,           
      q: shared_q,           
      r: shared_r,           
      m: shared_m,           
      y_m: 0.0005 + random(-0.0002, 0.0002), 
      x_offset: random(-80, 80), 
      x_vel: random(-0.2, 0.2),  
      v_m: 0,         
      v_term: 0,      
      v_fall_locked: null, 
      v_rise_locked: null, 
      v_locked_voltage: null
    });
  }
  
  // Automatically target a random droplet
  targetedDrop = random(droplets);
  
  mistParticles = [];
  let cx = CANVAS_W / 2;
  for(let i = 0; i < 30; i++) {
    mistParticles.push({
      x: cx + 210, 
      y: PLATE_TOP_PX - 80 + random(-10, 10),
      vx: random(-3, -6),
      vy: random(-1, 2),
      alpha: 255
    });
  }
}

function drawApparatus() {
  let cx = CANVAS_W / 2;
  
  // Main Housing
  fill(235); stroke(150); strokeWeight(4);
  rect(cx - 220, PLATE_TOP_PX - 150, 440, PLATE_BOT_PX - PLATE_TOP_PX + 200, 10);
  
  // Viewport
  fill(250); noStroke(); circle(cx, (PLATE_TOP_PX + PLATE_BOT_PX)/2, 380);
  stroke(200); strokeWeight(3); noFill(); circle(cx, (PLATE_TOP_PX + PLATE_BOT_PX)/2, 380);

  // Animate Spray Mist
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

  // Draw Plates
  strokeWeight(8); strokeCap(SQUARE);
  stroke('#dc3545'); 
  line(cx - 200, PLATE_TOP_PX, cx - 15, PLATE_TOP_PX); 
  line(cx + 15, PLATE_TOP_PX, cx + 200, PLATE_TOP_PX); 
  stroke('#0d6efd'); 
  line(cx - 200, PLATE_BOT_PX, cx + 200, PLATE_BOT_PX);

  // Reticle
  stroke(0, 0, 0, 30); strokeWeight(1);
  for(let y = PLATE_TOP_PX + 40; y < PLATE_BOT_PX; y += 40) {
    line(cx - 150, y, cx + 150, y);
  }

  drawCircuit(cx);

  // Removed fallback geometric atomizer

  // Labels
  push();
  fill(80); noStroke(); textSize(12); textStyle(BOLD);
  textAlign(CENTER, BOTTOM);
  // Shifted text 20 pixels higher
  text(" CLICK TO\nSPRAY", cx + 253, PLATE_TOP_PX - 100);
  textAlign(RIGHT, BOTTOM);
  fill('#dc3545'); text("CHARGED PLATE (+)", cx - 250, PLATE_TOP_PX - 5);
  textAlign(RIGHT, TOP);
  fill('#0d6efd'); text("CHARGED PLATE (-)", cx - 250, PLATE_BOT_PX + 5);
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
  fill('#dc3545'); noStroke(); textSize(20); textStyle(BOLD); text("+", bat_x + 25, bat_y - 5);
  fill('#0d6efd'); text("-", bat_x + 25, bat_y + 25);
}

function updateDropletsPhysics() {
  let dt = (1 / 60) * TIME_SCALE;
  
  for (let d of droplets) {
    let F_gravity = d.m * g;
    let F_buoyancy = (4/3) * Math.PI * Math.pow(d.r, 3) * rho_air * g;
    let F_electric = d.q * E_field; 
    let F_net_const = F_gravity - F_buoyancy - F_electric;
    let k_drag = 6 * Math.PI * eta * d.r;
    
    d.v_term = F_net_const / k_drag;
    d.v_m = d.v_term + (d.v_m - d.v_term) * Math.exp(-(k_drag / d.m) * dt);
    
    d.y_m += d.v_m * dt;
    
    d.x_offset += d.x_vel;
    if (d.x_offset > 120 || d.x_offset < -120) d.x_vel *= -1; 
    
    // --- VELOCITY LOCKING LOGIC ---
    // Only lock velocities if the droplet is freely floating in the chamber
    if (d.y_m > 0 && d.y_m < d_plates) {
      
      // If voltage changed, unlock V_r so a new one can be captured
      if (appliedVoltage > 0 && d.v_locked_voltage !== null && d.v_locked_voltage !== appliedVoltage) {
        d.v_rise_locked = null;
      }
      
      let relativeError = Math.abs((d.v_m - d.v_term) / d.v_term);
      if (relativeError < 0.01) {
        if (appliedVoltage === 0) {
          d.v_fall_locked = d.v_m; 
        } else if (d.v_m < 0) { // Moving upwards
          d.v_rise_locked = -d.v_m; 
          d.v_locked_voltage = appliedVoltage;
        }
      }
    }

    // Plate Collision
    if (d.y_m <= 0) { d.y_m = 0; d.v_m = 0; }
    if (d.y_m >= d_plates) { d.y_m = d_plates; d.v_m = 0; }
  }
}

function drawDroplets() {
  let cx = CANVAS_W / 2;
  
  for (let d of droplets) {
    let px = cx + d.x_offset;
    let py = PLATE_TOP_PX + (d.y_m * PX_PER_METER);
    
    if (d === targetedDrop) {
      push();
      noFill(); stroke('#0dcaf0'); strokeWeight(2);
      drawingContext.shadowBlur = 10; drawingContext.shadowColor = '#0dcaf0';
      circle(px, py, 24);
      pop();
    }
    
    drawingContext.shadowBlur = 10; drawingContext.shadowColor = '#000000';
    fill('#ffd700'); noStroke();
    circle(px, py, 12); 
    drawingContext.shadowBlur = 0;
  }
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

  if (!targetedDrop) {
    fill(150); textAlign(CENTER, CENTER);
    text("Spray droplets\nto view forces.", fbd_x + box_w/2, fbd_y + 120);
    return;
  }

  let origin_x = fbd_x + box_w/2;
  let origin_y = fbd_y + 110;

  let F_gravity = targetedDrop.m * g;
  let F_electric = targetedDrop.q * E_field;
  let F_drag = -6 * Math.PI * eta * targetedDrop.r * targetedDrop.v_m; 
  let scale = 45 / F_gravity; 

  fill('#ffd700'); stroke(150); strokeWeight(1); circle(origin_x, origin_y, 10);
  drawCleanArrow(origin_x, origin_y, origin_x, origin_y + (F_gravity * scale), '#dc3545', "Fg");

  if (F_electric > 0) {
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
  stroke(clr); fill(clr); strokeWeight(3); line(x1, y1, x2, y2);
  push();
  translate(x2, y2); rotate(atan2(y2 - y1, x2 - x1));
  let arrowSize = 6; triangle(-arrowSize, arrowSize * 0.6, -arrowSize, -arrowSize * 0.6, 0, 0);
  pop();
  noStroke(); fill(clr); textSize(11); textStyle(BOLD);
  if (y2 > y1) { textAlign(LEFT, TOP); text(lbl, x2 + 5, y2); } 
  else { textAlign(LEFT, BOTTOM); text(lbl, x2 + 5, y2); }
}

function updatePhysics() {
  appliedVoltage = parseFloat(document.getElementById('sliderV').value);
  E_field = appliedVoltage / d_plates;
  if(document.getElementById('readV_slider')) {
    document.getElementById('readV_slider').innerText = appliedVoltage + " V";
  }
}

function updateHUD() {
  let velEl = document.getElementById('hudVel');
  let eEl = document.getElementById('hudE');
  let statEl = document.getElementById('hudStatus');
  let vfBox = document.getElementById('readVf');
  let vrBox = document.getElementById('readVr');

  eEl.innerText = E_field.toExponential(2) + " V/m";

  if (!targetedDrop) {
    velEl.innerText = "--- m/s";
    statEl.innerText = "Target Droplet";
    statEl.className = "bg-white border rounded px-2 py-1 text-secondary fw-bold fs-6";
    vfBox.innerText = "No Target Selected"; vfBox.className = "readout-box";
    vrBox.innerText = "No Target Selected"; vrBox.className = "readout-box";
    return;
  }

  velEl.innerText = targetedDrop.v_m.toExponential(2) + " m/s";
  let relativeError = Math.abs((targetedDrop.v_m - targetedDrop.v_term) / targetedDrop.v_term);
  
  if (targetedDrop.y_m <= 0 || targetedDrop.y_m >= d_plates) {
    statEl.innerText = "Grounded";
    statEl.className = "bg-white border rounded px-2 py-1 text-danger fw-bold fs-6";
  } else if (relativeError < 0.01) {
    statEl.innerText = "Terminal Velocity";
    statEl.className = "bg-white border rounded px-2 py-1 text-success fw-bold fs-6";
  } else {
    statEl.innerText = "Accelerating...";
    statEl.className = "bg-white border rounded px-2 py-1 text-warning fw-bold fs-6";
  }

  if (targetedDrop.v_fall_locked !== null) {
    vfBox.innerText = targetedDrop.v_fall_locked.toExponential(3) + " m/s";
    vfBox.className = "readout-box locked-value";
  } else {
    vfBox.innerText = "Set V to 0 to measure";
    vfBox.className = "readout-box";
  }

  if (targetedDrop.v_rise_locked !== null) {
    vrBox.innerText = targetedDrop.v_rise_locked.toExponential(3) + " m/s";
    vrBox.className = "readout-box locked-value";
  } else {
    vrBox.innerText = "Increase V to measure";
    vrBox.className = "readout-box";
  }
}

function calculateCharge() {
  if (!targetedDrop) {
    alert("Please spray and select a target droplet first.");
    return;
  }
  if (targetedDrop.v_fall_locked === null || targetedDrop.v_rise_locked === null || targetedDrop.v_locked_voltage === null) {
    alert("Please wait for both Terminal Fall (V=0) and Terminal Rise (V>0) velocities to lock.");
    return;
  }

  let v_f = targetedDrop.v_fall_locked;
  let v_r = targetedDrop.v_rise_locked;
  let V = targetedDrop.v_locked_voltage;
  let E = V / d_plates;

  let r_calc = Math.sqrt( (9 * eta * v_f) / (2 * g * (rho_oil - rho_air)) );
  let q_calc = (6 * Math.PI * eta * r_calc * (v_f + v_r)) / E;
  let n_calc = Math.round(q_calc / e_charge);

  let output = document.getElementById('mathOutput');
  let exponent = Math.floor(Math.log10(q_calc));
  let base = (q_calc / Math.pow(10, exponent)).toFixed(3);
  
  output.innerHTML = `Charge (q): <b>${base} × 10^${exponent} C</b><br>Electrons (n): <b class="text-success fs-5">${n_calc}</b>`;
}