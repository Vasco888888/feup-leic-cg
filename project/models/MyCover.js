import { CGFobject, CGFappearance } from '../../lib/CGF.js';

/**
 * MyCover
 */
export class MyCover extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // Cloth material
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.7, 0.7, 0.7, 1.0);
        this.material.setDiffuse(0.9, 0.9, 0.9, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(1.0);
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const slices = 20;
        const radiusZ = 1.0;
        const radiusY = 1.4; // Taller arch
        const length = 3.0; // Full wagon length
        const hoops = 6; // Number of hoops

        for (let j = 0; j < hoops; j++) {
            let zOffset = (j * length / (hoops - 1)) - length / 2;

            for (let i = 0; i <= slices; i++) {
                let angle = (i * Math.PI) / slices;
                let z = Math.cos(angle) * radiusZ;
                let y = Math.sin(angle) * radiusY;

                // Outside
                this.vertices.push(zOffset, y, z);
                this.normals.push(0, y, z);
                this.texCoords.push(i / slices, j / (hoops - 1));
                
                // Inside
                this.vertices.push(zOffset, y, z);
                this.normals.push(0, -y, -z);
                this.texCoords.push(i / slices, j / (hoops - 1));
            }
        }

        // Indices for the cloth sections
        for (let j = 0; j < hoops - 1; j++) {
            for (let i = 0; i < slices; i++) {
                let current = j * (slices + 1) * 2 + i * 2;
                let next = (j + 1) * (slices + 1) * 2 + i * 2;

                // Outside
                this.indices.push(current, next, current + 2);
                this.indices.push(current + 2, next, next + 2);
                
                // Inside
                this.indices.push(current + 3, next + 1, current + 1);
                this.indices.push(next + 3, next + 1, current + 3);
            }
        }

        // --- Hoops ---
        const hoopRadiusZ = radiusZ + 0.05;
        const hoopRadiusY = radiusY + 0.05;
        const hoopThickness = 0.04;
        const hoopStart = this.vertices.length / 3;

        for (let j = 0; j < hoops; j++) {
            let zOffset = (j * length / (hoops - 1)) - length / 2;
            let currentHoopStart = (this.vertices.length / 3) - hoopStart;

            for (let i = 0; i <= slices; i++) {
                let angle = (i * Math.PI) / slices;
                let z = Math.cos(angle) * hoopRadiusZ;
                let y = Math.sin(angle) * hoopRadiusY;

                this.vertices.push(zOffset + hoopThickness/2, y, z);
                this.vertices.push(zOffset - hoopThickness/2, y, z);
                this.normals.push(1, 0, 0, -1, 0, 0);
                this.texCoords.push(i / slices, 0, i / slices, 1);
            }

            for (let i = 0; i < slices; i++) {
                let current = hoopStart + currentHoopStart + i * 2;
                // Side 1
                this.indices.push(current, current + 2, current + 1);
                this.indices.push(current + 1, current + 2, current + 3);
                // Side 2 (Reversed)
                this.indices.push(current + 1, current + 2, current);
                this.indices.push(current + 3, current + 2, current + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
