import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {Spaceship} from "./Spaceship";
import {registerMaterials} from "./materials";

const canvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    registerMaterials(scene);

    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    window.addEventListener('spaceship-collided', () => {
        document.getElementById('overlay').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('overlay').classList.add('hidden');
        }, 500);
    });

    // const ambient = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    // ambient.intensity = 0.5;

    const origin = BABYLON.MeshBuilder.CreateBox("origin", {size: 0.5}, scene);
    origin.position.set(0, 0, 0);

    const bottomWall = BABYLON.MeshBuilder.CreateBox('bottomWall', {height: 10, width: 100, depth: 1000}, scene);
    const topWall = BABYLON.MeshBuilder.CreateBox('topWall', {height: 10, width: 100, depth: 1000}, scene);
    const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', {height: 100, width: 10, depth: 1000}, scene);
    const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', {height: 100, width: 10, depth: 1000}, scene);
    bottomWall.material = scene.getMaterialByName('metal');
    topWall.material = scene.getMaterialByName('metal');
    leftWall.material = scene.getMaterialByName('metal');
    rightWall.material = scene.getMaterialByName('metal');
    bottomWall.position.z = 500;
    topWall.position.z = 500;
    leftWall.position.z = 500;
    rightWall.position.z = 500;
    bottomWall.position.y = -25;
    topWall.position.y = 25;
    leftWall.position.x = -25;
    rightWall.position.x = 25;
    bottomWall.checkCollisions = true;
    topWall.checkCollisions = true;
    leftWall.checkCollisions = true;
    rightWall.checkCollisions = true;

    Array.from({length: 25}, (_, index: number) => {
        const box = BABYLON.MeshBuilder.CreateBox(`box_${index}`, {size: 1}, scene);
        box.position.set(0, 0, (index+2)*75);
        box.checkCollisions = true;
    });

    let spaceShip = new Spaceship(scene, inputMap);
    const camera = new BABYLON.FollowCamera("Camera", new BABYLON.Vector3(0, 0, -10), scene, spaceShip.wrapper);
    camera.rotationOffset = 180;

    scene.onBeforeRenderObservable.add(() => {
        spaceShip.update();
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


