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
        const box = BABYLON.MeshBuilder.CreateBox(`box_${index}`, {size: 1}, scene);
        box.position.set(0, 0, (index+2)*75);
        box.checkCollisions = true;
    });

    let spaceShip = BABYLON.MeshBuilder.CreateBox("spaceship", {height: 1, width: 4, depth: 5}, scene);
    spaceShip.material = wireframe;
    spaceShip.ellipsoid = new BABYLON.Vector3(4, 1, 2);
    spaceShip.checkCollisions = true;
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
        const stabilizationStepAngle: number = BABYLON.Tools.ToRadians(1);
        const maneuverStepAngle: number = BABYLON.Tools.ToRadians(3);
        const maxManeuverAngle: number = BABYLON.Tools.ToRadians(20);

        if (inputMap["w"] || inputMap["ArrowUp"]) {
            spaceShip.moveWithCollisions(new BABYLON.Vector3(0, 0.1 , 0));
            if (spaceShip.rotation.x >= -maxManeuverAngle) {
                spaceShip.addRotation(-maneuverStepAngle, 0, 0);
            }
        }
        if (inputMap["a"] || inputMap["ArrowLeft"]) {
            spaceShip.moveWithCollisions(new BABYLON.Vector3(-0.1, 0 , 0));
            if (spaceShip.rotation.z <= maxManeuverAngle) {
                spaceShip.addRotation(0, 0, maneuverStepAngle);
            }
        }
        if (inputMap["s"] || inputMap["ArrowDown"]) {
            spaceShip.moveWithCollisions(new BABYLON.Vector3(0, -0.1 , 0));
            if (spaceShip.rotation.x <= maxManeuverAngle) {
                spaceShip.addRotation(maneuverStepAngle, 0, 0);
            }
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            spaceShip.moveWithCollisions(new BABYLON.Vector3(0.1, 0 , 0));
            if (spaceShip.rotation.z >= -maxManeuverAngle) {
                spaceShip.addRotation(0, 0, -maneuverStepAngle);
            }
        }

        const rotationAxisByKeyboardInput = {
            w: 'x',
            s: 'x',
            a: 'z',
            d: 'z'
        };

        ['x','y','z'].forEach(axis => {
            const isKeyPressed = Object.keys(rotationAxisByKeyboardInput).some( key => {
                return rotationAxisByKeyboardInput[key] === axis && inputMap[key]
            });
            if (isKeyPressed) {
                return;
            }
            if (spaceShip.rotation[axis] !== 0) {
                spaceShip.rotation[axis] += spaceShip.rotation[axis] > 0 ? -stabilizationStepAngle : stabilizationStepAngle;
            }
            if (spaceShip.rotation[axis] >= -stabilizationStepAngle && spaceShip.rotation[axis] <= stabilizationStepAngle) {
                spaceShip.rotation[axis] = 0;
            }
        });

        const desiredZ = spaceShip.position.z + 1;
        spaceShip.moveWithCollisions(new BABYLON.Vector3(0, 0 , 1));

        if (spaceShip.position.z > 5 && desiredZ - spaceShip.position.z > 0.5) {
            // alert('Oh, U DED!!');
        }
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


