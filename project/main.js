import { CGFapplication } from "../lib/CGF.js";
import { MyScene } from "./src/MyScene.js";
import { MyInterface } from "./src/MyInterface.js";

function main() {
    const app = new CGFapplication(document.body);
    const scene = new MyScene();
    const myInterface = new MyInterface();

    app.init();
    app.setScene(scene);
    app.setInterface(myInterface);

    myInterface.setActiveCamera(scene.camera);

    app.run();
}

main();
