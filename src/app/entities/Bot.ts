import * as THREE from 'three';
import {Ship} from './Ship';

export class Bot {
    constructor(public ship: Ship) {
    }

    start(player: Ship) {
        setInterval(() => this.interact(player), 1000);
    }

    interact(player: Ship) {
        // get distance to player ship
        const botPos = this.ship.model.position;
        const playerPos = player.model.position;
        const distance = botPos.distanceTo(playerPos);

        if (distance < 50) {
            this.ship.speed = 0.1;
        }

        const directionVector = new THREE.Vector3().subVectors(botPos, playerPos);
        this.rotateTo(directionVector);

        if (distance >= 100) {
            this.ship.speed = 0.3;
        } else if (distance >= 50) {
            this.ship.speed = 0.2;

        } else {
            this.ship.speed = 0.1;
        }
    }

    private rotateTo(directionVector: THREE.Vector3) {
        const mx = new THREE.Matrix4().lookAt(
            directionVector,
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0)
        );
        this.ship.model.setRotationFromMatrix(mx);
    }
}
