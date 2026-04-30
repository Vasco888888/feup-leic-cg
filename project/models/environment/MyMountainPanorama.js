import { CGFobject } from "../../../lib/CGF.js";

/**
 * MyMountainPanorama
 * A cylinder-based panorama that displays a mountain texture around the map.
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

        // We create a cylinder with two rings (bottom and top)
        for (let i = 0; i <= this.slices; i++) {
            const u = i / this.slices;
            const angle = u * Math.PI * 2;
            const x = Math.cos(angle);
            const z = Math.sin(angle);

            // Bottom vertex
            this.vertices.push(x * this.radius, 0, z * this.radius);
            this.normals.push(0, 1, 0); // Pointing up to catch sunlight
            this.texCoords.push(u * this.uRepeat, 1);

            // Top vertex
            this.vertices.push(x * this.radius, this.height, z * this.radius);
            this.normals.push(0, 1, 0); // Pointing up to catch sunlight
            this.texCoords.push(u * this.uRepeat, 0);
        }

        for (let i = 0; i < this.slices; i++) {
            const base = i * 2;
            // Two triangles per slice
            // Facing inward: bottom-left, top-right, top-left
            this.indices.push(base, base + 3, base + 1);
            // Facing inward: bottom-left, bottom-right, top-right
            this.indices.push(base, base + 2, base + 3);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
