import { CGFapplication } from "../lib/CGF.js";
import { MyScene } from "./MyScene.js";
import { MyInterface } from "./MyInterface.js";

function main() {
    const app = new CGFapplication(document.body);
    const scene = new MyScene();
    const gui = new MyInterface();

    app.init();
    app.setScene(scene);
    app.setInterface(gui);

    gui.setActiveCamera(scene.camera);

    app.run();
}

main();
