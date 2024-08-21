let svgMap = document.getElementById('svg-map');
let isPanning = false;
let startX, startY, initialTranslateX = 0, initialTranslateY = 0, scale = 1;
let initialDistance = 0;

const visitedConcellos = new Set();
let concellos = new Set();
let concelloData = {};  // Para almacenar los datos de los concellos

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^(o\s|a\s)/, '');
}

// Función para cargar los estilos CSS dinámicamente según la elección del usuario
function loadDifficulty(difficulty) {
    const dynamicCss = document.getElementById('dynamic-css');
    const dynamicSvgCss = document.getElementById('dynamic-svg-css');

    if (difficulty === 'easy') {
        dynamicCss.href = 'css/easy/styles.css';
        dynamicSvgCss.href = 'css/easy/svg.css';
    } else if (difficulty === 'hard') {
        dynamicCss.href = 'css/hard/styles.css';
        dynamicSvgCss.href = 'css/hard/svg.css';
    }
}

// Cargar los datos de los concellos desde data.json
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(concello => {
            concelloData[normalizeString(concello.nombre)] = concello;
        });
    })
    .catch(error => console.error('Error al cargar los datos:', error));

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

    if (!visitedConcellos.has(name)) {
        visitedConcellos.add(name);
        concellos.delete(name);

        document.querySelectorAll(`#svg-map path[id="${name}"]`).forEach(path => {
            path.classList.add('selected');
        });

        updateContadorConcellos();
    } else {
        alert(`${name} ya figura`);
    }
}

function updateContadorConcellos() {
    const contador = document.getElementById('contador-concellos');
    contador.innerText = `${visitedConcellos.size}/313`;
    updateConcelloList();
}

function updateConcelloList() {
    const listContainer = document.getElementById('concellos-list');
    listContainer.innerHTML = ''; // Limpiar la lista

    const sortedConcellos = Array.from(concellos).concat(Array.from(visitedConcellos)).sort((a, b) => normalizeString(a).localeCompare(normalizeString(b)));

    sortedConcellos.forEach(concello => {
        const listItem = document.createElement('li');

        if (visitedConcellos.has(concello)) {
            listItem.innerText = concello;  // Mostrar el concello adivinado
            listItem.classList.add('adivinado');
        } else if (concellos.has(concello)) {
            listItem.innerText = " ";  // Espacio para los no adivinados
            listItem.classList.add('no-adivinado');
        }

        listContainer.appendChild(listItem);
    });
}

// Mostrar y ocultar la lista de concellos
document.getElementById('contador-concellos').addEventListener('click', function () {
    const listContainer = document.getElementById('concellos-list-container');
    listContainer.classList.toggle('hidden');
    listContainer.style.display = listContainer.style.display === 'none' ? 'block' : 'none';
});

// Ocultar la lista si se hace clic fuera de ella
document.addEventListener('click', function (event) {
    const listContainer = document.getElementById('concellos-list-container');
    const contadorConcellos = document.getElementById('contador-concellos');
    
    if (!listContainer.contains(event.target) && !contadorConcellos.contains(event.target)) {
        listContainer.classList.add('hidden');
        listContainer.style.display = 'none';
    }
});

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
        minX: Math.min(-maxX, 0),
        maxX: Math.max(maxX, 0),
        minY: Math.min(-maxY, 0),
        maxY: Math.max(maxY, 0)
    };
}

// Aplicar la transformación con la escala y la traslación correctas
function applyTransform() {
    const limits = getTranslationLimits();
    initialTranslateX = Math.min(Math.max(initialTranslateX, limits.minX), limits.maxX);
    initialTranslateY = Math.min(Math.max(initialTranslateY, limits.minY), limits.maxY);

    svgMap.style.transform = `translate(${initialTranslateX}px, ${initialTranslateY}px) scale(${scale})`;
}

// Funcionalidad de arrastre del mapa
svgMap.addEventListener('mousedown', function (event) {
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
    svgMap.style.cursor = 'grabbing';
});

svgMap.addEventListener('mouseup', function (event) {
    isPanning = false;
    initialTranslateX += event.clientX - startX;
    initialTranslateY += event.clientY - startY;
    svgMap.style.cursor = 'grab';
    applyTransform();
});

