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

    private blueUnits = [];
    private redUnits = [];
    private isRunning = false;

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

    ngOnInit(): void {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(this.scene.position);
        this.scene.add(new THREE.AxesHelper(10));
        this.scene.background = new THREE.Color('lightblue');
        this.createEnvironment();
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

    onStart() {
        const unit1 = this.createUnit('red');
        unit1.position.set(-15, 0, 0);
        this.blueUnits.push(unit1);

        const unit2 = this.createUnit('blue');
        unit2.position.set(15, 0, 0);
        this.redUnits.push(unit2);

        this.isRunning = true;
        this.blueUnits.forEach(unit => this.animate(unit, .1));
        this.redUnits.forEach(unit => this.animate(unit, -.1));
    }

    onReset() {
        this.isRunning = false;
        this.blueUnits.forEach(unit => this.scene.remove(unit));
        this.redUnits.forEach(unit => this.scene.remove(unit));
        this.blueUnits = [];
        this.redUnits = [];
    }

    createEnvironment() {
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(60, 40, 1),
            new THREE.MeshPhongMaterial({color: 'lightgreen'})
        );
        ground.position.set(0, -1.5, 0);
        ground.rotateX(-Math.PI / 2);

        /*
        const light = new THREE.SpotLight();
        light.intensity = 1;
        light.position.set(0, 100, 0);
        light.shadow.mapSize.width = light.shadow.mapSize.height = 10000;
        light.castShadow = true;
       */

        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.target = ground;
        light.castShadow = true;
        light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
        this.scene.add(ground, light);
    }

    createUnit(color: string) {
        const unit = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshPhongMaterial({color})
        );
        unit.castShadow = true;
        this.scene.add(unit);
        return unit;
    }

    /*
    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }*/

    animate(obj: THREE.Object3D, distance: number) {
        obj.translateX(distance);
        this.render();
        if (this.isRunning) {
            requestAnimationFrame(() => this.animate(obj, distance));
        }
    }

    /*
    private activateDragging() {
      const dragControls = new DragControls(this.scene, this.camera, this.renderer.domElement);
      dragControls.
      this.animate();
    }
    */

}
