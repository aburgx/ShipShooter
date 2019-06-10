import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {Ship, Turret} from './entities/Ship';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

    @ViewChild('canvas')
    private canvas: ElementRef;

    private camera: THREE.Camera;
    private scene: THREE.Scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({antialias: true});

    private dragging = false;
    private x: number;
    private y: number;

    private playerShip: Ship;

    private hitAbleObjects: THREE.Object3D[] = [];

    private rayCaster = new THREE.Raycaster(undefined, undefined, 0, 3);

    @HostListener('document:mousedown', ['$event'])
    onmousedown(evt: MouseEvent) {
        this.dragging = true;
        this.x = evt.x;
        this.y = evt.y;
    }

    @HostListener('document:mouseup')
    onmouseup() {
        this.dragging = false;
    }

    @HostListener('document:mousemove', ['$event'])
    onmousemove(evt: MouseEvent) {
        if (this.dragging) {
            const offsetX = this.x - evt.x;
            this.x = evt.x;
            const offsetY = evt.y - this.y;
            this.y = evt.y;
            this.moveCamera(offsetX, offsetY);
        }
    }

    @HostListener('window:keydown', ['$event'])
    onkeydown(evt: KeyboardEvent) {
        console.log(`Key pressed: ${evt.code}`);
        switch (evt.code) {
            case 'Space':
                this.shoot();
                break;
            case 'KeyA':
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip.model, 0.01));
                break;
            case 'KeyD':
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip.model, -0.01));
                break;
            case 'ArrowDown':
                requestAnimationFrame(() => this.animateBarrels(this.playerShip.turrets[0].barrels, -0.02));
                break;
            case 'ArrowUp':
                requestAnimationFrame(() => this.animateBarrels(this.playerShip.turrets[0].barrels, 0.02));
                break;
            case 'ArrowRight':
                requestAnimationFrame(() => this.animateTurretTurn(this.playerShip.turrets[0].model, -0.05));
                break;
            case 'ArrowLeft':
                requestAnimationFrame(() => this.animateTurretTurn(this.playerShip.turrets[0].model, 0.05));
                break;
        }
    }

    ngOnInit(): void {
        // create camera
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.loadModels();
    }

    ngAfterViewInit(): void {
        this.canvas.nativeElement.appendChild(this.renderer.domElement);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    loadModels() {
        const manager = new THREE.LoadingManager(
            () => {
                console.log('%cLoading complete', 'color: green');
                this.generateEnvironment();
            }, (url, loaded, total) => {
                console.log(`Loading file: ${url} \nLoaded ${loaded} of ${total} files.`);
            }, (url) => {
                console.error(`An error occurred while loading ${url}.`);
            }
        );
        const objLoader = new OBJLoader(manager);
        objLoader.setPath('assets/');

        objLoader.load(
            'ship.obj',
            shipModel => {
                // setup playerShip
                shipModel.castShadow = true;
                this.scene.add(shipModel);

                // initiate first person view
                this.camera.position.set(shipModel.position.x - 20, shipModel.position.y + 12, shipModel.position.z);
                this.camera.lookAt(shipModel.position);
                shipModel.add(this.camera);

                this.playerShip = new Ship(shipModel);

                objLoader.load(
                    'turret.obj',
                    turretModel => {
                        // setup turret mesh
                        const turretBase = turretModel.getObjectByName('turret') as THREE.Mesh;
                        turretBase.geometry.center();
                        turretBase.material = new THREE.MeshPhongMaterial({color: 'darkgray'});
                        turretModel.position.set(6, 4.25, 0);

                        const turret = new Turret(turretModel);
                        turret.barrels.forEach(barrel => barrel.position.set(1, 0, 0));
                        this.playerShip.turrets.push(turret);
                        this.playerShip.model.add(turret.model);
                    }
                );
            }
        );

    }

    generateEnvironment() {
        // create environment
        this.scene.add(new THREE.AxesHelper(10));
        this.scene.background = new THREE.Color('white');
        const ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(500, 500),
            new THREE.MeshPhongMaterial({color: 'skyblue'})
        );
        ground.position.set(0, 0, 0);
        ground.rotateX(-Math.PI / 2);
        this.scene.add(ground);
        this.scene.fog = new THREE.Fog(0xffffff, 1, 400);

        // create light
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        sunLight.position.set(-20, 50, -20);
        sunLight.shadow.mapSize.width = sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // create hit-able objects
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 20),
            new THREE.MeshPhongMaterial({color: 'yellow'})
        );
        box.position.set(100, 5, 0);
        box.name = 'enemy1';
        this.hitAbleObjects.push(box);
        this.scene.add(box);

        // start playerShip movement animation
        requestAnimationFrame(() => this.animateMovement(this.playerShip.model, 0.1));
    }

    moveCamera(offsetX: number, offsetY: number) {
        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetX / 100);
        this.camera.position.y -= offsetY;
        this.camera.lookAt(this.playerShip.model.position);
        this.render();
    }

    animateMovement(ship: THREE.Object3D, distance: number) {
        ship.translateX(distance);
        this.render();
        requestAnimationFrame(() => this.animateMovement(ship, distance));
    }

    animateTurretTurn(turret: THREE.Object3D, angle: number) {
        // turret.rotateOnAxis(new THREE.Vector3(0, 1, 0), angle);
        turret.rotateY(angle);
        this.render();
    }

    animateBarrels(barrels: THREE.Object3D[], angle: number) {
        if (angle > 0) {
            if (barrels[0].rotation.z < 0.80) {
                barrels.forEach(barrel => {
                    barrel.rotateZ(angle);
                });
                this.render();
            }
        } else {
            if (barrels[0].rotation.z > 0.02) {
                barrels.forEach(barrel => {
                    barrel.rotateZ(angle);
                });
                this.render();
            }
        }
    }

    animateShipTurn(ship: THREE.Object3D, angle: number) {
        ship.rotateY(angle);
        this.render();
    }

    animateProjectile(projectile: THREE.Object3D, x: number) {
        const hitObject = this.detectHit(projectile);
        if (hitObject !== null) {
            console.log(`Hit: ${hitObject.name}`);
        } else {
            projectile.translateX(2);
            const y = this.calcY(x);
            if (y > 0) {
                projectile.position.setY(y);
                this.render();
                requestAnimationFrame(() => this.animateProjectile(projectile, x + 2));
            }
        }
    }

    detectHit(projectile: THREE.Object3D): THREE.Object3D {
        for (const object of this.hitAbleObjects) {
            const origin = new THREE.Vector3().copy(projectile.position);
            // this.drawLine(origin, object.position); // draw direction vector
            const directionVector = new THREE.Vector3().subVectors(object.position, origin);

            this.rayCaster.set(origin, directionVector.normalize());
            const intersections = this.rayCaster.intersectObjects(this.hitAbleObjects);

            if (intersections.length > 0) {
                const intersection = intersections[0];
                return intersection.object;
            }
        }
        return null;
    }

    drawLine(vector1, vector2) {
        const geom = new THREE.Geometry();
        geom.vertices.push(vector1);
        geom.vertices.push(vector2);
        const line = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 'black'}));
        this.scene.add(line);
    }

    calcY(x: number): number {
        const g = 9.81;
        const y0 = 5;
        const v0 = 50;
        // const alpha = 0.8;
        const alpha = this.playerShip.turrets[0].barrels[0].rotation.z;
        x = Math.abs(x);
        return y0 + Math.tan(alpha) * x
            - (g / (2 * Math.pow(v0, 2) * Math.pow(Math.cos(alpha), 2))) * Math.pow(x, 2);
    }

    shoot() {
        const projectile = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshPhongMaterial({color: 'darkgray'})
        );
        const turret = this.playerShip.turrets[0];
        projectile.setRotationFromMatrix(turret.model.matrixWorld);
        const turretPos = turret.model.getWorldPosition(new THREE.Vector3());
        projectile.position.set(turretPos.x, turretPos.y - 1, turretPos.z);
        this.scene.add(projectile);
        requestAnimationFrame(() => this.animateProjectile(projectile, 5));
    }

}
