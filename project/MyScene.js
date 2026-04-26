import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFshader, CGFtexture } from "../lib/CGF.js";
import { MySkyDome } from "./MySkyDome.js";
import { MyPlane } from "./MyPlane.js";
import { MyWagon } from "./models/wagon/MyWagon.js";
import { MyHayBale } from "./models/hay-bale/MyHayBale.js";
import { MyBarn } from "./models/barn/MyBarn.js";

export class MyScene extends CGFscene {
    constructor() {
        super();

        this.displayAxis = true;
        this.showSky = true;
        this.showClouds = true;

        this.sunLightEnabled = true;
        this.spotLightEnabled = true;

        this.cloudSpeed = 0.01;
        this.cloudOffset = 0.0;
        this.skyRadius = 260.0;

        this.sunDirection = vec3.fromValues(-0.35, 0.72, -0.60);
        this.dayCycleSpeed = 0.2;
        this.dayTime = 0;
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
        this.wagon = new MyWagon(this);
        this.hayBale = new MyHayBale(this);
        this.barn = new MyBarn(this);
        this.barnPos = { x: -20, z: -20 };

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
        this.moonTexture = new CGFtexture(this, "textures/environment/moon.jpg");
        this.skyShader.setUniformsValues({
            uSunDirection: this.sunDirection,
            uSunColor: [1.0, 0.92, 0.73],
            uMoonTexture: 0
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
        this.setGlobalAmbientLight(0.3, 0.3, 0.35, 1.0);

        if (this.lights.length > 0) {
            this.lights[0].setPosition(this.sunDirection[0], this.sunDirection[1], this.sunDirection[2], 0);
            this.lights[0].setAmbient(0.4, 0.4, 0.45, 1.0);
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
        this.dayTime = (t / 1000.0) * this.dayCycleSpeed;
        this.sunDirection = vec3.fromValues(
            Math.cos(this.dayTime),
            Math.sin(this.dayTime),
            -0.6
        );
        this.moonDirection = vec3.fromValues(
            -this.sunDirection[0],
            -this.sunDirection[1],
            -this.sunDirection[2]
        );

        this.cloudOffset = ((t / 1000.0) * this.cloudSpeed) % 1000.0;
        
        this.skyShader.setUniformsValues({ 
            uSunDirection: this.sunDirection,
            uMoonDirection: this.moonDirection
        });

        // Sync Light 0 with moving Sun
        if (this.lights.length > 0) {
            this.lights[0].setPosition(this.sunDirection[0], this.sunDirection[1], this.sunDirection[2], 0);
            this.lights[0].update();
        }
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
        this.moonTexture.bind(0);
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

        this.wagon.display();

        // Display Barn
        this.pushMatrix();
        this.translate(this.barnPos.x, 0, this.barnPos.z);
        this.barn.display();
        this.popMatrix();

        // Display Hay Bale
        this.pushMatrix();
        this.translate(5, 0.25, 5);
        this.hayBale.display();
        this.popMatrix();

        if (this.displayAxis) {
            this.axis.display();
        }
    }
}
