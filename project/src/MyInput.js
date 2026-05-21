import { CGFinterface } from "../../lib/CGF.js";

// Input plumbing only — the CGF harness requires app.setInterface() to receive
// a CGFinterface, and the wagon + gameplay read keys via scene.input.
// No dat.GUI panel: tuning was done during development and the values are now
// baked into the scene/lighting/wagon constructors.
export class MyInput extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        super.init(application);

        // scene reads input via scene.input.isKeyPressed(...)
        this.scene.input = this;
        // suppress CGFinterface's built-in WASD camera handling so the wagon owns those keys
        this.processKeyboard = function () {};
        this.activeKeys = {};

        return true;
    }

    processKeyDown(event) {
        this.activeKeys[event.code] = true;
    }

    processKeyUp(event) {
        this.activeKeys[event.code] = false;
    }

    isKeyPressed(keyCode) {
        return this.activeKeys[keyCode] || false;
    }

    // mouse position pans the camera: Y tilts pitch, X swings to the wagon's left/right
    processMouseMove(event) {
        const canvas = this.scene && this.scene.gl ? this.scene.gl.canvas : null;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const relX = event.clientX - rect.left;
        const relY = event.clientY - rect.top;
        // normalised cursor position, -1 at top/left, +1 at bottom/right
        const nx = (relX / rect.width) * 2.0 - 1.0;
        const ny = (relY / rect.height) * 2.0 - 1.0;
        // upper half lifts the target (look up to sky), lower half drops it
        this.scene.chaseCamera.pitchOffset = -ny * 80;
        // swing the camera around to the wagon's right/left shoulder so the wagon stays framed
        this.scene.chaseCamera.sideOffset = -nx * 16;
    }

    processMouseDown(event) {}
    processMouseUp(event) {}
    processClick(event) {}
    processWheel(event) {}
}
