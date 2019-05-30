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
                this.animateTurn(this.playerShip, 0.02);
                break;
            case 'KeyD':
                this.animateTurn(this.playerShip, -0.02);
                break;
            case 'ArrowRight':
                this.animateTurn(this.playerShip.getObjectByName('turret'), -0.05);
                break;
            case 'ArrowLeft':
                this.animateTurn(this.playerShip.getObjectByName('turret'), 0.05);
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
        // turret.raycast(new THREE.Raycaster(), []);
        this.playerShip.add(turret);
        this.scene.add(this.playerShip);
        this.animate(this.playerShip, 0.1);
    }

    animate(obj: THREE.Object3D, distance: number) {
        obj.translateX(distance);
        this.render();
        requestAnimationFrame(() => this.animate(obj, distance));
    }

    animateTurn(obj: THREE.Object3D, angle: number) {
        obj.rotateY(angle);
        // obj.translateZ(distance);
        this.render();
    }

    animateProjectile(obj: THREE.Object3D, distance: number) {
        obj.translateZ(distance);
        this.render();
        requestAnimationFrame(() => this.animateProjectile(obj, distance));
    }

    /*
    private activateDragging() {
      const dragControls = new DragControls(this.scene, this.camera, this.renderer.domElement);
      dragControls.
      this.animate();
    }
    */

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

        this.animateProjectile(projectile, 1);
    }

}
