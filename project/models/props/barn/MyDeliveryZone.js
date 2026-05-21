import { CGFobject, CGFappearance } from '../../../../lib/CGF.js';

// Thin annulus drawn flat on the terrain, marking the spot in front of the
// barn where the wagon delivers hay bales. Two materials: idle (amber) and
// active (green) — the scene picks one per frame based on whether the
// wagon centre is inside the disc.
export class MyDeliveryZone extends CGFobject {
    constructor(scene, centerX, centerZ, radius, terrain) {
        super(scene);
        this.centerX = centerX;
        this.centerZ = centerZ;
        this.radius = radius;
        this.terrain = terrain;

        this.ringWidth = 0.7;
        this.segments = 96;
        this.heightOffset = 0.06;

        this.initBuffers();
        this.initMaterials();
    }

    initBuffers() {
        const { centerX, centerZ, radius, terrain, ringWidth, segments, heightOffset } = this;
        const rInner = radius - ringWidth * 0.5;
        const rOuter = radius + ringWidth * 0.5;

        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        // pairs of (inner, outer) vertices around the ring; terrain sampling
        // per vertex makes the ring hug the rolling ground instead of clipping
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);

            const xIn = centerX + rInner * cos;
            const zIn = centerZ + rInner * sin;
            const xOut = centerX + rOuter * cos;
            const zOut = centerZ + rOuter * sin;

            const yIn = terrain ? terrain.getTerrainHeight(xIn, zIn) + heightOffset : heightOffset;
            const yOut = terrain ? terrain.getTerrainHeight(xOut, zOut) + heightOffset : heightOffset;

            this.vertices.push(xIn, yIn, zIn);
            this.vertices.push(xOut, yOut, zOut);
            this.normals.push(0, 1, 0, 0, 1, 0);
            this.texCoords.push(0, i / segments, 1, i / segments);
        }

        for (let i = 0; i < segments; i++) {
            const a = 2 * i;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;
            // winding chosen so the face normal points to +Y (up)
            this.indices.push(a, c, b);
            this.indices.push(b, c, d);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    initMaterials() {
        this.idleMaterial = new CGFappearance(this.scene);
        this.idleMaterial.setAmbient(0.55, 0.40, 0.10, 1.0);
        this.idleMaterial.setDiffuse(1.0, 0.80, 0.20, 1.0);
        this.idleMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.idleMaterial.setShininess(1.0);
        this.idleMaterial.setEmission(0.45, 0.30, 0.05, 1.0);

        this.activeMaterial = new CGFappearance(this.scene);
        this.activeMaterial.setAmbient(0.10, 0.55, 0.20, 1.0);
        this.activeMaterial.setDiffuse(0.25, 1.0, 0.40, 1.0);
        this.activeMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.activeMaterial.setShininess(1.0);
        this.activeMaterial.setEmission(0.10, 0.55, 0.18, 1.0);
    }

    contains(x, z) {
        const dx = x - this.centerX;
        const dz = z - this.centerZ;
        return dx * dx + dz * dz <= this.radius * this.radius;
    }

    display(active) {
        (active ? this.activeMaterial : this.idleMaterial).apply();
        super.display();
    }
}
