import { CGFobject, CGFappearance } from '../../lib/CGF.js';

/**
 * MyWagonBed
 */
export class MyWagonBed extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
        
        // Basic wooden material
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.3, 0.2, 0.1, 1.0);
        this.material.setDiffuse(0.6, 0.4, 0.2, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(5.0);
    }

    initBuffers() {
        // A box with: Length 4 (X), Width 2 (Z), Height 0.5 (Y)
        this.vertices = [
            -2, -0.25,  1,  // 0: Front Bottom Left
             2, -0.25,  1,  // 1: Front Bottom Right
            -2,  0.25,  1,  // 2: Front Top Left
             2,  0.25,  1,  // 3: Front Top Right
            -2, -0.25, -1,  // 4: Back Bottom Left
             2, -0.25, -1,  // 5: Back Bottom Right
            -2,  0.25, -1,  // 6: Back Top Left
             2,  0.25, -1   // 7: Back Top Right
        ];

        this.indices = [
            0, 1, 2,  3, 2, 1, // Front
            5, 4, 7,  6, 7, 4, // Back
            4, 0, 6,  2, 6, 0, // Left
            1, 5, 3,  7, 3, 5, // Right
            2, 3, 6,  7, 6, 3, // Top
            4, 5, 0,  1, 0, 5  // Bottom
        ];

        // Basic normals (all pointing outwards)
        this.normals = [
            -1, -1,  1,   1, -1,  1,  -1,  1,  1,   1,  1,  1,
            -1, -1, -1,   1, -1, -1,  -1,  1, -1,   1,  1, -1
        ];

        this.texCoords = [
            0, 1,  1, 1,  0, 0,  1, 0,
            1, 1,  0, 1,  1, 0,  0, 0
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
