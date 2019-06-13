import * as THREE from 'three';

export class Turret {
    public barrels: THREE.Object3D[] = [];
    public lastTimeShot = new Date(0);

    constructor(public model: THREE.Group) {
        this.barrels.push(
            model.getObjectByName('barrel1'),
            model.getObjectByName('barrel2'),
            model.getObjectByName('barrel3'),
        );
    }

    hasReloaded(): boolean {
        return new Date().getTime() - this.lastTimeShot.getTime() > 2000;
    }
}
