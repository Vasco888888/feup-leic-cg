import { CGFobject } from "../../../lib/CGF.js";

/**
 * MyMountainPanorama
 * A cylinder-based panorama that displays a mountain texture around the map.
 */
export class MyMountainPanorama extends CGFobject {
    constructor(scene, slices = 80, height = 50, radius = 250) {
        super(scene);
        this.slices = slices;
        this.height = height;
        this.radius = radius;
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
            this.normals.push(-x, 0, -z); // Facing inward
            this.texCoords.push(u * 15, 1);

            // Top vertex
            this.vertices.push(x * this.radius, this.height, z * this.radius);
            this.normals.push(-x, 0, -z); // Facing inward
            this.texCoords.push(u * 15, 0);
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
