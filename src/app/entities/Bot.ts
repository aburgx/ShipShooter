import * as THREE from 'three';
import {Ship} from './Ship';

export class Bot {
    constructor(public ship: Ship) {
    }

    interact(playerPos: THREE.Vector3, onShoot, onRotate) {
        // get distance to player ship
        const botPos = this.ship.model.position;
        const distance = botPos.distanceTo(playerPos);

        this.ship.turrets[0].model.lookAt(playerPos);
        this.ship.turrets[0].model.rotateY(THREE.Math.degToRad(-90));
        if (distance > 50) {
            this.ship.changeSpeed(1);
            // rotate towards player ship
            const copy = this.ship.model.clone();
            copy.lookAt(playerPos);
            const diff = copy.rotation.y - this.ship.model.rotation.y;
            onRotate(copy.rotation, Math.abs(diff));
            // this.ship.model.lookAt(playerPos);
            // this.ship.model.rotateY(THREE.Math.degToRad(-90));
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
        setTimeout(() => this.interact(playerPos, onShoot, onRotate), 1000);
    }

}
