import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Custom Cursor ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice && cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Adding a slight delay to the outline for smooth effect
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover effect for links and buttons
        const interactables = document.querySelectorAll('a, button, .project-card, .skill-item');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hover'));
        });
    }

    // --- Navigation & Mobile Menu ---
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            const icon = mobileMenuBtn.querySelector('i');
            if(navLinks.classList.contains('open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu on link click
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // --- Active Section Highlighting ---
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) {
                a.classList.add('active');
            }
        });
    });

    // --- Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -100px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- Three.js Background Animation (Lightweight) ---
    initThreeJS(isTouchDevice);
});

function initThreeJS(isTouchDevice) {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    // Reduce complexity on mobile for performance
    const particleCount = isTouchDevice ? 200 : 800;
    const geometryDetail = isTouchDevice ? 0 : 1;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isTouchDevice });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for perf
    container.appendChild(renderer.domElement);

    // Primary Object: Abstract Icosahedron
    const geometry = new THREE.IcosahedronGeometry(2, geometryDetail);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00f0ff, 
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const icosahedron = new THREE.Mesh(geometry, material);
    
    // Inner solid object
    const innerGeometry = new THREE.IcosahedronGeometry(1.5, geometryDetail);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x0a0a0e, // Match background
        transparent: true,
        opacity: 0.8
    });
    const innerObject = new THREE.Mesh(innerGeometry, innerMaterial);
    
    const group = new THREE.Group();
    group.add(icosahedron);
    group.add(innerObject);
    scene.add(group);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x7000ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    if (!isTouchDevice) {
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        });
    }

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();

        // Rotate object
        group.rotation.y += 0.002;
        group.rotation.x += 0.001;

        // Rotate particles slowly
        particleMesh.rotation.y = -0.0005 * elapsedTime;

        // Mouse interaction physics
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        
        group.rotation.y += 0.05 * (targetX - group.rotation.y);
        group.rotation.x += 0.05 * (targetY - group.rotation.x);
        
        // Gentle float
        group.position.y = Math.sin(elapsedTime * 0.5) * 0.2;

        // Only render if hero section is visible (Performance Optimization)
        if (window.scrollY < window.innerHeight) {
            renderer.render(scene, camera);
        }
    }
    
    animate();
}