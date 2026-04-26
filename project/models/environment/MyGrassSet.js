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
            uWindStrength: 0.15,
            uGrassColor: [0.25, 0.55, 0.15],
            uIsDead: 0,
            uSunInfluence: 1.0
        });

        // Grass appearance (no texture needed — shader colours it)
        this.grassAppearance = new CGFappearance(scene);
        this.grassAppearance.setAmbient(0.3, 0.5, 0.2, 1);
        this.grassAppearance.setDiffuse(0.4, 0.6, 0.25, 1);
        this.grassAppearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.grassAppearance.setShininess(5);

        // Pre-generate a pool of patch geometries
        this.patchPool = [];
        const poolSize = 6;
        for (let i = 0; i < poolSize; i++) {
            const bladeCount = 30 + Math.floor(this._seededRandom(i * 2) * 30);
            const radius = 2.0 + this._seededRandom(i * 2 + 1) * 3.0;
            this.patchPool.push(new MyGrassPatch(scene, bladeCount, radius, seed + i * 37));
        }

        // Generate placements
        this.densePlacements = this._generatePlacements(denseCount, false);
        this.deadPlacements = this._generatePlacements(deadCount, true);
    }

    _seededRandom(index) {
        let h = (index * 374761393 + this.seed * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
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
            const worldY = this.terrain.getTerrainHeight(worldX, worldZ);

            const patchIdx = Math.floor(this._seededRandom(idx * 3 + 2) * this.patchPool.length);

            placements.push({
                x: worldX, y: worldY, z: worldZ,
                patchIdx
            });
        }

        return placements;
    }

    update(t, sunInfluence = 1.0) {
        this.grassShader.setUniformsValues({
            uTime: t / 1000.0,
            uSunInfluence: sunInfluence
        });
    }

    display() {
        const scene = this.scene;

        scene.setActiveShader(this.grassShader);
        this.grassAppearance.apply();

        // Disable face culling for grass (visible from both sides)
        scene.gl.disable(scene.gl.CULL_FACE);

        // ── Dense green patches ──
        this.grassShader.setUniformsValues({
            uGrassColor: [0.25, 0.55, 0.15],
            uIsDead: 0
        });

        for (const p of this.densePlacements) {
            scene.pushMatrix();
            scene.translate(p.x, p.y, p.z);
            this.patchPool[p.patchIdx].display();
            scene.popMatrix();
        }

        // ── Dead/dry patches ──
        this.grassShader.setUniformsValues({
            uGrassColor: [0.55, 0.50, 0.25],
            uIsDead: 1
        });

        for (const p of this.deadPlacements) {
            scene.pushMatrix();
            scene.translate(p.x, p.y, p.z);
            this.patchPool[p.patchIdx].display();
            scene.popMatrix();
        }

        scene.gl.enable(scene.gl.CULL_FACE);
        scene.setActiveShader(scene.defaultShader);
    }
}
