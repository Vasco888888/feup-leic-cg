import { CGFscene, CGFappearance, CGFshader, CGFtexture } from "../../lib/CGF.js";
import { MySkyDome } from "../models/environment/MySkyDome.js";
import { MyPlane } from "../models/primitives/MyPlane.js";
import { MyWagon } from "../models/props/wagon/MyWagon.js";
import { MyHayBale } from "../models/props/hay-bale/MyHayBale.js";
import { MyHayBaleArrow } from "../models/props/hay-bale/MyHayBaleArrow.js";
import { MyBarn } from "../models/props/barn/MyBarn.js";
import { MyDeliveryZone } from "../models/props/barn/MyDeliveryZone.js";
import { MyTerrain } from "../models/environment/MyTerrain.js";
import { MyRockSet } from "../models/environment/MyRockSet.js";
import { MyFlowerSet } from "../models/environment/MyFlowerSet.js";
import { MyGrassSet } from "../models/environment/MyGrassSet.js";
import { MyMountainPanorama } from "../models/environment/MyMountainPanorama.js";
import { MyGameplay } from "./MyGameplay.js";
import { MyLighting } from "./MyLighting.js";
import { MyChaseCamera } from "./MyChaseCamera.js";

export class MyScene extends CGFscene {
    constructor() {
        super();

        this.showSky = true;
        this.showClouds = true;
        this.showTerrain = true;
        this.terrainWireframe = false;
        this.showRocks = true;
        this.showFlowers = true;
        this.showGrass = true;

        this.cloudSpeed = 0.01;
        this.cloudOffset = 0.0;
        this.skyRadius = 760.0;
        this.terrainYOffset = 0.0;

        // wagon physics needs a real dt between frames
        this.lastUpdateTime = null;

        // arrows only float above bales the wagon is close to, so finding them feels earned
        this.baleArrowRange = 55.0;

        this.lighting = new MyLighting(this);
        this.chaseCamera = new MyChaseCamera(this);
    }

