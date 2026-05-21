import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

// Barn body sits on a stone plinth; gable roof has no overhang and the
// front/back gable triangles reuse the wall material so the wood siding runs
// continuously from the foundation up to the peak. Front face carries the big
// sliding door and a hayloft door above. Two silos with corrugated bodies and
// dark conical caps sit to the left. Silos expose collider footprints via
// getColliders() so MyScene can add them to the wagon's collision list.

// Layout (barn-local coords; +z is the front facing the delivery zone)
const FOUNDATION_HEIGHT = 1.5;
const FOUNDATION_HALF   = 5.6;
const BODY_W = 10;
const BODY_D = 10;
const BODY_H = 8;
const BODY_TOP = FOUNDATION_HEIGHT + BODY_H;     // y = 9.5
const ROOF_PEAK_H = 4;
const ROOF_HALF_W = 5;
const ROOF_HALF_D = 5;

const SILOS = [
    { x: -7.2, z:  2.0, r: 2.0, h: 12.5 },
    { x: -7.2, z: -2.5, r: 1.5, h: 9.5 }
];

export class MyBarn extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        this.wallMaterial = new CGFappearance(scene);
        this.wallMaterial.setAmbient(0.22, 0.22, 0.22, 1.0);
        this.wallMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.wallMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.wallMaterial.setShininess(5.0);
        this.wallTexture = new CGFtexture(scene, "textures/props/barn/reclaimed_wood_planks_sundance_red_finish_wall.jpg");
        this.wallMaterial.setTexture(this.wallTexture);
        // gables sample beyond v=1 to tile the planks up to the peak
        this.wallMaterial.setTextureWrap('REPEAT', 'REPEAT');

        this.doorMaterial = new CGFappearance(scene);
        this.doorMaterial.setAmbient(0.22, 0.22, 0.22, 1.0);
        this.doorMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.doorMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.doorMaterial.setShininess(5.0);
        this.doorTexture = new CGFtexture(scene, "textures/props/barn/rustic_barn_door.jpg");
        this.doorMaterial.setTexture(this.doorTexture);

        this.roofMaterial = new CGFappearance(scene);
        this.roofMaterial.setAmbient(0.20, 0.20, 0.20, 1.0);
        this.roofMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.roofMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.roofTexture = new CGFtexture(scene, "textures/props/barn/wood_shingle_roof.jpg");
        this.roofMaterial.setTexture(this.roofTexture);
        this.roofMaterial.setTextureWrap('REPEAT', 'REPEAT');

        this.stoneMaterial = new CGFappearance(scene);
        this.stoneMaterial.setAmbient(0.30, 0.30, 0.30, 1.0);
        this.stoneMaterial.setDiffuse(0.95, 0.95, 0.95, 1.0);
        this.stoneMaterial.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.stoneMaterial.setShininess(4.0);
        this.stoneTexture = new CGFtexture(scene, "textures/props/barn/stone_foundation.png");
        this.stoneMaterial.setTexture(this.stoneTexture);
        this.stoneMaterial.setTextureWrap('REPEAT', 'REPEAT');

        this.siloMaterial = new CGFappearance(scene);
        this.siloMaterial.setAmbient(0.42, 0.42, 0.44, 1.0);
        this.siloMaterial.setDiffuse(0.95, 0.95, 0.97, 1.0);
        this.siloMaterial.setSpecular(0.12, 0.12, 0.14, 1.0);
        this.siloMaterial.setShininess(12.0);
        this.siloTexture = new CGFtexture(scene, "textures/props/barn/corrugated_iron.png");
        this.siloMaterial.setTexture(this.siloTexture);
        this.siloMaterial.setTextureWrap('REPEAT', 'REPEAT');

        this.capMaterial = new CGFappearance(scene);
        this.capMaterial.setAmbient(0.20, 0.20, 0.20, 1.0);
        this.capMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.capMaterial.setSpecular(0.10, 0.10, 0.10, 1.0);
        this.capMaterial.setShininess(8.0);
        this.capMaterial.setTexture(this.roofTexture);
        this.capMaterial.setTextureWrap('REPEAT', 'REPEAT');

        this.windowMaterial = new CGFappearance(scene);
        this.windowMaterial.setAmbient(0.35, 0.35, 0.35, 1.0);
        this.windowMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.windowMaterial.setSpecular(0.20, 0.22, 0.25, 1.0);
        this.windowMaterial.setShininess(40.0);
        this.windowTexture = new CGFtexture(scene, "textures/props/barn/window_pane.png");
        this.windowMaterial.setTexture(this.windowTexture);
    }

    initBuffers() {
        this.quad = new MyBarnQuad(this.scene);
        // foundation face is 11.2 wide x 1.5 tall — tile so stones don't smear
        // horizontally; top is 11.2x11.2 so it tiles in both directions
        this.stoneSideQuad = new MyTexQuad(this.scene, 6, 1);
        this.stoneTopQuad  = new MyTexQuad(this.scene, 6, 6);
        this.slants = new MyBarnSlants(this.scene, ROOF_HALF_W, ROOF_PEAK_H, ROOF_HALF_D);
        this.gables = new MyBarnGables(this.scene, ROOF_HALF_W, ROOF_PEAK_H, ROOF_HALF_D);
        this.cylinder = new MyBarnCylinder(this.scene, 24);
        this.cone = new MyBarnCone(this.scene, 24);
    }

    getColliders() {
        return SILOS.map(s => ({ localX: s.x, localZ: s.z, radius: s.r + 0.2 }));
    }

    display() {
        // sink the whole barn slightly into the ground so the foundation
        // reads as embedded instead of floating on the grass
        this.scene.pushMatrix();
        this.scene.translate(0, -0.3, 0);

        // stone foundation
        this.stoneMaterial.apply();
        this._drawStoneFoundation();

        // main body
        this.wallMaterial.apply();
        this._drawBox(0, FOUNDATION_HEIGHT + BODY_H / 2, 0, BODY_W, BODY_H, BODY_D);

        // gable ends — same red planks as the body, continuous wood look up to the peak
        this.scene.pushMatrix();
        this.scene.translate(0, BODY_TOP, 0);
        this.gables.display();
        this.scene.popMatrix();

        // big sliding door
        this.doorMaterial.apply();
        this.scene.pushMatrix();
        this.scene.translate(0, FOUNDATION_HEIGHT + 3, BODY_D / 2 + 0.01);
        this.scene.scale(5, 6, 1);
        this.quad.display();
        this.scene.popMatrix();

        // hayloft door above the main door
        this.scene.pushMatrix();
        this.scene.translate(0, FOUNDATION_HEIGHT + BODY_H - 1.0, BODY_D / 2 + 0.015);
        this.scene.scale(2.4, 1.6, 1);
        this.quad.display();
        this.scene.popMatrix();

        // side windows
        this.windowMaterial.apply();
        const winY = FOUNDATION_HEIGHT + 4.0;
        for (const side of [-1, 1]) {
            for (const wz of [-2.5, 2.5]) {
                this.scene.pushMatrix();
                this.scene.translate(side * (BODY_W / 2 + 0.02), winY, wz);
                this.scene.rotate(side * Math.PI / 2, 0, 1, 0);
                this.scene.scale(1.4, 1.4, 1);
                this.quad.display();
                this.scene.popMatrix();
            }
        }

        // roof slants — single-sided; back-face culling hides the underside
        this.roofMaterial.apply();
        this.scene.pushMatrix();
        this.scene.translate(0, BODY_TOP, 0);
        this.slants.display();
        this.scene.popMatrix();

        // silos
        for (const s of SILOS) {
            this.siloMaterial.apply();
            this.scene.pushMatrix();
            this.scene.translate(s.x, 0, s.z);
            this.scene.scale(s.r * 2, s.h, s.r * 2);
            this.cylinder.display();
            this.scene.popMatrix();

            // cone base flush with the silo top so the back-face-culled
            // underside is never exposed
            this.capMaterial.apply();
            this.scene.pushMatrix();
            this.scene.translate(s.x, s.h, s.z);
            this.scene.scale(s.r * 2, s.r * 1.0, s.r * 2);
            this.cone.display();
            this.scene.popMatrix();
        }

        this.scene.popMatrix();
    }

    // Foundation needs custom tiling per face so the stones tile at a
    // sensible scale on the long side and on the top.
    _drawStoneFoundation() {
        const w = FOUNDATION_HALF * 2;
        const d = FOUNDATION_HALF * 2;
        const h = FOUNDATION_HEIGHT;
        const cy = h / 2;
        const hx = FOUNDATION_HALF;

        // front
        this.scene.pushMatrix();
        this.scene.translate(0, cy, hx);
        this.scene.scale(w, h, 1);
        this.stoneSideQuad.display();
        this.scene.popMatrix();

        // back
        this.scene.pushMatrix();
        this.scene.translate(0, cy, -hx);
        this.scene.rotate(Math.PI, 0, 1, 0);
        this.scene.scale(w, h, 1);
        this.stoneSideQuad.display();
        this.scene.popMatrix();

        // left
        this.scene.pushMatrix();
        this.scene.translate(-hx, cy, 0);
        this.scene.rotate(-Math.PI / 2, 0, 1, 0);
        this.scene.scale(d, h, 1);
        this.stoneSideQuad.display();
        this.scene.popMatrix();

        // right
        this.scene.pushMatrix();
        this.scene.translate(hx, cy, 0);
        this.scene.rotate(Math.PI / 2, 0, 1, 0);
        this.scene.scale(d, h, 1);
        this.stoneSideQuad.display();
        this.scene.popMatrix();

        // top (visible ring around the body)
        this.scene.pushMatrix();
        this.scene.translate(0, h, 0);
        this.scene.rotate(-Math.PI / 2, 1, 0, 0);
        this.scene.scale(w, d, 1);
        this.stoneTopQuad.display();
        this.scene.popMatrix();
    }

    _drawBox(cx, cy, cz, w, h, d) {
        const hx = w / 2, hy = h / 2, hz = d / 2;
        const faces = [
            { pos: [cx,      cy,      cz + hz], rot: null,                       sx: w, sy: h },
            { pos: [cx,      cy,      cz - hz], rot: [Math.PI,    0, 1, 0],      sx: w, sy: h },
            { pos: [cx - hx, cy,      cz     ], rot: [-Math.PI/2, 0, 1, 0],      sx: d, sy: h },
            { pos: [cx + hx, cy,      cz     ], rot: [Math.PI/2,  0, 1, 0],      sx: d, sy: h },
            { pos: [cx,      cy + hy, cz     ], rot: [-Math.PI/2, 1, 0, 0],      sx: w, sy: d }
        ];
        for (const f of faces) {
            this.scene.pushMatrix();
            this.scene.translate(...f.pos);
            if (f.rot) this.scene.rotate(...f.rot);
            this.scene.scale(f.sx, f.sy, 1);
            this.quad.display();
            this.scene.popMatrix();
        }
    }
}

