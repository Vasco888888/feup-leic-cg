import { CGFobject } from '../../lib/CGF.js';

/**
 * MyWheel
 */
export class MyWheel extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
