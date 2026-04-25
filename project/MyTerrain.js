import { CGFobject } from "../lib/CGF.js";

/**
 * Procedurally-generated terrain mesh with rolling-hill elevation.
 *
 * A subdivided XZ grid whose vertex Y values come from multi-octave
 * value noise, producing subtle prairie hills.  Normals are computed
 * analytically via central differences so the lighting is smooth.
 *
 * Exposes getTerrainHeight(worldX, worldZ) for placing objects later.
 */
export class MyTerrain extends CGFobject {
    /**
     * @param {CGFscene} scene
     * @param {number}   divisions  Grid resolution (e.g. 128)
     * @param {number}   size       World-unit extent of the terrain
     * @param {number}   maxHeight  Maximum hill elevation
     * @param {number}   seed       Noise seed for reproducibility
     */
    constructor(scene, divisions = 128, size = 400, maxHeight = 12, seed = 42) {
        super(scene);

        this.divisions = divisions;
        this.size = size;
        this.maxHeight = maxHeight;
        this.seed = seed;

        // Noise parameters
        this.octaves = 4;
        this.persistence = 0.45;
        this.lacunarity = 2.2;
        this.baseFrequency = 2.0; // how "wide" the hills are

        // 2-D height cache (divisions+1) × (divisions+1)
        this.heightData = [];

        this.initBuffers();
    }

    // ────────────────── Noise helpers ──────────────────

    /**
     * Simple deterministic hash  → pseudo-random in [0, 1).
     */
    _hash(x, y) {
        let h = (x * 374761393 + y * 668265263 + this.seed) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    /**
     * Smoothly interpolated 2-D value noise.
     */
    _noise2D(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;

        // Smoothstep (Hermite)
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

    /**
     * Fractal Brownian Motion (multi-octave noise).
     * Returns a value roughly in [0, 1].
     */
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

        return value / maxAmp; // normalise to ~[0,1]
    }


}

function smoothstepJS(e0,e1,x){const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);}
