import { CGFobject } from "../../../lib/CGF.js";

/**
 * Parameter-based flower built from stem, receptacle and radial petals.
 */
export class MyFlower extends CGFobject {
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

        this.stemGeom = this._buildStem(8);
        this.receptacleGeom = this._buildReceptacle(8, 6);
        this.petalGeom = this._buildPetal();
    }

    _buildStem(slices) {
        const verts = [], norms = [], texs = [], inds = [];
        const step = (2 * Math.PI) / slices;
        const r = this.stemRadius;
        const h = this.stemHeight;

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

    _buildPetal() {
        const l = this.petalLength;
        const w = this.petalWidth / 2;
        const segments = 10;

        const verts = [];
        const norms = [];
        const texs = [];
        const inds = [];

        // centre vertex for fan triangulation
        verts.push(l * 0.45, 0, 0);
        norms.push(0, 0, 1);
        texs.push(0.45, 0.5);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2;

            // teardrop: sine envelope raised to 0.7 so the tip stays pointed
            const x = l * (0.5 + 0.5 * Math.cos(angle + Math.PI));
            const envelope = Math.pow(Math.sin(Math.PI * (x / l)), 0.7);
            const y = w * Math.sin(angle) * envelope;

            verts.push(x, y, 0);
            norms.push(0, 0, 1);
            texs.push(x / l, 0.5 - y / (2 * w));
        }

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

        scene.pushMatrix();
        scene.diffuseColor = [0.2, 0.5, 0.15, 1.0];
        this.stemGeom.display();
        scene.popMatrix();

        scene.pushMatrix();
        scene.translate(0, this.stemHeight, 0);

        // tilt the flower head slightly forward
        scene.rotate(-Math.PI / 8, 1, 0, 0);

        scene.gl.disable(scene.gl.CULL_FACE);
        const angleStep = (2 * Math.PI) / this.petalCount;
        for (let i = 0; i < this.petalCount; i++) {
            scene.pushMatrix();
            scene.rotate(i * angleStep, 0, 1, 0);
            // tilt petal outward
            scene.rotate(Math.PI / 6, 0, 0, 1);
            this.petalGeom.display();
            scene.popMatrix();
        }
        scene.gl.enable(scene.gl.CULL_FACE);

        scene.gl.disable(scene.gl.CULL_FACE);
        this.receptacleGeom.display();
        scene.gl.enable(scene.gl.CULL_FACE);

        scene.popMatrix();
    }
}
