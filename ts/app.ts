import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {Spaceship} from "./Spaceship";
import {registerMaterials} from "./materials";
import {BonusRing} from "./BonusRing";
import {SpaceJunk} from "./SpaceJunk";
import {randomBetween} from "./helpers";
import Tunnel from "./Tunnel";

const canvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);
let spaceShip;
let bonusRings: BonusRing[] = [];
let spaceJunks: SpaceJunk[] = [];
let score: number = 350;
let isGameOver: boolean = false;

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

    const ambient = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    ambient.intensity = 0.5;

    new Tunnel(scene);

    bonusRings = Array.from({length: 10}, () => {
        const position = new BABYLON.Vector3(randomBetween(-20, 20), randomBetween(-20, 20), randomBetween(100, 900));
       return  new BonusRing(scene, position);
    });

    spaceJunks = Array.from({length: 100}, () => {
        const position = new BABYLON.Vector3(randomBetween(-20, 20), randomBetween(-20, 20), randomBetween(50, 1500));
        return new SpaceJunk(scene, position);
    });

    spaceShip = new Spaceship(scene, inputMap);

    window.addEventListener("spaceship-collided", () => {
        document.getElementById("overlay").classList.remove("hidden");
        setTimeout(() => {
            if (spaceShip.healthStatus.current > 0) {
                document.getElementById("overlay").classList.add("hidden");
            }
        }, 500);
    });

    window.addEventListener("bonus-ring-destroyed", () => {
        score += 500;
    });

    scene.onBeforeRenderObservable.add(() => {
        spaceShip.update();
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    if (isGameOver) {
        return;
    }
    scene.render();

    bonusRings.forEach((ring: BonusRing) => {
        ring.update(spaceShip.wrapper);
    });
    bonusRings = bonusRings.filter(ring => !ring.hasCollided);

    spaceJunks.forEach(junk => {
        junk.update();
        if (junk.wrapper.position.z < spaceShip.wrapper.position.z - 50) {
            junk.wrapper.position.z = 1000 + randomBetween(5, 300);
        }
    });

    score--;

    const {current, max} = spaceShip.healthStatus;
    document.getElementById("health").innerText = `Health: ${current} / ${max}`;
    document.getElementById("exit").innerText = `Distance: ${Math.max(0, Math.floor(1000 - spaceShip.wrapper.position.z))}`;
    document.getElementById("score").innerText = `Score: ${Math.max(0,score)}`;

    if (spaceShip.healthStatus.current <= 0) {
        scene.activeCamera = spaceShip.rearViewCamera;
        document.getElementById("overlay").classList.remove("hidden");
        setTimeout(() => isGameOver = true, 1000);
    }
    if (score <= 0) {
        scene.activeCamera = spaceShip.rearViewCamera;
        document.getElementById("overlay").classList.remove("hidden");
        setTimeout(() => isGameOver = true, 1000);
    }

    if (spaceShip.wrapper.position.z > 1000) {
        spaceShip.isInvulnerable = true;
        scene.activeCamera = spaceShip.rearViewCamera;
        spaceJunks.forEach(junk => junk.dispose());
        setTimeout(() => isGameOver = true, 2500);
    }
});

window.addEventListener("resize", function () {
    engine.resize();
});


