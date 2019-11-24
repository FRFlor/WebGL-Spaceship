import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {renderAxes} from "./helpers";

const canvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    const light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

    const wireframe = new BABYLON.StandardMaterial("wireframeMaterial", scene);
    wireframe.wireframe = true;

    const origin = BABYLON.MeshBuilder.CreateBox("origin", {size: 0.5}, scene);
    origin.position.set(0, 0, 0);

    let spaceShip = BABYLON.MeshBuilder.CreateBox('spaceship', {height: 1, width: 4, depth: 5}, scene);
    spaceShip.material = wireframe;
    let local = renderAxes(3, scene);
    local.parent = spaceShip;

    // const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0, 0, 7), scene);
    const camera = new BABYLON.FollowCamera("Camera", new BABYLON.Vector3(0, 0, 5), scene);
    camera.attachControl(canvas, true);

    BABYLON.SceneLoader.ImportMesh("", "./resources/gltf/low_poly_space_ship/", "scene.gltf", scene, (model) => {
        model[0].position.y -= 0.85;
        model[0].parent = spaceShip;
        camera.lockedTarget = model[0];
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    // scene.getMeshByName("spaceship").rotate(new BABYLON.Vector3(0, 0, 1), 0.01);
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});


