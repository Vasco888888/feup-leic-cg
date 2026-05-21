import { CGFcamera } from "../../lib/CGF.js";

// Third-person chase camera: smoothly trails the wagon's position and heading,
// with mouse-driven pitch + side swing. Owns the dat.GUI-tweakable offsets and
// the underlying CGFcamera (exposed as scene.camera so the CGF harness sees it).
export class MyChaseCamera {
    constructor(scene) {
        this.scene = scene;

        // dat.GUI toggle: off lets the user use the default CGF camera controls instead
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

    // snap the chase camera straight behind the wagon at the given spawn height,
    // used by MyGameplay.startGame so the camera doesn't fly back from the death spot
    snapBehind(spawnY) {
        this.heading = 0;
        this.pitchOffset = 0;
        this.sideOffset = 0;
        const cam = this.scene.camera;
        if (!cam) return;
        cam.position[0] = -this.offsetZ;
        cam.position[1] = spawnY + this.offsetY;
        cam.position[2] = 0;
        cam.target[0] = 0;
        cam.target[1] = spawnY + this.targetUp;
        cam.target[2] = 0;
    }
}
