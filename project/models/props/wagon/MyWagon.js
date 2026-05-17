import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';
import { MyWheel } from './MyWheel.js';
import { MyWagonBed } from './MyWagonBed.js';
import { MyCover } from './MyCover.js';
import { MyTongue } from './MyTongue.js';
import { MySeat } from './MySeat.js';
import { MyLamp } from './MyLamp.js';
import { CGFobjModel } from '../../../../lib/extra/CGFobjModel.js';

const WAGON_SCALE = 2.0;
const FRONT_WHEEL_OFFSET_X = 1.1;
const REAR_WHEEL_OFFSET_X = -1.1;
const WHEEL_OFFSET_Z = 1.1;
const FRONT_WHEEL_Y = 0.5;
const REAR_WHEEL_Y = 0.6;
const REAR_WHEEL_SCALE = 1.2;
const FRONT_WHEEL_RADIUS_WORLD = 0.5 * WAGON_SCALE;
const REAR_WHEEL_RADIUS_WORLD = 0.5 * REAR_WHEEL_SCALE * WAGON_SCALE;

// kinematics tuned for a horse walking pace
const MAX_SPEED = 5.0;
const ACCELERATION = 2.0;
const BRAKE_DECELERATION = 4.0;
const FRICTION_DECELERATION = 0.8;
const MAX_STEERING = Math.PI / 5;
const STEERING_RATE = Math.PI * 1.2;
const STEERING_RETURN_RATE = Math.PI * 1.6;
const WHEELBASE_WORLD = (FRONT_WHEEL_OFFSET_X - REAR_WHEEL_OFFSET_X) * WAGON_SCALE;

// collision footprint: rear + front of bed are fixed in the wagon's frame,
// but the horse pivots around the kingpin so its point is recomputed each frame.
// All offsets are in world units (post-WAGON_SCALE).
const REAR_COLLISION = { localX: -2.0, localZ: 0, radius: 2.0 };
const FRONT_COLLISION = { localX:  2.0, localZ: 0, radius: 2.2 };
const HORSE_RADIUS = 1.8;
const KINGPIN_WORLD_X = FRONT_WHEEL_OFFSET_X * WAGON_SCALE;
const HORSE_FROM_KINGPIN = 2.0 * WAGON_SCALE;
// stay clear of the terrain edge
const WORLD_RADIUS = 240;

export class MyWagon extends CGFobject {
    constructor(scene) {
        super(scene);
        this.wheel = new MyWheel(scene);
        this.bed = new MyWagonBed(scene);
        this.cover = new MyCover(scene);
        this.tongue = new MyTongue(scene);
        this.seat = new MySeat(scene);
        this.lamp = new MyLamp(scene);

        this.horse = new CGFobjModel(scene, "models/external/horse.obj");
        this.horseMaterial = new CGFappearance(scene);
        this.horseMaterial.setAmbient(0.588, 0.588, 0.588, 1.0);
        this.horseMaterial.setDiffuse(0.588, 0.588, 0.588, 1.0);
        this.horseMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.horseMaterial.setShininess(10.0);

        this.horseTexture = new CGFtexture(scene, "textures/props/wagon/horse/horse.jpg");
        this.horseMaterial.setTexture(this.horseTexture);

        // world-space state
        this.position = vec3.fromValues(0, 0, 0);
        this.heading = 0;
        this.speed = 0;
        this.steering = 0;

        // accumulated rolling angles (radians)
        this.frontSpin = 0;
        this.rearSpin = 0;

        // hay-bale carrying slot
        this.carriedBale = null;
    }

