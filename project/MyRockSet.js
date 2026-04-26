import { CGFappearance, CGFtexture } from "../lib/CGF.js";
import { MyRock } from "./MyRock.js";

/**
 * Procedural scatter system for rocks.
 *
 * Generates a configurable number of rock instances with:
 *  - Random world positions (via seeded noise)
 *  - Random scale, rotation, and shape (via seed-based perturbation)
 *  - Multiple textures for visual variety
 *  - Correct placement on terrain using getTerrainHeight()
 */
export class MyRockSet {
    /**
     * @param {CGFscene} scene
     * @param {MyTerrain} terrain      Terrain reference for height queries
     * @param {number}    count        Number of rocks to scatter
     * @param {number}    areaRadius   Scatter area radius from origin
     * @param {number}    seed         Master seed for placement
     */
    constructor(scene, terrain, count = 30, areaRadius = 200, seed = 123) {
        this.scene = scene;
        this.terrain = terrain;
        this.count = count;
        this.areaRadius = areaRadius;
        this.seed = seed;

        // Pre-generate a set of rock geometries (reuse shapes)
        this.rockShapes = [];
        const numShapes = 5;
        for (let i = 0; i < numShapes; i++) {
            const slices = 10 + Math.floor(this._seededRandom(i * 3) * 6);
            const stacks = 6 + Math.floor(this._seededRandom(i * 3 + 1) * 4);
            const perturbation = 0.15 + this._seededRandom(i * 3 + 2) * 0.25;
            this.rockShapes.push(new MyRock(scene, slices, stacks, i * 17, perturbation));
        }

        // Load multiple rock textures
        this.rockTextures = [
            new CGFtexture(scene, "textures/rock1.png"),
            new CGFtexture(scene, "textures/rock2.png"),
        ];

        // Rock material
        this.rockAppearance = new CGFappearance(scene);
        this.rockAppearance.setAmbient(0.4, 0.4, 0.4, 1.0);
        this.rockAppearance.setDiffuse(0.7, 0.7, 0.7, 1.0);
        this.rockAppearance.setSpecular(0.15, 0.15, 0.15, 1.0);
        this.rockAppearance.setShininess(16.0);

        // Generate placement data
        this.placements = this._generatePlacements();
    }

    /**
     * Seeded pseudo-random number in [0, 1).
     */
    _seededRandom(index) {
        let h = (index * 374761393 + this.seed * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    /**
     * Generate positions, scales, rotations, shape and texture indices.
     */
    _generatePlacements() {
        const placements = [];

        for (let i = 0; i < this.count; i++) {
            // Random position within circular area
            const angle = this._seededRandom(i * 5) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(i * 5 + 1)) * this.areaRadius * 0.85;
            const worldX = Math.cos(angle) * dist;
            const worldZ = Math.sin(angle) * dist;

            // Get terrain height at this position
            const worldY = this.terrain.getTerrainHeight(worldX, worldZ);

            // Random scale (rocks vary in size)
            const baseScale = 0.8 + this._seededRandom(i * 5 + 2) * 2.5;
            const scaleX = baseScale * (0.8 + this._seededRandom(i * 7) * 0.4);
            const scaleY = baseScale * (0.5 + this._seededRandom(i * 7 + 1) * 0.4);
            const scaleZ = baseScale * (0.8 + this._seededRandom(i * 7 + 2) * 0.4);

            // Random Y rotation
            const rotY = this._seededRandom(i * 5 + 3) * Math.PI * 2;

            // Pick a shape and texture
            const shapeIdx = Math.floor(this._seededRandom(i * 5 + 4) * this.rockShapes.length);
            const texIdx = Math.floor(this._seededRandom(i * 11) * this.rockTextures.length);

            placements.push({
                x: worldX, y: worldY, z: worldZ,
                scaleX, scaleY, scaleZ,
                rotY,
                shapeIdx,
                texIdx
            });
        }

        return placements;
    }

    display() {
        // Disable culling — vertex perturbation can flip triangle winding
        this.scene.gl.disable(this.scene.gl.CULL_FACE);

        for (const rock of this.placements) {
            this.scene.pushMatrix();

            // Position on terrain (sink slightly into the ground)
            this.scene.translate(rock.x, rock.y - rock.scaleY * 0.3, rock.z);
            this.scene.rotate(rock.rotY, 0, 1, 0);
            this.scene.scale(rock.scaleX, rock.scaleY, rock.scaleZ);

            // Apply texture
            this.rockAppearance.setTexture(this.rockTextures[rock.texIdx]);
            this.rockAppearance.apply();

            this.rockShapes[rock.shapeIdx].display();

            this.scene.popMatrix();
        }

        this.scene.gl.enable(this.scene.gl.CULL_FACE);
    }
}
