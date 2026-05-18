import { CGFobject } from "../../../lib/CGF.js";

/**
 * Angular rock built from a (optionally subdivided) icosahedron with per-vertex
 * fbm displacement. Triangles are emitted with flat shading so each face reads
 * as its own planar facet — giving the rocks a chunky, faceted look.
 */
export class MyRock extends CGFobject {
    constructor(scene, subdivisions = 1, seed = 0, perturbation = 0.35) {
        super(scene);
        this.subdivisions = subdivisions;
        this.seed = seed;
        this.perturbation = perturbation;
        this.initBuffers();
    }

    _hash(x, y) {
        let h = (x * 374761393 + y * 668265263 + this.seed * 1013) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    _noise2D(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);

        const n00 = this._hash(ix, iy);
        const n10 = this._hash(ix + 1, iy);
        const n01 = this._hash(ix, iy + 1);
        const n11 = this._hash(ix + 1, iy + 1);

        const nx0 = n00 + (n10 - n00) * sx;
        const nx1 = n01 + (n11 - n01) * sx;
        return nx0 + (nx1 - nx0) * sy;
    }

    _fbm(x, y) {
        let value = 0, amp = 1, freq = 2.0, maxAmp = 0;
        for (let i = 0; i < 3; i++) {
            value += this._noise2D(x * freq, y * freq) * amp;
            maxAmp += amp;
            amp *= 0.5;
            freq *= 2.0;
        }
        return value / maxAmp;
    }

    _icosahedron() {
        const t = (1 + Math.sqrt(5)) / 2;
        const verts = [
            [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
            [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
            [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1],
        ];
        for (const v of verts) {
            const l = Math.hypot(v[0], v[1], v[2]);
            v[0] /= l; v[1] /= l; v[2] /= l;
        }
        const faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
        ];
        return { verts, faces };
    }

    _subdivide(verts, faces) {
        const out = [];
        const cache = new Map();
        const midpoint = (a, b) => {
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;
            if (cache.has(key)) return cache.get(key);
            const va = verts[a], vb = verts[b];
            const m = [(va[0] + vb[0]) * 0.5, (va[1] + vb[1]) * 0.5, (va[2] + vb[2]) * 0.5];
            const l = Math.hypot(m[0], m[1], m[2]);
            m[0] /= l; m[1] /= l; m[2] /= l;
            const idx = verts.length;
            verts.push(m);
            cache.set(key, idx);
            return idx;
        };
        for (const [a, b, c] of faces) {
            const ab = midpoint(a, b);
            const bc = midpoint(b, c);
            const ca = midpoint(c, a);
            out.push([a, ab, ca]);
            out.push([b, bc, ab]);
            out.push([c, ca, bc]);
            out.push([ab, bc, ca]);
        }
        return out;
    }

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        let { verts, faces } = this._icosahedron();
        for (let i = 0; i < this.subdivisions; i++) {
            faces = this._subdivide(verts, faces);
        }

        // squash on Y so rocks read as flat-bottomed boulders, not crystals
        const flattenY = 0.55 + this._hash(this.seed, this.seed + 7) * 0.3;

        // displace each unique vertex once so shared edges stay sealed
        const displaced = verts.map((v) => {
            const n1 = this._fbm(v[0] * 1.4 + this.seed, v[2] * 1.4);
            const n2 = this._fbm(v[1] * 1.4 + this.seed + 5, v[0] * 1.4 - 2);
            const n = (n1 + n2) * 0.5;
            const d = 1.0 + (n - 0.5) * 2.0 * this.perturbation;
            return [v[0] * d, v[1] * d * flattenY, v[2] * d];
        });

        // flat-shaded: each triangle gets its own 3 verts and one shared normal
        let idx = 0;
        for (const [a, b, c] of faces) {
            const pa = displaced[a], pb = displaced[b], pc = displaced[c];

            const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2];
            const vx = pc[0] - pa[0], vy = pc[1] - pa[1], vz = pc[2] - pa[2];
            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;
            const nl = Math.hypot(nx, ny, nz) || 1;
            nx /= nl; ny /= nl; nz /= nl;

            // planar UVs from the face's dominant axis — keeps the texture undistorted per facet
            const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
            const uvOf = (p) => {
                if (ay >= ax && ay >= az) return [p[0] * 0.5 + 0.5, p[2] * 0.5 + 0.5];
                if (ax >= az)             return [p[2] * 0.5 + 0.5, p[1] * 0.5 + 0.5];
                return [p[0] * 0.5 + 0.5, p[1] * 0.5 + 0.5];
            };
            const ua = uvOf(pa), ub = uvOf(pb), uc = uvOf(pc);

            this.vertices.push(
                pa[0], pa[1], pa[2],
                pb[0], pb[1], pb[2],
                pc[0], pc[1], pc[2],
            );
            this.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
            this.texCoords.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
            this.indices.push(idx, idx + 1, idx + 2);
            idx += 3;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
