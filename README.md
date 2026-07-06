# Virtual Physics Laboratory Suite

**Developed by:** Sachin Tripathi

## Overview
This repository contains a suite of four interactive, real-time physics simulations built entirely on the client side using JavaScript and **p5.js**. Designed to bridge the gap between theoretical mathematics and visual learning, this project demonstrates custom physics engine development, real-time state management, rigid-body kinematics, and intuitive UI/UX design.

Rather than relying on pre-rendered animations, these modules utilize **deterministic kinematics engines**. Every particle, droplet, and collision is calculated frame-by-frame using exact physical formulas and Euler integration.

---

## 🔬 The Simulations

### 1. Millikan Oil Drop Experiment (Fluid Dynamics & Electromagnetism)
A recreation of the 1909 experiment used to determine the fundamental charge of an electron.
* **The Engine:** Calculates droplet motion based on the exact continuous balance of Gravity, Buoyancy, Electric Force, and Viscous Drag (Stokes' Law).
* **Key Features:** Includes an atomizer to generate randomized droplets, a dynamic Free-Body Diagram (FBD) that updates force vectors in real-time, and an auto-locking data ledger that eliminates human stopwatch error by detecting exact terminal falling and rising velocities.

### 2. J.J. Thomson Cathode Ray Tube (Electromagnetism & Kinematics)
A model of the historical experiment that discovered the electron by measuring its $e/m$ ratio.
* **The Engine:** Calculates electron beam deflection by simulating the cross-product forces of adjustable perpendicular Electric (E) and Magnetic (B) fields.
* **Key Features:** Features seamless dual-camera perspectives (a side-profile view of the apparatus and a front-facing Oscilloscope target), dynamically shifting deflection paths, and a built-in mathematical validator to calculate error percentages against the true $e/m$ constant.

### 3. Rutherford Alpha Scattering (Electrostatics & Atomic Structure)
A visualization of the gold foil experiment demonstrating Coulomb's Law of electrostatic repulsion.
* **The Engine:** Uses vector mathematics to calculate the continuous repulsive forces between positively charged alpha particles and a heavy atomic nucleus.
* **Key Features:** Users can swap target elements (Gold, Silver, Copper, Aluminum) to instantly visualize how changing the atomic number (Z) scales the electric field and alters scattering trajectories. Includes burst/continuous beam emitters and an angular detector screen.

### 4. Solid Sphere Scattering (Rigid-Body Mechanics)
A transition from atomic forces to classical elastic collisions, wrapped in an interactive, deductive-reasoning puzzle.
* **The Engine:** Calculates exact kinematic reflections across complex boundaries, utilizing mathematical sub-stepping to prevent high-velocity tunneling through radial curves (spheres), linear segments (squares), and sloped intersections (triangles).
* **Key Features:** Features a draggable vertical-axis projectile launcher, continuous firing modes, and a "Hidden Target" game mode where the object is rendered invisible, challenging the user to deduce the underlying geometry based strictly on bounce trajectories and impact angles.

---

## 🛠️ Technical Philosophy & Architecture
* **Zero Dependencies:** The suite is engineered to be lightweight and universally accessible. There are no build steps, backend requirements, or heavy frameworks (React/Node). 
* **Vector Mathematics:** Complex trigonometry is bypassed in favor of `p5.Vector` math, cleanly handling normal calculations, dot products, and directional magnitudes.
* **Instant Deployment:** The applications run entirely in the browser. Anyone reviewing this code can simply open the respective `index.html` files to instantly interact with the simulations.
* **Responsive Dashboards:** The UI is locked into clean, academic-style control panels ensuring that users can easily adjust environmental variables without breaking the HTML5 Canvas layout.

## 🚀 How to Run
1. Clone or download this repository.
2. Navigate to the folder of the specific simulation you wish to view.
3. Open the `index.html` file in any modern web browser.
