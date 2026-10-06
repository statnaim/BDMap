/* =========================================================
   INTERACTIVE BANGLADESH MAP
   Vanilla JavaScript
========================================================= */


/* =========================================================
   REAL BANGLADESH DIVISION GEOJSON
========================================================= */

const MAP_GEOJSON_URL =
    "https://raw.githubusercontent.com/Tasmim-Adib/Bangladesh-GeoJson/main/bangladesh_divisions.geojson";


/* =========================================================
   DIVISION DATA
   Exactly 8 divisions and 64 districts
========================================================= */

const divisions = {

    dhaka: {
        name: "Dhaka Division",
        shortName: "Dhaka",
        color: "#2563eb",
        center: {
            lat: 23.810332,
            lon: 90.412518
        },
        districts: [
            "Dhaka",
            "Faridpur",
            "Gazipur",
            "Gopalganj",
            "Kishoreganj",
            "Madaripur",
            "Manikganj",
            "Munshiganj",
            "Narayanganj",
            "Narsingdi",
            "Rajbari",
            "Shariatpur",
            "Tangail"
        ]
    },


    chattogram: {
        name: "Chattogram Division",
        shortName: "Chattogram",
        color: "#10b981",
        center: {
            lat: 22.356851,
            lon: 91.783182
        },
        districts: [
            "Bandarban",
            "Brahmanbaria",
            "Chandpur",
            "Chattogram",
            "Cumilla",
            "Cox's Bazar",
            "Feni",
            "Khagrachhari",
            "Lakshmipur",
            "Noakhali",
            "Rangamati"
        ]
    },


    rajshahi: {
        name: "Rajshahi Division",
        shortName: "Rajshahi",
        color: "#f59e0b",
        center: {
            lat: 24.363589,
            lon: 88.624135
        },
        districts: [
            "Bogura",
            "Chapainawabganj",
            "Joypurhat",
            "Naogaon",
            "Natore",
            "Pabna",
            "Rajshahi",
            "Sirajganj"
        ]
    },


    khulna: {
        name: "Khulna Division",
        shortName: "Khulna",
        color: "#8b5cf6",
        center: {
            lat: 22.845641,
            lon: 89.540328
        },
        districts: [
            "Bagerhat",
            "Chuadanga",
            "Jashore",
            "Jhenaidah",
            "Khulna",
            "Kushtia",
            "Magura",
            "Meherpur",
            "Narail",
            "Satkhira"
        ]
    },


    barishal: {
        name: "Barishal Division",
        shortName: "Barishal",
        color: "#ef4444",
        center: {
            lat: 22.701002,
            lon: 90.353451
        },
        districts: [
            "Barguna",
            "Barishal",
            "Bhola",
            "Jhalokathi",
            "Patuakhali",
            "Pirojpur"
        ]
    },


    sylhet: {
        name: "Sylhet Division",
        shortName: "Sylhet",
        color: "#14b8a6",
        center: {
            lat: 24.894929,
            lon: 91.868706
        },
        districts: [
            "Habiganj",
            "Moulvibazar",
            "Sunamganj",
            "Sylhet"
        ]
    },


    rangpur: {
        name: "Rangpur Division",
        shortName: "Rangpur",
        color: "#eab308",
        center: {
            lat: 25.743892,
            lon: 89.275227
        },
        districts: [
            "Dinajpur",
            "Gaibandha",
            "Kurigram",
            "Lalmonirhat",
            "Nilphamari",
            "Panchagarh",
            "Rangpur",
            "Thakurgaon"
        ]
    },


    mymensingh: {
        name: "Mymensingh Division",
        shortName: "Mymensingh",
        color: "#ec4899",
        center: {
            lat: 24.747149,
            lon: 90.420273
        },
        districts: [
            "Jamalpur",
            "Mymensingh",
            "Netrokona",
            "Sherpur"
        ]
    }

};


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
    selectedDivision: null,
    selectedDistrict: null,
    expandedDivisions: new Set(),
    geoJson: null,
    featureElements: new Map(),
    labelElements: new Map(),
    districtToDivision: new Map()
};


