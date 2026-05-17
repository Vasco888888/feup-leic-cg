import { CGFappearance, CGFshader, CGFtexture } from "../../../lib/CGF.js";
import { MyGrassPatch } from "./MyGrassPatch.js";

/**
 * Scatters dense green and dry wheat grass patches with a shared wind shader.
 */
export class MyGrassSet {
    constructor(scene, terrain, denseCount = 40, deadCount = 15, areaRadius = 190, seed = 456) {
        this.scene = scene;
        this.terrain = terrain;
        this.areaRadius = areaRadius;
        this.seed = seed;

        this.grassShader = new CGFshader(
            scene.gl,
            "shaders/grass.vert",
            "shaders/grass.frag"
        );

        // grass freely overlaps rocks and flowers, it just sprouts everywhere
        this.obstacles = [];

        this.grassShader.setUniformsValues({
            uTime: 0,
            uWindStrength: 0.6,
            uGrassColor: [0.28, 0.45, 0.12],
            uIsDead: 0,
            uSunInfluence: 1.0,
            uPatchPos: [0, 0, 0],
            uRotY: 0,
            uScale: [1, 1]
        });

        // shader supplies the colour, so no texture is bound
        this.grassAppearance = new CGFappearance(scene);
        this.grassAppearance.setAmbient(0.3, 0.5, 0.2, 1);
        this.grassAppearance.setDiffuse(0.4, 0.6, 0.25, 1);
        this.grassAppearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.grassAppearance.setShininess(5);

        this.patchPool = [];
        const poolSize = 6;
        for (let i = 0; i < poolSize; i++) {
            // keep patches small so they hug rolling hills
            const radius = 2.6 + this._seededRandom(i * 2 + 1) * 2.4;
            const area = Math.PI * radius * radius;
            const bladeCount = Math.floor(area * 7.0);
            this.patchPool.push(new MyGrassPatch(scene, bladeCount, radius, seed + i * 37));
        }

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
        let attempts = 0;
        const maxAttempts = count * 100;
        const offset = isDead ? 10000 : 0;

        while (placements.length < count && attempts < maxAttempts) {
            const idx = attempts + offset;
            attempts++;

            const angle = this._seededRandom(idx * 3) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(idx * 3 + 1)) * this.areaRadius * 0.85;
            const worldX = Math.cos(angle) * dist;
            const worldZ = Math.sin(angle) * dist;

            // mirror the dirt path mask from terrain.frag so grass keeps off the roads
            const terrainSize = 1200;
            const TWO_PI = 6.2831;
            const u = worldX / terrainSize + 0.5;
            const v = worldZ / terrainSize + 0.5;

            const c1 = 0.5
                + 0.18 * Math.sin(v * TWO_PI * 1.2 + 0.8)
                + 0.08 * Math.sin(v * TWO_PI * 2.7 + 2.1);
            const d1 = Math.abs(u - c1);

            const c2 = 0.5
                + 0.16 * Math.sin(u * TWO_PI * 1.0 + 1.6)
                + 0.07 * Math.sin(u * TWO_PI * 2.4 + 4.3);
            const d2 = Math.abs(v - c2);

            const c3 = 0.32 + 0.12 * Math.sin(v * TWO_PI * 1.6 + 2.4);
            let spurGate = 0.0;
            if (v > 0.28) spurGate = Math.min(1.0, (v - 0.28) / 0.12);
            if (v > 0.62) spurGate *= Math.max(0.0, 1.0 - (v - 0.62) / 0.16);
            const d3 = spurGate > 0.0 ? Math.abs(u - c3) : 1.0;

            const pathHalfWidth = 0.034;
            if (Math.min(d1, Math.min(d2, d3)) < pathHalfWidth) continue;

            // split the field into green/wheat zones with a thin buffer between them
            const zone = Math.sin(worldX * 0.03) * Math.cos(worldZ * 0.03);
            if (isDead && zone < 0.55) continue;
            if (!isDead && zone > 0.45) continue;

            const worldY = this.terrain.getTerrainHeight(worldX, worldZ);
            const patchIdx = Math.floor(this._seededRandom(idx * 3 + 2) * this.patchPool.length);

            // scaleZ = 1/scaleX preserves patch area while breaking the circular outline
            const rotY = this._seededRandom(idx * 3 + 3) * Math.PI * 2;
            const scaleX = 0.5 + this._seededRandom(idx * 3 + 4) * 1.5;
            const scaleZ = 1.0 / scaleX;

            placements.push({
                x: worldX, y: worldY, z: worldZ,
                patchIdx, rotY, scaleX, scaleZ
            });
        }

