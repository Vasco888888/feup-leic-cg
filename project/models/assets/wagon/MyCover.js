import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

/**
 * MyCover
 */
export class MyCover extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // Burlap Cloth Material
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.4, 0.4, 0.4, 1.0);
        this.material.setDiffuse(0.8, 0.8, 0.8, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(1.0);

        this.texture = new CGFtexture(scene, "textures/assets/wagon/burlap_cover.jpg");
        this.material.setTexture(this.texture);
        this.material.setTextureWrap('REPEAT', 'REPEAT');
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        // Dimensions
        const length = 3.0;
        const height = 1.4;
        const radius = 1.0;
        const slices = 20;
        const hoopsCount = 6;

        // --- Helper: Add an Arch for openings ---
        const addArch = (xPos, depth) => {
            let s = this.vertices.length / 3;
            const outerScale = 1.08;

            for (let i = 0; i <= slices; i++) {
                let angle = (i * Math.PI) / slices;
                let z = Math.cos(angle) * radius;
                let y = Math.sin(angle) * height;

                // Vertices
                this.vertices.push(xPos, y, z); // Inner
                this.vertices.push(xPos, y * outerScale, z * outerScale); // Outer
                this.vertices.push(xPos + depth, y, z); // Inner Depth
                this.vertices.push(xPos + depth, y * outerScale, z * outerScale); // Outer Depth

                // Normals (Facing Out/In along X)
                let nx = xPos > 0 ? 1 : -1;
                this.normals.push(nx, 0, 0, nx, 0, 0, -nx, 0, 0, -nx, 0, 0);

                // UVs
                let u = i / slices;
                this.texCoords.push(u, 1, u, 0, u, 1, u, 0);
            }

            for (let i = 0; i < slices; i++) {
                let b = s + i * 4;
                // Front face
                this.indices.push(b, b + 1, b + 5, b, b + 5, b + 4);
                this.indices.push(b + 4, b + 5, b + 1, b + 4, b + 1, b);
                // Back face
                this.indices.push(b + 2, b + 7, b + 3, b + 2, b + 6, b + 7);
                this.indices.push(b + 7, b + 6, b + 2, b + 3, b + 7, b + 2);
                // Outer Edge
                this.indices.push(b + 1, b + 3, b + 7, b + 1, b + 7, b + 5);
                this.indices.push(b + 5, b + 7, b + 3, b + 5, b + 3, b + 1);
            }
        };

        // Front Arch (Folds Inwards)
        addArch(length / 2, -0.1);
        // Back Arch (Folds Inwards)
        addArch(-length / 2, 0.1);

        // --- Main Cover ---
        const radiusZ = 1.0;
        const radiusY = 1.4; // Taller arch
        const hoops = 6; // Number of hoops

        for (let j = 0; j < hoops; j++) {
            let zOffset = (j * length / (hoops - 1)) - length / 2;

            for (let i = 0; i <= slices; i++) {
                let angle = (i * Math.PI) / slices;
                let z = Math.cos(angle) * radiusZ;
                let y = Math.sin(angle) * radiusY;

                // Outside
                this.vertices.push(zOffset, y, z);
                this.normals.push(0, y, z);
                this.texCoords.push(i / slices, j / (hoops - 1));
                
                // Inside
                this.vertices.push(zOffset, y, z);
                this.normals.push(0, -y, -z);
                this.texCoords.push(i / slices, j / (hoops - 1));
            }
        }

        // Indices for the cloth sections
        const vertexOffset = (slices + 1) * 4 * 2; // Offset from the two arches
        for (let j = 0; j < hoops - 1; j++) {
            for (let i = 0; i < slices; i++) {
                let current = vertexOffset + j * (slices + 1) * 2 + i * 2;
                let next = vertexOffset + (j + 1) * (slices + 1) * 2 + i * 2;

                // Outside
                this.indices.push(current, next, current + 2);
                this.indices.push(current + 2, next, next + 2);
                
                // Inside
                this.indices.push(current + 3, next + 1, current + 1);
                this.indices.push(next + 3, next + 1, current + 3);
            }
        }

        // --- Hoops ---
        const hoopRadiusZ = radiusZ + 0.05;
        const hoopRadiusY = radiusY + 0.05;
        const hoopThickness = 0.04;
        const hoopStart = this.vertices.length / 3;

        for (let j = 0; j < hoops; j++) {
            let zOffset = (j * length / (hoops - 1)) - length / 2;
            let currentHoopStart = (this.vertices.length / 3) - hoopStart;

            for (let i = 0; i <= slices; i++) {
                let angle = (i * Math.PI) / slices;
                let z = Math.cos(angle) * hoopRadiusZ;
                let y = Math.sin(angle) * hoopRadiusY;

                this.vertices.push(zOffset + hoopThickness/2, y, z);
                this.vertices.push(zOffset - hoopThickness/2, y, z);
                this.normals.push(1, 0, 0, -1, 0, 0);
                this.texCoords.push(i / slices, 0, i / slices, 1);
            }

            for (let i = 0; i < slices; i++) {
                let current = hoopStart + currentHoopStart + i * 2;
                // Side 1
                this.indices.push(current, current + 2, current + 1);
                this.indices.push(current + 1, current + 2, current + 3);
                // Side 2 (Reversed)
                this.indices.push(current + 1, current + 2, current);
                this.indices.push(current + 3, current + 2, current + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
