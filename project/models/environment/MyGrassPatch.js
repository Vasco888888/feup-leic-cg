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
            const height = 0.8 + this._seededRandom(i * 6 + 2) * 1.0;
            const width = 0.25 + this._seededRandom(i * 6 + 3) * 0.2;
            const rotY = this._seededRandom(i * 6 + 4) * Math.PI;
            const bendAmount = this._seededRandom(i * 6 + 5) * 0.6;

            // Blade orientation
            const cosR = Math.cos(rotY);
            const sinR = Math.sin(rotY);
            const hw = width / 2;

            // 3 vertices per blade: bottom-left, bottom-right, top-center
            // Bottom vertices (y = 0, stay fixed)
            const blX = bx - hw * cosR;
            const blZ = bz - hw * sinR;
            const brX = bx + hw * cosR;
            const brZ = bz + hw * sinR;

            // Top vertex (y = height, will be animated by wind shader)
            // Slight bend in the blade direction
            const tX = bx + bendAmount * sinR;
            const tZ = bz - bendAmount * cosR;

            // Bottom-left
            this.vertices.push(blX, 0, blZ);
            this.normals.push(-sinR, 0, cosR);
            this.texCoords.push(0, 1); // v=1 means bottom (fixed)

            // Bottom-right
            this.vertices.push(brX, 0, brZ);
            this.normals.push(-sinR, 0, cosR);
            this.texCoords.push(1, 1);

            // Top-center
            this.vertices.push(tX, height, tZ);
            this.normals.push(-sinR, 0.3, cosR);
            this.texCoords.push(0.5, 0); // v=0 means top (animated)

            // Two triangles per blade (front and back face)
            this.indices.push(idx, idx + 1, idx + 2);
            // Back face
            this.indices.push(idx + 2, idx + 1, idx);

            idx += 3;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