/* =========================================================
   DOM REFERENCES
========================================================= */

const elements = {
    divisionList:
        document.getElementById("divisionList"),

    searchInput:
        document.getElementById("searchInput"),

    searchResults:
        document.getElementById("searchResults"),

    clearSearch:
        document.getElementById("clearSearch"),

    resetButton:
        document.getElementById("resetButton"),

    infoContent:
        document.getElementById("infoContent"),

    selectionIndicator:
        document.getElementById("selectionIndicator"),

    map:
        document.getElementById("bangladeshMap"),

    mapFeatures:
        document.getElementById("mapFeatures"),

    mapLabels:
        document.getElementById("mapLabels"),

    mapBackground:
        document.getElementById("mapBackground"),

    mapTooltip:
        document.getElementById("mapTooltip"),

    mapLoading:
        document.getElementById("mapLoading"),

    mapError:
        document.getElementById("mapError"),

    retryMap:
        document.getElementById("retryMap"),

    mapStatus:
        document.getElementById("mapStatus"),

    legendItems:
        document.getElementById("legendItems")
};


/* =========================================================
   BUILD DISTRICT LOOKUP
========================================================= */

function buildDistrictLookup() {

    state.districtToDivision.clear();

    Object.entries(divisions).forEach(
        ([divisionId, division]) => {

            division.districts.forEach(
                district => {

                    state.districtToDivision.set(
                        normalize(district),
                        divisionId
                    );

                }
            );

        }
    );

}


/* =========================================================
   NORMALIZE SEARCH TEXT
========================================================= */

function normalize(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[’']/g, "'")
        .replace(/\s+/g, " ");

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   CREATE SVG ELEMENT
========================================================= */

function createSvgElement(tag, attributes = {}) {

    const element =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );

    Object.entries(attributes).forEach(
        ([key, value]) => {
            element.setAttribute(key, value);
        }
    );

    return element;

}


/* =========================================================
   GEOJSON COORDINATE EXTRACTION
========================================================= */

function collectCoordinates(geometry, output = []) {

    if (!geometry) {
        return output;
    }

    const type = geometry.type;
    const coordinates = geometry.coordinates;

    if (type === "Point") {

        output.push(coordinates);

    }

    else if (type === "MultiPoint") {

        coordinates.forEach(
            coordinate => output.push(coordinate)
        );

    }

    else if (type === "LineString") {

        coordinates.forEach(
            coordinate => output.push(coordinate)
        );

    }

    else if (type === "MultiLineString") {

        coordinates.forEach(
            line => {

                line.forEach(
                    coordinate => output.push(coordinate)
                );

            }
        );

    }

    else if (type === "Polygon") {

        coordinates.forEach(
            ring => {

                ring.forEach(
                    coordinate => output.push(coordinate)
                );

            }
        );

    }

    else if (type === "MultiPolygon") {

        coordinates.forEach(
            polygon => {

                polygon.forEach(
                    ring => {

                        ring.forEach(
                            coordinate => output.push(coordinate)
                        );

                    }
                );

            }
        );

    }

    else if (type === "GeometryCollection") {

        geometry.geometries.forEach(
            childGeometry => {

                collectCoordinates(
                    childGeometry,
                    output
                );

            }
        );

    }

    return output;

}


/* =========================================================
   CALCULATE GEOJSON BOUNDS
========================================================= */

function calculateBounds(features) {

    const points = [];

    features.forEach(
        feature => {

            collectCoordinates(
                feature.geometry,
                points
            );

        }
    );

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    points.forEach(
        point => {

            const lon = Number(point[0]);
            const lat = Number(point[1]);

            if (!Number.isFinite(lon) ||
                !Number.isFinite(lat)) {
                return;
            }

            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);

            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);

        }
    );

    return {
        minLon,
        maxLon,
        minLat,
        maxLat
    };

}


/* =========================================================
   CREATE SIMPLE GEO PROJECTION
========================================================= */

