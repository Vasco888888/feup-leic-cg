import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

/**
 * MyHayBale
 */
export class MyHayBale extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // Hay Material
        this.hayMaterial = new CGFappearance(scene);
        this.hayMaterial.setAmbient(0.6, 0.6, 0.4, 1.0);
        this.hayMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.hayMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.hayMaterial.setShininess(5.0);

        this.hayTexture = new CGFtexture(scene, "textures/assets/hay-bale/hay_bale.jpg");
        this.hayMaterial.setTexture(this.hayTexture);
        this.hayMaterial.setTextureWrap('REPEAT', 'REPEAT');

        // Twine Material (Dark Brown)
        this.twineMaterial = new CGFappearance(scene);
        this.twineMaterial.setAmbient(0.2, 0.1, 0.05, 1.0);
        this.twineMaterial.setDiffuse(0.3, 0.15, 0.07, 1.0);
        this.twineMaterial.setSpecular(0, 0, 0, 1.0);
    }

    initBuffers() {
        // Dimensions: 1.0 (X) x 0.5 (Y) x 0.5 (Z)
        const x = 0.5;
        const y = 0.25;
        const z = 0.25;

        this.vertices = [
            // Front
            -x, -y, z,  x, -y, z,  -x, y, z,  x, y, z,
            // Back
            -x, -y, -z, x, -y, -z, -x, y, -z, x, y, -z,
            // Left
            -x, -y, -z, -x, -y, z, -x, y, -z, -x, y, z,
            // Right
            x, -y, -z,  x, -y, z,  x, y, -z,  x, y, z,
            // Top
            -x, y, z,   x, y, z,   -x, y, -z, x, y, -z,
            // Bottom
            -x, -y, z,  x, -y, z,  -x, -y, -z, x, -y, -z
        ];

        this.normals = [
            0,0,1, 0,0,1, 0,0,1, 0,0,1,
            0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
            -1,0,0, -1,0,0, -1,0,0, -1,0,0,
            1,0,0, 1,0,0, 1,0,0, 1,0,0,
            0,1,0, 0,1,0, 0,1,0, 0,1,0,
            0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0
        ];

        this.indices = [];
        this.texCoords = [];
        for(let i=0; i<6; i++) {
            let s = i * 4;
            // Front face
            this.indices.push(s, s+1, s+3, s, s+3, s+2);
            // Back face
            this.indices.push(s+3, s+1, s, s+2, s+3, s);
            
            this.texCoords.push(0,1, 1,1, 0,0, 1,0);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();

        this.twineBox = new MyHayBaleTwine(this.scene);
    }

    display() {
        // --- Bale ---
        this.hayMaterial.apply();
        super.display();

        // --- Twine Bands ---
        this.twineMaterial.apply();
        
        // Band 1
        this.scene.pushMatrix();
        this.scene.translate(-0.25, 0, 0);
        this.scene.scale(0.02, 0.52, 0.52);
        this.twineBox.display();
        this.scene.popMatrix();

        // Band 2
        this.scene.pushMatrix();
        this.scene.translate(0.25, 0, 0);
        this.scene.scale(0.02, 0.52, 0.52);
        this.twineBox.display();
        this.scene.popMatrix();
    }
}

/**
 * Internal helper for twine geometry
 */
class MyHayBaleTwine extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        const s = 0.5;
        this.vertices = [
            -s, -s, s, s, -s, s, -s, s, s, s, s, s,
            -s, -s, -s, s, -s, -s, -s, s, -s, s, s, -s,
            -s, -s, -s, -s, -s, s, -s, s, -s, -s, s, s,
            s, -s, -s, s, -s, s, s, s, -s, s, s, s,
            -s, s, s, s, s, s, -s, s, -s, s, s, -s,
            -s, -s, s, s, -s, s, -s, -s, -s, s, -s, -s
        ];
        this.indices = [];
        for(let i=0; i<6; i++) {
            let b = i * 4;
            this.indices.push(b, b + 1, b + 3, b, b + 3, b + 2);
            this.indices.push(b + 3, b + 1, b, b + 2, b + 3, b);
        }

        this.normals = [
            0,0,1, 0,0,1, 0,0,1, 0,0,1,
            0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
            -1,0,0, -1,0,0, -1,0,0, -1,0,0,
            1,0,0, 1,0,0, 1,0,0, 1,0,0,
            0,1,0, 0,1,0, 0,1,0, 0,1,0,
            0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
