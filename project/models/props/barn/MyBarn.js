import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

export class MyBarn extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // red plank walls
        this.wallMaterial = new CGFappearance(scene);
        this.wallMaterial.setAmbient(0.22, 0.22, 0.22, 1.0);
        this.wallMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.wallMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.wallMaterial.setShininess(5.0);
        this.wallTexture = new CGFtexture(scene, "textures/props/barn/reclaimed_wood_planks_sundance_red_finish_wall.jpg");
        this.wallMaterial.setTexture(this.wallTexture);

        this.doorMaterial = new CGFappearance(scene);
        this.doorMaterial.setAmbient(0.22, 0.22, 0.22, 1.0);
        this.doorMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.doorMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.doorMaterial.setShininess(5.0);
        this.doorTexture = new CGFtexture(scene, "textures/props/barn/rustic_barn_door.jpg");
        this.doorMaterial.setTexture(this.doorTexture);

        this.roofMaterial = new CGFappearance(scene);
        this.roofMaterial.setAmbient(0.20, 0.20, 0.20, 1.0);
        this.roofMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.roofMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.roofTexture = new CGFtexture(scene, "textures/props/barn/wood_shingle_roof.jpg");
        this.roofMaterial.setTexture(this.roofTexture);
        this.roofMaterial.setTextureWrap('REPEAT', 'REPEAT');

    }

    initBuffers() {
        this.mainCube = new MyBarnCube(this.scene);
        this.frontFace = new MyBarnFront(this.scene);
        this.roofPart = new MyBarnRoof(this.scene);
    }

    display() {
        this.wallMaterial.apply();

        const faces = [
            { pos: [0, 4, -5], rot: [Math.PI, 0, 1, 0], scale: [10, 8, 1] },
            { pos: [-5, 4, 0], rot: [-Math.PI / 2, 0, 1, 0], scale: [10, 8, 1] },
            { pos: [5, 4, 0], rot: [Math.PI / 2, 0, 1, 0], scale: [10, 8, 1] },
            { pos: [0, 8, 0], rot: [-Math.PI / 2, 1, 0, 0], scale: [10, 10, 1] },
            { pos: [0, 0.01, 0], rot: [Math.PI / 2, 1, 0, 0], scale: [10, 10, 1] },
            { pos: [0, 4, 5], rot: [0, 0, 1, 0], scale: [10, 8, 1] }
        ];

        faces.forEach(f => {
            this.scene.pushMatrix();
            this.scene.translate(...f.pos);
            if (f.rot[0] !== 0) this.scene.rotate(f.rot[0], f.rot[1], f.rot[2], f.rot[3]);
            this.scene.scale(...f.scale);
            this.mainCube.display();
            this.scene.popMatrix();
        });

        this.doorMaterial.apply();
        this.scene.pushMatrix();
        this.scene.translate(0, 3, 5.05); // sit just in front of the wall to avoid z-fight
        this.scene.scale(5, 6, 1);
        this.frontFace.display();
        this.scene.popMatrix();

        this.roofMaterial.apply();
        this.scene.pushMatrix();
        this.scene.translate(0, 8, 0);
        this.roofPart.display();
        this.scene.popMatrix();
    }
}

class MyBarnCube extends CGFobject {
    constructor(scene) { super(scene); this.initBuffers(); }
    initBuffers() {
        this.vertices = [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0];
        this.indices = [
            0, 1, 3, 0, 3, 2,
            3, 1, 0, 2, 3, 0
        ];
        this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
        this.texCoords = [0, 1, 1, 1, 0, 0, 1, 0];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

class MyBarnFront extends MyBarnCube {}

class MyBarnRoof extends CGFobject {
    constructor(scene) { super(scene); this.initBuffers(); }
    initBuffers() {
        const w = 5, rh = 4, d = 5;
        this.vertices = [
            // left slant: 0..3
            -w, 0, d,  0, rh, d,  -w, 0, -d, 0, rh, -d,
            // right slant: 4..7
            0, rh, d, w, 0, d,   0, rh, -d, w, 0, -d,
            // front gable: 8..10
            -w, 0, d,  w, 0, d,   0, rh, d,
            // back gable: 11..13
            -w, 0, -d, w, 0, -d,  0, rh, -d
        ];

        this.indices = [
            0, 1, 3, 0, 3, 2,
            4, 5, 7, 4, 7, 6,
            8, 9, 10,
            13, 12, 11,
            // double-sided
            3, 1, 0, 2, 3, 0, 7, 5, 4, 6, 7, 4, 10, 9, 8, 11, 12, 13
        ];

        this.texCoords = [
            0, 2,  1, 2,  0, 0,  1, 0,
            1, 2,  0, 2,  1, 0,  0, 0,
            0, 1,  1, 1,  0.5, 0,
            0, 1,  1, 1,  0.5, 0
        ];

        const len = Math.sqrt(rh * rh + w * w);
        const nl = [-rh / len, w / len, 0];
        const nr = [rh / len, w / len, 0];
        
        this.normals = [
            ...nl, ...nl, ...nl, ...nl,
            ...nr, ...nr, ...nr, ...nr,
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