    update(dtSeconds, colliders = []) {
        const gui = this.scene.gui;
        if (!gui) return;

        const wPressed = gui.isKeyPressed("KeyW");
        const sPressed = gui.isKeyPressed("KeyS");
        const aPressed = gui.isKeyPressed("KeyA");
        const dPressed = gui.isKeyPressed("KeyD");

        // longitudinal physics: forward-only, kinematic acceleration
        if (wPressed) {
            this.speed += ACCELERATION * dtSeconds;
        } else if (sPressed) {
            this.speed -= BRAKE_DECELERATION * dtSeconds;
        } else {
            // coast: rolling friction pulls us back to zero
            this.speed -= FRICTION_DECELERATION * dtSeconds;
        }
        if (this.speed < 0) this.speed = 0;          // no reverse
        if (this.speed > MAX_SPEED) this.speed = MAX_SPEED;

        // steering: gradual towards max, springs back when no key is held
        if (aPressed && !dPressed) {
            this.steering += STEERING_RATE * dtSeconds;
        } else if (dPressed && !aPressed) {
            this.steering -= STEERING_RATE * dtSeconds;
        } else {
            // return to centre
            if (this.steering > 0) {
                this.steering = Math.max(0, this.steering - STEERING_RETURN_RATE * dtSeconds);
            } else if (this.steering < 0) {
                this.steering = Math.min(0, this.steering + STEERING_RETURN_RATE * dtSeconds);
            }
        }
        if (this.steering > MAX_STEERING) this.steering = MAX_STEERING;
        if (this.steering < -MAX_STEERING) this.steering = -MAX_STEERING;

        // bicycle-model kinematics (centre-referenced approximation)
        // dh/dt = v/L * tan(steering); heading only changes while rolling
        const dist = this.speed * dtSeconds;
        if (this.speed > 0) {
            this.heading += (this.speed / WHEELBASE_WORLD) * Math.tan(this.steering) * dtSeconds;
        }
        // local +X is the wagon's forward; rotation by heading around +Y maps it to (cos, 0, -sin)
        let newX = this.position[0] + dist * Math.cos(this.heading);
        let newZ = this.position[2] + -dist * Math.sin(this.heading);

        // resolve obstacle penetration: every collision point along the rig is tested,
        // and overlaps push the wagon centre back out along the contact normal
        let hit = false;
        const cosH = Math.cos(this.heading);
        const sinH = Math.sin(this.heading);
        const cosS = Math.cos(this.steering);
        const sinS = Math.sin(this.steering);
        const points = [
            REAR_COLLISION,
            FRONT_COLLISION,
            // horse pivots around the kingpin with the steering angle
            {
                localX: KINGPIN_WORLD_X + HORSE_FROM_KINGPIN * cosS,
                localZ: -HORSE_FROM_KINGPIN * sinS,
                radius: HORSE_RADIUS,
                ignoreSoft: true
            }
        ];
        for (const cp of points) {
            // wagon-local (lx, lz) → world: heading rotation around +Y
            const pointX = newX + cp.localX * cosH + cp.localZ * sinH;
            const pointZ = newZ - cp.localX * sinH + cp.localZ * cosH;
            for (const c of colliders) {
                if (cp.ignoreSoft && c.soft) continue;
                const dx = pointX - c.x;
                const dz = pointZ - c.z;
                const minDist = c.radius + cp.radius;
                const distSq = dx * dx + dz * dz;
                if (distSq < minDist * minDist) {
                    const d = Math.sqrt(distSq) || 0.0001;
                    const push = minDist - d;
                    // applying push to the wagon centre instead of just the contact point
                    // keeps the rig rigid; the next frame re-evaluates all points
                    newX += (dx / d) * push;
                    newZ += (dz / d) * push;
                    hit = true;
                }
            }
        }

        // keep the wagon inside the playable terrain disc
        const radial = Math.sqrt(newX * newX + newZ * newZ);
        if (radial > WORLD_RADIUS) {
            newX *= WORLD_RADIUS / radial;
            newZ *= WORLD_RADIUS / radial;
            hit = true;
        }

        this.position[0] = newX;
        this.position[2] = newZ;

        // running into something bleeds off momentum so we don't grind against the wall
        if (hit) this.speed *= 0.2;

        // wheel rolling — front wheels are smaller so they spin faster
        this.frontSpin += dist / FRONT_WHEEL_RADIUS_WORLD;
        this.rearSpin += dist / REAR_WHEEL_RADIUS_WORLD;
    }

