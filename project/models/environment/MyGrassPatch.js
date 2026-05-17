import { CGFobject } from "../../../lib/CGF.js";

/**
 * Cluster of upright blade quads; the vertex shader animates the tops for wind.
 */
export class MyGrassPatch extends CGFobject {
    constructor(scene, bladeCount = 40, patchRadius = 3.0, seed = 0) {
        super(scene);
        this.bladeCount = bladeCount;
        this.patchRadius = patchRadius;
        this.seed = seed;
        this.initBuffers();
    }

    _seededRandom(index) {
        let h = (index * 374761393 + this.seed * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        let idx = 0;

        for (let i = 0; i < this.bladeCount; i++) {
            const angle = this._seededRandom(i * 6) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(i * 6 + 1)) * this.patchRadius;
            const bx = Math.cos(angle) * dist;
            const bz = Math.sin(angle) * dist;

            const height = 0.45 + this._seededRandom(i * 6 + 2) * 0.55;
            const width = 0.16 + this._seededRandom(i * 6 + 3) * 0.14;
            const rotY = this._seededRandom(i * 6 + 4) * Math.PI;
            const bendAmount = this._seededRandom(i * 6 + 5) * 0.6;

            const cosR = Math.cos(rotY);
            const sinR = Math.sin(rotY);
            const hw = width / 2;

            // bottom corners stay anchored at y=0
            const blX = bx - hw * cosR;
            const blZ = bz - hw * sinR;
            const brX = bx + hw * cosR;
            const brZ = bz + hw * sinR;

            // top vertex gets a small lateral bend; wind shader animates it further
            const tX = bx + bendAmount * sinR;
            const tZ = bz - bendAmount * cosR;

            this.vertices.push(blX, 0, blZ);
            this.normals.push(-sinR, 0, cosR);
            this.texCoords.push(0, 1); // v=1 marks fixed bottom

            this.vertices.push(brX, 0, brZ);
            this.normals.push(-sinR, 0, cosR);
            this.texCoords.push(1, 1);

            this.vertices.push(tX, height, tZ);
            this.normals.push(-sinR, 0.3, cosR);
            this.texCoords.push(0.5, 0); // v=0 marks animated top

            // double-sided: emit both windings
            this.indices.push(idx, idx + 1, idx + 2);
            this.indices.push(idx + 2, idx + 1, idx);

            idx += 3;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
