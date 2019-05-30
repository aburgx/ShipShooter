import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';

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
        console.log('Key pressed: ' + evt.code);
        switch (evt.code) {
            case 'Space':
                this.shoot();
                break;
            case 'KeyA':
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip, 0.02));
                break;
            case 'KeyD':
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip, -0.02));
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
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 40, 50);
        this.camera.lookAt(this.scene.position);

        this.scene.add(new THREE.AxesHelper(10));

        this.createEnvironment();
        this.createPlayerShip();
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

    moveCamera(offsetX: number, offsetY: number) {
        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetX / 100);
        this.camera.position.y -= offsetY;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.render();
    }

    createEnvironment() {
        this.scene.background = new THREE.Color('white');

        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, 60, 1),
            new THREE.MeshPhongMaterial({color: 'skyblue'})
        );
        ground.position.set(0, -1.5, 0);
        ground.rotateX(-Math.PI / 2);

        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.target = ground;
        light.castShadow = true;
        light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
        this.scene.add(ground, light);

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshPhongMaterial({color: 'yellow'})
        );
        box.name = 'sumbox';
        box.position.set(100, 0, 0);
        this.objects.push(box);
        this.scene.add(box);
    }

    createPlayerShip() {
        this.playerShip = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 5),
            new THREE.MeshPhongMaterial({color: 'whitesmoke'})
        );
        const turret = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({color: 'blue'})
        );
        turret.position.set(0, 3, 0);
        turret.name = 'turret';
        this.playerShip.add(turret);
        this.scene.add(this.playerShip);
        requestAnimationFrame(() => this.animateMovement(this.playerShip, 0.1));
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

    animateShipTurn(ship: THREE.Object3D, angle: number) {
        // TODO: Rotate turret with ship
        ship.rotateY(angle);
        this.render();
    }

    animateProjectile(projectile: THREE.Object3D, distance: number) {
        this.rayCaster.set(projectile.position, projectile.getWorldDirection(new THREE.Vector3()));
        const intersects = this.rayCaster.intersectObjects(this.objects);
        if (intersects.length > 0) {
            console.log(intersects[0].distance);
        }
        projectile.translateZ(distance);
        this.render();
        requestAnimationFrame(() => this.animateProjectile(projectile, distance));
    }

    shoot() {
        const projectile = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial()
        );
        const shipPos = this.playerShip.position;
        const turret = this.playerShip.getObjectByName('turret');
        projectile.setRotationFromEuler(turret.rotation);
        projectile.position.set(shipPos.x, shipPos.y + 2, shipPos.z);
        this.scene.add(projectile);
        requestAnimationFrame(() => this.animateProjectile(projectile, 1));
    }

}