        return placements;
    }

    _collidesWithObstacles(x, z) {
        for (const o of this.obstacles) {
            const dx = x - o.x;
            const dz = z - o.z;
            if (dx * dx + dz * dz < o.r * o.r) return true;
        }
        return false;
    }

    update(t, sunInfluence = 1.0) {
        // modulo keeps the GLSL float from losing precision over long runs
        this.time = (t / 1000.0) % 10000.0;
        this.sunInfluence = sunInfluence;
    }

    display() {
        const scene = this.scene;

        scene.setActiveShader(this.grassShader);
        this.grassAppearance.apply();

        // grass blades are double-sided
        scene.gl.disable(scene.gl.CULL_FACE);

        this.grassShader.setUniformsValues({
            uTime: this.time || 0,
            uSunInfluence: this.sunInfluence !== undefined ? this.sunInfluence : 1.0,
            uWindStrength: 0.6,
            uGrassColor: [0.28, 0.45, 0.12],
            uIsDead: 0
        });

        // render grass in front of the camera up to a long distance, skip everything
        // behind us; gives the field depth without paying for unseen patches
        const cam = scene.camera;
        const camX = cam ? cam.position[0] : 0;
        const camZ = cam ? cam.position[2] : 0;
        let fX = 0;
        let fZ = -1;
        if (cam) {
            fX = cam.target[0] - cam.position[0];
            fZ = cam.target[2] - cam.position[2];
            const fLen = Math.hypot(fX, fZ);
            if (fLen > 1e-3) { fX /= fLen; fZ /= fLen; }
        }
        const renderDist = 95;
        const renderDistSq = renderDist * renderDist;
        // slight tolerance so patches just behind the camera (peripheral vision) still show
        const behindThreshold = -0.2;

        for (const p of this.densePlacements) {
            const dx = p.x - camX;
            const dz = p.z - camZ;
            const distSq = dx * dx + dz * dz;
            if (distSq > renderDistSq) continue;
            if (distSq > 25 && (dx * fX + dz * fZ) / Math.sqrt(distSq) < behindThreshold) continue;
            scene.pushMatrix();
            scene.translate(p.x, p.y, p.z);
            scene.rotate(p.rotY, 0, 1, 0);
            scene.scale(p.scaleX, 1.0, p.scaleZ);
            this.grassShader.setUniformsValues({
                uPatchPos: [p.x, p.y, p.z],
                uRotY: p.rotY,
                uScale: [p.scaleX, p.scaleZ]
            });
            this.patchPool[p.patchIdx].display();
            scene.popMatrix();
        }

        this.grassShader.setUniformsValues({
            uTime: this.time || 0,
            uSunInfluence: this.sunInfluence !== undefined ? this.sunInfluence : 1.0,
            uWindStrength: 0.6,
            uGrassColor: [0.85, 0.75, 0.35],
            uIsDead: 1
        });

        for (const p of this.deadPlacements) {
            const dx = p.x - camX;
            const dz = p.z - camZ;
            const distSq = dx * dx + dz * dz;
            if (distSq > renderDistSq) continue;
            if (distSq > 25 && (dx * fX + dz * fZ) / Math.sqrt(distSq) < behindThreshold) continue;
            scene.pushMatrix();
            scene.translate(p.x, p.y, p.z);
            scene.rotate(p.rotY, 0, 1, 0);
            scene.scale(p.scaleX, 1.0, p.scaleZ);
            this.grassShader.setUniformsValues({ 
                uPatchPos: [p.x, p.y, p.z],
                uRotY: p.rotY,
                uScale: [p.scaleX, p.scaleZ]
            });
            this.patchPool[p.patchIdx].display();
            scene.popMatrix();
        }

        scene.gl.enable(scene.gl.CULL_FACE);
        scene.setActiveShader(scene.defaultShader);
    }
}
