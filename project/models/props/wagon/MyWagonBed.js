import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

export class MyWagonBed extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // dark oak
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.3, 0.2, 0.1, 1.0);
        this.material.setDiffuse(0.8, 0.8, 0.8, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(5.0);

        this.texture = new CGFtexture(scene, "textures/props/wagon/dark_oak.jpg");
        this.material.setTexture(this.texture);
        this.material.setTextureWrap('REPEAT', 'REPEAT');
    }

    initBuffers() {
        // half-extents: 3 long, 2 wide, 0.5 tall
        const x = 1.5;
        const y = 0.25;
        const z = 1.0;

        this.vertices = [
            -x, -y, z, x, -y, z, -x, y, z, x, y, z,
            -x, -y, -z, x, -y, -z, -x, y, -z, x, y, -z,
            -x, -y, -z, -x, -y, z, -x, y, -z, -x, y, z,
            x, -y, -z, x, -y, z, x, y, -z, x, y, z,
            -x, y, z, x, y, z, -x, y, -z, x, y, -z,
            -x, -y, z, x, -y, z, -x, -y, -z, x, -y, -z
        ];

        this.indices = [
            0, 1, 3, 0, 3, 2,
            5, 4, 6, 5, 6, 7,
            8, 9, 11, 8, 11, 10,
            13, 12, 14, 13, 14, 15,
            16, 17, 19, 16, 19, 18,
            21, 20, 22, 21, 22, 23
        ];

        this.normals = [
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
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
