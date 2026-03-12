
const DB_URL = "https://tinkr.tech/sdb/minu_puud";
window.onload = function() {
    loadTrees();
};


async function getTrees() {
    try {
        const response = await fetch(DB_URL);
        if (!response.ok) {
            return []
        } 
        return await response.json();
    } catch (e) {
        return []
    }
}

async function saveTree(tree) {
    const response = await fetch(DB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tree)
    });
    return await response.json();
}

async function updateTree(id, updatedData) {
    const response = await fetch(`${DB_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    });
    return await response.json();
}

async function deleteTreeFromAPI(id) {
    await fetch(`${DB_URL}/${id}`, {
        method: "DELETE"
    });
}

function getLocation(inputId) {
    console.log("getLocation")
    if (!navigator.geolocation) {
        console.log("if")
        alert("Geolocation ei ole toetatud sinu brauseris.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log("function")
            var latitude = position.coords.latitude;
            console.log("latitude")
            var longitude = position.coords.longitude;
            console.log("longitude")

            document.getElementById(inputId).value =
            latitude.toFixed(6) + "," + longitude.toFixed(6);
        },
        function() {
            alert("Asukoha leidmine ebaõnnestus. Luba asukoht.");
        }
        );
}

async function addTree() {
    var name = document.getElementById("treeName").value;
    var species = document.getElementById("species").value.toLowerCase();
    var date = document.getElementById("date").value;
    var location = document.getElementById("location").value;

    var allowedSpecies = ["mänd", "kask", "tamm"];
    if (!allowedSpecies.includes(species)) {
        alert("Saad lisada ainult: mänd, kask, tamm");
        return;
    }

    if (!name || !species || !date || !location) {
        alert("Täida kõik väljad!");
        return;
    }

    await saveTree({
        name,
        species,
        date,
        location,
        type: "standard"
    });

    loadTrees();
    clearStandardFields();
}

async function addUserTree() {
    var name = document.getElementById("userTreeName").value;
    var species = document.getElementById("userSpecies").value;
    var matureAge = document.getElementById("userMatureAge").value;
    var date = document.getElementById("userDate").value;
    var location = document.getElementById("userLocation").value;

    if (!name || !species || !matureAge || !date || !location) {
        alert("Täida kõik väljad!");
        return;
    }

    await saveTree({
        name,
        species,
        matureAge: parseInt(matureAge),
        date,
        location,
        type: "user"
    });

    loadTrees();
    clearUserFields();
}

function clearStandardFields() {
    document.getElementById("treeName").value = "";
    document.getElementById("species").value = "";
    document.getElementById("date").value = "";
    document.getElementById("location").value = "";
}

function clearUserFields() {
    document.getElementById("userTreeName").value = "";
    document.getElementById("userSpecies").value = "";
    document.getElementById("userMatureAge").value = "";
    document.getElementById("userDate").value = "";
    document.getElementById("userLocation").value = "";
}

async function deleteTree(id) {
    await deleteTreeFromAPI(id);
    loadTrees();
}

async function editTree(id, currentName, currentSpecies) {
    var newName = prompt("Uus nimi:", currentName);
    var newSpecies = prompt("Uus liik:", currentSpecies);

    if (!newName || !newSpecies) return;

    await updateTree(id, {
        name: newName,
        species: newSpecies
    });

    loadTrees();
}

function toggleMap(id) {
    var map = document.getElementById("map-" + id);
    map.style.display = (map.style.display === "none") ? "block" : "none";
}

async function loadTrees() {
    var trees = await getTrees();
    var treeList = document.getElementById("treeList");
    var recentTrees = document.getElementById("recentTrees");

    treeList.innerHTML = "";
    recentTrees.innerHTML = "";

    var totalCO2 = 0;
    var yearlyCO2 = 0;

    for (var i = 0; i < trees.length; i++) {
        var tree = trees[i];
        var years = calculateAge(tree.date);
        var co2PerYear = (tree.type === "standard")
        ? getYearlyCO2(tree.species)
        : 15;

        var co2Total = co2PerYear * years;

        totalCO2 += co2Total;
        yearlyCO2 += co2PerYear;

        var mapEmbed =
        "https://maps.google.com/maps?q=" +
        tree.location +
        "&z=15&output=embed";

        treeList.innerHTML +=
        "<div class='tree-card'>" +
        "<h3>" + tree.name + "</h3>" +
        "<p><b>Liik:</b> " + tree.species + "</p>" +
        "<p><b>Vanus:</b> " + years + " aastat</p>" +
        "<p><b>CO₂ kokku:</b> " + co2Total + " kg</p>" +
        "<p><b>CO₂ aastas:</b> " + co2PerYear + " kg</p>" +
        "<button onclick='toggleMap(" + i + ")'>Näita / Peida kaart</button>" +
        "<div class='map-container' id='map-" + i + "'>" +
        "<iframe src='" + mapEmbed + "'></iframe></div>" +
        "<button onclick='editTree(\"" + tree.id + "\", \"" + tree.name + "\", \"" + tree.species + "\")'>Muuda</button>" +
        "<button onclick='deleteTree(\"" + tree.id + "\")'>Kustuta</button>" +
        "</div>";

        if (i >= trees.length - 5) {
            recentTrees.innerHTML +=
            "<div class='sidebar-card'><b>" +
            tree.name +
            "</b><br>" +
            tree.species +
            "</div>";
        }
    }

    document.getElementById("treeCount").innerText = trees.length;
    document.getElementById("totalCO2").innerText = totalCO2 + " kg";
    document.getElementById("yearlyCO2").innerText = yearlyCO2 + " kg/aastas";
}

function calculateAge(date) {
    var today = new Date();
    var planted = new Date(date);
    return Math.floor((today - planted) / (1000 * 60 * 60 * 24 * 365));
}

function getYearlyCO2(species) {
    species = species.toLowerCase();
    if (species === "mänd") return 22;
    if (species === "kask") return 18;
    if (species === "tamm") return 25;
    return 15;
}