function createProjection(bounds) {

    const width = 760;
    const height = 820;

    const padding = 35;

    const geoWidth =
        bounds.maxLon - bounds.minLon;

    const geoHeight =
        bounds.maxLat - bounds.minLat;

    const scaleX =
        (width - padding * 2) / geoWidth;

    const scaleY =
        (height - padding * 2) / geoHeight;

    const scale =
        Math.min(scaleX, scaleY);

    const renderedWidth =
        geoWidth * scale;

    const renderedHeight =
        geoHeight * scale;

    const offsetX =
        (width - renderedWidth) / 2;

    const offsetY =
        (height - renderedHeight) / 2;

    return function project(lon, lat) {

        const x =
            offsetX +
            (lon - bounds.minLon) * scale;

        const y =
            offsetY +
            (bounds.maxLat - lat) * scale;

        return [x, y];

    };

}


/* =========================================================
   CONVERT GEOJSON GEOMETRY TO SVG PATH
========================================================= */

function geometryToPath(geometry, project) {

    if (!geometry) {
        return "";
    }

    const type = geometry.type;
    const coordinates = geometry.coordinates;

    function ringToPath(ring) {

        if (!ring || ring.length === 0) {
            return "";
        }

        let path = "";

        ring.forEach(
            (coordinate, index) => {

                const point =
                    project(
                        Number(coordinate[0]),
                        Number(coordinate[1])
                    );

                if (index === 0) {
                    path +=
                        `M ${point[0].toFixed(2)} ${point[1].toFixed(2)} `;
                }

                else {
                    path +=
                        `L ${point[0].toFixed(2)} ${point[1].toFixed(2)} `;
                }

            }
        );

        path += "Z ";

        return path;

    }


    if (type === "Polygon") {

        return coordinates
            .map(ringToPath)
            .join("");

    }


    if (type === "MultiPolygon") {

        return coordinates
            .map(
                polygon =>
                    polygon
                        .map(ringToPath)
                        .join("")
            )
            .join("");

    }


    if (type === "GeometryCollection") {

        return geometry.geometries
            .map(
                child =>
                    geometryToPath(
                        child,
                        project
                    )
            )
            .join("");

    }


    return "";

}


/* =========================================================
   FIND DIVISION ID FROM GEOJSON FEATURE
========================================================= */

function findDivisionId(feature) {

    if (!feature || !feature.properties) {
        return null;
    }

    const properties =
        feature.properties;

    const values =
        Object.values(properties);

    const aliases = {

        dhaka: [
            "dhaka",
            "ঢাকা"
        ],

        chattogram: [
            "chattogram",
            "chittagong",
            "chattagram",
            "চট্টগ্রাম"
        ],

        rajshahi: [
            "rajshahi",
            "রাজশাহী"
        ],

        khulna: [
            "khulna",
            "খুলনা"
        ],

        barishal: [
            "barishal",
            "barisal",
            "বরিশাল"
        ],

        sylhet: [
            "sylhet",
            "সিলেট"
        ],

        rangpur: [
            "rangpur",
            "রংপুর"
        ],

        mymensingh: [
            "mymensingh",
            "ময়মনসিংহ",
            "ময়মনসিংহ"
        ]

    };


    const normalizedValues =
        values.map(
            value =>
                normalize(value)
        );


    for (
        const [divisionId, names]
        of Object.entries(aliases)
    ) {

        for (const alias of names) {

            const normalizedAlias =
                normalize(alias);

            if (
                normalizedValues.some(
                    value =>
                        value === normalizedAlias ||
                        value.includes(normalizedAlias)
                )
            ) {
                return divisionId;
            }

        }

    }


    return null;

}


/* =========================================================
   BUILD SIDEBAR
========================================================= */

