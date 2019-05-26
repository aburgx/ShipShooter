import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import * as THREE from 'three';

@Component({
    selector: 'app-root',
    template: '<div #canvas style="width: 100%; height: 100%"></div>',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

    @ViewChild('canvas')
    private canvas: ElementRef;

    private camera: THREE.Camera;
    private scene: THREE.Scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({antialias: true});

    private width = window.innerWidth;
    private height = window.innerHeight;

    private dragging = false;
    private x: number;
    private y: number;

    @HostListener('document:mousedown', ['$event'])
    onmousedown(event: MouseEvent) {
        this.dragging = true;
        this.x = event.x;
        this.y = event.y;
    }

    @HostListener('document:mouseup', ['$event'])
    onmouseup(event: MouseEvent) {
        this.dragging = false;
    }

    @HostListener('document:mousemove', ['$event'])
    onmousemove(event: MouseEvent) {
        if (this.dragging) {
            const offsetx = this.x - event.x;
            this.x = event.x;
            const offsety = event.y - this.y;
            this.y = event.y;
            this.moveCamera(offsetx, offsety);
        }
    }

    ngOnInit(): void {
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(this.scene.position);
        this.scene.add(new THREE.AxesHelper(10));
        this.scene.background = new THREE.Color('lightblue');
        /*
        const skyGeometry = new THREE.SphereGeometry(1000, 25, 25);
        const material = new THREE.MeshLambertMaterial({color: 'white'});
        material.side = THREE.DoubleSide;
        const sky = new THREE.Mesh(skyGeometry, material);
        this.scene.add(sky);
        */
        this.basicBox();
    }

    ngAfterViewInit(): void {
        this.canvas.nativeElement.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.render();
    }

    basicBox() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1.5, 2),
            new THREE.MeshPhongMaterial({color: 'blue'})
        );
        box.position.set(2, 2, 2);
        box.castShadow = true;

        /*
        const light = new THREE.SpotLight();
        light.intensity = 1;
        light.position.set(0, 100, 0);
        light.shadow.mapSize.width = light.shadow.mapSize.height = 10000;
        light.castShadow = true;
         */

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 40, 1, 1),
            new THREE.MeshPhongMaterial({color: 'lightgreen'})
        );
        plane.rotateX(-Math.PI / 2);

        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.target = plane;
        light.castShadow = true;
        light.shadow.mapSize.width = light.shadow.mapSize.height = 10000;

        this.scene.add(box, light, plane);
    }

    /*
    private activateDragging() {
        const dragControls = new DragControls(this.scene, this.camera, this.renderer.domElement);
        dragControls.
        this.animate();
    }
    */

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    private moveCamera(offsetx: number, offsety: number) {
        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetx / 100);
        this.camera.position.y -= offsety;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.render();
    }

}
