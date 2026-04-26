import { CGFobject, CGFappearance, CGFtexture } from '../../lib/CGF.js';

/**
 * MyWagonBed
 */
export class MyWagonBed extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // Dark Oak Wood Material
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.3, 0.2, 0.1, 1.0);
        this.material.setDiffuse(0.8, 0.8, 0.8, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(5.0);

        this.texture = new CGFtexture(scene, "textures/assets/wagon/dark_oak.jpg");
        this.material.setTexture(this.texture);
        this.material.setTextureWrap('REPEAT', 'REPEAT');
    }

    initBuffers() {
        // Dimensions: Length 3 (X), Width 2 (Z), Height 0.5 (Y)
        const x = 1.5;
        const y = 0.25;
        const z = 1.0;

        this.vertices = [
            // Front face (Z=1)
            -x, -y, z, x, -y, z, -x, y, z, x, y, z,
            // Back face (Z=-1)
            -x, -y, -z, x, -y, -z, -x, y, -z, x, y, -z,
            // Left face (X=-1.5)
            -x, -y, -z, -x, -y, z, -x, y, -z, -x, y, z,
            // Right face (X=1.5)
            x, -y, -z, x, -y, z, x, y, -z, x, y, z,
            // Top face (Y=0.25)
            -x, y, z, x, y, z, -x, y, -z, x, y, -z,
            // Bottom face (Y=-0.25)
            -x, -y, z, x, -y, z, -x, -y, -z, x, -y, -z
        ];

        this.indices = [
            // Front face (Z=1)
            0, 1, 3, 0, 3, 2,
            // Back face (Z=-1)
            5, 4, 6, 5, 6, 7,
            // Left face (X=-1.5)
            8, 9, 11, 8, 11, 10,
            // Right face (X=1.5)
            13, 12, 14, 13, 14, 15,
            // Top face (Y=0.25)
            16, 17, 19, 16, 19, 18,
            // Bottom face (Y=-0.25)
            21, 20, 22, 21, 22, 23
        ];

        this.normals = [
            // Front
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // Back
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // Left
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            // Right
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            // Top
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            // Bottom
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
        ];

        this.texCoords = [];
        for (let i = 0; i < 6; i++) {
            this.texCoords.push(0, 1, 1, 1, 0, 0, 1, 0);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
