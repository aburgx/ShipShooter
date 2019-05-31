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
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip, 0.1));
                break;
            case 'KeyD':
                requestAnimationFrame(() => this.animateShipTurn(this.playerShip, -0.1));
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

        // create playerShip
        this.playerShip = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 5),
            new THREE.MeshPhongMaterial({color: 'whitesmoke'})
        );
        this.playerShip.position.set(0, 2.5, 0);
        this.playerShip.castShadow = true;
        const turret = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({color: 'blue'})
        );
        turret.position.set(0, 3, 0);
        turret.name = 'turret';
        this.playerShip.add(turret);
        this.scene.add(this.playerShip);

        // create light
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        sunLight.position.set(-20, 50, -20);
        sunLight.shadow.mapSize.width = sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // create camera
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
        const playerShipPos = this.playerShip.position;
        this.camera.position.set(playerShipPos.x - 20, playerShipPos.y + 12, playerShipPos.z);
        this.camera.lookAt(this.playerShip.position);
        this.playerShip.add(this.camera);

        // create hit-able objects
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshPhongMaterial({color: 'yellow'})
        );
        box.position.set(100, 5, 0);
        this.objects.push(box);
        this.scene.add(box);

        // start playerShip movement animation
        requestAnimationFrame(() => this.animateMovement(this.playerShip, 0.1));
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

    animateShipTurn(ship: THREE.Object3D, angle: number) {
        ship.rotateY(angle);
        this.render();
    }

    animateProjectile(projectile: THREE.Object3D, x: number) {
        const directionVector = new THREE.Vector3();
        directionVector.subVectors(projectile.position, this.objects[0].position);
        if (directionVector.length() > 10) {
            projectile.translateX(1);
            const y = this.calcY(x);
            if (y > 0) {
                projectile.position.setY(y);
                this.render();
                requestAnimationFrame(() => this.animateProjectile(projectile, ++x));
            }
        } else {
            console.log('hit');
        }
    }

    calcY(x: number): number {
        const g = 9.81;
        const y0 = 5;
        const v0 = 15;
        const alpha = 0.8;
        x = Math.abs(x);
        return y0 + Math.tan(alpha) * x
            - (g / (2 * Math.pow(v0, 2) * Math.pow(Math.cos(alpha), 2))) * Math.pow(x, 2);
    }

    shoot() {
        const projectile = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({color: 'darkgray'})
        );
        const turret = this.playerShip.getObjectByName('turret');
        projectile.setRotationFromMatrix(turret.matrixWorld);
        projectile.position.copy(this.playerShip.position);
        projectile.position.setY(this.playerShip.position.y + 3);
        projectile.add(new THREE.AxesHelper());
        this.scene.add(projectile);
        requestAnimationFrame(() => this.animateProjectile(projectile, 0));
    }

}
