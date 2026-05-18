import { CGFinterface, dat } from "../lib/CGF.js";

export class MyInterface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        super.init(application);

        this.gui = new dat.GUI();

        // gameplay readout — listen() so the bar tracks scene state every frame
        const gameplayFolder = this.gui.addFolder("Gameplay");
        gameplayFolder.add(this.scene, "wagonHP", 0, this.scene.maxHP).name("Health Points").listen();
        gameplayFolder.open();

        const skyFolder = this.gui.addFolder("Sky");
        skyFolder.add(this.scene, "showSky").name("Show Sky");
        skyFolder.add(this.scene, "showClouds").name("Show Clouds");
        skyFolder.add(this.scene, "skyRadius", 120, 600).name("Sky Radius");
        skyFolder.add(this.scene, "cloudSpeed", 0.0, 0.08).name("Cloud Speed");

        const terrainFolder = this.gui.addFolder("Terrain");
        terrainFolder.add(this.scene, "showTerrain").name("Show Terrain");
        terrainFolder.add(this.scene, "terrainWireframe").name("Wireframe");
        terrainFolder.add(this.scene, "showRocks").name("Show Rocks");
        terrainFolder.add(this.scene, "showFlowers").name("Show Flowers");
        terrainFolder.add(this.scene, "showGrass").name("Show Grass");

        const lightFolder = this.gui.addFolder("Sun Lighting");
        lightFolder.add(this.scene, "sunLightEnabled").name("Directional Sun");
        lightFolder.add(this.scene, "spotLightEnabled").name("Spotlight");
        lightFolder.add(this.scene, "pauseDayCycle").name("Pause Cycle");

        const wagonFolder = this.gui.addFolder("Wagon");
        if (this.scene.wagon) {
            wagonFolder.add(this.scene.wagon, "maxSpeed", 1, 30).name("Max Speed");
        }

        const cameraFolder = this.gui.addFolder("Camera");
        cameraFolder.add(this.scene, "cameraFollow").name("Follow Wagon");
        cameraFolder.add(this.scene, "cameraOffsetX", -60, 60).name("Offset X");
        cameraFolder.add(this.scene, "cameraOffsetY", 4, 40).name("Height");
        cameraFolder.add(this.scene, "cameraOffsetZ", -60, 60).name("Offset Z");
        cameraFolder.add(this.scene, "cameraSmoothTau", 0.05, 1.5).name("Smoothing");

        this.initKeys();

        return true;
    }

    initKeys() {
        // scene reads input via scene.gui.isKeyPressed(...)
        this.scene.gui = this;
        // suppress CGFinterface's built-in WASD camera handling
        this.processKeyboard = function () {};
        this.activeKeys = {};
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
        // upper half lifts the target (look up to sky), lower half drops it (look down)
        this.scene.cameraPitchOffset = -ny * 80;
        // swing the camera around to the wagon's right shoulder (left edge of screen)
        // or left shoulder (right edge) so the wagon is always framed
        this.scene.cameraSideOffset = -nx * 16;
    }
    processMouseDown(event) {}
    processMouseUp(event) {}
    processClick(event) {}
    processWheel(event) {}
}