function renderSidebar() {

    elements.divisionList.innerHTML = "";

    Object.entries(divisions).forEach(
        ([divisionId, division]) => {

            const item =
                document.createElement("div");

            item.className =
                "division-item";

            item.dataset.division =
                divisionId;


            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "division-button";

            button.dataset.division =
                divisionId;

            button.setAttribute(
                "aria-expanded",
                state.expandedDivisions.has(
                    divisionId
                )
                    ? "true"
                    : "false"
            );


            button.innerHTML = `

                <span class="expand-icon">
                    ›
                </span>

                <span
                    class="division-color"
                    style="background:${division.color}"
                ></span>

                <span class="division-name">
                    ${escapeHtml(division.name)}
                </span>

                <span class="division-count">
                    ${division.districts.length}
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    toggleDivision(
                        divisionId
                    );

                    selectDivision(
                        divisionId
                    );

                }
            );


            const districtList =
                document.createElement("div");

            districtList.className =
                "district-list";


            const districtInner =
                document.createElement("div");

            districtInner.className =
                "district-list-inner";


            division.districts.forEach(
                district => {

                    const districtButton =
                        document.createElement("button");

                    districtButton.type = "button";

                    districtButton.className =
                        "district-button";

                    districtButton.dataset.division =
                        divisionId;

                    districtButton.dataset.district =
                        district;

                    districtButton.setAttribute(
                        "aria-label",
                        `${district}, ${division.name}`
                    );

                    districtButton.textContent =
                        district;


                    districtButton.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            selectDistrict(
                                district,
                                divisionId
                            );

                        }
                    );


                    districtInner.appendChild(
                        districtButton
                    );

                }
            );


            districtList.appendChild(
                districtInner
            );

            item.appendChild(button);

            item.appendChild(
                districtList
            );

            elements.divisionList.appendChild(
                item
            );

        }
    );

    updateSidebarState();

}


/* =========================================================
   UPDATE SIDEBAR VISUAL STATE
========================================================= */

function updateSidebarState() {

    const items =
        elements.divisionList.querySelectorAll(
            ".division-item"
        );


    items.forEach(
        item => {

            const divisionId =
                item.dataset.division;

            const button =
                item.querySelector(
                    ".division-button"
                );

            const expanded =
                state.expandedDivisions.has(
                    divisionId
                );

            const selected =
                state.selectedDivision ===
                divisionId;


            item.classList.toggle(
                "expanded",
                expanded
            );

            button.classList.toggle(
                "expanded",
                expanded
            );

            button.classList.toggle(
                "selected",
                selected
            );

            button.setAttribute(
                "aria-expanded",
                expanded
                    ? "true"
                    : "false"
            );

        }
    );


    const districtButtons =
        elements.divisionList.querySelectorAll(
            ".district-button"
        );


    districtButtons.forEach(
        button => {

            button.classList.toggle(
                "selected",
                state.selectedDistrict ===
                    button.dataset.district
            );

        }
    );

}


/* =========================================================
   TOGGLE DIVISION
========================================================= */

function toggleDivision(divisionId) {

    if (
        state.expandedDivisions.has(
            divisionId
        )
    ) {

        state.expandedDivisions.delete(
            divisionId
        );

    }

    else {

        state.expandedDivisions.add(
            divisionId
        );

    }

    updateSidebarState();

}


/* =========================================================
   SELECT DIVISION
========================================================= */

function selectDivision(
    divisionId,
    options = {}
) {

    if (!divisions[divisionId]) {
        return;
    }


    state.selectedDivision =
        divisionId;

    state.selectedDistrict =
        null;


    if (
        options.expand !== false
    ) {

        state.expandedDivisions.add(
            divisionId
        );

    }


    updateSidebarState();

    updateMapSelection();

    renderDivisionInfo(
        divisionId
    );

    updateMapStatus(
        divisions[divisionId].shortName
    );

    elements.selectionIndicator.classList.add(
        "active"
    );

    if (
        options.scrollInfo !== false
    ) {
        scrollInfoIntoView();
    }

}


/* =========================================================
   SELECT DISTRICT
========================================================= */

function selectDistrict(
    district,
    divisionId
) {

    if (
        !divisions[divisionId]
    ) {
        return;
    }


    state.selectedDivision =
        divisionId;

    state.selectedDistrict =
        district;


    state.expandedDivisions.add(
        divisionId
    );


    updateSidebarState();

    updateMapSelection();

    renderDistrictInfo(
        district,
        divisionId
    );

    updateMapStatus(
        district
    );

    elements.selectionIndicator.classList.add(
        "active"
    );


    scrollSelectedDistrictIntoView();

}


/* =========================================================
   MAP SELECTION STATE
========================================================= */

function updateMapSelection() {

    state.featureElements.forEach(
        (element, divisionId) => {

            const selected =
                state.selectedDivision ===
                divisionId;

            const hasSelection =
                Boolean(
                    state.selectedDivision
                );


            element.classList.toggle(
                "selected",
                selected
            );


            element.classList.toggle(
                "dimmed",
                hasSelection &&
                !selected
            );

        }
    );


    state.labelElements.forEach(
        (element, divisionId) => {

            const selected =
                state.selectedDivision ===
                divisionId;

            const hasSelection =
                Boolean(
                    state.selectedDivision
                );


            element.classList.toggle(
                "selected",
                selected
            );


            element.classList.toggle(
                "dimmed",
                hasSelection &&
                !selected
            );

        }
    );

}


/* =========================================================
   RENDER DIVISION INFORMATION
========================================================= */

function renderDivisionInfo(
    divisionId
) {

    const division =
        divisions[divisionId];


    const districtHtml =
        division.districts
            .map(
                district => `
                    <button
                        type="button"
                        class="info-district"
                        data-info-district="${escapeHtml(district)}"
                        data-info-division="${divisionId}"
                    >
                        ${escapeHtml(district)}
                    </button>
                `
            )
            .join("");


    elements.infoContent.innerHTML = `

        <div class="info-kicker">
            DIVISION
        </div>

        <h3
            class="info-title"
        >
            ${escapeHtml(division.name)}
        </h3>

        <p class="info-description">
            Administrative division of Bangladesh.
        </p>

        <div class="info-stat">

            <span class="info-stat-label">
                Total Districts
            </span>

            <span class="info-stat-value">
                ${division.districts.length}
            </span>

        </div>

        <div class="district-heading">
            DISTRICTS
        </div>

        <div class="info-district-grid">
            ${districtHtml}
        </div>

    `;


    const infoButtons =
        elements.infoContent.querySelectorAll(
            "[data-info-district]"
        );


    infoButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectDistrict(
                        button.dataset.infoDistrict,
                        button.dataset.infoDivision
                    );

                }
            );

        }
    );

}


/* =========================================================
   RENDER DISTRICT INFORMATION
========================================================= */

function renderDistrictInfo(
    district,
    divisionId
) {

    const division =
        divisions[divisionId];


    elements.infoContent.innerHTML = `

        <div class="district-info-card">

            <div
                class="district-color-line"
                style="background:${division.color}"
            ></div>

            <div class="info-kicker">
                DISTRICT
            </div>

            <h3 class="info-title">
                ${escapeHtml(district)}
            </h3>

            <div class="detail-row">

                <span class="detail-label">
                    District
                </span>

                <span class="detail-value">
                    ${escapeHtml(district)}
                </span>

            </div>

            <div class="detail-row">

                <span class="detail-label">
                    Division
                </span>

                <span class="detail-value">
                    ${escapeHtml(division.name)}
                </span>

            </div>

            <div class="detail-row">

                <span class="detail-label">
                    Districts in Division
                </span>

                <span class="detail-value">
                    ${division.districts.length}
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   SCROLL SELECTED DISTRICT INTO VIEW
========================================================= */

function scrollSelectedDistrictIntoView() {

    requestAnimationFrame(
        () => {

            const selected =
                elements.divisionList.querySelector(
                    ".district-button.selected"
                );

            if (!selected) {
                return;
            }


            selected.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }
    );

}


/* =========================================================
   SCROLL INFORMATION INTO VIEW
========================================================= */

function scrollInfoIntoView() {

    if (
        window.innerWidth <= 900
    ) {

        document
            .querySelector(".info-panel")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }

}


/* =========================================================
   UPDATE MAP STATUS
========================================================= */

function updateMapStatus(
    label
) {

    elements.mapStatus.innerHTML = `

        <span class="status-dot"></span>

        <span>
            ${escapeHtml(label)}
        </span>

    `;

}


/* =========================================================
   BUILD LEGEND
========================================================= */

function renderLegend() {

    elements.legendItems.innerHTML =
        Object.entries(divisions)
            .map(
                ([id, division]) => `
                    <div class="legend-item">

                        <span
                            class="legend-color"
                            style="background:${division.color}"
                        ></span>

                        <span>
                            ${escapeHtml(division.shortName)}
                        </span>

                    </div>
                `
            )
            .join("");

}


/* =========================================================
   GEOJSON MAP RENDERING
========================================================= */

async function loadMap() {

    showMapLoading();

    hideMapError();


    try {

        const response =
            await fetch(
                MAP_GEOJSON_URL,
                {
                    cache: "force-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Map request failed: ${response.status}`
            );

        }


        const geoJson =
            await response.json();


        if (
            !geoJson ||
            !Array.isArray(
                geoJson.features
            )
        ) {

            throw new Error(
                "Invalid GeoJSON format."
            );

        }


        state.geoJson =
            geoJson;


        renderGeoJsonMap(
            geoJson
        );


        hideMapLoading();

        updateMapStatus(
            "Ready"
        );

    }

    catch (error) {

        console.error(
            "Bangladesh map loading error:",
            error
        );

        hideMapLoading();

        showMapError();

        updateMapStatus(
            "Map unavailable"
        );

    }

}


/* =========================================================
   RENDER GEOJSON
========================================================= */

function renderGeoJsonMap(
    geoJson
) {

    const features =
        geoJson.features;


    const bounds =
        calculateBounds(
            features
        );


    const project =
        createProjection(
            bounds
        );


    elements.mapFeatures.innerHTML =
        "";

    elements.mapLabels.innerHTML =
        "";

    state.featureElements.clear();

    state.labelElements.clear();


    /* ===============================
       BACKGROUND
    =============================== */

    const countryPath =
        createSvgElement(
            "path",
            {
                class: "map-background"
            }
        );


    let countryD = "";


    features.forEach(
        feature => {

            countryD +=
                geometryToPath(
                    feature.geometry,
                    project
                );

        }
    );


    countryPath.setAttribute(
        "d",
        countryD
    );


    elements.mapBackground.innerHTML =
        "";

    elements.mapBackground.appendChild(
        countryPath
    );


    /* ===============================
       DIVISION FEATURES
    =============================== */

    features.forEach(
        feature => {

            const divisionId =
                findDivisionId(
                    feature
                );


            if (
                !divisionId ||
                !divisions[divisionId]
            ) {

                console.warn(
                    "Could not identify GeoJSON division:",
                    feature.properties
                );

                return;

            }


            const division =
                divisions[divisionId];


            const path =
                createSvgElement(
                    "path",
                    {
                        class:
                            "division-shape",
                        d:
                            geometryToPath(
                                feature.geometry,
                                project
                            ),
                        fill:
                            division.color,
                        "data-division":
                            divisionId,
                        tabindex:
                            "0",
                        role:
                            "button",
                        "aria-label":
                            `${division.name}, ${division.districts.length} districts`
                    }
                );


            path.addEventListener(
                "click",
                () => {

                    selectDivision(
                        divisionId
                    );

                }
            );


            path.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        selectDivision(
                            divisionId
                        );

                    }

                }
            );


            path.addEventListener(
                "mouseenter",
                event => {

                    showTooltip(
                        event,
                        divisionId
                    );

                }
            );


            path.addEventListener(
                "mousemove",
                event => {

                    moveTooltip(
                        event
                    );

                }
            );


            path.addEventListener(
                "mouseleave",
                hideTooltip
            );


            elements.mapFeatures.appendChild(
                path
            );


            state.featureElements.set(
                divisionId,
                path
            );

        }
    );


    /* ===============================
       DIVISION LABELS
    =============================== */

    Object.entries(divisions).forEach(
        ([divisionId, division]) => {

            const point =
                project(
                    division.center.lon,
                    division.center.lat
                );


            const group =
                createSvgElement(
                    "g",
                    {
                        class:
                            "map-label-group"
                    }
                );


            const text =
                createSvgElement(
                    "text",
                    {
                        class:
                            "map-label",
                        x:
                            point[0],
                        y:
                            point[1],
                        "data-division":
                            divisionId
                    }
                );


            text.textContent =
                division.shortName;


            group.appendChild(
                text
            );

            elements.mapLabels.appendChild(
                group
            );


            state.labelElements.set(
                divisionId,
                text
            );

        }
    );


    updateMapSelection();

}


