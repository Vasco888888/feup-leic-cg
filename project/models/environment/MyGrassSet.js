import { CGFappearance, CGFshader, CGFtexture } from "../../../lib/CGF.js";
import { MyGrassPatch } from "./MyGrassPatch.js";

/**
 * Scatters grass patches across the terrain.
 *
 * Manages two types:
 *  - Dense green grass patches
 *  - Dead/dry yellowish grass patches
 *
 * Uses a wind shader for animation.
 */
export class MyGrassSet {
    constructor(scene, terrain, denseCount = 40, deadCount = 15, areaRadius = 190, seed = 456) {
        this.scene = scene;
        this.terrain = terrain;
        this.areaRadius = areaRadius;
        this.seed = seed;

        // Create grass shader with wind animation
        this.grassShader = new CGFshader(
            scene.gl,
            "shaders/grass.vert",
            "shaders/grass.frag"
        );
        this.grassShader.setUniformsValues({
            uTime: 0,
            uWindStrength: 0.6,
            uGrassColor: [0.45, 0.65, 0.10],
            uIsDead: 0,
            uSunInfluence: 1.0
        });

        // Grass appearance (no texture needed — shader colours it)
        this.grassAppearance = new CGFappearance(scene);
        this.grassAppearance.setAmbient(0.3, 0.5, 0.2, 1);
        this.grassAppearance.setDiffuse(0.4, 0.6, 0.25, 1);
        this.grassAppearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.grassAppearance.setShininess(5);

        this.patchPool = [];
        const poolSize = 6;
        for (let i = 0; i < poolSize; i++) {
            // Making patches significantly bigger and denser
            const bladeCount = 300 + Math.floor(this._seededRandom(i * 2) * 400);
            const radius = 10.0 + this._seededRandom(i * 2 + 1) * 15.0;
            this.patchPool.push(new MyGrassPatch(scene, bladeCount, radius, seed + i * 37));
        }

        // Generate placements
        this.densePlacements = this._generatePlacements(denseCount, false);
        this.deadPlacements = this._generatePlacements(deadCount, true);
    }

    /**
     * Generates a deterministic pseudo-random number in [0, 1] from an integer index.
     * Uses large prime numbers to mix the bits and avoid repeating patterns.
     * Same seed + same index always gives the same result (reproducible).
     */
    _seededRandom(index) {
        // Combine index and seed using large primes to spread values apart
        let h = (index * 374761393 + this.seed * 668265263) | 0;
        // XOR-shift: mix the high bits into the low bits for better distribution
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        // Convert to a float in [0, 1] by masking to positive and dividing
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    _generatePlacements(count, isDead) {
        const placements = [];
        const offset = isDead ? 10000 : 0;

        for (let i = 0; i < count; i++) {
            const idx = i + offset;
            const angle = this._seededRandom(idx * 3) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(idx * 3 + 1)) * this.areaRadius * 0.85;
            const worldX = Math.cos(angle) * dist;
            const worldZ = Math.sin(angle) * dist;

            // Skip if on the dirt path (same curve used in terrain.frag)
            const terrainSize = 520;
            const TWO_PI = 6.2831;

            // Convert world position to [0,1] UV coordinates
            const u = worldX / terrainSize + 0.5;
            const v = worldZ / terrainSize + 0.5;

            // Path follows two sine waves: a wide curve + a smaller wobble
            const mainCurveAmplitude = 0.18;
            const mainCurveFrequency = 1.2;
            const wobbleAmplitude = 0.08;
            const wobbleFrequency = 2.7;

            const pathCentreX = 0.5
                + mainCurveAmplitude * Math.sin(v * TWO_PI * mainCurveFrequency + 0.8)
                + wobbleAmplitude    * Math.sin(v * TWO_PI * wobbleFrequency + 2.1);

            const pathHalfWidth = 0.035;
            if (Math.abs(u - pathCentreX) < pathHalfWidth) continue;

            const worldY = this.terrain.getTerrainHeight(worldX, worldZ);
            const patchIdx = Math.floor(this._seededRandom(idx * 3 + 2) * this.patchPool.length);

            // Irregular scaling and rotation to break the circular shape
            const rotY = this._seededRandom(idx * 3 + 3) * Math.PI * 2;
            const scaleX = 0.6 + this._seededRandom(idx * 3 + 4) * 1.5; // Stretch randomly
            const scaleZ = 0.6 + this._seededRandom(idx * 3 + 5) * 1.5;

            placements.push({
                x: worldX, y: worldY, z: worldZ,
                patchIdx, rotY, scaleX, scaleZ
            });
        }

        return placements;
    }

    update(t, sunInfluence = 1.0) {
        this.time = (t / 1000.0) % 10000.0; // Modulo prevents GLSL float precision loss
        this.sunInfluence = sunInfluence;
    }

    display() {
        const scene = this.scene;

        scene.setActiveShader(this.grassShader);
        this.grassAppearance.apply();

        // Disable face culling for grass (visible from both sides)
        scene.gl.disable(scene.gl.CULL_FACE);

        // ── Dense green patches ──
        this.grassShader.setUniformsValues({
            uTime: this.time || 0,
            uSunInfluence: this.sunInfluence !== undefined ? this.sunInfluence : 1.0,
            uWindStrength: 0.6,
            uGrassColor: [0.45, 0.65, 0.10],
            uIsDead: 0
        });

        for (const p of this.densePlacements) {
            scene.pushMatrix();
            scene.translate(p.x, p.y, p.z);
            scene.rotate(p.rotY, 0, 1, 0);
            scene.scale(p.scaleX, 1.0, p.scaleZ);
            this.patchPool[p.patchIdx].display();
            scene.popMatrix();
        }

        // ── Dead/dry patches ──
        this.grassShader.setUniformsValues({
            uTime: this.time || 0,
            uSunInfluence: this.sunInfluence !== undefined ? this.sunInfluence : 1.0,
            uWindStrength: 0.6,
            uGrassColor: [0.85, 0.75, 0.35], // Golden wheat color
            uIsDead: 1
        });

        for (const p of this.deadPlacements) {
            scene.pushMatrix();
            scene.translate(p.x, p.y, p.z);
            scene.rotate(p.rotY, 0, 1, 0);
            scene.scale(p.scaleX, 1.0, p.scaleZ);
            this.patchPool[p.patchIdx].display();
            scene.popMatrix();
        }

        scene.gl.enable(scene.gl.CULL_FACE);
        scene.setActiveShader(scene.defaultShader);
    }
}
