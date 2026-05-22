import { CGFinterface, dat } from "../../lib/CGF.js";

// Keyboard/mouse plumbing and the dat.GUI panel. The numeric bars (HP,
// instantaneous damage, instantaneous health restored, bales delivered, score)
// read live from MyGameplay via .listen().
export class MyInterface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        super.init(application);

        this.scene.input = this;
        // suppress CGFinterface's built-in WASD camera handling so the wagon owns those keys
        this.processKeyboard = function () {};
        this.activeKeys = {};

        // CGFinterface.init() does NOT auto-call initInterface(), so invoke it here
        this.initInterface();

        return true;
    }

    initInterface() {
        // setInterface runs AFTER setScene, so scene.gameplay is already wired up
        // and its properties can be bound straight into dat.GUI bars.
        this.gui = new dat.GUI();
        // hidden while the menu is up; MyGameplay toggles visibility on Play
        // and on game-over so the title screen stays clean
        this.setGuiVisible(false);

        const gameplay = this.scene && this.scene.gameplay;
        if (gameplay) {
            const f = this.gui.addFolder('Gameplay');
            const controllers = [
                f.add(gameplay, 'wagonHP', 0, gameplay.maxHP).name('HP').listen(),
                f.add(gameplay, 'lastDamage', 0, 15).name('Instant damage').listen(),
                f.add(gameplay, 'lastHealing', 0, gameplay.maxHP).name('Instant heal').listen(),
                f.add(gameplay, 'balesDelivered', 0, 50).name('Bales delivered').listen(),
                f.add(gameplay, 'score', 0, 9999).name('Score (s)').listen(),
                f.add(gameplay, 'bestScore', 0, 9999).name('Best (s)').listen()
            ];
            // disable pointer events so the player can't drag the sliders
            for (const c of controllers) {
                c.domElement.style.pointerEvents = 'none';
            }
            f.open();
        }
    }

    setGuiVisible(visible) {
        if (this.gui && this.gui.domElement) {
            this.gui.domElement.style.display = visible ? '' : 'none';
        }
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
