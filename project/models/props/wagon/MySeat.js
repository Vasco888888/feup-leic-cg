import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

export class MySeat extends CGFobject {
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
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        // axis-aligned box with 24 vertices so each face has its own normal and UVs
        const addBox = (x, y, z, lx, ly, lz) => {
            let s = this.vertices.length / 3;
            this.vertices.push(
                x, y, z+lz,  x+lx, y, z+lz,  x, y+ly, z+lz,  x+lx, y+ly, z+lz,
                x, y, z,     x+lx, y, z,     x, y+ly, z,     x+lx, y+ly, z,
                x, y, z,     x, y, z+lz,     x, y+ly, z,     x, y+ly, z+lz,
                x+lx, y, z,  x+lx, y, z+lz,  x+lx, y+ly, z,  x+lx, y+ly, z+lz,
                x, y+ly, z,  x+lx, y+ly, z,  x, y+ly, z+lz,  x+lx, y+ly, z+lz,
                x, y, z,     x+lx, y, z,     x, y, z+lz,     x+lx, y, z+lz
            );

            this.normals.push(
                0,0,1, 0,0,1, 0,0,1, 0,0,1,
                0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
                -1,0,0, -1,0,0, -1,0,0, -1,0,0,
                1,0,0, 1,0,0, 1,0,0, 1,0,0,
                0,1,0, 0,1,0, 0,1,0, 0,1,0,
                0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0
            );

            // every face is double-sided
            this.indices.push(
                s+0,s+1,s+3, s+0,s+3,s+2,
                s+3,s+1,s+0, s+2,s+3,s+0,
                s+5,s+4,s+6, s+5,s+6,s+7,
                s+6,s+4,s+5, s+7,s+6,s+5,
                s+8,s+9,s+11, s+8,s+11,s+10,
                s+11,s+9,s+8, s+10,s+11,s+8,
                s+13,s+12,s+14, s+13,s+14,s+15,
                s+14,s+12,s+13, s+15,s+14,s+13,
                s+16,s+17,s+19, s+16,s+19,s+18,
                s+19,s+17,s+16, s+18,s+19,s+16,
                s+21,s+20,s+22, s+21,s+22,s+23,
                s+22,s+20,s+21, s+23,s+22,s+21
            );

            for(let i=0; i<6; i++) {
                this.texCoords.push(0,1, 1,1, 0,0, 1,0);
            }
        };

        // bench
        addBox(-0.1, 0, -0.9, 0.4, 0.1, 1.8);
        // backrest
        addBox(-0.1, 0.1, -0.9, 0.1, 0.4, 1.8);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
