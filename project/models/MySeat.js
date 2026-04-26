import { CGFobject, CGFappearance, CGFtexture } from '../../lib/CGF.js';

/**
 * MySeat
 */
export class MySeat extends CGFobject {
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
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        // Helper to add a box with proper UVs and normals
        const addBox = (x, y, z, lx, ly, lz) => {
            let s = this.vertices.length / 3;
            // 24 vertices for 6 faces
            this.vertices.push(
                // Front
                x, y, z+lz,  x+lx, y, z+lz,  x, y+ly, z+lz,  x+lx, y+ly, z+lz,
                // Back
                x, y, z,     x+lx, y, z,     x, y+ly, z,     x+lx, y+ly, z,
                // Left
                x, y, z,     x, y, z+lz,     x, y+ly, z,     x, y+ly, z+lz,
                // Right
                x+lx, y, z,  x+lx, y, z+lz,  x+lx, y+ly, z,  x+lx, y+ly, z+lz,
                // Top
                x, y+ly, z,  x+lx, y+ly, z,  x, y+ly, z+lz,  x+lx, y+ly, z+lz,
                // Bottom
                x, y, z,     x+lx, y, z,     x, y, z+lz,     x+lx, y, z+lz
            );
            
            this.normals.push(
                0,0,1, 0,0,1, 0,0,1, 0,0,1,       // Front
                0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,   // Back
                -1,0,0, -1,0,0, -1,0,0, -1,0,0,   // Left
                1,0,0, 1,0,0, 1,0,0, 1,0,0,       // Right
                0,1,0, 0,1,0, 0,1,0, 0,1,0,       // Top
                0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0    // Bottom
            );

            this.indices.push(
                // Front face
                s+0,s+1,s+3, s+0,s+3,s+2,
                s+3,s+1,s+0, s+2,s+3,s+0, // Reversed
                // Back face
                s+5,s+4,s+6, s+5,s+6,s+7,
                s+6,s+4,s+5, s+7,s+6,s+5, // Reversed
                // Left face
                s+8,s+9,s+11, s+8,s+11,s+10,
                s+11,s+9,s+8, s+10,s+11,s+8, // Reversed
                // Right face
                s+13,s+12,s+14, s+13,s+14,s+15,
                s+14,s+12,s+13, s+15,s+14,s+13, // Reversed
                // Top face
                s+16,s+17,s+19, s+16,s+19,s+18,
                s+19,s+17,s+16, s+18,s+19,s+16, // Reversed
                // Bottom face
                s+21,s+20,s+22, s+21,s+22,s+23,
                s+22,s+20,s+21, s+23,s+22,s+21  // Reversed
            );

            for(let i=0; i<6; i++) {
                this.texCoords.push(0,1, 1,1, 0,0, 1,0);
            }
        };

        // Bench Seat
        addBox(-0.1, 0, -0.9, 0.4, 0.1, 1.8);
        // Backrest
        addBox(-0.1, 0.1, -0.9, 0.1, 0.4, 1.8);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
