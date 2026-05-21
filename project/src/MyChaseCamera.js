import { CGFcamera } from "../../lib/CGF.js";

// Third-person chase camera: smoothly trails the wagon's position and heading,
// with mouse-driven pitch and side swing. Owns the wagon-local offsets and the
// underlying CGFcamera, which is exposed as scene.camera for the CGF harness.
export class MyChaseCamera {
    constructor(scene) {
        this.scene = scene;

        // when off, the default CGF camera controls take over
        this.follow = true;

        // wagon-local offsets: X is rightward, Y is up, Z is backward
        this.offsetX = 0.0;
        this.offsetY = 8.0;
        this.offsetZ = 18.0;
        this.targetUp = 4.0;

        // exponential-smoothing time constants; separate tau so the rotational lag
        // feels heavier than the translational follow
        this.smoothTau = 0.4;
        this.headingTau = 0.9;

        // smoothed heading the camera orbits around; matches wagon at rest
        this.heading = 0;
        // mouse position (no drag) tilts pitch (Y) and swings side-to-side (X)
        this.pitchOffset = 0;
        this.sideOffset = 0;
    }

    init() {
        // seed at the rest offset (wagon at origin, facing +X) so the camera
        // starts behind the wagon and doesn't whip in on the first frame
        const startEye = vec3.fromValues(-this.offsetZ, this.offsetY, this.offsetX);
        const startTarget = vec3.fromValues(0, this.targetUp, 0);
        this.scene.camera = new CGFcamera(0.6, 0.1, 1000, startEye, startTarget);
    }

    update(dt) {
        const w = this.scene.wagon;
        const cam = this.scene.camera;
        if (!w || !cam) return;

        // chase the wagon's heading on a slower timescale so the camera
        // visibly trails behind when the wagon turns
        const kHead = 1.0 - Math.exp(-dt / this.headingTau);
        let dh = w.heading - this.heading;
        // shortest-path wrap so we don't take the long way around the circle
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;
        this.heading += dh * kHead;

        const cosH = Math.cos(this.heading);
        const sinH = Math.sin(this.heading);

        const side = this.offsetX + this.sideOffset;
        const back = this.offsetZ;

        const desiredEyeX = w.position[0] + side * sinH - back * cosH;
        const desiredEyeY = w.position[1] + this.offsetY;
        const desiredEyeZ = w.position[2] + side * cosH + back * sinH;

        // mouse-driven pitch raises/lowers the target so the camera tilts up to the sky
        const desiredTgtX = w.position[0];
        const desiredTgtY = w.position[1] + this.targetUp + this.pitchOffset;
        const desiredTgtZ = w.position[2];

        // frame-rate independent exponential smoothing
        const k = 1.0 - Math.exp(-dt / this.smoothTau);

        cam.position[0] += (desiredEyeX - cam.position[0]) * k;
        cam.position[1] += (desiredEyeY - cam.position[1]) * k;
        cam.position[2] += (desiredEyeZ - cam.position[2]) * k;

        cam.target[0] += (desiredTgtX - cam.target[0]) * k;
        cam.target[1] += (desiredTgtY - cam.target[1]) * k;
        cam.target[2] += (desiredTgtZ - cam.target[2]) * k;
    }

    // 3/4 cinematic pose for the title screen: above and to the wagon's
    // front-right, looking past the wagon toward the barn behind it. Fixed
    // framing — does not chase.
    frameTitleShot() {
        const w = this.scene.wagon;
        const cam = this.scene.camera;
        if (!w || !cam) return;

        this.heading = w.heading;
        this.pitchOffset = 0;
        this.sideOffset = 0;

        const cosH = Math.cos(w.heading);
        const sinH = Math.sin(w.heading);

        // wagon-local offsets: +forward is in front of the wagon, +right is to
        // its right (which maps to world via the standard heading rotation)
        const eyeForward = 14;
        const eyeRight = 8;
        const eyeUp = 7;
        const tgtBehind = 10; // target sits 10u behind the wagon, drawing the eye toward the barn
        const tgtUp = 2;

        cam.position[0] = w.position[0] + eyeForward * cosH + eyeRight * sinH;
        cam.position[1] = w.position[1] + eyeUp;
        cam.position[2] = w.position[2] - eyeForward * sinH + eyeRight * cosH;

        cam.target[0] = w.position[0] - tgtBehind * cosH;
        cam.target[1] = w.position[1] + tgtUp;
        cam.target[2] = w.position[2] + tgtBehind * sinH;
    }

    // snap the chase camera behind the wagon's current pose. Called when the
    // wagon is repositioned (init / startGame / respawn) so update() doesn't
    // lerp in from the previous spot.
    snapBehind() {
        const w = this.scene.wagon;
        const cam = this.scene.camera;
        if (!w || !cam) return;

        // sync the smoothed heading immediately so update() doesn't slew toward
        // the old heading on the first frame
        this.heading = w.heading;
        this.pitchOffset = 0;
        this.sideOffset = 0;

        const cosH = Math.cos(this.heading);
        const sinH = Math.sin(this.heading);

        cam.position[0] = w.position[0] - this.offsetZ * cosH;
        cam.position[1] = w.position[1] + this.offsetY;
        cam.position[2] = w.position[2] + this.offsetZ * sinH;

        cam.target[0] = w.position[0];
        cam.target[1] = w.position[1] + this.targetUp;
        cam.target[2] = w.position[2];
    }
}
