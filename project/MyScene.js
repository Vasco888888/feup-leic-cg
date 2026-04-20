import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFshader } from "../lib/CGF.js";
import { MySkyDome } from "./MySkyDome.js";
import { MyPlane } from "./MyPlane.js";

export class MyScene extends CGFscene {
    constructor() {
        super();

        this.displayAxis = true;
        this.showSky = true;
        this.showClouds = true;

        this.sunLightEnabled = true;
        this.spotLightEnabled = true;

        this.cloudSpeed = 0.02;
        this.cloudOffset = 0.0;
        this.skyRadius = 260.0;

        this.sunDirection = vec3.fromValues(-0.35, 0.72, -0.60);
    }

    init(application) {
        super.init(application);

        this.initCameras();
        this.initLights();

        this.gl.clearColor(0.53, 0.75, 0.96, 1.0);
        this.gl.clearDepth(100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.enableTextures(true);

        this.axis = new CGFaxis(this, 8, 0.1);
        this.skyDome = new MySkyDome(this, 80, 28);
        this.floor = new MyPlane(this, 20);

        this.skyAppearance = new CGFappearance(this);
        this.skyAppearance.setAmbient(1.0, 1.0, 1.0, 1.0);
        this.skyAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.skyAppearance.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.skyAppearance.setShininess(1.0);

        this.cloudAppearance = new CGFappearance(this);
        this.cloudAppearance.setAmbient(1.0, 1.0, 1.0, 1.0);
        this.cloudAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.cloudAppearance.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.cloudAppearance.setShininess(1.0);

        this.floorAppearance = new CGFappearance(this);
        this.floorAppearance.setAmbient(0.08, 0.24, 0.08, 1.0);
        this.floorAppearance.setDiffuse(0.18, 0.62, 0.20, 1.0);
        this.floorAppearance.setSpecular(0.04, 0.10, 0.04, 1.0);
        this.floorAppearance.setShininess(12.0);

        this.skyShader = new CGFshader(this.gl, "shaders/sky.vert", "shaders/sky.frag");
        this.skyShader.setUniformsValues({
            uSunDirection: this.sunDirection,
            uSunColor: [1.0, 0.92, 0.73]
        });

        this.cloudShader = new CGFshader(this.gl, "shaders/clouds.vert", "shaders/clouds.frag");
        this.cloudShader.setUniformsValues({ uCloudOffset: 0.0 });

        this.setUpdatePeriod(50);
    }

    initCameras() {
        this.camera = new CGFcamera(
            0.4,
            0.1,
            1000,
            vec3.fromValues(35, 25, 35),
            vec3.fromValues(0, 8, 0)
        );
    }

    initLights() {
        if (this.lights.length > 0) {
            this.lights[0].setPosition(this.sunDirection[0], this.sunDirection[1], this.sunDirection[2], 0);
            this.lights[0].setAmbient(0.20, 0.20, 0.24, 1.0);
            this.lights[0].setDiffuse(1.00, 0.95, 0.80, 1.0);
            this.lights[0].setSpecular(1.00, 0.90, 0.75, 1.0);
            this.lights[0].enable();
            this.lights[0].update();
        }

        if (this.lights.length > 1) {
            this.lights[1].setPosition(45, 85, -30, 1);
            this.lights[1].setAmbient(0.05, 0.05, 0.05, 1.0);
            this.lights[1].setDiffuse(1.00, 0.90, 0.70, 1.0);
            this.lights[1].setSpecular(0.80, 0.70, 0.60, 1.0);
            this.lights[1].setSpotDirection(-45, -85, 30);
            this.lights[1].setSpotExponent(8);
            this.lights[1].setSpotCutOff(55);
            this.lights[1].enable();
            this.lights[1].update();
        }
    }

    update(t) {
        this.cloudOffset = (t / 1000.0) * this.cloudSpeed;
        this.cloudShader.setUniformsValues({ uCloudOffset: this.cloudOffset });
    }

    updateLightStates() {
        if (this.lights.length > 0) {
            if (this.sunLightEnabled) this.lights[0].enable();
            else this.lights[0].disable();
            this.lights[0].update();
        }

        if (this.lights.length > 1) {
            if (this.spotLightEnabled) this.lights[1].enable();
            else this.lights[1].disable();
            this.lights[1].update();
        }
    }

    displaySkyDome() {
        this.pushMatrix();
        this.scale(this.skyRadius, this.skyRadius, this.skyRadius);

        // Gameplay is inside the dome, so render both sides for this pass.
        this.gl.disable(this.gl.CULL_FACE);

        this.skyAppearance.apply();
        this.setActiveShader(this.skyShader);
        this.skyShader.setUniformsValues({ uSunDirection: this.sunDirection });
        this.skyDome.display();

        if (this.showClouds) {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

            this.cloudAppearance.apply();
            this.setActiveShader(this.cloudShader);
            this.pushMatrix();
            // Draw clouds on a slightly inner shell to avoid z-overlap with the base sky.
            this.scale(0.985, 0.985, 0.985);
            this.skyDome.display();
            this.popMatrix();

            this.gl.disable(this.gl.BLEND);
        }

        this.gl.enable(this.gl.CULL_FACE);

        this.setActiveShader(this.defaultShader);
        this.popMatrix();
    }

    displayFloor() {
        this.pushMatrix();

        // Put a large green floor slightly below origin.
        this.translate(0, -0.02, 0);
        this.rotate(-Math.PI / 2, 1, 0, 0);
        this.scale(650, 650, 1);

        this.floorAppearance.apply();
        this.floor.display();

        this.popMatrix();
    }

    display() {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.updateProjectionMatrix();
        this.loadIdentity();
        this.applyViewMatrix();

        this.updateLightStates();

        if (this.showSky) {
            this.gl.depthMask(false);
            this.displaySkyDome();
            this.gl.depthMask(true);
        }

        this.displayFloor();

        if (this.displayAxis) {
            this.axis.display();
        }
    }
}
