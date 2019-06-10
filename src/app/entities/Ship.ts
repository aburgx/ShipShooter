import * as THREE from 'three';

export class Ship {
    public turrets: Turret[] = [];
    public hitAbleParts: THREE.Object3D[] = [];

    constructor(public model: THREE.Group) {
        this.hitAbleParts.push(model.getObjectByName('base'), model.getObjectByName('cabin'));
    }
}

export class Turret {
    public barrels: THREE.Object3D[] = [];

    constructor(public model: THREE.Group) {
        this.barrels.push(
            model.getObjectByName('barrel1'),
            model.getObjectByName('barrel2'),
            model.getObjectByName('barrel3'),
        );
    }
}