/* =========================================================
   TOOLTIP
========================================================= */

function showTooltip(
    event,
    divisionId
) {

    const division =
        divisions[divisionId];


    elements.mapTooltip.innerHTML = `

        <div class="tooltip-title">
            ${escapeHtml(division.name)}
        </div>

        <div class="tooltip-subtitle">
            ${division.districts.length} Districts
        </div>

    `;


    elements.mapTooltip.classList.add(
        "visible"
    );


    moveTooltip(
        event
    );

}


/* =========================================================
   MOVE TOOLTIP
========================================================= */

function moveTooltip(
    event
) {

    const tooltip =
        elements.mapTooltip;


    const offset = 15;

    const rect =
        tooltip.getBoundingClientRect();


    let left =
        event.clientX + offset;

    let top =
        event.clientY + offset;


    if (
        left + rect.width >
        window.innerWidth - 10
    ) {

        left =
            event.clientX -
            rect.width -
            offset;

    }


    if (
        top + rect.height >
        window.innerHeight - 10
    ) {

        top =
            event.clientY -
            rect.height -
            offset;

    }


    tooltip.style.left =
        `${Math.max(8, left)}px`;

    tooltip.style.top =
        `${Math.max(8, top)}px`;

}


/* =========================================================
   HIDE TOOLTIP
========================================================= */

