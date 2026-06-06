# Rutherford Scattering Simulation Framework

An independent, zero-dependency 2D physics simulation built to model Ernest Rutherford's gold foil experiment. This project serves as a proof-of-concept for building interactive, 60-FPS educational physics engines using lightweight web technologies.

## 🛠️ Tech Stack
* **Frontend UI:** HTML5 & CSS3 (Flexbox/Grid for a locked, responsive dashboard)
* **Physics & Rendering Engine:** Vanilla JavaScript + p5.js (for Canvas rendering and Vector mathematics)
* **Architecture:** Object-Oriented Programming (OOP) with real-time state management.

---

## 🧠 Core Architecture & Engine Mechanics

### 1. The Game Loop (State, Update, Render)
Unlike standard web development that waits for user input, this simulation runs a continuous 60 frames-per-second mathematical loop.
* `setup()`: Runs exactly once to bridge the JS canvas to the HTML DOM and initialize the environment.
* `draw()`: The continuous loop. It clears the screen, calculates the new physics coordinates for all objects, and redraws them.

### 2. Euler Integration
The physics engine moves objects using standard Euler integration:
1. **Force** alters Acceleration.
2. **Acceleration** alters Velocity.
3. **Velocity** alters Position.
* *Crucial Note:* Acceleration must be cleared to zero at the end of every frame (`acc.mult(0)`), otherwise the force compounds infinitely and breaks the simulation.

### 3. Vector Mathematics
Instead of calculating X and Y separately using complex trigonometry, the engine uses `p5.Vector`.
* Subtracting the Target Vector from the Particle Vector generates an arrow pointing directly *away* from the nucleus.
* We calculate the magnitude (distance) of this arrow, apply the force to it, and add it directly to the particle's acceleration.

---

## ⚛️ The Physics Implementation

### Coulomb's Law of Electrostatic Repulsion
The core mathematical driver of the simulation is Coulomb's Law: `F = k * (q1 * q2) / r^2`
* `q1`: Alpha particle charge (+2)
* `q2`: Target nucleus charge (Dynamic based on selected element)
* `r`: Distance between the particle and the nucleus.
* *Safety Net:* We use `constrain(distance, radius, 1000)` to ensure `r` never reaches zero. Dividing by zero returns `Infinity`, which crashes the rendering engine.

### Angular Resolution (The Detector Screen)
The detector screen is placed at a specific radius to visually amplify small angles of deflection. If the screen is too close, a 2-degree deflection is visually indistinguishable from a straight line. Physical distance acts as a mechanical amplifier for tight angles, making statistical measurement possible.

---

## 💻 Key JavaScript Engineering Notes

### Garbage Collection (The Reverse Loop)
When managing the `particles = []` array, we must delete particles that leave the screen or hit the detector to prevent memory leaks.
* **The Rule:** Always loop through arrays *backwards* (`for let i = array.length - 1; i >= 0; i--`) when splicing. If you loop forwards and delete an index, the array shifts, and the loop will skip the next particle.

### Data Dictionaries Over If/Else
To handle multiple elements (Gold, Silver, Aluminum), we use a JavaScript Object Dictionary rather than a chain of `if/else` statements.
* By mapping the Atomic Number (Z) to a dictionary of properties (`{ symbol: 'Au', color: [255, 215, 0], radius: 60 }`), the UI and Physics engine instantly update in tandem based on a single variable change.

---

## 🚀 Idea: Ed-Tech Integration
This simulation is the visual frontend layer. The next phase of architecture involves turning this into a trackable, proctored educational tool:
1. **Telemetry Layer:** Track user interactions (slider changes, burst fires).
2. **Backend Integration:** Send cryptographic JSON session states to a Node.js/PostgreSQL backend.
3. **Professor Dashboard:** Build an authenticated portal for faculty to verify student completion and approve lab attendance based on telemetry data.
