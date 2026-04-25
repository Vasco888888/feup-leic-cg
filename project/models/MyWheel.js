import { CGFobject, CGFappearance } from '../../lib/CGF.js';

/**
 * MyWheel
 */
export class MyWheel extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // Dark grey material for the wheel
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.1, 0.1, 0.1, 1.0);
        this.material.setDiffuse(0.2, 0.2, 0.2, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(10.0);
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const slices = 20;
        const radius = 0.5;
        const thickness = 0.2;
        const angle = (2 * Math.PI) / slices;

        // Outer Vertices for the front and back circles
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle) * radius;
            let y = Math.sin(i * angle) * radius;

            // Front
            this.vertices.push(x, y, thickness / 2);
            this.normals.push(x, y, 0);
            this.texCoords.push(i / slices, 0);

            // Back
            this.vertices.push(x, y, -thickness / 2);
            this.normals.push(x, y, 0);
            this.texCoords.push(i / slices, 1);
        }

        // Inner Vertices (for the inside of the ring)
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle) * radius;
            let y = Math.sin(i * angle) * radius;

            // Front
            this.vertices.push(x, y, thickness / 2);
            this.normals.push(-x, -y, 0);
            this.texCoords.push(i / slices, 0);

            // Back
            this.vertices.push(x, y, -thickness / 2);
            this.normals.push(-x, -y, 0);
            this.texCoords.push(i / slices, 1);
        }

        // Indices for the side faces (Outer)
        for (let i = 0; i < slices; i++) {
            this.indices.push(2 * i, 2 * i + 1, 2 * i + 2);
            this.indices.push(2 * i + 2, 2 * i + 1, 2 * i + 3);
        }

        // Indices for the side faces (Inner)
        const offset = 2 * (slices + 1);
        for (let i = 0; i < slices; i++) {
            this.indices.push(offset + 2 * i + 2, offset + 2 * i + 1, offset + 2 * i);
            this.indices.push(offset + 2 * i + 3, offset + 2 * i + 1, offset + 2 * i + 2);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