function hideTooltip() {

    elements.mapTooltip.classList.remove(
        "visible"
    );

}


/* =========================================================
   SEARCH
========================================================= */

function handleSearch() {

    const query =
        normalize(
            elements.searchInput.value
        );


    elements.clearSearch.classList.toggle(
        "visible",
        query.length > 0
    );


    if (!query) {

        closeSearchResults();

        clearSearchHighlight();

        return;

    }


    const results = [];


    /* ===============================
       DIVISION SEARCH
    =============================== */

    Object.entries(divisions).forEach(
        ([divisionId, division]) => {

            const divisionName =
                normalize(
                    division.shortName
                );

            const fullName =
                normalize(
                    division.name
                );


            if (
                divisionName.includes(query) ||
                fullName.includes(query)
            ) {

                results.push({
                    type: "division",
                    divisionId,
                    name: division.name,
                    subtitle:
                        `${division.districts.length} districts`
                });

            }

        }
    );


    /* ===============================
       DISTRICT SEARCH
    =============================== */

    Object.entries(divisions).forEach(
        ([divisionId, division]) => {

            division.districts.forEach(
                district => {

                    if (
                        normalize(
                            district
                        ).includes(query)
                    ) {

                        results.push({
                            type: "district",
                            divisionId,
                            name: district,
                            subtitle:
                                division.name
                        });

                    }

                }
            );

        }
    );


    renderSearchResults(
        results.slice(0, 12)
    );

}


