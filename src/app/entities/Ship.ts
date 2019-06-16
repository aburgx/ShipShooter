import * as THREE from 'three';
import {Turret} from './Turret';

export class Ship {
    public turrets: Turret[] = [];
    public hitAbleParts: THREE.Object3D[] = [];
    public speed = 1;

    constructor(public model: THREE.Group) {
        this.hitAbleParts.push(model.getObjectByName('base'), model.getObjectByName('cabin'));
    }

    changeSpeed(amount: number) {
        if ((amount > 0 && this.speed !== 3) || (amount < 0 && this.speed !== 1)) {
            this.speed = Math.trunc(this.speed + amount);
        }
        console.log(`Speed: ${this.speed}`);
    }

    shoot(): THREE.Mesh {
        const turret = this.turrets[0];
        if (turret.hasReloaded()) {
            const projectile = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshPhongMaterial({color: 'darkgray'})
            );
            // set the position of the projectile from the turret
            turret.lastTimeShot = new Date();
            projectile.setRotationFromMatrix(turret.model.matrixWorld);
            const turretPos = turret.model.getWorldPosition(new THREE.Vector3());
            projectile.position.set(turretPos.x, turretPos.y - 1, turretPos.z);
            return projectile;
        }
        return null;
    }
}
