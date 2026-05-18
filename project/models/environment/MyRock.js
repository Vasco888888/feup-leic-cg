import { CGFobject } from "../../../lib/CGF.js";

/**
 * Angular rock: icosahedron with per-vertex random displacement and flat
 * shading. Each of the 20 faces reads as its own planar facet.
 */
export class MyRock extends CGFobject {
    constructor(scene, seed = 0, perturbation = 0.35) {
        super(scene);
        this.seed = seed;
        this.perturbation = perturbation;
        this.initBuffers();
    }

    _rand(i) {
        let h = (i * 374761393 + this.seed * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) & 0x7fffffff) / 0x7fffffff;
    }

    initBuffers() {
        const t = (1 + Math.sqrt(5)) / 2;
        const baseVerts = [
            [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
            [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
            [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1],
        ].map((v) => {
            const l = Math.hypot(v[0], v[1], v[2]);
            return [v[0] / l, v[1] / l, v[2] / l];
        });
        const faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
        ];

        // squash on Y so rocks read as flat-bottomed boulders
        const flattenY = 0.55 + this._rand(7) * 0.3;

        // displace each unique vertex once so shared edges stay sealed
        const verts = baseVerts.map((v, i) => {
            const d = 1 + (this._rand(i + 1) - 0.5) * 2 * this.perturbation;
            return [v[0] * d, v[1] * d * flattenY, v[2] * d];
        });

        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        let idx = 0;
        for (const [a, b, c] of faces) {
            const pa = verts[a], pb = verts[b], pc = verts[c];

            // face normal from the displaced triangle edges
            const ex = pb[0] - pa[0], ey = pb[1] - pa[1], ez = pb[2] - pa[2];
            const fx = pc[0] - pa[0], fy = pc[1] - pa[1], fz = pc[2] - pa[2];
            let nx = ey * fz - ez * fy;
            let ny = ez * fx - ex * fz;
            let nz = ex * fy - ey * fx;
            const nl = Math.hypot(nx, ny, nz) || 1;
            nx /= nl; ny /= nl; nz /= nl;

            // planar UVs on the face's dominant axis — texture stays undistorted per facet
            const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
            const uv = (p) =>
                ay >= ax && ay >= az ? [p[0] * 0.5 + 0.5, p[2] * 0.5 + 0.5] :
                ax >= az              ? [p[2] * 0.5 + 0.5, p[1] * 0.5 + 0.5] :
                                        [p[0] * 0.5 + 0.5, p[1] * 0.5 + 0.5];

            for (const p of [pa, pb, pc]) {
                const [u, w] = uv(p);
                this.vertices.push(p[0], p[1], p[2]);
                this.normals.push(nx, ny, nz);
                this.texCoords.push(u, w);
            }
            this.indices.push(idx, idx + 1, idx + 2);
            idx += 3;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
