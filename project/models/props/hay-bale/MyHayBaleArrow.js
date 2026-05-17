import { CGFobject, CGFappearance } from '../../../../lib/CGF.js';

export class MyHayBaleArrow extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.9, 0.7, 0.1, 1.0);
        this.material.setDiffuse(1.0, 0.85, 0.25, 1.0);
        this.material.setSpecular(1.0, 1.0, 0.6, 1.0);
        this.material.setShininess(40.0);
        // emissive so it stays visible at night
        this.material.setEmission(0.35, 0.25, 0.05, 1.0);
    }

    initBuffers() {
        const h = 1.2;
        const w = 0.45;

        this.vertices = [];
        this.normals = [];
        this.indices = [];
        this.texCoords = [];

        // apex at origin, square base at y=+h
        const corners = [
            [-w, h, -w],
            [ w, h, -w],
            [ w, h,  w],
            [-w, h,  w]
        ];

        const sides = [[0, 1], [1, 2], [2, 3], [3, 0]];
        for (const [a, b] of sides) {
            const ca = corners[a];
            const cb = corners[b];
            // apex is the origin, so corner vectors double as edge vectors
            const nx = ca[1] * cb[2] - ca[2] * cb[1];
            const ny = ca[2] * cb[0] - ca[0] * cb[2];
            const nz = ca[0] * cb[1] - ca[1] * cb[0];
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            const n = [nx / len, ny / len, nz / len];

            const idx = this.vertices.length / 3;
            this.vertices.push(0, 0, 0, ca[0], ca[1], ca[2], cb[0], cb[1], cb[2]);
            this.normals.push(...n, ...n, ...n);
            this.texCoords.push(0.5, 1, 0, 0, 1, 0);
            this.indices.push(idx, idx + 1, idx + 2);
        }

        // top cap so the pyramid looks solid from above
        const baseIdx = this.vertices.length / 3;
        for (const c of corners) this.vertices.push(c[0], c[1], c[2]);
        for (let i = 0; i < 4; i++) this.normals.push(0, 1, 0);
        this.texCoords.push(0, 0, 1, 0, 1, 1, 0, 1);
        this.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
