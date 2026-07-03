# Virtual Physics Laboratory Suite

**Developed by:** Sachin Tripathi

## Overview
This repository contains a suite of interactive, real-time physics simulations designed to bridge the gap between theoretical mathematics and visual learning. Built entirely on the client side using JavaScript and p5.js, this project serves as a demonstration of custom physics engine development, real-time state management, and intuitive UI/UX design.

These simulations bypass pre-animated videos in favor of **deterministic kinematics engines**—meaning every particle, droplet, and collision is calculated frame-by-frame based on exact physical formulas. 

## The Simulations

### 1. Millikan Oil Drop Experiment (Fluid Dynamics & Electromagnetism)
A recreation of the 1909 experiment used to determine the fundamental charge of an electron. 
* **The Engine:** Calculates droplet motion based on the exact balance of Gravity, Buoyancy, Electric Force, and Viscous Drag (Stokes' Law).
* **Key Features:** Includes a dynamic Free-Body Diagram (FBD) that updates force vectors in real-time, an atomizer to generate randomized droplets, and an auto-locking data ledger that eliminates human stopwatch error by detecting exact terminal velocities.

### 2. Rutherford Alpha Scattering (Electrostatics & Atomic Structure)
A model of the famous gold foil experiment demonstrating electrostatic Coulomb repulsion.
* **The Engine:** Uses vector mathematics and Coulomb's Law to calculate the continuous repulsive forces between positively charged alpha particles and a heavy nucleus.
* **Key Features:** Users can swap target elements (Gold, Silver, Copper, Aluminum) to instantly visualize how changing the atomic number (Z) scales the electric field and alters scattering trajectories. Includes a continuous beam emitter and a data-logging detector screen.

### 3. Geometric Kinematic Scattering (Rigid-Body Mechanics)
A transition from atomic forces to classic elastic collisions, acting as an interactive shape-probing puzzle.
* **The Engine:** Calculates exact kinematic reflections across complex boundaries, including radial curves (spheres), linear segments (squares), and sloped intersections (triangles).
* **Key Features:** Features an adjustable vertical-axis projectile launcher. Includes a "Hidden Target" mode that renders the object invisible, challenging the user to deduce the underlying geometry based strictly on the bounce trajectories of their projectiles.

## Technical Philosophy
* **Zero Dependencies:** The suite is engineered to be lightweight and universally accessible. There are no build steps, backend requirements, or heavy frameworks.
* **Instant Deployment:** The applications run entirely in the browser. Anyone reviewing this code can simply open the `index.html` files to instantly interact with the simulations.
* **Responsive Dashboards:** The UI is locked into clean, academic-style control panels ensuring that users can easily adjust environmental variables without breaking the canvas layout.

## How to Run
1. Clone or download this repository.
2. Navigate to the folder of the simulation you wish to view.
3. Open the `index.html` file in any modern web browser.
