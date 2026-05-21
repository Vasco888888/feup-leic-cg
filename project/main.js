import { CGFapplication } from "../lib/CGF.js";
import { MyScene } from "./src/MyScene.js";
import { MyInput } from "./src/MyInput.js";

function main() {
    const app = new CGFapplication(document.body);
    const scene = new MyScene();
    const input = new MyInput();

    app.init();
    app.setScene(scene);
    app.setInterface(input);

    input.setActiveCamera(scene.camera);

    app.run();
}

main();
