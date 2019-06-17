import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {Ship} from './entities/Ship';
import {Turret} from './entities/Turret';
import {Bot} from './entities/Bot';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

    @ViewChild('canvas', {static: false})
    private canvas: ElementRef;

    private camera: THREE.Camera;
    private scene: THREE.Scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({antialias: true});

    private dragging = false;
    private x: number;
    private y: number;

    private player: Ship;
    private bots: Bot[] = [];

    private hitAbleObjects: THREE.Object3D[] = [];

    private models = new Map();

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
        switch (evt.code) {
            case 'Space':
                const projectile = this.player.shoot();
                if (projectile !== null) {
                    this.scene.add(projectile);
                    requestAnimationFrame(() => this.animateProjectile(projectile, 5));
                }
                break;
            case 'KeyW':
                this.player.changeSpeed(1);
                break;
            case 'KeyS':
                this.player.changeSpeed(-1);
                break;
            case 'KeyA':
                requestAnimationFrame(() => this.animateShipTurn(this.player.model, 0.01));
                break;
            case 'KeyD':
                requestAnimationFrame(() => this.animateShipTurn(this.player.model, -0.01));
                break;
            case 'ArrowDown':
                requestAnimationFrame(() => this.animateBarrels(this.player.turrets[0].barrels, -0.02));
                break;
            case 'ArrowUp':
                requestAnimationFrame(() => this.animateBarrels(this.player.turrets[0].barrels, 0.02));
                break;
            case 'ArrowRight':
                requestAnimationFrame(() => this.animateTurretTurn(this.player.turrets[0].model, -0.05));
                break;
            case 'ArrowLeft':
                requestAnimationFrame(() => this.animateTurretTurn(this.player.turrets[0].model, 0.05));
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
        // this.renderer.setPixelRatio(window.devicePixelRatio);
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    loadModels() {
        const manager = new THREE.LoadingManager(
            () => {
                console.log('%cLoading complete', 'color: green');
                this.setupPlayer();
                this.setupEnemies();
                this.generateEnvironment();
            }, (url, loaded, total) => {
                console.log(`Loading file: ${url} \nLoaded ${loaded} of ${total} files.`);
            }, (url) => {
                console.error(`An error occurred while loading ${url}.`);
            }
        );

        const objLoader = new OBJLoader(manager);
        objLoader.setPath('assets/');

        // load ship model
        objLoader.load(
            'ship.obj',
            shipModel => {
                shipModel.castShadow = true;
                shipModel.position.setY(3);
                const base = shipModel.getObjectByName('cabin') as THREE.Mesh;
                base.material = new THREE.MeshLambertMaterial({color: 'lightgrey'});
                this.models.set('ship', shipModel);
            }
        );

        // load turret model
        objLoader.load(
            'turret.obj',
            turretModel => {
                turretModel.castShadow = true;
                const turretBase = turretModel.getObjectByName('turret') as THREE.Mesh;
                turretBase.geometry.center();
                turretBase.material = new THREE.MeshPhongMaterial({color: 'darkgray'});
                this.models.set('turret', turretModel);
            }
        );
    }

    setupPlayer() {
        const playerShip = this.createShip();
        const cabin = playerShip.model.getObjectByName('base') as THREE.Mesh;
        cabin.material = new THREE.MeshLambertMaterial({color: 'blue'});
        // initiate first person view
        const modelPos = playerShip.model.position;
        this.camera.position.set(modelPos.x - 25, modelPos.y + 15, modelPos.z);
        this.camera.lookAt(playerShip.model.position);
        playerShip.model.add(this.camera);

        this.player = playerShip;
        // start playerShip movement animation
        requestAnimationFrame(() => this.animateMovement(playerShip));
    }

    setupEnemies() {
        for (let i = 0; i < 2; ++i) {
            const enemyShip = this.createShip();
            enemyShip.model.rotateY(THREE.Math.degToRad(180));
            const cabin = enemyShip.model.getObjectByName('base') as THREE.Mesh;
            cabin.material = new THREE.MeshLambertMaterial({color: 'red'});
            const bot = new Bot(enemyShip);
            requestAnimationFrame(() => this.animateMovement(enemyShip));
            // start enemy movement and Bot interaction
            bot.interact(
                this.player.model.position,
                (projectile) => {
                    this.scene.add(projectile);
                    requestAnimationFrame(() => this.animateProjectile(projectile, 5));
                }, () => {
                    // remove dead bot
                    this.scene.remove(bot.ship.model);
                    const index: number = this.bots.indexOf(bot);
                    if (index !== -1) {
                        this.bots.splice(index, 1);
                    }
                    this.render();
                    if (this.bots.length === 0) {
                        alert('Player has won!\nPress ok to restart...');
                        location.reload();
                    }
                }
            );
            this.bots.push(bot);
        }

        this.bots[0].ship.model.position.setX(200);
        this.bots[0].ship.model.position.setZ(75);
        this.bots[1].ship.model.position.setX(100);
        this.bots[1].ship.model.position.setZ(-75);
    }

    createShip(): Ship {
        // copy the loaded models
        const ship = new Ship(this.models.get('ship').clone());
        const turret = new Turret(this.models.get('turret').clone());

        // setup turret and barrels
        turret.model.position.set(9, 0.25, 0);
        turret.barrels.forEach(barrel => barrel.position.set(1, 0, 0));
        ship.turrets.push(turret);
        ship.model.add(turret.model);

        // add ship to the objects that can be hit
        this.hitAbleObjects = this.hitAbleObjects.concat(ship.hitAbleParts);
        this.scene.add(ship.model);
        return ship;
    }

    generateEnvironment() {
        // create environment
        this.scene.add(new THREE.AxesHelper(10));
        this.scene.background = new THREE.Color('white');
        const ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000, 2000),
            new THREE.MeshPhongMaterial({color: 'skyblue'})
        );
        ground.position.set(0, 0, 0);
        ground.rotateX(-Math.PI / 2);
        this.scene.add(ground);
        this.scene.fog = new THREE.Fog(0xffffff, 1, 600);

        // create light
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        sunLight.position.set(-20, 50, -20);
        sunLight.shadow.mapSize.width = sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
    }

    moveCamera(offsetX: number, offsetY: number) {
        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetX / 100);
        this.camera.position.y -= offsetY;
        this.camera.lookAt(this.player.model.position);
        this.render();
    }

    animateMovement(ship: Ship) {
        ship.model.translateX(ship.speed / 10);
        this.render();
        requestAnimationFrame(() => this.animateMovement(ship));
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
        // check if the projectile has hit a object
        const hitObject = this.detectHit(projectile);
        if (hitObject !== null) {
            console.log(`%cHit: ${hitObject.name}`, 'color: blue');
            if (this.player.model.children.includes(hitObject)) {
                this.player.health--;
                if (this.player.health <= 0) {
                    alert('Player has lost.\nPress ok to try again...');
                    location.reload();
                }
            } else {
                this.bots.forEach(bot => {
                    if (bot.ship.model.children.includes(hitObject)) {
                        bot.ship.health--;
                    }
                });
            }
        } else {
            // no object has been hit, continue the animation
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

    // draws a direction vector
    drawLine(vector1, vector2) {
        const geom = new THREE.Geometry();
        geom.vertices.push(vector1);
        geom.vertices.push(vector2);
        const line = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 'black'}));
        this.scene.add(line);
    }

    // calculates the projectile position using the projectile motion formula
    calcY(x: number): number {
        const g = 9.81;
        const y0 = 5;
        const v0 = 50;
        // const alpha = 0.8;
        const alpha = this.player.turrets[0].barrels[0].rotation.z;
        x = Math.abs(x);
        return y0 + Math.tan(alpha) * x
            - (g / (2 * Math.pow(v0, 2) * Math.pow(Math.cos(alpha), 2))) * Math.pow(x, 2);
    }
}