// Double-sided unit quad in the XY plane, facing +Z.
class MyBarnQuad extends CGFobject {
    constructor(scene) { super(scene); this.initBuffers(); }
    initBuffers() {
        this.vertices = [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0];
        this.indices = [
            0, 1, 3, 0, 3, 2,
            3, 1, 0, 2, 3, 0
        ];
        this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
        this.texCoords = [0, 1, 1, 1, 0, 0, 1, 0];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// Same shape as MyBarnQuad but with configurable UV repeat counts so a single
// quad can show many tiles of its texture (needs REPEAT wrap on the material).
class MyTexQuad extends CGFobject {
    constructor(scene, uRepeat = 1, vRepeat = 1) {
        super(scene);
        this.uRepeat = uRepeat;
        this.vRepeat = vRepeat;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0];
        this.indices = [
            0, 1, 3, 0, 3, 2,
            3, 1, 0, 2, 3, 0
        ];
        this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
        const u = this.uRepeat, v = this.vRepeat;
        this.texCoords = [0, v, u, v, 0, 0, u, 0];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// Two slanted rectangles meeting at the ridge. CCW from outside (above), so
// back-face culling hides the underside.
class MyBarnSlants extends CGFobject {
    constructor(scene, halfW, peakH, halfD) {
        super(scene);
        this.halfW = halfW;
        this.peakH = peakH;
        this.halfD = halfD;
        this.initBuffers();
    }
    initBuffers() {
        const w = this.halfW, rh = this.peakH, d = this.halfD;
        this.vertices = [
            // left slant: bottom-front, top-front, bottom-back, top-back
            -w, 0, d,  0, rh, d,  -w, 0, -d, 0, rh, -d,
            // right slant
            0, rh, d, w, 0, d,   0, rh, -d, w, 0, -d
        ];

        this.indices = [
            0, 1, 3, 0, 3, 2,
            4, 5, 7, 4, 7, 6
        ];

        // tile the shingle texture along the slant length so each shingle
        // reads at a sensible scale
        this.texCoords = [
            0, 2,  1, 2,  0, 0,  1, 0,
            1, 2,  0, 2,  1, 0,  0, 0
        ];

        const len = Math.sqrt(rh * rh + w * w);
        const nl = [-rh / len, w / len, 0];
        const nr = [rh / len, w / len, 0];

        this.normals = [
            ...nl, ...nl, ...nl, ...nl,
            ...nr, ...nr, ...nr, ...nr
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// Front and back triangular gables — drawn separately from the slants so the
// barn can apply the wall (planks) material to them while the slants keep the
// shingle material.
class MyBarnGables extends CGFobject {
    constructor(scene, halfW, peakH, halfD) {
        super(scene);
        this.halfW = halfW;
        this.peakH = peakH;
        this.halfD = halfD;
        this.initBuffers();
    }
    initBuffers() {
        const w = this.halfW, rh = this.peakH, d = this.halfD;
        this.vertices = [
            // front gable
            -w, 0, d,  w, 0, d,  0, rh, d,
            // back gable
            -w, 0, -d, w, 0, -d, 0, rh, -d
        ];

        // Front: CCW from +z. Back: reverse winding so normal points -z.
        this.indices = [
            0, 1, 2,
            5, 4, 3
        ];

        this.texCoords = [
            0, 1, 1, 1, 0.5, 0,
            0, 1, 1, 1, 0.5, 0
        ];

        this.normals = [
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// Unit cylinder: radius 0.5 around the Y axis, height from y=0 to y=1.
// UV is rotated 90° so the corrugated_iron texture's horizontal bands run
// vertically up the silo (matching real corrugated-metal panels), and tiled
// 3× around so each panel is a sensible width.
class MyBarnCylinder extends CGFobject {
    constructor(scene, sides = 24) {
        super(scene);
        this.sides = sides;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        const N = this.sides;
        const vTilesAround = 3;
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            const angle = t * 2 * Math.PI;
            const cx = Math.cos(angle);
            const cz = Math.sin(angle);
            // bottom vertex — U=1 maps to one edge of the texture
            this.vertices.push(cx * 0.5, 0, cz * 0.5);
            this.normals.push(cx, 0, cz);
            this.texCoords.push(1, t * vTilesAround);
            // top vertex — U=0 maps to the opposite edge
            this.vertices.push(cx * 0.5, 1, cz * 0.5);
            this.normals.push(cx, 0, cz);
            this.texCoords.push(0, t * vTilesAround);
        }

        for (let i = 0; i < N; i++) {
            const b0 = i * 2;
            const t0 = i * 2 + 1;
            const b1 = (i + 1) * 2;
            const t1 = (i + 1) * 2 + 1;
            this.indices.push(b0, t1, b1, b0, t0, t1);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

class MyBarnCone extends CGFobject {
    constructor(scene, sides = 24) {
        super(scene);
        this.sides = sides;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        const N = this.sides;
        const slopeH = 0.5;
        const slopeV = 1.0;
        const slopeLen = Math.sqrt(slopeH * slopeH + slopeV * slopeV);
        const nyAxial = slopeH / slopeLen;
        const nRadial = slopeV / slopeLen;

        for (let i = 0; i < N; i++) {
            const t0 = i / N;
            const t1 = (i + 1) / N;
            const a0 = t0 * 2 * Math.PI;
            const a1 = t1 * 2 * Math.PI;
            const am = (a0 + a1) / 2;

            const idx = this.vertices.length / 3;
            this.vertices.push(
                Math.cos(a0) * 0.5, 0, Math.sin(a0) * 0.5,
                Math.cos(a1) * 0.5, 0, Math.sin(a1) * 0.5,
                0, 1, 0
            );

            const nx = Math.cos(am) * nRadial;
            const nz = Math.sin(am) * nRadial;
            this.normals.push(nx, nyAxial, nz,  nx, nyAxial, nz,  nx, nyAxial, nz);
            this.texCoords.push(t0, 1, t1, 1, (t0 + t1) / 2, 0);

            this.indices.push(idx, idx + 2, idx + 1);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
