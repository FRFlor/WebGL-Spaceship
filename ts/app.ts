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

    Array.from({length: 200}, (_, index: number) => {
        const box = BABYLON.MeshBuilder.CreateBox(`box_${index}`, {size: 0.5}, scene);
        box.position.set(0, 0, index*5);
    });

    let spaceShip = BABYLON.MeshBuilder.CreateBox("spaceship", {height: 1, width: 4, depth: 5}, scene);
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

    var inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    // Game/Render loop
    scene.onBeforeRenderObservable.add(() => {
        if (inputMap["w"] || inputMap["ArrowUp"]) {
            spaceShip.position.y += 0.1;
            spaceShip.rotation.x = BABYLON.Tools.ToRadians(-30);
        }
        if (inputMap["a"] || inputMap["ArrowLeft"]) {
            spaceShip.position.x -= 0.1;
            spaceShip.rotation.z = BABYLON.Tools.ToRadians(20);
        }
        if (inputMap["s"] || inputMap["ArrowDown"]) {
            spaceShip.position.y -= 0.1;
            spaceShip.rotation.x = BABYLON.Tools.ToRadians(30);
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            spaceShip.position.x += 0.1;
            spaceShip.rotation.z = BABYLON.Tools.ToRadians(-20);
        }

        const oneDegree: number = BABYLON.Tools.ToRadians(1);
        ['x','y','z'].forEach(axis => {
            if (spaceShip.rotation[axis] !== 0) {
                spaceShip.rotation[axis] += spaceShip.rotation[axis] > 0 ? -oneDegree : oneDegree;
            }
            if (spaceShip.rotation[axis] >= -oneDegree && spaceShip.rotation[axis] <= oneDegree) {
                spaceShip.rotation[axis] = 0;
            }
        });

        spaceShip.position.z += 1;
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});


