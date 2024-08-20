// script.js

let svgMap = document.getElementById('svg-map');
let isPanning = false;
let startX, startY, initialTranslateX = 0, initialTranslateY = 0, scale = 1;
let initialDistance = 0;

const visitedConcellos = new Set();
const concellos = new Set();

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^(o\s|a\s)/, '');
}

// Detectar cambios en el campo de búsqueda y colorear concello automáticamente
document.getElementById('concellos-search').addEventListener('input', function () {
    const input = normalizeString(this.value.trim());

    if (input === '') return;

    let matchingConcello = null;

    for (const concello of concellos) {
        const normalizedConcello = normalizeString(concello);

        if (input === normalizedConcello) {
            matchingConcello = concello;
            break;
        }
    }

    if (matchingConcello) {
        addConcello(matchingConcello);
        this.value = '';
    }
});

function addConcello(name) {
    const normalizedName = normalizeString(name);

    // Excepciones para nombres que comienzan similar pero no son exactamente iguales
    if (visitedConcellos.size > 0) {
        for (const visited of visitedConcellos) {
            const normalizedVisited = normalizeString(visited);
            if (
                (normalizedVisited.startsWith(normalizedName) && normalizedVisited.length > normalizedName.length) ||
                (normalizedName.startsWith(normalizedVisited) && normalizedName.length > normalizedVisited.length)
            ) {
                continue; // No bloquear la selección si uno es un prefijo del otro
            } else if (normalizedVisited === normalizedName) {
                alert(`${name} ya figura`);
                return;
            }
        }
    }

    visitedConcellos.add(name);
    document.querySelectorAll(`#svg-map path[id="${name}"]`).forEach(path => {
        path.classList.add('selected');
    });

    updateContadorConcellos();
}

function updateContadorConcellos() {
    const contador = document.getElementById('contador-concellos');
    contador.innerText = `${visitedConcellos.size}/313`;
}

// Definir los límites para el desplazamiento
function getTranslationLimits() {
    const svgRect = svgMap.getBoundingClientRect();
    const mapWidth = svgRect.width * scale;
    const mapHeight = svgRect.height * scale;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    const maxX = (mapWidth - containerWidth) / 2;
    const maxY = (mapHeight - containerHeight) / 2;

    return {
        minX: -maxX,
        maxX: maxX,
        minY: -maxY,
        maxY: maxY
    };
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

        const limits = getTranslationLimits();
        translateX = Math.min(Math.max(translateX, limits.minX), limits.maxX);
        translateY = Math.min(Math.max(translateY, limits.minY), limits.maxY);

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

// Eventos táctiles para dispositivos móviles
svgMap.addEventListener('touchstart', function (event) {
    if (event.touches.length === 2) {
        initialDistance = getDistance(event.touches);
        isPanning = false;
    } else if (event.touches.length === 1) {
        isPanning = true;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        svgMap.style.cursor = 'grabbing';
    }
});

svgMap.addEventListener('touchmove', function (event) {
    if (event.touches.length === 2) {
        const newDistance = getDistance(event.touches);
        const zoomFactor = 0.01;
        scale *= newDistance / initialDistance;
        scale = Math.min(Math.max(scale, 1), 5);
        initialDistance = newDistance;

        svgMap.style.transform = `translate(${initialTranslateX}px, ${initialTranslateY}px) scale(${scale})`;
    } else if (isPanning && event.touches.length === 1) {
        let translateX = initialTranslateX + (event.touches[0].clientX - startX);
        let translateY = initialTranslateY + (event.touches[0].clientY - startY);

        const limits = getTranslationLimits();
        translateX = Math.min(Math.max(translateX, limits.minX), limits.maxX);
        translateY = Math.min(Math.max(translateY, limits.minY), limits.maxY);

        svgMap.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
});

svgMap.addEventListener('touchend', function (event) {
    isPanning = false;
    if (event.touches.length < 2) {
        initialTranslateX += (event.changedTouches[0].clientX - startX);
        initialTranslateY += (event.changedTouches[0].clientY - startY);
        svgMap.style.cursor = 'grab';
    }
});

// Cargar el mapa SVG e inicializar
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
        updateContadorConcellos();
    })
    .catch(error => console.error('Error al cargar el SVG:', error));

function addTooltips() {
    document.querySelectorAll('#svg-map path').forEach(path => {
        path.addEventListener('mouseenter', function (e) {
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
                tooltip.innerText = this.getAttribute('id');
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

function getDistance(touches) {
    return Math.sqrt(Math.pow(touches[0].clientX - touches[1].clientX, 2) +
                     Math.pow(touches[0].clientY - touches[1].clientY, 2));
}