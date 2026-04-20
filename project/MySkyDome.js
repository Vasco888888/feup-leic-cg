import { CGFobject } from "../lib/CGF.js";

/**
 * Inward-facing half-sphere used for sky rendering.
 */
export class MySkyDome extends CGFobject {
    constructor(scene, slices = 80, stacks = 28) {
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        for (let stack = 0; stack <= this.stacks; stack++) {
            const v = stack / this.stacks;
            const theta = v * (Math.PI / 2.0);
            const y = Math.cos(theta);
            const ringRadius = Math.sin(theta);

            for (let slice = 0; slice <= this.slices; slice++) {
                const u = slice / this.slices;
                const phi = u * Math.PI * 2.0;
                const x = ringRadius * Math.cos(phi);
                const z = ringRadius * Math.sin(phi);

                this.vertices.push(x, y, z);
                this.normals.push(-x, -y, -z);
                this.texCoords.push(1.0 - u, 1.0 - v);
            }
        }

        const stride = this.slices + 1;
        for (let stack = 0; stack < this.stacks; stack++) {
            for (let slice = 0; slice < this.slices; slice++) {
                const current = stack * stride + slice;
                const next = current + stride;

                // Reversed winding so triangles face inward.
                this.indices.push(current, next + 1, next);
                this.indices.push(current, current + 1, next + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
