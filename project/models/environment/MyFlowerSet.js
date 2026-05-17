import { CGFappearance, CGFtexture } from "../../../lib/CGF.js";
import { MyFlower } from "./MyFlower.js";

/**
 * Procedural flower scatter system.
 *
 * Generates flowers across the terrain with randomised parameters:
 *  - Petal count, length, width
 *  - Stem height
 *  - Petal and centre colours
 *  - Position, rotation, scale
 */
export class MyFlowerSet {
    /**
     * @param {CGFscene} scene
     * @param {MyTerrain} terrain    Terrain for height queries
     * @param {number}    count      Number of flowers
     * @param {number}    areaRadius Scatter radius
     * @param {number}    seed       Master seed
     */
    constructor(scene, terrain, count = 50, areaRadius = 190, seed = 777) {
        this.scene = scene;
        this.terrain = terrain;
        this.count = count;
        this.areaRadius = areaRadius;
        this.seed = seed;

        // Pre-defined petal colour palette (prairie wildflowers)
        this.petalPalette = [
            [1.0, 0.55, 0.70],   // pink
            [0.95, 0.90, 0.35],  // yellow
            [0.85, 0.50, 0.85],  // purple/lilac
            [1.0, 1.0, 1.0],    // white
            [1.0, 0.65, 0.30],   // orange
            [0.70, 0.55, 0.90],  // lavender
        ];

        this.centrePalette = [
            [1.0, 0.85, 0.20],   // golden
            [0.55, 0.35, 0.15],  // brown
            [0.90, 0.90, 0.50],  // light yellow
        ];

        // Generate unique flower shapes (reuse a few)
        this.flowerShapes = [];
        this.placements = [];

        this._generateFlowers();

        // Appearances for petals and stems
        this.petalTexture = new CGFtexture(scene, "textures/environment/flora/petal.png");

        this.petalAppearance = new CGFappearance(scene);
        this.petalAppearance.setTexture(this.petalTexture);
        this.petalAppearance.setTextureWrap('CLAMP_TO_EDGE', 'CLAMP_TO_EDGE');
        this.petalAppearance.setSpecular(0.1, 0.1, 0.1, 1);
        this.petalAppearance.setShininess(5);

        this.stemAppearance = new CGFappearance(scene);
        this.stemAppearance.setAmbient(0.15, 0.35, 0.10, 1);
        this.stemAppearance.setDiffuse(0.20, 0.50, 0.15, 1);
        this.stemAppearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.stemAppearance.setShininess(5);

        this.centreAppearance = new CGFappearance(scene);
        this.centreAppearance.setSpecular(0.1, 0.1, 0.1, 1);
        this.centreAppearance.setShininess(8);
    }

