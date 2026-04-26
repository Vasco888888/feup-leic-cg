import { CGFobject } from "../../../lib/CGF.js";

/**
 * Grass patch — a cluster of grass blades rendered as quads.
 *
 * Each blade is a thin quad (2 triangles) standing upright.
 * The vertex shader will animate the top vertices for wind.
 *
 * Dense and dead grass patches are controlled by the colour
 * uniform passed to the shader.
 */
export class MyGrassPatch extends CGFobject {
    /**
     * @param {CGFscene} scene
     * @param {number}   bladeCount  Blades per patch
     * @param {number}   patchRadius Radius of the patch
     * @param {number}   seed        For unique blade placement
     */
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
            // Random position within circular patch
            const angle = this._seededRandom(i * 6) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(i * 6 + 1)) * this.patchRadius;
            const bx = Math.cos(angle) * dist;
            const bz = Math.sin(angle) * dist;

            // Random blade properties
            const height = 0.4 + this._seededRandom(i * 6 + 2) * 0.8;
            const width = 0.06 + this._seededRandom(i * 6 + 3) * 0.08;
            const rotY = this._seededRandom(i * 6 + 4) * Math.PI;
            const bendAmount = this._seededRandom(i * 6 + 5) * 0.3;

            // Blade orientation
            const cosR = Math.cos(rotY);
            const sinR = Math.sin(rotY);
            const hw = width / 2;

            // 4 vertices per blade: bottom-left, bottom-right, top-left, top-right
            // Bottom vertices (y = 0, stay fixed)
            const blX = bx - hw * cosR;
            const blZ = bz - hw * sinR;
            const brX = bx + hw * cosR;
            const brZ = bz + hw * sinR;

            // Top vertices (y = height, will be animated by wind shader)
            // Slight bend in the blade direction
            const tlX = blX + bendAmount * sinR;
            const tlZ = blZ - bendAmount * cosR;
            const trX = brX + bendAmount * sinR;
            const trZ = brZ - bendAmount * cosR;

            // Bottom-left
            this.vertices.push(blX, 0, blZ);
            this.normals.push(-sinR, 0, cosR);
            this.texCoords.push(0, 1); // v=1 means bottom (fixed)

            // Bottom-right
            this.vertices.push(brX, 0, brZ);
            this.normals.push(-sinR, 0, cosR);
            this.texCoords.push(1, 1);

            // Top-left
            this.vertices.push(tlX, height, tlZ);
            this.normals.push(-sinR, 0.3, cosR);
            this.texCoords.push(0, 0); // v=0 means top (animated)

            // Top-right
            this.vertices.push(trX, height, trZ);
            this.normals.push(-sinR, 0.3, cosR);
            this.texCoords.push(1, 0);

            // Two triangles per blade (front and back face)
            this.indices.push(idx, idx + 1, idx + 2);
            this.indices.push(idx + 1, idx + 3, idx + 2);
            // Back face
            this.indices.push(idx + 2, idx + 1, idx);
            this.indices.push(idx + 2, idx + 3, idx + 1);

            idx += 4;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
