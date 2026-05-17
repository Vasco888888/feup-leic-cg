import { CGFobject } from "../../../lib/CGF.js";

/**
 * Subdivided plane centered at origin in the XY plane.
 */
export class MyPlane extends CGFobject {
    constructor(scene, nrDivs = 1, minS = 0, maxS = 1, minT = 0, maxT = 1) {
        super(scene);
        this.nrDivs = nrDivs;
        this.patchLength = 1.0 / nrDivs;
        this.minS = minS;
        this.maxS = maxS;
        this.minT = minT;
        this.maxT = maxT;
        this.q = (this.maxS - this.minS) / this.nrDivs;
        this.w = (this.maxT - this.minT) / this.nrDivs;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];

        let yCoord = 0.5;
        for (let j = 0; j <= this.nrDivs; j++) {
            let xCoord = -0.5;
            for (let i = 0; i <= this.nrDivs; i++) {
                this.vertices.push(xCoord, yCoord, 0);
                this.normals.push(0, 0, 1);
                this.texCoords.push(this.minS + i * this.q, this.minT + j * this.w);
                xCoord += this.patchLength;
            }
            yCoord -= this.patchLength;
        }

        this.indices = [];
        let ind = 0;
        for (let j = 0; j < this.nrDivs; j++) {
            for (let i = 0; i <= this.nrDivs; i++) {
                this.indices.push(ind);
                this.indices.push(ind + this.nrDivs + 1);
                ind++;
            }
            if (j + 1 < this.nrDivs) {
                this.indices.push(ind + this.nrDivs);
                this.indices.push(ind);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLE_STRIP;
        this.initGLBuffers();
    }

    setFillMode() {
        this.primitiveType = this.scene.gl.TRIANGLE_STRIP;
    }

    setLineMode() {
        this.primitiveType = this.scene.gl.LINES;
    }
}
