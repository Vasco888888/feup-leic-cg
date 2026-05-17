import { CGFappearance, CGFtexture } from "../../../lib/CGF.js";
import { MyRock } from "./MyRock.js";

/**
 * Procedural rock scatter system; varies shape, scale, rotation and texture per instance.
 */
export class MyRockSet {
    constructor(scene, terrain, count = 30, areaRadius = 200, seed = 123) {
        this.scene = scene;
        this.terrain = terrain;
        this.count = count;
        this.areaRadius = areaRadius;
        this.seed = seed;

        // shared pool: every placement reuses one of these geometries
        this.rockShapes = [];
        const numShapes = 5;
        for (let i = 0; i < numShapes; i++) {
            const slices = 10 + Math.floor(this._seededRandom(i * 3) * 6);
            const stacks = 6 + Math.floor(this._seededRandom(i * 3 + 1) * 4);
            const perturbation = 0.15 + this._seededRandom(i * 3 + 2) * 0.25;
            this.rockShapes.push(new MyRock(scene, slices, stacks, i * 17, perturbation));
        }

        this.rockTextures = [
            new CGFtexture(scene, "textures/environment/rocks/rock1.png"),
            new CGFtexture(scene, "textures/environment/rocks/rock2.png"),
        ];

        this.rockAppearance = new CGFappearance(scene);
        this.rockAppearance.setAmbient(0.4, 0.4, 0.4, 1.0);
        this.rockAppearance.setDiffuse(0.7, 0.7, 0.7, 1.0);
        this.rockAppearance.setSpecular(0.15, 0.15, 0.15, 1.0);
        this.rockAppearance.setShininess(16.0);

        this.placements = this._generatePlacements();
    }

    _seededRandom(index) {
        let h = (index * 374761393 + this.seed * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = h ^ (h >>> 16);
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    _generatePlacements() {
        const placements = [];

        for (let i = 0; i < this.count; i++) {
            const angle = this._seededRandom(i * 5) * Math.PI * 2;
            const dist = Math.sqrt(this._seededRandom(i * 5 + 1)) * this.areaRadius * 0.85;
            const worldX = Math.cos(angle) * dist;
            const worldZ = Math.sin(angle) * dist;

            const worldY = this.terrain.getTerrainHeight(worldX, worldZ);

            const baseScale = 0.8 + this._seededRandom(i * 5 + 2) * 2.5;
            const scaleX = baseScale * (0.8 + this._seededRandom(i * 7) * 0.4);
            const scaleY = baseScale * (0.5 + this._seededRandom(i * 7 + 1) * 0.4);
            const scaleZ = baseScale * (0.8 + this._seededRandom(i * 7 + 2) * 0.4);

            const rotY = this._seededRandom(i * 5 + 3) * Math.PI * 2;

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

    getColliders() {
        // approximate each rock as a circle in the XZ plane for wagon collision
        const colliders = [];
        for (const r of this.placements) {
            const radius = Math.max(r.scaleX, r.scaleZ) * 0.7;
            if (radius > 0.3) {
                colliders.push({ x: r.x, z: r.z, radius });
            }
        }
        return colliders;
    }

    display() {
        // vertex perturbation can flip winding, so culling stays off
        this.scene.gl.disable(this.scene.gl.CULL_FACE);

        const cam = this.scene.camera;
        const camX = cam ? cam.position[0] : 0;
        const camZ = cam ? cam.position[2] : 0;
        const cullDistSq = 160 * 160;

        for (const rock of this.placements) {
            const dx = rock.x - camX;
            const dz = rock.z - camZ;
            if (dx * dx + dz * dz > cullDistSq) continue;

            this.scene.pushMatrix();

            // sink slightly into the ground so rocks don't appear to float
            this.scene.translate(rock.x, rock.y - rock.scaleY * 0.3, rock.z);
            this.scene.rotate(rock.rotY, 0, 1, 0);
            this.scene.scale(rock.scaleX, rock.scaleY, rock.scaleZ);

            this.rockAppearance.setTexture(this.rockTextures[rock.texIdx]);
            this.rockAppearance.apply();

            this.rockShapes[rock.shapeIdx].display();

            this.scene.popMatrix();
        }

        this.scene.gl.enable(this.scene.gl.CULL_FACE);
    }
}
