import { CGFobject } from "../../../lib/CGF.js";

/**
 * Subdivided XZ grid with fbm hills and analytic normals.
 * Exposes getTerrainHeight(worldX, worldZ) for placing objects on the surface.
 */
export class MyTerrain extends CGFobject {
    constructor(scene, divisions = 128, size = 400, maxHeight = 12, seed = 42) {
        super(scene);

        this.divisions = divisions;
        this.size = size;
        this.maxHeight = maxHeight;
        this.seed = seed;

        this.octaves = 4;
        this.persistence = 0.45;
        this.lacunarity = 2.2;
        this.baseFrequency = 2.0; // controls how wide the hills are

        this.heightData = [];

        this.initBuffers();
    }

    _hash(x, y) {
        let h = (x * 374761393 + y * 668265263 + this.seed) | 0;
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
        let value = 0;
        let amplitude = 1;
        let frequency = this.baseFrequency;
        let maxAmp = 0;

        for (let i = 0; i < this.octaves; i++) {
            value += this._noise2D(x * frequency, y * frequency) * amplitude;
            maxAmp += amplitude;
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return value / maxAmp;
    }

    _heightAtUV(u, v) {
        const h = this._fbm(u, v);

        const edgeFade = this._edgeFade(u, v);

        // recenter around 0 so the noise yields both hills and valleys
        const centered = (h - 0.5) * 2.0;

        // gently lift the border ring so deep valleys don't punch through the horizon
        const interiorHeight = centered * this.maxHeight * edgeFade;
        const borderLift = (1.0 - edgeFade) * (this.maxHeight * 0.10);
        return interiorHeight + borderLift;
    }

    _edgeFade(u, v) {
        const margin = 0.08;
        const fadeU = smoothstepJS(0, margin, u) * smoothstepJS(0, margin, 1 - u);
        const fadeV = smoothstepJS(0, margin, v) * smoothstepJS(0, margin, 1 - v);
        return fadeU * fadeV;
    }

    /**
     * Bilinearly samples the cached height grid at an arbitrary (worldX, worldZ).
     */
    getTerrainHeight(worldX, worldZ) {
        const u = (worldX / this.size) + 0.5;
        const v = (worldZ / this.size) + 0.5;

        const gx = u * this.divisions;
        const gz = v * this.divisions;

        const ix = Math.floor(gx);
        const iz = Math.floor(gz);

        const fx = gx - ix;
        const fz = gz - iz;

        const ix0 = Math.max(0, Math.min(ix, this.divisions));
        const ix1 = Math.max(0, Math.min(ix + 1, this.divisions));
        const iz0 = Math.max(0, Math.min(iz, this.divisions));
        const iz1 = Math.max(0, Math.min(iz + 1, this.divisions));

        const n = this.divisions + 1;
        const h00 = this.heightData[iz0 * n + ix0];
        const h10 = this.heightData[iz0 * n + ix1];
        const h01 = this.heightData[iz1 * n + ix0];
        const h11 = this.heightData[iz1 * n + ix1];

        const hx0 = h00 + (h10 - h00) * fx;
        const hx1 = h01 + (h11 - h01) * fx;

        return hx0 + (hx1 - hx0) * fz;
    }

    initBuffers() {
        const n = this.divisions + 1;
        const step = this.size / this.divisions;
        const halfSize = this.size / 2;

        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        this.heightData = new Float32Array(n * n);

        for (let iz = 0; iz < n; iz++) {
            for (let ix = 0; ix < n; ix++) {
                const u = ix / this.divisions;
                const v = iz / this.divisions;

                const worldX = -halfSize + ix * step;
                const worldZ = -halfSize + iz * step;
                const worldY = this._heightAtUV(u, v);

                this.heightData[iz * n + ix] = worldY;

                this.vertices.push(worldX, worldY, worldZ);
                this.texCoords.push(u, v);

                // placeholder, overwritten in the normals pass below
                this.normals.push(0, 1, 0);
            }
        }

        // central differences for smooth analytic normals
        const eps = 1.0 / this.divisions;
        for (let iz = 0; iz < n; iz++) {
            for (let ix = 0; ix < n; ix++) {
                const u = ix / this.divisions;
                const v = iz / this.divisions;

                const hL = this._heightAtUV(Math.max(u - eps, 0), v);
                const hR = this._heightAtUV(Math.min(u + eps, 1), v);
                const hD = this._heightAtUV(u, Math.max(v - eps, 0));
                const hU = this._heightAtUV(u, Math.min(v + eps, 1));

                const dx = 2 * step;
                const dz = 2 * step;

                // n = cross((dx, hR-hL, 0), (0, hU-hD, dz))
                let nx = -(hR - hL) * dz;
                let ny = dx * dz;
                let nz = -(hU - hD) * dx;

                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                nx /= len;
                ny /= len;
                nz /= len;

                const idx = (iz * n + ix) * 3;
                this.normals[idx] = nx;
                this.normals[idx + 1] = ny;
                this.normals[idx + 2] = nz;
            }
        }

        for (let iz = 0; iz < this.divisions; iz++) {
            for (let ix = 0; ix < this.divisions; ix++) {
                const topLeft = iz * n + ix;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + n;
                const bottomRight = bottomLeft + 1;

                this.indices.push(topLeft, bottomLeft, topRight);
                this.indices.push(topRight, bottomLeft, bottomRight);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    setFillMode() {
        this.primitiveType = this.scene.gl.TRIANGLES;
    }

    setLineMode() {
        this.primitiveType = this.scene.gl.LINES;
    }
}

// GLSL-style smoothstep
function smoothstepJS(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}