    init(application) {
        super.init(application);

        this.chaseCamera.init();
        this.lighting.init();

        this.gl.clearColor(0.53, 0.75, 0.96, 1.0);
        this.gl.clearDepth(100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.enableTextures(true);

        this.skyDome = new MySkyDome(this, 80, 28);
        this.floor = new MyPlane(this, 20);
        this.wagon = new MyWagon(this);
        this.hayBale = new MyHayBale(this);
        this.hayBaleArrow = new MyHayBaleArrow(this);
        this.barn = new MyBarn(this);
        this.barnPos = { x: -20, z: -20 };
        this.terrain = new MyTerrain(this, 144, 3000, 12, 42);
        // sits just in front of the barn door (barn front face at world Z = barnPos.z + 5)
        this.deliveryZone = new MyDeliveryZone(this, this.barnPos.x, this.barnPos.z + 12, 5.5, this.terrain);
        this.rockSet = new MyRockSet(this, this.terrain, 95, 520, 123);
        this.flowerSet = new MyFlowerSet(this, this.terrain, 150, 500, 777);
        // many small patches so they hug the rolling hills
        this.grassSet = new MyGrassSet(this, this.terrain, 3500, 480, 580, 456);
        // panoramas sit just outside the terrain disc so the rim never occludes their foothills
        this.mountainPanorama = new MyMountainPanorama(this, 96, 85, 615, 60);
        this.mountainFarPanorama = new MyMountainPanorama(this, 96, 190, 720, 22);

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

        this.mountainAppearance = new CGFappearance(this);
        this.mountainAppearance.setAmbient(1, 1, 1, 1);
        this.mountainAppearance.setDiffuse(1, 1, 1, 1);
        this.mountainAppearance.setSpecular(0, 0, 0, 1);
        this.mountainAppearance.setShininess(1.0);
        this.mountainTexture = new CGFtexture(this, "textures/environment/sky/hills.png");
        this.mountainAppearance.setTexture(this.mountainTexture);
        this.mountainAppearance.setTextureWrap('REPEAT', 'CLAMP_TO_EDGE');

        this.mountainFarAppearance = new CGFappearance(this);
        this.mountainFarAppearance.setAmbient(0.5, 0.5, 0.6, 1); // darker silhouette for the far layer
        this.mountainFarAppearance.setDiffuse(0.5, 0.5, 0.6, 1);
        this.mountainFarAppearance.setSpecular(0, 0, 0, 1);
        this.mountainFarAppearance.setShininess(1.0);
        this.mountainFarTexture = new CGFtexture(this, "textures/environment/sky/mountains.png");
        this.mountainFarAppearance.setTexture(this.mountainFarTexture);
        this.mountainFarAppearance.setTextureWrap('REPEAT', 'CLAMP_TO_EDGE');


        this.terrainAppearance = new CGFappearance(this);
        this.terrainAppearance.setAmbient(0.8, 0.8, 0.8, 1.0);
        this.terrainAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.terrainAppearance.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.terrainAppearance.setShininess(8.0);

        this.grassTexture = new CGFtexture(this, "textures/environment/terrain/grass.jpeg");
        this.dirtTexture = new CGFtexture(this, "textures/environment/terrain/dirt.png");
        this.flowerTexture = new CGFtexture(this, "textures/environment/terrain/flowers.png");

        this.terrainShader = new CGFshader(this.gl, "shaders/terrain.vert", "shaders/terrain.frag");
        this.terrainShader.setUniformsValues({
            uGrassTexture: 0,
            uDirtTexture: 1,
            uFlowerTexture: 2,
            uTerrainSize: 3000.0,
            uTerrainRadius: 1495.0,
            uLightDir: this.lighting.sunDirection,
            uAmbientStrength: 0.18,
            uDiffuseStrength: 0.65,
            uLamp0Pos: [0, 0, 0],
            uLamp1Pos: [0, 0, 0],
            uLampColor: [1.0, 0.7, 0.2],
            uLampRange: 16.0,
            uLampStrength: 0.0,
            uAOWagon: [0, 0, 1, 0],
            uAOBarn:  [0, 0, 1, 0],
            uAOBale0: [0, 0, 1, 0],
            uAOBale1: [0, 0, 1, 0],
            uAOBale2: [0, 0, 1, 0],
            uCloudOffset: 0.0,
            uCloudShadow: 0.35
        });

        this.skyShader = new CGFshader(this.gl, "shaders/sky.vert", "shaders/sky.frag");
        this.moonTexture = new CGFtexture(this, "textures/environment/sky/moon.jpg");
        this.skyShader.setUniformsValues({
            uSunDirection: this.lighting.sunDirection,
            uSunColor: [1.0, 0.92, 0.73],
            uMoonTexture: 0
        });

        this.cloudShader = new CGFshader(this.gl, "shaders/clouds.vert", "shaders/clouds.frag");
        this.cloudShader.setUniformsValues({ uCloudOffset: 0.0 });

        this.mountainShader = new CGFshader(this.gl, "shaders/mountain.vert", "shaders/mountain.frag");
        this.mountainShader.setUniformsValues({
            uTexture: 0,
            uTint: [1.0, 1.0, 1.0],
            uFogColor: [0.78, 0.85, 0.92],
            uFogStrength: 0.0,
            uPanoramaHeight: 1.0,
            uSunInfluence: 1.0
        });

        this.gameplay = new MyGameplay(this);
        this.gameplay.init();

        this.setUpdatePeriod(50);
    }

    update(t) {
        // dt in seconds, clamped so a tab-switch pause doesn't teleport the wagon
        let dt = 0;
        if (this.lastUpdateTime !== null) {
            dt = (t - this.lastUpdateTime) / 1000.0;
            if (dt < 0) dt = 0;
            if (dt > 0.1) dt = 0.1;
        }
        this.lastUpdateTime = t;
        this.currentTime = t;

        const playing = this.gameplay.isPlaying();

        if (playing && dt > 0) {
            this.gameplay.tick(dt);
        }

        this.lighting.update(t, dt, playing);

        // clouds and grass are time-driven — freeze them with the rest of the world while menu is up
        if (playing) {
            this.cloudOffset = ((t / 1000.0) * this.cloudSpeed) % 1000.0;
            this.grassSet.update(t, this.lighting.sunInfluence);
        }

        if (playing && this.wagon && dt > 0) {
            this.wagon.update(dt, this.getColliders());
            // wheels need to ride on the terrain, not the abstract plane at Y=0
            this.wagon.position[1] = this.terrain.getTerrainHeight(
                this.wagon.position[0],
                this.wagon.position[2]
            );
            this.wagon.applyTerrainTilt(this.terrain, dt);
            this.gameplay.handleHayBaleKeys();
            this.gameplay.applyImpactDamage();
            this.gameplay.applyDelivery();
            if (this.chaseCamera.follow) this.chaseCamera.update(dt);
        }

        this.updateTerrainEnvironment();
        this.gameplay.updateHUD();

        // bounce back to menu the moment the wagon dies (HUD already shows the final HP=0 + score)
        if (playing && this.gameplay.wagonHP <= 0) {
            this.gameplay.showMenu();
        }
    }

    updateTerrainEnvironment() {
        if (!this.terrainShader) return;

        const aoOff = [0, 0, 1, 0];
        const aoFor = (pos, radius, strength) => [pos[0], pos[2], radius, strength];

        const aoWagon = this.wagon
            ? aoFor(this.wagon.position, 4.2, 0.55)
            : aoOff;
        const aoBarn = this.barnPos
            ? [this.barnPos.x, this.barnPos.z, 5.5, 0.6]
            : aoOff;

        const baleSlots = [aoOff, aoOff, aoOff];
        let slot = 0;
        for (const bale of this.gameplay.bales) {
            if (bale.held || slot >= 3) continue;
            baleSlots[slot++] = [bale.pos[0], bale.pos[2], 1.8, 0.5];
        }

        this.terrainShader.setUniformsValues({
            uCloudOffset: this.cloudOffset,
            uAOWagon: aoWagon,
            uAOBarn: aoBarn,
            uAOBale0: baleSlots[0],
            uAOBale1: baleSlots[1],
            uAOBale2: baleSlots[2]
        });
    }

    getColliders() {
        const colliders = this.rockSet ? this.rockSet.getColliders() : [];

        // barn footprint: 10x10 square, treated as a tight circle
        colliders.push({ x: this.barnPos.x, z: this.barnPos.z, radius: 6.5 });

        // silos and other barn-side props expose their own local footprints
        if (this.barn && this.barn.getColliders) {
            for (const c of this.barn.getColliders()) {
                colliders.push({
                    x: this.barnPos.x + c.localX,
                    z: this.barnPos.z + c.localZ,
                    radius: c.radius
                });
            }
        }

        // every grounded hay bale is a soft collider so the horse can muzzle
        // up to it, but the wagon bed still bumps into it
        for (const bale of this.gameplay.bales) {
            if (!bale.held) {
                colliders.push({ x: bale.pos[0], z: bale.pos[2], radius: 1.5, soft: true });
            }
        }

        return colliders;
    }

    displaySkyDome() {
        this.pushMatrix();
        // keep the dome centred on the camera so its edge never drifts into view
        if (this.camera) {
            this.translate(this.camera.position[0], 0, this.camera.position[2]);
        }
        this.scale(this.skyRadius, this.skyRadius, this.skyRadius);

        // camera lives inside the dome, so render both sides
        this.gl.disable(this.gl.CULL_FACE);

        this.skyAppearance.apply();
        this.setActiveShader(this.skyShader);
        this.skyShader.setUniformsValues({ uSunDirection: this.lighting.sunDirection });
        this.moonTexture.bind(0);
        this.skyDome.display();

        if (this.showClouds) {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

            this.cloudAppearance.apply();
            this.setActiveShader(this.cloudShader);
            this.cloudShader.setUniformsValues({ uCloudOffset: this.cloudOffset });
            this.pushMatrix();
            // inner shell avoids z-fighting with the base sky
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

        // sits just below the terrain base so it never z-fights
        this.translate(0, this.terrainYOffset - 0.02, 0);
        this.rotate(-Math.PI / 2, 1, 0, 0);
        this.scale(3000, 3000, 1);

        this.floorAppearance.apply();
        this.floor.display();

        this.popMatrix();
    }

    displayTerrain() {
        this.pushMatrix();

        this.translate(0, this.terrainYOffset, 0);

        this.terrainAppearance.apply();
        this.setActiveShader(this.terrainShader);

        this.grassTexture.bind(0);
        this.dirtTexture.bind(1);
        this.flowerTexture.bind(2);

        if (this.terrainWireframe) {
            this.terrain.setLineMode();
        } else {
            this.terrain.setFillMode();
        }

        this.terrain.display();

        this.setActiveShader(this.defaultShader);
        this.popMatrix();
    }

    display() {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.updateProjectionMatrix();
        this.loadIdentity();
        this.applyViewMatrix();

        this.lighting.updateLightStates();

        if (this.showSky) {
            this.gl.depthMask(false);
            this.displaySkyDome();
            this.gl.depthMask(true);
        }

        if (this.showTerrain) {
            this.displayTerrain();
        } else {
            this.displayFloor();
        }

        if (this.showRocks) {
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.rockSet.display();
            this.popMatrix();
        }

        if (this.showFlowers) {
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.flowerSet.display();
            this.popMatrix();
        }

        if (this.showGrass) {
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.grassSet.display();
            this.popMatrix();
        }

        this.displayMountainPanorama();

        this.pushMatrix();
        this.translate(0, this.terrainYOffset, 0);
        this.wagon.display();
        this.popMatrix();

        this.pushMatrix();
        // sit the barn on the terrain at its centre; MyBarn sinks itself a bit
        // more to keep the foundation embedded as the terrain undulates
        const barnY = this.terrain ? this.terrain.getTerrainHeight(this.barnPos.x, this.barnPos.z) : 0;
        this.translate(this.barnPos.x, this.terrainYOffset + barnY, this.barnPos.z);
        this.barn.display();
        this.popMatrix();

        if (this.deliveryZone) {
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.deliveryZone.display(this.gameplay.wagonInDeliveryZone);
            this.popMatrix();
        }

        // bales: cull distant ones so we don't pay for unseen geometry
        const camX = this.camera ? this.camera.position[0] : 0;
        const camZ = this.camera ? this.camera.position[2] : 0;
        const baleCullDistSq = 160 * 160;
        const arrowRangeSq = this.baleArrowRange * this.baleArrowRange;

        for (const bale of this.gameplay.bales) {
            if (bale.held) continue;
            const cdx = bale.pos[0] - camX;
            const cdz = bale.pos[2] - camZ;
            if (cdx * cdx + cdz * cdz > baleCullDistSq) continue;
            const groundY = this.terrain.getTerrainHeight(bale.pos[0], bale.pos[2]);
            this.pushMatrix();
            // bale geometry is centred (half-y 0.25 * scale 1.5 = 0.375), so lift
            // by that amount to sit the base flush with the terrain
            this.translate(bale.pos[0], groundY + 0.375, bale.pos[2]);
            this.scale(1.5, 1.5, 1.5);
            this.hayBale.display();
            this.popMatrix();
        }

        // batch the arrows under one shader bind so we don't switch per bale
        this.hayBaleArrow.beginBatch();
        for (const bale of this.gameplay.bales) {
            if (bale.held) continue;
            const dx = bale.pos[0] - this.wagon.position[0];
            const dz = bale.pos[2] - this.wagon.position[2];
            if (dx * dx + dz * dz >= arrowRangeSq) continue;
            const groundY = this.terrain.getTerrainHeight(bale.pos[0], bale.pos[2]);
            this.pushMatrix();
            this.translate(bale.pos[0], groundY + 0.75 + 1.4, bale.pos[2]);
            this.hayBaleArrow.drawInstance();
            this.popMatrix();
        }
        this.hayBaleArrow.endBatch();
    }

    displayMountainPanorama() {
        this.pushMatrix();

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        const hazeColor = this.getMountainHazeColor();

        this.setActiveShader(this.mountainShader);

        this.pushMatrix();
        this.translate(0, this.terrainYOffset - 44, 0);
        this.mountainFarAppearance.apply();
        this.mountainFarTexture.bind(0);
        this.mountainShader.setUniformsValues({
            uTexture: 0,
            uTint: [0.78, 0.82, 0.92],
            uFogColor: hazeColor,
            uFogStrength: 0.55,
            uPanoramaHeight: this.mountainFarPanorama.height,
            uSunInfluence: this.lighting.sunInfluence,
            uSunDir: this.lighting.sunDirection
        });
        this.mountainFarPanorama.display();
        this.popMatrix();

        this.pushMatrix();
        this.translate(0, this.terrainYOffset - 7, 0);
        this.mountainAppearance.apply();
        this.mountainTexture.bind(0);
        this.mountainShader.setUniformsValues({
            uTexture: 0,
            uTint: [1.0, 1.0, 1.0],
            uFogColor: hazeColor,
            uFogStrength: 0.22,
            uPanoramaHeight: this.mountainPanorama.height,
            uSunInfluence: this.lighting.sunInfluence,
            uSunDir: this.lighting.sunDirection
        });
        this.mountainPanorama.display();
        this.popMatrix();

        this.setActiveShader(this.defaultShader);

        this.gl.disable(this.gl.BLEND);
        this.popMatrix();
    }

    getMountainHazeColor() {
        const sunElevation = this.lighting.sunDirection[1];
        const day = [0.75, 0.85, 0.95];
        const sunset = [0.92, 0.62, 0.45];
        const night = [0.12, 0.15, 0.22];
        const daySunsetMix = MyLighting.smoothstep(-0.15, 0.35, sunElevation);
        const sunsetNightMix = MyLighting.smoothstep(-0.5, -0.1, sunElevation);
        const out = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            const sd = sunset[i] + (day[i] - sunset[i]) * daySunsetMix;
            out[i] = night[i] + (sd - night[i]) * sunsetNightMix;
        }
        return out;
    }
}
