import { CGFobject } from "../../../lib/CGF.js";

/**
 * Sphere with seeded fbm vertex displacement that gives each rock a unique shape.
 */
export class MyRock extends CGFobject {
    constructor(scene, slices = 12, stacks = 8, seed = 0, perturbation = 0.25) {
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
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

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        for (let stack = 0; stack <= this.stacks; stack++) {
            const v = stack / this.stacks;
            const theta = v * Math.PI;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            for (let slice = 0; slice <= this.slices; slice++) {
                const u = slice / this.slices;
                const phi = u * 2 * Math.PI;
                const cosPhi = Math.cos(phi);
                const sinPhi = Math.sin(phi);

                let nx = sinTheta * cosPhi;
                let ny = cosTheta;
                let nz = sinTheta * sinPhi;

                const noiseVal = this._fbm(u * 5 + this.seed, v * 5);
                const displacement = 1.0 + (noiseVal - 0.5) * 2.0 * this.perturbation;

                // squash y so rocks read as boulders rather than spheres
                const flattenY = 0.6 + this._hash(this.seed, this.seed + 7) * 0.3;

                const x = nx * displacement;
                const y = ny * displacement * flattenY;
                const z = nz * displacement;

                this.vertices.push(x, y, z);

                // sphere normal is close enough once displacement is small
                this.normals.push(nx, ny, nz);

                this.texCoords.push(u, v);
            }
        }

        for (let stack = 0; stack < this.stacks; stack++) {
            for (let slice = 0; slice < this.slices; slice++) {
                const first = stack * (this.slices + 1) + slice;
                const second = first + this.slices + 1;

                this.indices.push(first, second, first + 1);
                this.indices.push(second, second + 1, first + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