/* =========================================================
   RENDER SEARCH RESULTS
========================================================= */

function renderSearchResults(
    results
) {

    if (!results.length) {

        elements.searchResults.innerHTML = `

            <div class="no-results">
                No division or district found.
            </div>

        `;

        elements.searchResults.classList.add(
            "visible"
        );

        return;

    }


    elements.searchResults.innerHTML =
        results
            .map(
                (result, index) => `

                    <button
                        type="button"
                        class="search-result-item"
                        data-result-index="${index}"
                    >

                        <span class="result-symbol">
                            ${result.type === "division" ? "▦" : "•"}
                        </span>

                        <span class="result-text">

                            <strong>
                                ${escapeHtml(result.name)}
                            </strong>

                            <span>
                                ${escapeHtml(result.subtitle)}
                            </span>

                        </span>

                    </button>

                `
            )
            .join("");


    const buttons =
        elements.searchResults.querySelectorAll(
            ".search-result-item"
        );


    buttons.forEach(
        (button, index) => {

            button.addEventListener(
                "click",
                () => {

                    const result =
                        results[index];


                    if (
                        result.type ===
                        "division"
                    ) {

                        selectDivision(
                            result.divisionId
                        );

                    }

                    else {

                        selectDistrict(
                            result.name,
                            result.divisionId
                        );

                    }


                    closeSearchResults();

                }
            );

        }
    );


    elements.searchResults.classList.add(
        "visible"
    );

}


