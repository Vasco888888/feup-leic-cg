import { CGFobject } from '../../lib/CGF.js';

/**
 * MyTongue
 */
export class MyTongue extends CGFobject {
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
