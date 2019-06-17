import * as THREE from 'three';
import {Ship} from './Ship';

export class Bot {
    constructor(public ship: Ship) {
    }

    interact(playerPos: THREE.Vector3, onShoot, onDeath) {
        // get distance to player ship
        const botPos = this.ship.model.position;
        const distance = botPos.distanceTo(playerPos);

        this.ship.turrets[0].model.lookAt(playerPos);
        this.ship.turrets[0].model.rotateY(THREE.Math.degToRad(-90));

        if (distance > 50) {
            this.ship.changeSpeed(1);
            const random = Math.random();
            if (random >= 0.7) {
                this.ship.model.lookAt(playerPos);
                this.ship.model.rotateY(THREE.Math.degToRad(THREE.Math.randInt(-80, -100)));
            } else if (random >= 0.4) {
                this.ship.model.rotateY(THREE.Math.degToRad(THREE.Math.randInt(-40, 40)));
            }
        } else {
            this.ship.changeSpeed(-1);
            this.ship.turrets[0].model.lookAt(playerPos);
            this.ship.turrets[0].model.rotateY(THREE.Math.degToRad(-90));
            // shoot at the player ship
            const projectile = this.ship.shoot();
            if (projectile !== null) {
                onShoot(projectile);
            }
        }

        if (distance > 80) {
            this.ship.changeSpeed(0.1);
        }
        if (this.ship.health > 0) {
            setTimeout(() => this.interact(playerPos, onShoot, onDeath), 1000);
        } else {
            onDeath();
        }
    }

}