svgMap.addEventListener('mouseleave', function () {
    isPanning = false;
    svgMap.style.cursor = 'grab';
});

svgMap.addEventListener('mousemove', function (event) {
    if (isPanning) {
        const translateX = initialTranslateX + (event.clientX - startX);
        const translateY = initialTranslateY + (event.clientY - startY);
        
        svgMap.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
});

svgMap.addEventListener('wheel', function (event) {
    event.preventDefault();
    const zoomFactor = 0.1;
    const oldScale = scale;

    if (event.deltaY < 0) {
        scale = Math.min(scale + zoomFactor, 5);  // Zoom in
    } else {
        scale = Math.max(scale - zoomFactor, 1);  // Zoom out
    }

    // Ajustar la posición de la vista para mantener el foco del zoom en el mismo lugar
    const rect = svgMap.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    initialTranslateX -= (mouseX / oldScale) * (scale - oldScale);
    initialTranslateY -= (mouseY / oldScale) * (scale - oldScale);

    applyTransform();
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
        const oldScale = scale;
        scale *= newDistance / initialDistance;
        scale = Math.min(Math.max(scale, 1), 5);
        initialDistance = newDistance;

        const rect = svgMap.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        initialTranslateX -= (centerX / oldScale) * (scale - oldScale);
        initialTranslateY -= (centerY / oldScale) * (scale - oldScale);

        applyTransform();
    } else if (isPanning && event.touches.length === 1) {
        const translateX = initialTranslateX + (event.touches[0].clientX - startX);
        const translateY = initialTranslateY

 + (event.touches[0].clientY - startY);
        
        svgMap.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
});

svgMap.addEventListener('touchend', function (event) {
    isPanning = false;
    if (event.touches.length < 2) {
        initialTranslateX += (event.changedTouches[0].clientX - startX);
        initialTranslateY += (event.changedTouches[0].clientY - startY);
        svgMap.style.cursor = 'grab';
        applyTransform();
    }
});

// Cargar el mapa SVG e inicializar
fetch('svg/map_cleaned.svg')
    .then(response => response.text())
    .then(data => {
        svgMap.innerHTML = data;

        const bbox = svgMap.getBBox();
        svgMap.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width + 50} ${bbox.height + 50}`);

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
            const concelloName = this.getAttribute('id');
            const normalizedName = normalizeString(concelloName);

            // Verificar si el concello ha sido adivinado y si existe en los datos
            if (visitedConcellos.has(concelloName) && concelloData[normalizedName]) {
                const data = concelloData[normalizedName];

                const tooltip = document.createElement('div');
                tooltip.id = 'tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.backgroundColor = '#333';
                tooltip.style.color = '#fff';
                tooltip.style.padding = '10px';
                tooltip.style.borderRadius = '5px';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.zIndex = '1000';

                // Manejar múltiples escudos
                let escudosHtml = '';
                if (Array.isArray(data.escudos)) {
                    data.escudos.forEach(escudoPath => {
                        escudosHtml += `<img src="${escudoPath}" alt="Escudo de ${data.nombre}" style="width:50px;height:auto;margin-top:5px;"> `;
                    });
                } else if (data.escudo) {
                    escudosHtml = `<img src="${data.escudo}" alt="Escudo de ${data.nombre}" style="width:50px;height:auto;margin-top:5px;">`;
                }

                // Construir el contenido del tooltip
                tooltip.innerHTML = `
                    <strong>${data.nombre}</strong><br>
                    ${data.capital ? `Capital: ${data.capital}<br>` : ''}
                    Habitantes: ${data.habitantes}<br>
                    Superficie: ${data.superficie} km²<br>
                    Comarca: ${data.comarca}<br>
                    Provincia: ${data.provincia}<br>
                    ${escudosHtml}
                `;
                document.body.appendChild(tooltip);

                // Posicionar el tooltip
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

// Cargar la dificultad por defecto (por ejemplo, fácil)
window.addEventListener('load', function() {
    loadDifficulty('easy');
});

// Escuchar los clics en los botones de dificultad
document.getElementById('easy-btn').addEventListener('click', function() {
    loadDifficulty('easy');
});

document.getElementById('hard-btn').addEventListener('click', function() {
    loadDifficulty('hard');
});