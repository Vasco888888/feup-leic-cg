import { CGFinterface, dat } from "../lib/CGF.js";

export class MyInterface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        super.init(application);

        this.gui = new dat.GUI();

        this.gui.add(this.scene, "displayAxis").name("Display Axis");

        const skyFolder = this.gui.addFolder("Sky");
        skyFolder.add(this.scene, "showSky").name("Show Sky");
        skyFolder.add(this.scene, "showClouds").name("Show Clouds");
        skyFolder.add(this.scene, "skyRadius", 120, 600).name("Sky Radius");
        skyFolder.add(this.scene, "cloudSpeed", 0.0, 0.08).name("Cloud Speed");

        const terrainFolder = this.gui.addFolder("Terrain");
        terrainFolder.add(this.scene, "showTerrain").name("Show Terrain");
        terrainFolder.add(this.scene, "terrainWireframe").name("Wireframe");
        terrainFolder.add(this.scene, "showRocks").name("Show Rocks");
        terrainFolder.add(this.scene, "showFlowers").name("Show Flowers");
        terrainFolder.add(this.scene, "showGrass").name("Show Grass");

        const lightFolder = this.gui.addFolder("Sun Lighting");
        lightFolder.add(this.scene, "sunLightEnabled").name("Directional Sun");
        lightFolder.add(this.scene, "spotLightEnabled").name("Spotlight");
        lightFolder.add(this.scene, "pauseDayCycle").name("Pause Cycle");

        return true;
    }
}
