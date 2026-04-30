import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';
import { MyWheel } from './MyWheel.js';
import { MyWagonBed } from './MyWagonBed.js';
import { MyCover } from './MyCover.js';
import { MyTongue } from './MyTongue.js';
import { MySeat } from './MySeat.js';
import { MyLamp } from './MyLamp.js';
import { CGFobjModel } from '../../../../lib/extra/CGFobjModel.js';

/**
 * MyWagon
 */
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
    }

    display() {
        // Bed (lifted up for wheels)
        this.scene.pushMatrix();
        this.scene.translate(0, 0.75, 0);
        this.bed.display();
        this.scene.popMatrix();

        // 4 Wheels
        const xPos = 1.1;
        const zPos = 1.1;

        // Front Wheels (Standard size)
        const frontY = 0.5;
        // Front Right
        this.scene.pushMatrix();
        this.scene.translate(xPos, frontY, zPos);
        this.wheel.display();
        this.scene.popMatrix();

        // Front Left
        this.scene.pushMatrix();
        this.scene.translate(xPos, frontY, -zPos);
        this.wheel.display();
        this.scene.popMatrix();

        // Back Wheels (1.2x larger)
        const backY = 0.6;
        const backScale = 1.2;
        // Back Right
        this.scene.pushMatrix();
        this.scene.translate(-xPos, backY, zPos);
        this.scene.scale(backScale, backScale, backScale);
        this.wheel.display();
        this.scene.popMatrix();

        // Back Left
        this.scene.pushMatrix();
        this.scene.translate(-xPos, backY, -zPos);
        this.scene.scale(backScale, backScale, backScale);
        this.wheel.display();
        this.scene.popMatrix();

        // --- Cover and Tongue ---
        this.scene.pushMatrix();
        this.scene.translate(0, 1.0, 0); // Centered on the bed
        this.cover.display();
        this.scene.popMatrix();

        // --- Seat ---
        this.scene.pushMatrix();
        this.scene.translate(1.2, 1.0, 0); // Positioned on top and front of the bed
        this.seat.display();
        this.scene.popMatrix();

        // --- Tongue ---
        this.scene.pushMatrix();
        this.scene.translate(1.1, 0.5, 0);
        this.tongue.display();
        this.scene.popMatrix();

        // --- Lamps ---
        // Right side
        this.scene.pushMatrix();
        this.scene.translate(1.3, 1.1, 0.75); 
        this.lamp.display();
        this.scene.popMatrix();

        // Left side
        this.scene.pushMatrix();
        this.scene.translate(1.3, 1.1, -0.75);
        this.lamp.display();
        this.scene.popMatrix();

        // --- Horse ---
        this.scene.pushMatrix();
        this.scene.translate(3.1, 0.0, 0);
        this.scene.scale(0.0013, 0.0013, 0.0013);
        this.scene.rotate(Math.PI / 2, 0, 1, 0);
        this.scene.rotate(Math.PI / 2, -1, 0, 0);
        this.horseMaterial.apply();
        this.horse.display();
        this.scene.popMatrix();
    }
}
