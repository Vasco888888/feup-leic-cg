import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';
import { MyWheel } from './MyWheel.js';
import { MyWagonBed } from './MyWagonBed.js';
import { MyCover } from './MyCover.js';
import { MyTongue } from './MyTongue.js';
import { MySeat } from './MySeat.js';
import { MyLamp } from './MyLamp.js';
import { CGFobjModel } from '../../../../lib/extra/CGFobjModel.js';

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
        // lift the bed so the wheels fit underneath
        this.scene.pushMatrix();
        this.scene.translate(0, 0.75, 0);
        this.bed.display();
        this.scene.popMatrix();

        const xPos = 1.1;
        const zPos = 1.1;

        const frontY = 0.5;
        this.scene.pushMatrix();
        this.scene.translate(xPos, frontY, zPos);
        this.wheel.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(xPos, frontY, -zPos);
        this.wheel.display();
        this.scene.popMatrix();

        // rear wheels are larger; raise them so their center matches the larger radius
        const backY = 0.6;
        const backScale = 1.2;
        this.scene.pushMatrix();
        this.scene.translate(-xPos, backY, zPos);
        this.scene.scale(backScale, backScale, backScale);
        this.wheel.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(-xPos, backY, -zPos);
        this.scene.scale(backScale, backScale, backScale);
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
        this.scene.translate(1.1, 0.5, 0);
        this.tongue.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(1.3, 1.1, 0.75);
        this.lamp.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
        this.scene.translate(1.3, 1.1, -0.75);
        this.lamp.display();
        this.scene.popMatrix();

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
