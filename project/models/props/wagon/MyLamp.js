import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

/**
 * Lantern made of a metal frame around an emissive glass cylinder.
 */
export class MyLamp extends CGFobject {
    constructor(scene) {
        super(scene);

        this.metalPart = new MyLampMetal(scene);
        this.glassPart = new MyLampGlass(scene);

        this.ironMaterial = new CGFappearance(scene);
        this.ironMaterial.setAmbient(0.3, 0.3, 0.3, 1.0);
        this.ironMaterial.setDiffuse(0.6, 0.6, 0.6, 1.0);
        this.ironMaterial.setSpecular(0.4, 0.4, 0.4, 1.0);
        this.ironMaterial.setShininess(20.0);
        this.ironTexture = new CGFtexture(scene, "textures/props/wagon/worn_iron_wheel.jpg");
        this.ironMaterial.setTexture(this.ironTexture);

        // emissive glass so the lantern glows even with no scene lights
        this.glassMaterial = new CGFappearance(scene);
        this.glassMaterial.setAmbient(1.0, 0.8, 0.4, 1.0);
        this.glassMaterial.setDiffuse(1.0, 0.8, 0.4, 1.0);
        this.glassMaterial.setSpecular(1.0, 1.0, 1.0, 1.0);
        this.glassMaterial.setEmission(1.0, 0.7, 0.2, 1.0);
        this.glassMaterial.setShininess(100.0);
    }

    display() {
        this.ironMaterial.apply();
        this.metalPart.display();

        this.glassMaterial.apply();
        this.glassPart.display();
    }
}

class MyLampMetal extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const slices = 12;
        const angle = (2 * Math.PI) / slices;

        const addCylinder = (radius, height, zOffset) => {
            const startIdx = this.vertices.length / 3;
            for (let i = 0; i <= slices; i++) {
                let x = Math.cos(i * angle) * radius;
                let z = Math.sin(i * angle) * radius;
                this.vertices.push(x, zOffset, z);
                this.normals.push(x, 0, z);
                this.texCoords.push(i / slices, 1);
                this.vertices.push(x, zOffset + height, z);
                this.normals.push(x, 0, z);
                this.texCoords.push(i / slices, 0);
            }
            for (let i = 0; i < slices; i++) {
                let b = startIdx + i * 2;
                // double-sided wall
                this.indices.push(b, b + 1, b + 3, b, b + 3, b + 2);
                this.indices.push(b, b + 3, b + 1, b, b + 2, b + 3);
            }
        };

        const addDisk = (radius, zOffset, normalY) => {
            const startIdx = this.vertices.length / 3;
            this.vertices.push(0, zOffset, 0);
            this.normals.push(0, normalY, 0);
            this.texCoords.push(0.5, 0.5);
            for (let i = 0; i <= slices; i++) {
                let x = Math.cos(i * angle) * radius;
                let z = Math.sin(i * angle) * radius;
                this.vertices.push(x, zOffset, z);
                this.normals.push(0, normalY, 0);
                this.texCoords.push(0.5 + 0.5 * Math.cos(i * angle), 0.5 + 0.5 * Math.sin(i * angle));
            }
            for (let i = 0; i < slices; i++) {
                // both winding orders for a double-sided disk
                this.indices.push(startIdx, startIdx + i + 1, startIdx + i + 2);
                this.indices.push(startIdx, startIdx + i + 2, startIdx + i + 1);
            }
        };

        // base cap
        addCylinder(0.15, 0.1, 0);
        addDisk(0.15, 0, -1);
        addDisk(0.15, 0.1, 1);
        // top cap
        addCylinder(0.16, 0.05, 0.4);
        addDisk(0.16, 0.4, -1);
        addDisk(0.16, 0.45, 1);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

class MyLampGlass extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const slices = 12;
        const angle = (2 * Math.PI) / slices;

        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle) * 0.12;
            let z = Math.sin(i * angle) * 0.12;
            this.vertices.push(x, 0.1, z);
            this.normals.push(x, 0, z);
            this.texCoords.push(i / slices, 1);
            this.vertices.push(x, 0.4, z);
            this.normals.push(x, 0, z);
            this.texCoords.push(i / slices, 0);
        }
        for (let i = 0; i < slices; i++) {
            let b = i * 2;
            // double-sided wall
            this.indices.push(b, b + 1, b + 3, b, b + 3, b + 2);
            this.indices.push(b, b + 3, b + 1, b, b + 2, b + 3);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
