// script.js

let svgMap = document.getElementById('svg-map');
let isPanning = false;
let startX, startY, initialTranslateX = 0, initialTranslateY = 0, scale = 1;

const visitedConcellos = new Set();
const concellos = new Set();

function normalizeString(str) {
    // Normaliza el string, elimina acentos y quita los artículos iniciales ("O ", "A ")
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^(o\s|a\s)/, '');
}

// Detectar cambios en el campo de búsqueda y colorear concello automáticamente
document.getElementById('concellos-search').addEventListener('input', function () {
    const input = normalizeString(this.value.trim());

    // No hacer nada si el campo de búsqueda está vacío
    if (input === '') return;

    // Buscar el concello exacto
    let matchingConcello = null;

    for (const concello of concellos) {
        const normalizedConcello = normalizeString(concello);

        if (input === normalizedConcello) {
            matchingConcello = concello;
            break;
        }
    }

    // Si hay una coincidencia exacta, colorear el concello
    if (matchingConcello) {
        addConcello(matchingConcello);
        this.value = ''; // Limpiar el campo de búsqueda después de colorear
    }
});

function addConcello(name) {
    if (!visitedConcellos.has(name)) {
        visitedConcellos.add(name);
        document.querySelectorAll(`#svg-map path[id="${name}"]`).forEach(path => {
            path.classList.add('selected');
        });
    }
}

// Funcionalidad de arrastre del mapa
svgMap.addEventListener('mousedown', function (event) {
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
    svgMap.style.cursor = 'grabbing';
});

svgMap.addEventListener('mouseup', function () {
    isPanning = false;
    initialTranslateX += event.clientX - startX;
    initialTranslateY += event.clientY - startY;
    svgMap.style.cursor = 'grab';
});

svgMap.addEventListener('mouseleave', function () {
    isPanning = false;
    svgMap.style.cursor = 'grab';
});

svgMap.addEventListener('mousemove', function (event) {
    if (isPanning) {
        let translateX = initialTranslateX + (event.clientX - startX);
        let translateY = initialTranslateY + (event.clientY - startY);
        svgMap.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
});

svgMap.addEventListener('wheel', function (event) {
    event.preventDefault();
    const zoomFactor = 0.1;
    if (event.deltaY < 0) {
        scale = Math.min(scale + zoomFactor, 5);  // Zoom in
    } else {
        scale = Math.max(scale - zoomFactor, 1);  // Zoom out
    }
    svgMap.style.transform = `scale(${scale}) translate(${initialTranslateX}px, ${initialTranslateY}px)`;
});

// Cargar el mapa SVG e inicializar
fetch('svg/mapa-galicia-nombres.svg')
    .then(response => response.text())
    .then(data => {
        svgMap.innerHTML = data;

        // Ajustar el viewBox basado en el contenido del SVG
        const bbox = svgMap.getBBox();
        svgMap.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

        // Poblar el set de concellos
        document.querySelectorAll('#svg-map path').forEach(path => {
            concellos.add(path.id);
        });

        // Añadir tooltips después de cargar el SVG
        addTooltips();
    })
    .catch(error => console.error('Error al cargar el SVG:', error));

function addTooltips() {
    document.querySelectorAll('#svg-map path').forEach(path => {
        path.addEventListener('mouseenter', function (e) {
            // Solo mostrar tooltip si el concello tiene la clase 'selected'
            if (this.classList.contains('selected')) {
                const tooltip = document.createElement('div');
                tooltip.id = 'tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.backgroundColor = '#333';
                tooltip.style.color = '#fff';
                tooltip.style.padding = '5px 10px';
                tooltip.style.borderRadius = '5px';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.zIndex = '1000';
                tooltip.innerText = this.getAttribute('id'); // Asume que el ID del path es el nombre del concello
                document.body.appendChild(tooltip);

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.pageXOffset + rect.width / 2}px`;
                tooltip.style.top = `${rect.top + window.pageYOffset - rect.height / 2}px`;
            }
        });

        path.addEventListener('mouseleave', function () {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

function addConcello(name) {
    if (!visitedConcellos.has(name)) {
        visitedConcellos.add(name);
        document.querySelectorAll(`#svg-map path[id="${name}"]`).forEach(path => {
            path.classList.add('selected');
        });
        updateContadorConcellos(); // Actualizar el contador cuando se añade un concello
    }
}

function updateContadorConcellos() {
    const contador = document.getElementById('contador-concellos');
    contador.innerText = `${visitedConcellos.size}/313 concellos seleccionados`;
}

fetch('svg/mapa-galicia-nombres.svg')
    .then(response => response.text())
    .then(data => {
        svgMap.innerHTML = data;

        const bbox = svgMap.getBBox();
        svgMap.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

        document.querySelectorAll('#svg-map path').forEach(path => {
            concellos.add(path.id);
        });

        addTooltips();
        updateContadorConcellos(); // Inicia el contador en 0
    })
    .catch(error => console.error('Error al cargar el SVG:', error));
