import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
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
let isGameOver: boolean = true;

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    registerMaterials(scene);

    var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const button = GUI.Button.CreateSimpleButton("start-game-button", "Start Game");
    button.width = 0.2;
    button.height = "40px";
    button.color = "white";
    button.background = "green";
    advancedTexture.addControl(button);
    button.onPointerClickObservable.add(() => {
        window.dispatchEvent(new Event("start-game"));
        button.isVisible = false;
    });

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
        return new BonusRing(scene, position);
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
        document.getElementById("extra-score").classList.add("float-up");
        setTimeout(() => document.getElementById("extra-score").classList.remove("float-up"), 2000);
        score += 500;
    });

    return scene;
};

let scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
    if (isGameOver) {
        return;
    }
    spaceShip.update();

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
    document.getElementById("health").innerHTML = `Health: <progress min="0" max="${max}" value="${current}"/>`;
    document.getElementById("distance").innerText = `${Math.max(0, Math.floor(1000 - spaceShip.wrapper.position.z))} m`;
    document.getElementById("score").innerText = `Score: ${Math.max(0, score)}`;

    if (spaceShip.healthStatus.current <= 0) {
        scene.activeCamera = spaceShip.rearViewCamera;
        document.getElementById("overlay").classList.remove("hidden");
        setTimeout(onGameOver, 1000);
    }
    if (score <= 0) {
        scene.activeCamera = spaceShip.rearViewCamera;
        document.getElementById("overlay").classList.remove("hidden");
        setTimeout(onGameOver, 1000);
    }

    if (spaceShip.wrapper.position.z > 1000) {
        spaceShip.isInvulnerable = true;
        scene.activeCamera = spaceShip.rearViewCamera;
        spaceJunks.forEach(junk => junk.dispose());
        setTimeout(onGameOver, 2500);
    }
});

function onGameOver() {
    document.getElementById("end-screen").classList.remove("hidden");
    document.getElementById("HUD").classList.add("hidden");
    document.getElementById("score-report").innerText = `Final Score: ${Math.max(0, score)}`;
    document.getElementById("end-text").innerText = spaceShip.healthStatus.current > 0 && score > 0
        ? "Congratulations! You've escaped!"
        : "Game Over!";
    isGameOver = true;
}

window.addEventListener("start-game", () => {
    isGameOver = false;
    document.getElementById("introduction").classList.add("hidden");
    document.getElementById("HUD").classList.remove("hidden");
});

window.addEventListener("resize", function () {
    engine.resize();
});


