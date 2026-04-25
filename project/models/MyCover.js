import { CGFobject } from '../../lib/CGF.js';

/**
 * MyCover
 */
export class MyCover extends CGFobject {
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
