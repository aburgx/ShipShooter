import * as THREE from 'three';
import {Turret} from './Turret';

export class Ship {
    public turrets: Turret[] = [];
    public hitAbleParts: THREE.Object3D[] = [];
    public speed = 0.1;

    constructor(public model: THREE.Group) {
        this.hitAbleParts.push(model.getObjectByName('base'), model.getObjectByName('cabin'));
    }

    changeSpeed(amount: number) {
        if ((amount > 0 && this.speed <= 0.3) || (amount < 0 && this.speed > 0.2)) {
            this.speed += amount;
        }
        console.log(`Speed: ${this.speed}`);
    }
}
