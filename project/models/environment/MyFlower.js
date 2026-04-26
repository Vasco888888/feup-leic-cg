import { CGFobject } from "../../../lib/CGF.js";

/**
 * Parameter-based flower built from simple primitives.
 *
 * Components:
 *  - Stem:       thin cylinder (MyCylinder-style)
 *  - Receptacle: small sphere at the top
 *  - Petals:     elliptical quads arranged radially
 *
 * All parameters foster natural randomness when varied per instance.
 */
export class MyFlower extends CGFobject {
    /**
     * @param {CGFscene} scene
     * @param {number} petalCount     Number of petals (4–10)
     * @param {number} petalLength    Length of each petal
     * @param {number} petalWidth     Width of each petal
     * @param {number} stemHeight     Height of the stem
     * @param {number} stemRadius     Radius of the stem
     * @param {number} receptacleRadius  Size of the centre
     * @param {number} petalColor     [r, g, b] petal colour
     * @param {number} receptacleColor [r, g, b] centre colour
     */
    constructor(
        scene,
        petalCount = 6,
        petalLength = 0.5,
        petalWidth = 0.2,
        stemHeight = 1.0,
        stemRadius = 0.04,
        receptacleRadius = 0.12,
        petalColor = [1, 0.6, 0.8],
        receptacleColor = [1, 0.85, 0.2]
    ) {
        super(scene);

        this.petalCount = petalCount;
        this.petalLength = petalLength;
        this.petalWidth = petalWidth;
        this.stemHeight = stemHeight;
        this.stemRadius = stemRadius;
        this.receptacleRadius = receptacleRadius;
        this.petalColor = petalColor;
        this.receptacleColor = receptacleColor;

        // Build sub-geometries
        this.stemGeom = this._buildStem(8);
        this.receptacleGeom = this._buildReceptacle(8, 6);
        this.petalGeom = this._buildPetal();
    }

    // ── Stem: simple cylinder along Y axis ──

    _buildStem(slices) {
        const verts = [], norms = [], texs = [], inds = [];
        const step = (2 * Math.PI) / slices;
        const r = this.stemRadius;
        const h = this.stemHeight;

        // Two rings: bottom (y=0) and top (y=h)
        for (let ring = 0; ring <= 1; ring++) {
            const y = ring * h;
            for (let i = 0; i <= slices; i++) {
                const a = i * step;
                const x = Math.cos(a) * r;
                const z = Math.sin(a) * r;
                verts.push(x, y, z);
                norms.push(Math.cos(a), 0, Math.sin(a));
                texs.push(i / slices, 1 - ring);
            }
        }

        const stride = slices + 1;
        for (let i = 0; i < slices; i++) {
            inds.push(i, i + stride, i + 1);
            inds.push(i + 1, i + stride, i + stride + 1);
        }

        return this._makeGeom(verts, norms, texs, inds);
    }

    // ── Receptacle: small half-sphere at top of stem ──

    _buildReceptacle(slices, stacks) {
        const verts = [], norms = [], texs = [], inds = [];
        const r = this.receptacleRadius;

        for (let st = 0; st <= stacks; st++) {
            const v = st / stacks;
            const theta = v * (Math.PI / 2); // half-sphere
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);

            for (let sl = 0; sl <= slices; sl++) {
                const u = sl / slices;
                const phi = u * 2 * Math.PI;
                const x = sinT * Math.cos(phi) * r;
                const y = cosT * r;
                const z = sinT * Math.sin(phi) * r;
                verts.push(x, y, z);
                norms.push(sinT * Math.cos(phi), cosT, sinT * Math.sin(phi));
                texs.push(u, v);
            }
        }

        const stride = slices + 1;
        for (let st = 0; st < stacks; st++) {
            for (let sl = 0; sl < slices; sl++) {
                const cur = st * stride + sl;
                const next = cur + stride;
                inds.push(cur, next, cur + 1);
                inds.push(cur + 1, next, next + 1);
            }
        }

        return this._makeGeom(verts, norms, texs, inds);
    }

    // ── Petal: elliptical/teardrop shape (fan of triangles) ──

    _buildPetal() {
        const l = this.petalLength;
        const w = this.petalWidth / 2;
        const segments = 10; // edge resolution

        const verts = [];
        const norms = [];
        const texs = [];
        const inds = [];

        // Centre vertex (for fan triangulation)
        verts.push(l * 0.45, 0, 0);
        norms.push(0, 0, 1);
        texs.push(0.45, 0.5);

        // Edge vertices in a teardrop/ellipse shape
        for (let i = 0; i <= segments; i++) {
            const t = i / segments; // 0 → 1 around the edge
            const angle = t * Math.PI * 2;

            // Teardrop shape: narrower at base (t=0), wider in middle, pointed at tip
            // X goes from 0 (base) to l (tip) and back
            // Y follows a sine envelope modulated for teardrop
            const x = l * (0.5 + 0.5 * Math.cos(angle + Math.PI));
            const envelope = Math.pow(Math.sin(Math.PI * (x / l)), 0.7);
            const y = w * Math.sin(angle) * envelope;

            verts.push(x, y, 0);
            norms.push(0, 0, 1);
            texs.push(x / l, 0.5 - y / (2 * w));
        }

        // Fan triangles from centre (vertex 0) to edge vertices
        for (let i = 1; i <= segments; i++) {
            inds.push(0, i, i + 1);
        }

        return this._makeGeom(verts, norms, texs, inds);
    }

    _makeGeom(verts, norms, texs, inds) {
        const g = new CGFobject(this.scene);
        g.vertices = verts;
        g.normals = norms;
        g.texCoords = texs;
        g.indices = inds;
        g.primitiveType = this.scene.gl.TRIANGLES;
        g.initGLBuffers();
        return g;
    }

    display() {
        const scene = this.scene;

        // ── Draw stem ──
        scene.pushMatrix();
        // Stem colour (green)
        scene.diffuseColor = [0.2, 0.5, 0.15, 1.0];
        this.stemGeom.display();
        scene.popMatrix();

        // ── Draw flower head at top of stem ──
        scene.pushMatrix();
        scene.translate(0, this.stemHeight, 0);

        // Tilt the flower slightly forward
        scene.rotate(-Math.PI / 8, 1, 0, 0);

        // ── Draw petals ──
        const angleStep = (2 * Math.PI) / this.petalCount;
        for (let i = 0; i < this.petalCount; i++) {
            scene.pushMatrix();
            scene.rotate(i * angleStep, 0, 1, 0);
            // Tilt petal outward slightly
            scene.rotate(Math.PI / 6, 0, 0, 1);
            this.petalGeom.display();
            scene.popMatrix();
        }

        // ── Draw receptacle (centre) ──
        this.receptacleGeom.display();

        scene.popMatrix();
    }
}
