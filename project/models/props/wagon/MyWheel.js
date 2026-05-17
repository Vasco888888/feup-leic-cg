import { CGFobject, CGFappearance, CGFtexture } from '../../../../lib/CGF.js';

export class MyWheel extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();

        // worn iron
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.3, 0.3, 0.3, 1.0);
        this.material.setDiffuse(0.8, 0.8, 0.8, 1.0);
        this.material.setSpecular(0.2, 0.2, 0.2, 1.0);
        this.material.setShininess(10.0);

        this.texture = new CGFtexture(scene, "textures/props/wagon/worn_iron_wheel.jpg");
        this.material.setTexture(this.texture);
        this.material.setTextureWrap('REPEAT', 'REPEAT');
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

        // outer rim wall
        const outsideStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelRadius, y * wheelRadius, wheelThickness / 2);
            this.vertices.push(x * wheelRadius, y * wheelRadius, -wheelThickness / 2);
            this.normals.push(x, y, 0, x, y, 0);
            this.texCoords.push(i / slices, 0, i / slices, 1);
        }

        // inner rim wall (normals flipped so the hole renders from outside)
        const insideStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, wheelThickness / 2);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, -wheelThickness / 2);
            this.normals.push(-x, -y, 0, -x, -y, 0);
            this.texCoords.push(i / slices, 0, i / slices, 1);
        }

        // front face ring connecting outer to inner rim
        const frontStart = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            let x = Math.cos(i * angle);
            let y = Math.sin(i * angle);
            this.vertices.push(x * wheelRadius, y * wheelRadius, wheelThickness / 2);
            this.vertices.push(x * wheelInnerRadius, y * wheelInnerRadius, wheelThickness / 2);
            this.normals.push(0, 0, 1, 0, 0, 1);
            this.texCoords.push(x, y, x, y);
        }

        // matching back face ring
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
            this.indices.push(outsideStart + 2 * i, outsideStart + 2 * i + 1, outsideStart + 2 * i + 2);
            this.indices.push(outsideStart + 2 * i + 2, outsideStart + 2 * i + 1, outsideStart + 2 * i + 3);
            this.indices.push(insideStart + 2 * i + 2, insideStart + 2 * i + 1, insideStart + 2 * i);
            this.indices.push(insideStart + 2 * i + 3, insideStart + 2 * i + 1, insideStart + 2 * i + 2);
            this.indices.push(frontStart + 2 * i, frontStart + 2 * i + 2, frontStart + 2 * i + 1);
            this.indices.push(frontStart + 2 * i + 1, frontStart + 2 * i + 2, frontStart + 2 * i + 3);
            this.indices.push(backStart + 2 * i, backStart + 2 * i + 1, backStart + 2 * i + 2);
            this.indices.push(backStart + 2 * i + 2, backStart + 2 * i + 1, backStart + 2 * i + 3);
        }

        // hub
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

        // cap the hub at each end with a triangle fan from a central pole vertex
        const cFrontIndex = this.vertices.length / 3;
        this.vertices.push(0, 0, centerThickness / 2);
        this.normals.push(0, 0, 1);
        this.texCoords.push(0.5, 0.5);

        const cBackIndex = this.vertices.length / 3;
        this.vertices.push(0, 0, -centerThickness / 2);
        this.normals.push(0, 0, -1);
        this.texCoords.push(0.5, 0.5);

        for (let i = 0; i < slices; i++) {
            this.indices.push(cFrontIndex, centerStart + 4 * (i + 1), centerStart + 4 * i);
            this.indices.push(cFrontIndex, centerStart + 4 * i, centerStart + 4 * (i + 1));

            this.indices.push(cBackIndex, centerStart + 4 * i + 1, centerStart + 4 * (i + 1) + 1);
            this.indices.push(cBackIndex, centerStart + 4 * (i + 1) + 1, centerStart + 4 * i + 1);
        }

        // spokes
        const numLines = 12;
        const lineWidth = 0.03;
        const lineThickness = 0.05;
        const lineRadius = wheelRadius - 0.02; // shortened so the spoke ends sit inside the rim
        for (let i = 0; i < numLines; i++) {
            const linesStart = this.vertices.length / 3;
            const linesAngle = i * (2 * Math.PI / numLines);
            const sa = Math.sin(linesAngle);
            const ca = Math.cos(linesAngle);

            this.vertices.push(ca * centerRadius, sa * centerRadius, lineThickness / 2);
            this.vertices.push(ca * lineRadius, sa * lineRadius, lineThickness / 2);
            this.vertices.push((ca * centerRadius) + (sa * lineWidth), (sa * centerRadius) - (ca * lineWidth), lineThickness / 2);
            this.vertices.push((ca * lineRadius) + (sa * lineWidth), (sa * lineRadius) - (ca * lineWidth), lineThickness / 2);

            this.vertices.push(ca * centerRadius, sa * centerRadius, -lineThickness / 2);
            this.vertices.push(ca * lineRadius, sa * lineRadius, -lineThickness / 2);
            this.vertices.push((ca * centerRadius) + (sa * lineWidth), (sa * centerRadius) - (ca * lineWidth), -lineThickness / 2);
            this.vertices.push((ca * lineRadius) + (sa * lineWidth), (sa * lineRadius) - (ca * lineWidth), -lineThickness / 2);

            this.normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
            this.normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            this.texCoords.push(0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1);

            this.indices.push(linesStart + 0, linesStart + 2, linesStart + 1);
            this.indices.push(linesStart + 1, linesStart + 2, linesStart + 3);
            this.indices.push(linesStart + 4, linesStart + 5, linesStart + 6);
            this.indices.push(linesStart + 6, linesStart + 5, linesStart + 7);
            this.indices.push(linesStart + 0, linesStart + 1, linesStart + 4);
            this.indices.push(linesStart + 4, linesStart + 1, linesStart + 5);
            this.indices.push(linesStart + 2, linesStart + 6, linesStart + 3);
            this.indices.push(linesStart + 3, linesStart + 6, linesStart + 7);
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
