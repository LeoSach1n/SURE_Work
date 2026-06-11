// --- GLOBAL VARIABLES ---
const PIXELS_PER_CM = 9; // ZOOMED IN: 1 cm = 12 pixels
const GRATING_X = 150;    // Grating position
const CENTER_Y = 250;     // Optical axis

let currentLambda = 632.8; 
let currentD_cm = 0.001; 
let currentY_cm = 30; 

const LASER_COLORS = {
  "632.8": [255, 30, 30],   // He-Ne (Red)
  "532": [50, 255, 50],     // Nd:YAG (Green)
  "488": [50, 150, 255]     // Argon-ion (Blue)
};

function setup() {
  // Made canvas slightly wider and shorter for the zoomed bench look
  let canvas = createCanvas(900, 600); 
  canvas.parent('canvas-container');
  updateSetup(); 
}

function draw() {
  background(248, 249, 250); 

  // 1. Draw Optical Rail (Sliding Channel)
  noStroke();
  fill(180, 100, 50); // Brown/Orange metallic
  rect(0, CENTER_Y - 15, width, 30);
  fill(140, 70, 30); // Inner shadow/groove
  rect(0, CENTER_Y - 5, width, 10);

  // 2. Draw Optical Axis (Dashed line)
  stroke(200); strokeWeight(2); drawingContext.setLineDash([10, 10]);
  line(0, CENTER_Y, width, CENTER_Y); drawingContext.setLineDash([]);

  // 3. Draw Laser Source & Mount
  fill(100); noStroke(); rect(40, CENTER_Y - 20, 20, 40); // Mount
  fill(60); rect(20, CENTER_Y - 25, 60, 50, 5); // Laser body
  fill(30); rect(80, CENTER_Y - 8, 15, 16); // Nozzle

  // 4. Draw Grating & Mount
  fill(100); rect(GRATING_X - 10, CENTER_Y - 20, 20, 40); // Mount
  stroke(50); strokeWeight(4); line(GRATING_X, CENTER_Y - 45, GRATING_X, CENTER_Y + 45);
  noStroke(); fill(0); textAlign(CENTER, BOTTOM); textSize(12); text("GRATING", GRATING_X, CENTER_Y - 50);

  // 5. Draw Screen & Mount
  let screenX = GRATING_X + (currentY_cm * PIXELS_PER_CM);
  fill(100); noStroke(); rect(screenX - 10, CENTER_Y - 20, 20, 40); // Mount
  stroke(40); strokeWeight(6); line(screenX, 20, screenX, height - 20); // Screen panel

  // 6. Calculate Rays
  let d_nm = currentD_cm * 10000000; 
  let laserColor = LASER_COLORS[currentLambda.toString()];

  // Main beam to grating
  stroke(laserColor[0], laserColor[1], laserColor[2], 220); strokeWeight(4);
  line(95, CENTER_Y, GRATING_X, CENTER_Y);

  let x1_cm = 0; 
  let theta1 = 0; // To store angle for the arc

  // Diffraction orders (m = 0, 1, 2)
  for (let m = 0; m <= 2; m++) {
    let sinTheta = (m * currentLambda) / d_nm;
    
    if (sinTheta < 1) {
      let theta = Math.asin(sinTheta); 
      if (m === 1) theta1 = theta; // Save 1st order angle

      let spreadX_cm = currentY_cm * Math.tan(theta); 
      if (m === 1) x1_cm = spreadX_cm; 

      let spreadY_px = spreadX_cm * PIXELS_PER_CM;

      // Ensure dots don't draw off the physical top/bottom of our visual screen
      if (CENTER_Y - spreadY_px > 20) {
        // Draw Upper Ray
        stroke(laserColor[0], laserColor[1], laserColor[2], 180 - (m * 40)); strokeWeight(2);
        line(GRATING_X, CENTER_Y, screenX, CENTER_Y - spreadY_px);
        
        // Draw Lower Ray
        if (m > 0) line(GRATING_X, CENTER_Y, screenX, CENTER_Y + spreadY_px);

        // Draw Scintillation Dots
        noStroke(); fill(laserColor[0], laserColor[1], laserColor[2]);
        circle(screenX, CENTER_Y - spreadY_px, 10);
        if (m > 0) circle(screenX, CENTER_Y + spreadY_px, 10);
      }
    }
  }

  // 7. Draw Angle Arc (θ) for m=1
  if (theta1 > 0) {
    noFill(); stroke(255); strokeWeight(3);
    // Draw an arc from the center axis up to the 1st order ray
    arc(GRATING_X, CENTER_Y, 200, 200, -theta1, 0);
    
    // Label it 
    fill(50); noStroke(); textSize(14);
    // Position text slightly outside the arc
    text("θ", GRATING_X + 70, CENTER_Y - (Math.tan(theta1/2) * 70) - 10); 
  }

  // Update UI Measurement for X1
  document.getElementById('valX1').innerText = x1_cm.toFixed(2);
  
  // Draw Visual Measurement Lines
  drawMeasurementLine(GRATING_X, height - 30, screenX, height - 30, `Y = ${currentY_cm.toFixed(1)} cm`);
}

function drawMeasurementLine(x1, y1, x2, y2, label) {
  stroke(100); strokeWeight(1); line(x1, y1, x2, y2);
  fill(50); noStroke(); textSize(14); textAlign(CENTER, CENTER);
  text(label, (x1 + x2) / 2, y1 - 10);
}

// --- UI TRIGGER FUNCTIONS ---

function syncY(source) {
  let slider = document.getElementById('distanceSlider');
  let input = document.getElementById('distanceInput');
  
  if (source === 'slider') input.value = slider.value;
  if (source === 'input') slider.value = input.value;
  
  updateSetup();
}

function updateSetup() {
  currentLambda = parseFloat(document.getElementById('laserSelect').value);
  currentY_cm = parseFloat(document.getElementById('distanceSlider').value);
  
  // Decoding the Grating Select values
  let gratingVal = document.getElementById('gratingSelect').value;
  if (gratingVal === "1000_cm") currentD_cm = 1 / 1000;
  else if (gratingVal === "3000_cm") currentD_cm = 1 / 3000;
  else if (gratingVal === "15000_in") currentD_cm = 2.54 / 15000; // 1 inch = 2.54 cm
  
  // Update Live Readouts
  document.getElementById('valD').innerText = currentD_cm.toExponential(2);
  document.getElementById('valY').innerText = currentY_cm.toFixed(1);
  
  // Clear the error field when apparatus is moved
  document.getElementById('errorOutput').innerText = "---";
  document.getElementById('errorOutput').style.color = "#dc3545";
}

function checkAccuracy() {
  let studentInput = parseFloat(document.getElementById('studentLambda').value);
  if (isNaN(studentInput)) { alert("Please enter a valid number."); return; }

  let errorPercentage = Math.abs(studentInput - currentLambda) / currentLambda * 100;
  let outputSpan = document.getElementById('errorOutput');
  
  outputSpan.innerText = errorPercentage.toFixed(2) + " %";
  outputSpan.style.color = (errorPercentage < 2.0) ? "#28a745" : "#dc3545"; 
}