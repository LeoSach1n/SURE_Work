# Millikan Oil Drop Virtual Laboratory

## Overview
This interactive simulation replicates Robert A. Millikan's historic 1909 oil drop experiment, which proved that electric charge is quantized and determined the fundamental charge of an electron ($e$). 

Rather than a pre-animated video, this simulation features a deterministic, real-time kinematics engine. It utilizes exact analytical integration of Stokes' Law to calculate viscous fluid drag, meaning the oil droplets naturally settle into terminal velocities based entirely on the dynamic forces applied to them.

## Features
* **Deterministic Physics Engine:** Droplet motion is calculated frame-by-frame based on Gravity, Buoyancy, Electric Force, and Viscous Drag.
* **Dynamic Free-Body Diagram (FBD):** A live telemetry HUD maps the exact force vectors acting on the droplet in real-time, helping users visualize equilibrium states.
* **Auto-Locking Ledger:** Eliminates human stopwatch error by automatically detecting when a droplet reaches true terminal velocity (zero acceleration) and locking the metric into the data ledger.
* **Mathematical Derivation:** Features a built-in textbook-style derivation using MathJax to bridge the gap between visual phenomena and the algebraic proof.

<img width="1627" height="955" alt="image" src="https://github.com/user-attachments/assets/62ea82c4-10e7-4902-b8a7-3fc63f4a06ae" />


<img width="1643" height="947" alt="image" src="https://github.com/user-attachments/assets/6a4cf8a7-dd1d-46ef-bd43-e7fbd70f9a96" />



<img width="1637" height="586" alt="image" src="https://github.com/user-attachments/assets/363509a0-c26d-40a2-a7e5-c5a00031d8b8" />



## Experimental Procedure (How to Use)

**Step 1: Isolate a Droplet**
Click the **"Spray New Droplet"** button to trigger the atomizer. The simulation will randomly generate a droplet with a microscopic radius and a randomized discrete charge multiple ($q = ne$).

**Step 2: Phase 1 (Voltage OFF)**
Set the phase to **Voltage OFF**. The droplet will fall under the influence of gravity. As it accelerates, upward viscous drag will increase until it perfectly balances the droplet's effective weight. Wait for the HUD to confirm the droplet has reached its **Terminal Fall Velocity** ($v_f$).

**Step 3: Phase 2 (Voltage ON)**
Set the phase to **Voltage ON** and use the slider to apply an electric field. 
* **The Goal:** Find the "sweet spot" voltage. If the voltage is too low, the drop will continue to sink. If the voltage is too high, it will slam into the positive plate. 
* Adjust the voltage until the droplet reverses direction and rises at a steady, measurable pace. Wait for the HUD to lock in the **Terminal Rise Velocity** ($v_r$).

**Step 4: Calculate the Charge**
Once both velocities and the balancing voltage are locked in the ledger, click **"Calculate Charge"**. The engine will execute Millikan's master equation to reveal the total charge ($q$) and the exact integer number of electrons ($n$) residing on that specific droplet.

## How to Run
This is a completely client-side application with zero dependencies or build steps required.
1. Download or clone this repository.
2. Ensure both `index.html` and `sketch.js` are in the same directory.
3. Open `index.html` in any modern web browser.
