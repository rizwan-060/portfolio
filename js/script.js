// Global variable to store data for CV generation
let portfolioData = null;

// --- 1. THREE.JS 3D BACKGROUND ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return; // Guard clause

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(10, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.3 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.15, color: 0x7000ff });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.002;
        sphere.rotation.y += 0.002;
        particlesMesh.rotation.y -= 0.0005;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- 2. FETCH DATA FROM DB (THE CONNECTION) ---
async function fetchData() {
    try {
        // This '/api/data' points to the file you created in the api folder
        const response = await fetch('/api/data'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        portfolioData = data; // Save for CV
        renderWebsite(data);  // Populate HTML
    } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback in case DB fails
        document.getElementById('p-name').innerText = "Rizwan Ahmed"; 
    }
}

// --- 3. RENDER WEBSITE ---
function renderWebsite(data) {
    const p = data.profile;
    
    // Header & About
    if(p) {
        document.getElementById('p-name').innerText = p.name;
        document.getElementById('p-title').innerText = p.title;
        document.getElementById('p-summary-short').innerText = p.summary.split('.')[0] + ".";
        document.getElementById('p-about-full').innerHTML = `<p class="text-light-gray lead">${p.summary}</p>`;
        document.getElementById('p-edu-degree').innerText = p.education_degree;
        document.getElementById('p-edu-year').innerText = p.education_year;
        document.getElementById('p-location').innerText = p.location;
    }

    // Skills
    const skillsContainer = document.getElementById('skills-container');
    if (data.skills && skillsContainer) {
        skillsContainer.innerHTML = '';
        data.skills.forEach((cat, index) => {
            const delay = (index + 1) * 100;
            let icon = 'fa-code';
            if(cat.category.includes('Framework')) icon = 'fa-layer-group';
            if(cat.category.includes('Tool')) icon = 'fa-screwdriver-wrench';

            const skillSpans = cat.skill_list.split(',').map(s => `<span>${s.trim()}</span>`).join('');

            skillsContainer.innerHTML += `
                <div class="col-md-4 reveal-on-scroll" style="transition-delay: ${delay}ms">
                    <div class="skill-card h-100">
                        <div class="icon-box"><i class="fa-solid ${icon}"></i></div>
                        <h4>${cat.category}</h4>
                        <div class="skill-tags">${skillSpans}</div>
                    </div>
                </div>
            `;
        });
    }

    // --- NEW: Render Services ---
    const servicesContainer = document.getElementById('services-container');
    if (data.services && servicesContainer) {
        servicesContainer.innerHTML = '';
        data.services.forEach((service, index) => {
            const delay = (index + 1) * 100;
            servicesContainer.innerHTML += `
                <div class="col-md-6 col-lg-3 reveal-on-scroll" style="transition-delay: ${delay}ms">
                    <div class="glass-panel p-4 h-100 text-center service-card">
                        <div class="icon-box mb-3 mx-auto">
                            <i class="fa-solid ${service.icon_class} fa-2x"></i>
                        </div>
                        <h5 class="fw-bold mb-3">${service.title}</h5>
                        <p class="small text-light-gray">${service.description}</p>
                    </div>
                </div>
            `;
        });
    }

    // Projects
    const projectsContainer = document.getElementById('projects-container');
    if (data.projects && projectsContainer) {
        projectsContainer.innerHTML = '';
        data.projects.forEach((proj) => {
            const techList = proj.tech_stack.split(',').map(t => `<li>${t.trim()}</li>`).join('');
            
            projectsContainer.innerHTML += `
                <div class="col-md-6 reveal-on-scroll">
                    <div class="project-card">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <i class="fa-solid ${proj.icon_class} folder-icon"></i>
                            <a href="${proj.github_link}" target="_blank" class="github-link"><i class="fa-brands fa-github"></i></a>
                        </div>
                        <h3>${proj.title}</h3>
                        <p>${proj.short_desc}</p>
                        <ul class="tech-list">${techList}</ul>
                    </div>
                </div>
            `;
        });
    }

    

    // Re-trigger animations
    initScrollReveal();
}

// --- 4. DYNAMIC CV GENERATOR ---
async function generateCV() {
    if(!portfolioData) { alert("Data is loading... please wait a moment."); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);
    let yPos = 20;
    const p = portfolioData.profile;

    // Header
    doc.setFontSize(26); doc.setFont("helvetica", "bold");
    doc.text(p.name.toUpperCase(), margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    doc.text(`${p.location} | ${p.phone} | ${p.email}`, margin, yPos);
    yPos += 6;
    doc.text(`LinkedIn: ${p.linkedin} | GitHub: ${p.github}`, margin, yPos);
    
    yPos += 6;
    doc.setDrawColor(200); doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 10;

    // Summary
    doc.setFontSize(14); doc.setTextColor(0, 100, 200); doc.setFont("helvetica", "bold");
    doc.text("PROFESSIONAL SUMMARY", margin, yPos); yPos += 7;
    
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "normal");
    const splitSummary = doc.splitTextToSize(p.summary, maxLineWidth);
    doc.text(splitSummary, margin, yPos);
    yPos += (splitSummary.length * 5) + 5;

    // Education
    doc.setFontSize(14); doc.setTextColor(0, 100, 200); doc.setFont("helvetica", "bold");
    doc.text("EDUCATION", margin, yPos); yPos += 7;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(p.education_degree, margin, yPos);
    doc.setFontSize(10);
    doc.text(`${p.education_uni} (${p.education_year})`, pageWidth - margin, yPos, {align:'right'});
    yPos += 12;

    // Skills
    doc.setFontSize(14); doc.setTextColor(0, 100, 200); doc.setFont("helvetica", "bold");
    doc.text("TECHNICAL SKILLS", margin, yPos); yPos += 7;
    doc.setFontSize(10); doc.setTextColor(0);

    portfolioData.skills.forEach(skill => {
        doc.setFont("helvetica", "bold");
        doc.text(skill.category + ":", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(skill.skill_list, margin + 30, yPos);
        yPos += 6;
    });
    yPos += 5;

    // Projects
    doc.setFontSize(14); doc.setTextColor(0, 100, 200); doc.setFont("helvetica", "bold");
    doc.text("PROJECTS", margin, yPos); yPos += 8;

    portfolioData.projects.forEach(proj => {
        if(yPos > 260) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
        doc.text(proj.title, margin, yPos); yPos += 5;
        
        doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica", "italic");
        doc.text(proj.tech_stack, margin, yPos); yPos += 6;

        doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "normal");
        const fullDesc = proj.full_desc.split('|');
        fullDesc.forEach(line => {
            const splitLine = doc.splitTextToSize("• " + line, maxLineWidth);
            doc.text(splitLine, margin, yPos);
            yPos += (splitLine.length * 5);
        });
        yPos += 4;
    });

    doc.save(`${p.name.replace(' ', '_')}_CV.pdf`);
}

// --- 5. INITIALIZATION ---
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("active");
        });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
    initThreeJS();
    fetchData(); // This starts the DB Fetch!
});