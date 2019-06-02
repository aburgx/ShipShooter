import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {ColorKeywords} from 'three-full/sources/math/Euler';

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

    private playerShip: THREE.Mesh;
    private objects = [];

    private rayCaster = new THREE.Raycaster(undefined, undefined, 0, 1);

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
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip, 0.01));
                break;
            case 'KeyD':
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip, -0.01));
                break;
            case 'ArrowDown':
                requestAnimationFrame(() => this.animateTurretAngle(this.playerShip.getObjectByName('turret'), 0.02));
                break;
            case 'ArrowUp':
                requestAnimationFrame(() => this.animateTurretAngle(this.playerShip.getObjectByName('turret'), -0.02));
                break;
            case 'ArrowRight':
                requestAnimationFrame(() => this.animateTurretTurn(this.playerShip.getObjectByName('turret'), -0.05));
                break;
            case 'ArrowLeft':
                requestAnimationFrame(() => this.animateTurretTurn(this.playerShip.getObjectByName('turret'), 0.05));
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
        this.importShipModel();
    }

    ngAfterViewInit(): void {
        this.canvas.nativeElement.appendChild(this.renderer.domElement);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    loadMesh() {
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
        this.objects.push(box);
        this.scene.add(box);

        // start playerShip movement animation
        requestAnimationFrame(() => this.animateMovement(this.playerShip, 0.1));
    }

    importShipModel() {
        const objLoader = new OBJLoader();
        objLoader.setPath('assets/');
        // objLoader.setMaterials(material.getAsArray());
        objLoader.load(
            'ship.obj',
            group => {
                console.log(group.children);

                const children = group.children;

                // create playerShip
                const base = children.find(child => {
                    return child.name === 'base';
                });
                this.playerShip = base as THREE.Mesh;

                let cabin: THREE.Mesh;
                let turret1: THREE.Mesh;
                let turret2: THREE.Mesh;
                children.forEach(child => {
                    switch (child.name) {
                        case 'cabin':
                            cabin = child as THREE.Mesh;
                            this.playerShip.add(cabin);
                            break;
                        case 'turret1':
                            turret1 = child as THREE.Mesh;
                            turret1.material = new THREE.MeshPhongMaterial({color: 'blue'});
                            this.playerShip.add(turret1);
                            break;
                        case 'turret2':
                            turret2 = child as THREE.Mesh;
                            turret2.material = new THREE.MeshPhongMaterial({color: 'blue'});
                            this.playerShip.add(turret2);
                            break;
                    }
                });

                children.forEach(child => {
                    if (child.name === 'barrel1.1' || child.name === 'barrel1.2' || child.name === 'barrel1.3') {
                        turret1.add(child as THREE.Mesh);
                    } else if (child.name === 'barrel2.1' || child.name === 'barrel2.2' || child.name === 'barrel2.3') {
                        turret2.add(child as THREE.Mesh);
                    }
                });

                this.playerShip.position.set(0, 2.5, 0);
                this.playerShip.castShadow = true;

                // setup turrets


                /*
                const turret = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshPhongMaterial({color: 'blue'})
                );
                turret.position.set(0, 3, 0);
                turret.name = 'turret';
                this.playerShip.add(turret);
                */
                this.scene.add(this.playerShip);

                const playerShipPos = this.playerShip.position;
                this.camera.position.set(playerShipPos.x - 20, playerShipPos.y + 12, playerShipPos.z);
                this.camera.lookAt(this.playerShip.position);
                this.playerShip.add(this.camera);

                this.loadMesh();
            }, evt => {
                console.log(`Object: ${evt.loaded} / ${evt.total}`);
            }, evt => {
                console.error(evt);
            }
        );
        /*
        const materialLoader = new MTLLoader();
        materialLoader.setPath('assets/');
        materialLoader.load(
            'ship.mtl',
            material => {
                material.preload();

            }, evt => {
                console.log(`Material: ${evt.loaded} / ${evt.total}`);
            }, evt => {
                console.error(evt);
            }
        );*/
    }

    moveCamera(offsetX: number, offsetY: number) {
        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetX / 100);
        this.camera.position.y -= offsetY;
        this.camera.lookAt(this.playerShip.position);
        this.render();
    }

    animateMovement(obj: THREE.Object3D, distance: number) {
        obj.translateX(distance);
        this.render();
        requestAnimationFrame(() => this.animateMovement(obj, distance));
    }

    animateTurretTurn(turret: THREE.Object3D, angle: number) {
        turret.rotateY(angle);
        this.render();
    }

    animateTurretAngle(turret: THREE.Object3D, angle: number) {
        if (angle > 0) {
            if (turret.rotation.z < 0.88) {
                turret.rotateZ(angle);
                this.render();
            }
        } else {
            if (turret.rotation.z > 0.02) {
                turret.rotateZ(angle);
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
        for (const object of this.objects) {
            const origin = new THREE.Vector3().copy(projectile.position);
            // this.drawLine(origin, object.position); // draw direction vector
            const directionVector = new THREE.Vector3().subVectors(object.position, origin);

            this.rayCaster.set(origin, directionVector.normalize());
            const intersections = this.rayCaster.intersectObjects(this.objects);

            if (intersections.length > 0) {
                const intersection = intersections[0];
                return intersection.object;
            }
        }
        return null;
    }

    drawLine(veci1, veci2) {
        const geom = new THREE.Geometry();
        geom.vertices.push(veci1);
        geom.vertices.push(veci2);
        const line = new THREE.Line(
            geom,
            new THREE.LineBasicMaterial({color: 'black'})
        );
        this.scene.add(line);
    }

    calcY(x: number): number {
        const g = 9.81;
        const y0 = 5;
        const v0 = 50;
        // const alpha = 0.8;
        const alpha = this.playerShip.getObjectByName('turret').rotation.z;
        x = Math.abs(x);
        return y0 + Math.tan(alpha) * x
            - (g / (2 * Math.pow(v0, 2) * Math.pow(Math.cos(alpha), 2))) * Math.pow(x, 2);
    }

    shoot() {
        const projectile = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshPhongMaterial({color: 'darkgray'})
        );
        const turret = this.playerShip.getObjectByName('turret');
        projectile.setRotationFromMatrix(turret.matrixWorld);
        projectile.position.copy(this.playerShip.position);
        projectile.position.setY(this.playerShip.position.y + 3);
        this.scene.add(projectile);
        requestAnimationFrame(() => this.animateProjectile(projectile, 0));
    }

}