/* =========================================================
   CLEAR SEARCH HIGHLIGHT
========================================================= */

function clearSearchHighlight() {

    state.featureElements.forEach(
        element => {

            element.classList.remove(
                "search-match"
            );

        }
    );

}


/* =========================================================
   CLOSE SEARCH RESULTS
========================================================= */

function closeSearchResults() {

    elements.searchResults.classList.remove(
        "visible"
    );

}


/* =========================================================
   RESET MAP
========================================================= */

function resetMap() {

    state.selectedDivision =
        null;

    state.selectedDistrict =
        null;

    state.expandedDivisions.clear();


    elements.searchInput.value =
        "";


    elements.clearSearch.classList.remove(
        "visible"
    );


    closeSearchResults();

    clearSearchHighlight();

    updateSidebarState();

    updateMapSelection();

    renderDefaultInfo();

    elements.selectionIndicator.classList.remove(
        "active"
    );

    updateMapStatus(
        "Ready"
    );

    hideTooltip();

}


/* =========================================================
   DEFAULT INFORMATION
========================================================= */

function renderDefaultInfo() {

    elements.infoContent.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                🗺️
            </div>

            <h3>
                Select a division or district
            </h3>

            <p>
                Click any division on the map or choose an item
                from the list to view information.
            </p>

        </div>

    `;

}


/* =========================================================
   MAP LOADING UI
========================================================= */

function showMapLoading() {

    elements.mapLoading.classList.remove(
        "loaded"
    );

}


function hideMapLoading() {

    elements.mapLoading.classList.add(
        "loaded"
    );

}


/* =========================================================
   MAP ERROR UI
========================================================= */

function showMapError() {

    elements.mapError.classList.remove(
        "hidden"
    );

}


function hideMapError() {

    elements.mapError.classList.add(
        "hidden"
    );

}


/* =========================================================
   SEARCH EVENT LISTENERS
========================================================= */

elements.searchInput.addEventListener(
    "input",
    handleSearch
);


elements.searchInput.addEventListener(
    "focus",
    () => {

        if (
            elements.searchInput.value.trim()
        ) {

            handleSearch();

        }

    }
);


elements.clearSearch.addEventListener(
    "click",
    () => {

        elements.searchInput.value =
            "";

        elements.clearSearch.classList.remove(
            "visible"
        );

        closeSearchResults();

        clearSearchHighlight();

        elements.searchInput.focus();

    }
);


/* =========================================================
   RESET BUTTON
========================================================= */

elements.resetButton.addEventListener(
    "click",
    resetMap
);


/* =========================================================
   RETRY BUTTON
========================================================= */

elements.retryMap.addEventListener(
    "click",
    loadMap
);


/* =========================================================
   CLOSE SEARCH WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !elements.searchResults.contains(
                event.target
            ) &&
            !event.target.closest(
                ".search-wrapper"
            )
        ) {

            closeSearchResults();

        }

    }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeSearchResults();

            hideTooltip();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeApp() {

    buildDistrictLookup();

    renderSidebar();

    renderLegend();

    renderDefaultInfo();

    loadMap();

}


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);