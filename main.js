document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initFilters();
    initIntersectionObservers();
    updateStats();
    renderGrid();
  });
  
  // ----------------------------------------
  // 1. THREE.JS HERO CANVAS
  // ----------------------------------------
  let scene, camera, renderer, particles;
  
  function initThreeJS() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
  
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
  
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
    // Particles
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
  
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 100;
    }
  
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
    // Create subtle electric blue particles
    const material = new THREE.PointsMaterial({
      color: 0x4f8ef7,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
  
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
  
    // Animation Loop
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
  
    document.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
    });
  
    function animate() {
      requestAnimationFrame(animate);
      
      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;
      
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;
      
      // Gentle parallax
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
    }
    
    animate();
  
    // Resize handling
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  // ----------------------------------------
  // 2. LOGIC & DATA
  // ----------------------------------------
  function updateStats() {
    const statTotal = document.getElementById('statTotal');
    const statLive = document.getElementById('statLive');
    const statDays = document.getElementById('statDays');
    const navCount = document.getElementById('navCount');
  
    if (!statTotal || !PROJECTS) return;
  
    const totalCount = PROJECTS.length;
    const liveCount = PROJECTS.filter(p => p.isLive).length;
    const daysActive = PROJECTS.length > 0 ? Math.max(...PROJECTS.map(p => p.day)) : 0;
  
    if (navCount) navCount.textContent = `${totalCount} projects`;
  
    statTotal.setAttribute('data-target', totalCount);
    statLive.setAttribute('data-target', liveCount);
    statDays.setAttribute('data-target', daysActive);
  }
  
  function animateCounters() {
    const stats = [
      document.getElementById('statTotal'),
      document.getElementById('statLive'),
      document.getElementById('statDays')
    ];
  
    stats.forEach(stat => {
      if (!stat) return;
      
      const target = parseInt(stat.getAttribute('data-target') || '0', 10);
      const duration = 1500;
      const start = performance.now();
      
      function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);
        
        stat.textContent = current + (stat.id === 'statTotal' && current === target && target > 100 ? '+' : '');
        
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          stat.textContent = target + (stat.id === 'statTotal' && target > 100 ? '+' : '');
        }
      }
      requestAnimationFrame(update);
    });
  }
  
  // ----------------------------------------
  // 3. PROJECT GRID RENDERER
  // ----------------------------------------
  function renderCard(project) {
    const liveBadge = project.isLive ? `
      <div class="live-badge">
        <span class="dot"></span>
        LIVE
      </div>
    ` : '';
  
    const sourceBtnState = project.sourceUrl ? `href="${project.sourceUrl}"` : 'disabled';
    const sourceBtnClass = project.sourceUrl ? 'btn-source' : 'btn-source disabled';
  
    const formattedId = String(project.id).padStart(2, '0');
    
    // Choose an icon based on tags as a placeholder for the top image
    let icon = "web";
    if (project.tags.includes('React') || project.tags.includes('JS')) icon = "javascript";
    if (project.tags.includes('WebGL') || project.tags.includes('Three.js')) icon = "blur_on";
    if (project.tags.includes('API')) icon = "hub";
  
    return `
      <div class="project-card" data-tags="${project.tags.join(',')}" data-day="${project.day}">
        <div class="card-top-glow"></div>
        <div class="card-header-img">
          <span class="material-symbols-outlined">${icon}</span>
          ${liveBadge}
        </div>
        <div class="card-body">
          <div class="card-title-row">
             <h3 class="card-title">${project.title}</h3>
             <span class="card-number">#${formattedId}</span>
          </div>
          <p class="card-desc">${project.description}</p>
          
          <div class="card-tags">
            ${project.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          
          <div class="card-actions">
            <a href="${project.demoUrl}" target="_blank" class="btn-demo">Live Demo ↗</a>
            <a ${sourceBtnState} target="_blank" class="btn-source">&lt;&gt; Source</a>
          </div>
          
          <div class="card-folder">${project.folder}</div>
        </div>
      </div>
    `;
  }
  
  function renderGrid() {
    const grid = document.getElementById('projectsGrid');
    const searchVal = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const topSearchVal = document.getElementById('navSearch')?.value.toLowerCase() || '';
    const activeSearch = searchVal || topSearchVal;
    const tagFilter = document.getElementById('tagFilter')?.value || '';
    const sortOrder = document.getElementById('sortOrder')?.value || 'newest';
    const resultsCount = document.getElementById('resultsCount');
  
    if (!grid) return;
  
    let filtered = PROJECTS.filter(p => {
      const matchSearch = (p.title.toLowerCase().includes(activeSearch) || 
                           p.description.toLowerCase().includes(activeSearch) || 
                           p.tags.join(' ').toLowerCase().includes(activeSearch));
      const matchTag = tagFilter === '' || p.tags.includes(tagFilter);
      return matchSearch && matchTag;
    });
  
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => a.id - b.id);
    } else if (sortOrder === 'az') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
  
    grid.innerHTML = filtered.map(renderCard).join('');
    
    if (resultsCount) {
      resultsCount.textContent = `Showing ${filtered.length} of ${PROJECTS.length} projects`;
    }
  
    // Re-init vanilla-tilt and intersection observers on new DOM elements
    setTimeout(() => {
      if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".project-card"), {
          max: 8,
          speed: 400,
          glare: true,
          "max-glare": 0.08,
          perspective: 1000
        });
      }
      
      observeCards();
    }, 50);
  }
  
  function initFilters() {
    let timeout = null;
    const handleSearch = () => {
      clearTimeout(timeout);
      timeout = setTimeout(renderGrid, 200);
    };
  
    const navSearch = document.getElementById('navSearch');
    const projectSearch = document.getElementById('projectSearch');
  
    if (navSearch) {
      navSearch.addEventListener('input', (e) => {
        if(projectSearch) projectSearch.value = e.target.value;
        handleSearch();
      });
    }
  
    if (projectSearch) {
      projectSearch.addEventListener('input', (e) => {
        if(navSearch) navSearch.value = e.target.value;
        handleSearch();
      });
    }
  
    document.getElementById('tagFilter')?.addEventListener('change', renderGrid);
    document.getElementById('sortOrder')?.addEventListener('change', renderGrid);
  }
  
  // ----------------------------------------
  // 4. INTERSECTION OBSERVERS
  // ----------------------------------------
  function initIntersectionObservers() {
    // Stats Bar observer
    const statsBar = document.querySelector('.stats-bar-wrapper');
    if (statsBar) {
      const statsObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounters();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      statsObserver.observe(statsBar);
    }
  }
  
  function observeCards() {
    const cards = document.querySelectorAll('.project-card:not(.visible)');
    if (cards.length === 0) return;
  
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger effect
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 80);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
  
    cards.forEach(card => observer.observe(card));
  }
