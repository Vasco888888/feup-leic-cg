import { CGFobject } from '../../lib/CGF.js';
import { MyWheel } from './MyWheel.js';
import { MyWagonBed } from './MyWagonBed.js';
import { MyCover } from './MyCover.js';
import { MyTongue } from './MyTongue.js';

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
    }

    display() {
        // Bed (lifted up for wheels)
        this.scene.pushMatrix();
        this.scene.translate(0, 0.75, 0); 
        this.bed.display();
        this.scene.popMatrix();

        // 4 Wheels
        const xPos = 1.5;
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

        // --- Cover and Tongue (TODO) ---
        /*
        this.scene.pushMatrix();
        this.cover.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.tongue.display();
        this.scene.popMatrix();
        */
    }
}
