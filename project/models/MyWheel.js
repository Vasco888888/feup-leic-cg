import { CGFobject, CGFappearance } from '../../lib/CGF.js';

/**
 * MyWheel
 */
export class MyWheel extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // Dark grey material for the wheel
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.1, 0.1, 0.1, 1.0);
        this.material.setDiffuse(0.2, 0.2, 0.2, 1.0);
        this.material.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.material.setShininess(10.0);
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const slices = 20;
        const wheelRadius = 0.5;
        const wheelInnerRadius = 0.45;
        const wheelThickness = 0.2;
        const centerRadius = 0.1;
        const centerThickness = 0.25;
        const angle = (2 * Math.PI) / slices;

        // --- Wheel ---
        // 1. Outside Surface
        const outsideStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelRadius, y * wheelRadius, wheelThickness / 2);
            this.vertices.push(x * wheelRadius, y * wheelRadius, -wheelThickness / 2);
            this.normals.push(x, y, 0, x, y, 0);
            this.texCoords.push(i / slices, 0, i / slices, 1);
        }

        // 2. Inside Surface
        const insideStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, wheelThickness / 2);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, -wheelThickness / 2);
            this.normals.push(-x, -y, 0, -x, -y, 0);
            this.texCoords.push(i / slices, 0, i / slices, 1);
        }

        // 3. Front Face (Ring)
        const frontStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelRadius, y * wheelRadius, wheelThickness / 2);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, wheelThickness / 2);
            this.normals.push(0, 0, 1, 0, 0, 1);
            this.texCoords.push(x, y, x, y);
        }

        // 4. Back Face (Ring)
        const backStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelRadius, y * wheelRadius, -wheelThickness / 2);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, -wheelThickness / 2);
            this.normals.push(0, 0, -1, 0, 0, -1);
            this.texCoords.push(x, y, x, y);
        }

        for (let i = 0; i < slices; i++) {
            // Outside
            this.indices.push(outsideStart + 2 * i, outsideStart + 2 * i + 1, outsideStart + 2 * i + 2);
            this.indices.push(outsideStart + 2 * i + 2, outsideStart + 2 * i + 1, outsideStart + 2 * i + 3);
            // Inside
            this.indices.push(insideStart + 2 * i + 2, insideStart + 2 * i + 1, insideStart + 2 * i);
            this.indices.push(insideStart + 2 * i + 3, insideStart + 2 * i + 1, insideStart + 2 * i + 2);
            // Front Ring
            this.indices.push(frontStart + 2 * i, frontStart + 2 * i + 2, frontStart + 2 * i + 1);
            this.indices.push(frontStart + 2 * i + 1, frontStart + 2 * i + 2, frontStart + 2 * i + 3);
            // Back Ring
            this.indices.push(backStart + 2 * i, backStart + 2 * i + 1, backStart + 2 * i + 2);
            this.indices.push(backStart + 2 * i + 2, backStart + 2 * i + 1, backStart + 2 * i + 3);
        }

        // --- Center ---
        const centerStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle) * centerRadius;
            let y = Math.sin(i * angle) * centerRadius;
            
            this.vertices.push(x, y, centerThickness / 2);
            this.normals.push(x, y, 0);
            this.texCoords.push(i / slices, 0);
            this.vertices.push(x, y, -centerThickness / 2);
            this.normals.push(x, y, 0);
            this.texCoords.push(i / slices, 1);

            this.vertices.push(x, y, centerThickness / 2);
            this.normals.push(-x, -y, 0);
            this.texCoords.push(i / slices, 0);
            this.vertices.push(x, y, -centerThickness / 2);
            this.normals.push(-x, -y, 0);
            this.texCoords.push(i / slices, 1);
        }
        for (let i = 0; i < slices; i++) {
            this.indices.push(centerStart + 4 * i, centerStart + 4 * i + 1, centerStart + 4 * i + 4);
            this.indices.push(centerStart + 4 * i + 4, centerStart + 4 * i + 1, centerStart + 4 * i + 5);
            this.indices.push(centerStart + 4 * i + 6, centerStart + 4 * i + 3, centerStart + 4 * i + 2);
            this.indices.push(centerStart + 4 * i + 7, centerStart + 4 * i + 3, centerStart + 4 * i + 6);
        }

        // Close Center Front and Back
        const cFrontIndex = this.vertices.length / 3;
        this.vertices.push(0, 0, centerThickness / 2);
        this.normals.push(0, 0, 1);
        this.texCoords.push(0.5, 0.5);

        const cBackIndex = this.vertices.length / 3;
        this.vertices.push(0, 0, -centerThickness / 2);
        this.normals.push(0, 0, -1);
        this.texCoords.push(0.5, 0.5);

        for (let i = 0; i < slices; i++) {
            // Center Front (Double-sided)
            this.indices.push(cFrontIndex, centerStart + 4 * (i + 1), centerStart + 4 * i);
            this.indices.push(cFrontIndex, centerStart + 4 * i, centerStart + 4 * (i + 1));

            // Center Back (Double-sided)
            this.indices.push(cBackIndex, centerStart + 4 * i + 1, centerStart + 4 * (i + 1) + 1);
            this.indices.push(cBackIndex, centerStart + 4 * (i + 1) + 1, centerStart + 4 * i + 1);
        }

        // --- Lines ---
        const numLines = 12;
        const lineWidth = 0.03;
        const lineThickness = 0.05;
        const lineRadius = wheelRadius - 0.02; // Shorten to stay inside wheel ring
        for (let i = 0; i < numLines; i++) {
            const linesStart = this.vertices.length / 3;
            const linesAngle = i * (2 * Math.PI / numLines);
            const sa = Math.sin(linesAngle);
            const ca = Math.cos(linesAngle);

            // Front vertices
            this.vertices.push(ca * centerRadius, sa * centerRadius, lineThickness / 2);
            this.vertices.push(ca * lineRadius, sa * lineRadius, lineThickness / 2);
            this.vertices.push((ca * centerRadius) + (sa * lineWidth), (sa * centerRadius) - (ca * lineWidth), lineThickness / 2);
            this.vertices.push((ca * lineRadius) + (sa * lineWidth), (sa * lineRadius) - (ca * lineWidth), lineThickness / 2);

            // Back vertices
            this.vertices.push(ca * centerRadius, sa * centerRadius, -lineThickness / 2);
            this.vertices.push(ca * lineRadius, sa * lineRadius, -lineThickness / 2);
            this.vertices.push((ca * centerRadius) + (sa * lineWidth), (sa * centerRadius) - (ca * lineWidth), -lineThickness / 2);
            this.vertices.push((ca * lineRadius) + (sa * lineWidth), (sa * lineRadius) - (ca * lineWidth), -lineThickness / 2);

            this.normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
            this.normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            this.texCoords.push(0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1);
            
            // Front face
            this.indices.push(linesStart + 0, linesStart + 2, linesStart + 1);
            this.indices.push(linesStart + 1, linesStart + 2, linesStart + 3);
            // Back face
            this.indices.push(linesStart + 4, linesStart + 5, linesStart + 6);
            this.indices.push(linesStart + 6, linesStart + 5, linesStart + 7);
            // Side faces
            this.indices.push(linesStart + 0, linesStart + 1, linesStart + 4);
            this.indices.push(linesStart + 4, linesStart + 1, linesStart + 5);
            this.indices.push(linesStart + 2, linesStart + 6, linesStart + 3);
            this.indices.push(linesStart + 3, linesStart + 6, linesStart + 7);
            // Bottom/Top faces
            this.indices.push(linesStart + 0, linesStart + 4, linesStart + 2);
            this.indices.push(linesStart + 2, linesStart + 4, linesStart + 6);
            this.indices.push(linesStart + 1, linesStart + 3, linesStart + 5);
            this.indices.push(linesStart + 5, linesStart + 3, linesStart + 7);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.material.apply();
        super.display();
    }
}