    pickup(bale) {
        if (this.carriedBale) return false;
        this.carriedBale = bale;
        return true;
    }

    dropPosition() {
        // drop just behind the wagon so it doesn't collide with the rear wheels
        const dropLocalX = REAR_WHEEL_OFFSET_X * WAGON_SCALE - 1.5;
        const cos = Math.cos(this.heading);
        const sin = Math.sin(this.heading);
        return [
            this.position[0] + dropLocalX * cos,
            this.position[1],
            this.position[2] - dropLocalX * sin
        ];
    }

    releaseBale() {
        const bale = this.carriedBale;
        this.carriedBale = null;
        return bale;
    }

    display() {
        this.scene.pushMatrix();

        // place and orient the whole rig in the world
        this.scene.translate(this.position[0], this.position[1], this.position[2]);
        this.scene.rotate(this.heading, 0, 1, 0);
        this.scene.scale(WAGON_SCALE, WAGON_SCALE, WAGON_SCALE);

        // lift the bed so the wheels fit underneath
        this.scene.pushMatrix();
        this.scene.translate(0, 0.75, 0);
        this.bed.display();
        this.scene.popMatrix();

        // front axle group: both wheels, the tongue, and the horse pivot together
        // around a kingpin at the centre of the front axle (1.1, 0.5, 0).
        this.scene.pushMatrix();
        this.scene.translate(FRONT_WHEEL_OFFSET_X, FRONT_WHEEL_Y, 0);
        this.scene.rotate(this.steering, 0, 1, 0);

        this.scene.pushMatrix();
        this.scene.translate(0, 0, WHEEL_OFFSET_Z);
        this.scene.rotate(-this.frontSpin, 0, 0, 1);
        this.wheel.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(0, 0, -WHEEL_OFFSET_Z);
        this.scene.rotate(-this.frontSpin, 0, 0, 1);
        this.wheel.display();
        this.scene.popMatrix();

        // tongue's rear end sits at the kingpin and extends forward in local +X
        this.tongue.display();

        // horse is harnessed to the tongue tip, so it swings with the same pivot
        this.scene.pushMatrix();
        this.scene.translate(2.0, -0.5, 0);
        this.scene.scale(0.0013, 0.0013, 0.0013);
        this.scene.rotate(Math.PI / 2, 0, 1, 0);
        this.scene.rotate(Math.PI / 2, -1, 0, 0);
        this.horseMaterial.apply();
        this.horse.display();
        this.scene.popMatrix();

        this.scene.popMatrix(); // end front axle group

        // rear wheels — fixed orientation, larger radius
        this.scene.pushMatrix();
        this.scene.translate(REAR_WHEEL_OFFSET_X, REAR_WHEEL_Y, WHEEL_OFFSET_Z);
        this.scene.scale(REAR_WHEEL_SCALE, REAR_WHEEL_SCALE, REAR_WHEEL_SCALE);
        this.scene.rotate(-this.rearSpin, 0, 0, 1);
        this.wheel.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(REAR_WHEEL_OFFSET_X, REAR_WHEEL_Y, -WHEEL_OFFSET_Z);
        this.scene.scale(REAR_WHEEL_SCALE, REAR_WHEEL_SCALE, REAR_WHEEL_SCALE);
        this.scene.rotate(-this.rearSpin, 0, 0, 1);
        this.wheel.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(0, 1.0, 0);
        this.cover.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(1.2, 1.0, 0);
        this.seat.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(1.3, 1.1, 0.75);
        this.lamp.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(1.3, 1.1, -0.75);
        this.lamp.display();
        this.scene.popMatrix();

        // carried hay bale rides on top of the bed
        if (this.carriedBale) {
            this.scene.pushMatrix();
            this.scene.translate(0, 1.4, 0);
            this.carriedBale.display();
            this.scene.popMatrix();
        }

        this.scene.popMatrix();
    }
}