    _seededRandom(index) {
        let h = (index * 374761393 + this.seed * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    _generateFlowers() {
        // Create a pool of flower shapes
        const numShapes = 8;
        for (let i = 0; i < numShapes; i++) {
            const petalCount = 4 + Math.floor(this._seededRandom(i * 10) * 7); // 4–10
            const petalLength = 0.3 + this._seededRandom(i * 10 + 1) * 0.5;
            const petalWidth = 0.12 + this._seededRandom(i * 10 + 2) * 0.2;
            const stemHeight = 0.6 + this._seededRandom(i * 10 + 3) * 1.2;
            const stemRadius = 0.02 + this._seededRandom(i * 10 + 4) * 0.03;
            const receptacleRadius = 0.08 + this._seededRandom(i * 10 + 5) * 0.1;

            const petalColorIdx = Math.floor(this._seededRandom(i * 10 + 6) * this.petalPalette.length);
            const centreColorIdx = Math.floor(this._seededRandom(i * 10 + 7) * this.centrePalette.length);

            this.flowerShapes.push({
                flower: new MyFlower(
                    this.scene, petalCount, petalLength, petalWidth,
                    stemHeight, stemRadius, receptacleRadius,
                    this.petalPalette[petalColorIdx],
                    this.centrePalette[centreColorIdx]
                ),
                petalColor: this.petalPalette[petalColorIdx],
                centreColor: this.centrePalette[centreColorIdx]
            });
        }

        // Collect rock obstacles to avoid placing flowers inside rocks
        const obstacles = [];
        if (this.scene.rockSet) {
            for (const r of this.scene.rockSet.placements) {
                obstacles.push({
                    x: r.x, z: r.z,
                    r: Math.max(r.scaleX, r.scaleZ) * 1.1 + 0.3
                });
            }
        }

        // Generate placements with retry so we can skip spots that overlap rocks
        let attempts = 0;
        const maxAttempts = this.count * 60;
        while (this.placements.length < this.count && attempts < maxAttempts) {
            const i = attempts;
            attempts++;

            const angle = this._seededRandom(i * 4) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(i * 4 + 1)) * this.areaRadius * 0.85;
            const worldX = Math.cos(angle) * dist;
            const worldZ = Math.sin(angle) * dist;

            const scale = 0.6 + this._seededRandom(i * 4 + 2) * 1.0;
            const flowerRadius = scale * 0.5;

            if (this._collidesWithObstacles(worldX, worldZ, flowerRadius, obstacles)) continue;

            const worldY = this.terrain.getTerrainHeight(worldX, worldZ);
            const rotY = this._seededRandom(i * 4 + 3) * Math.PI * 2;
            const shapeIdx = Math.floor(this._seededRandom(i * 13) * this.flowerShapes.length);

            this.placements.push({
                x: worldX, y: worldY, z: worldZ,
                scale, rotY, shapeIdx
            });
        }
    }

    _collidesWithObstacles(x, z, padding, obstacles) {
        for (const o of obstacles) {
            const dx = x - o.x;
            const dz = z - o.z;
            const minDist = o.r + padding;
            if (dx * dx + dz * dz < minDist * minDist) return true;
        }
        return false;
    }

    display() {
        for (const p of this.placements) {
            const shape = this.flowerShapes[p.shapeIdx];

            this.scene.pushMatrix();
            this.scene.translate(p.x, p.y, p.z);
            this.scene.rotate(p.rotY, 0, 1, 0);
            this.scene.scale(p.scale, p.scale, p.scale);

            // Apply stem colour
            this.stemAppearance.apply();

            // Display the flower (stem + petals + centre drawn internally)
            // We set petal/centre colours via appearance before each part
            this._displayFlowerWithColors(shape);

            this.scene.popMatrix();
        }
    }

    _displayFlowerWithColors(shape) {
        const scene = this.scene;
        const flower = shape.flower;

        // Stem (green)
        this.stemAppearance.apply();
        scene.pushMatrix();
        flower.stemGeom.display();
        scene.popMatrix();

        // Flower head
        scene.pushMatrix();
        scene.translate(0, flower.stemHeight, 0);
        scene.rotate(-Math.PI / 8, 1, 0, 0);

        // Petals
        scene.gl.disable(scene.gl.CULL_FACE);
        this.petalAppearance.setAmbient(...shape.petalColor, 1);
        this.petalAppearance.setDiffuse(...shape.petalColor, 1);
        this.petalAppearance.apply();

        const angleStep = (2 * Math.PI) / flower.petalCount;
        for (let i = 0; i < flower.petalCount; i++) {
            scene.pushMatrix();
            scene.rotate(i * angleStep, 0, 1, 0);
            scene.rotate(Math.PI / 6, 0, 0, 1);
            flower.petalGeom.display();
            scene.popMatrix();
        }
        scene.gl.enable(scene.gl.CULL_FACE);

        // Centre
        this.centreAppearance.setAmbient(...shape.centreColor, 1);
        this.centreAppearance.setDiffuse(...shape.centreColor, 1);
        this.centreAppearance.apply();
        scene.gl.disable(scene.gl.CULL_FACE);
        flower.receptacleGeom.display();
        scene.gl.enable(scene.gl.CULL_FACE);

        scene.popMatrix();
    }
}
