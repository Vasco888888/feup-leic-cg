import { CGFobject, CGFappearance, CGFtexture } from '../../lib/CGF.js';

/**
 * MyTongue
 */
export class MyTongue extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.3, 0.2, 0.1, 1.0);
        this.material.setDiffuse(0.8, 0.8, 0.8, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(5.0);

        this.texture = new CGFtexture(scene, "textures/wagon/dark_oak.jpg");
        this.material.setTexture(this.texture);
        this.material.setTextureWrap('REPEAT', 'REPEAT');
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        // Tongue properties
        const length = 1.5;
        const thick = 0.1;
        const frontWidth = 0.8;

        // Helper to add a box
        const addBox = (x, y, z, lx, ly, lz) => {
            let s = this.vertices.length / 3;
            // 8 vertices per box
            this.vertices.push(
                x, y, z,       x+lx, y, z,       x, y+ly, z,       x+lx, y+ly, z,
                x, y, z+lz,    x+lx, y, z+lz,    x, y+ly, z+lz,    x+lx, y+ly, z+lz
            );
            this.normals.push(
                -1,-1,-1,  1,-1,-1, -1, 1,-1,  1, 1,-1,
                -1,-1, 1,  1,-1, 1, -1, 1, 1,  1, 1, 1
            );
            this.indices.push(
                s+0,s+1,s+2, s+3,s+2,s+1, // Front
                s+5,s+4,s+7, s+6,s+7,s+4, // Back
                s+4,s+0,s+6, s+2,s+6,s+0, // Left
                s+1,s+5,s+3, s+7,s+3,s+5, // Right
                s+2,s+3,s+6, s+7,s+6,s+3, // Top
                s+4,s+5,s+0, s+1,s+0,s+5  // Bottom
            );
            for(let i=0; i<8; i++) this.texCoords.push(0,0);
        };

        // Tongue
        addBox(0, -thick/2, -thick/2, length, thick, thick);
        // Front
        addBox(length - thick, -thick/2, -frontWidth/2, thick, thick, frontWidth);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
