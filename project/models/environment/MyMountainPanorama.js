import { CGFobject } from "../../../lib/CGF.js";

/**
 * Cylinder panorama that wraps a mountain texture around the map.
 */
export class MyMountainPanorama extends CGFobject {
    constructor(scene, slices = 80, height = 50, radius = 250, uRepeat = 1) {
        super(scene);
        this.slices = slices;
        this.height = height;
        this.radius = radius;
        this.uRepeat = uRepeat;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        for (let i = 0; i <= this.slices; i++) {
            const u = i / this.slices;
            const angle = u * Math.PI * 2;
            const x = Math.cos(angle);
            const z = Math.sin(angle);

            // normals point up so the panorama catches sunlight evenly
            this.vertices.push(x * this.radius, 0, z * this.radius);
            this.normals.push(0, 1, 0);
            this.texCoords.push(u * this.uRepeat, 1);

            this.vertices.push(x * this.radius, this.height, z * this.radius);
            this.normals.push(0, 1, 0);
            this.texCoords.push(u * this.uRepeat, 0);
        }

        // winding faces inward so the viewer inside the cylinder sees the texture
        for (let i = 0; i < this.slices; i++) {
            const base = i * 2;
            this.indices.push(base, base + 3, base + 1);
            this.indices.push(base, base + 2, base + 3);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
