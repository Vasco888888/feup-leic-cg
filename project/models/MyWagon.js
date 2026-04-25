import { CGFobject } from '../lib/CGF.js';
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
        this.scene.pushMatrix();
        this.bed.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.cover.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.tongue.display();
        this.scene.popMatrix();

        // 4 Wheels
        this.scene.pushMatrix();
        this.wheel.display();
        this.scene.popMatrix();
    }
}
