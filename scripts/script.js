const CONFIG = {
  API_KEY: "28510c0481d8781fe3b0844f6b01ace3", // Clé API OpenWeatherMap
  LANG: "fr",
  UNITES: "metric",
};

// Éléments du DOM
const elements = {
  inputVille: document.getElementById("inputVille"),
  btnSearch: document.getElementById("btnSearch"),
  btnGeo: document.getElementById("btnGeo"),
  cartesMeteo: document.getElementById("cartesMeteo"),
  titreVille: document.getElementById("titreVille"),
  erreur: document.getElementById("erreur"),
  loading: document.getElementById("loading"),
  darkToggle: document.getElementById("darkToggle"),
  btnFavoris: document.getElementById("btnFavoris"),
};

// Cache des données
const cache = {
  data: new Map(),
  maxAge: 1000 * 60 * 15, // 15 minutes

  set(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now(),
    });
  },

  get(key) {
    const data = this.data.get(key);
    if (!data) return null;
    if (Date.now() - data.timestamp > this.maxAge) {
      this.data.delete(key);
      return null;
    }
    return data.value;
  },
};

// Stockage global des données météo
let donneesMeteoCompletes = null;
let tempsTotal = 0;
let tempsDebut = 0;

// Ajouter ces fonctions de gestion des favoris et historique
class StorageManager {
  constructor(key, maxItems = 5) {
    this.key = key;
    this.maxItems = maxItems;
  }

  getItems() {
    return JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  setItems(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  addItem(item) {
    const items = this.getItems();
    const index = items.findIndex(
      (i) => i.toLowerCase() === item.toLowerCase()
    );

    if (index > -1) {
      items.splice(index, 1);
    }

    items.unshift(item);
    if (items.length > this.maxItems) {
      items.pop();
    }

    this.setItems(items);
  }

  removeItem(item) {
    const items = this.getItems();
    const index = items.findIndex(
      (i) => i.toLowerCase() === item.toLowerCase()
    );
    if (index > -1) {
      items.splice(index, 1);
      this.setItems(items);
    }
  }

  hasItem(item) {
    return this.getItems().some((i) => i.toLowerCase() === item.toLowerCase());
  }
}

// Initialiser les gestionnaires de stockage
const favorisManager = new StorageManager("favoris", 10);
const historiqueManager = new StorageManager("historique", 5);

// Fonction de mise à jour du bouton favoris
function updateFavorisButton(cityName) {
  const btnFavoris = elements.btnFavoris;
  if (!cityName) {
    btnFavoris.hidden = true;
    return;
  }

  btnFavoris.hidden = false;
  const isFavori = favorisManager.hasItem(cityName);
  btnFavoris.className = `btn ${
    isFavori ? "btn-warning" : "btn-outline-warning"
  }`;
  btnFavoris.innerHTML = `<span class="favori-icon">${
    isFavori ? "⭐" : "☆"
  }</span>`;

  // Mettre à jour le gestionnaire d'événements
  btnFavoris.onclick = () => {
    if (isFavori) {
      favorisManager.removeItem(cityName);
    } else {
      favorisManager.addItem(cityName);
    }
    afficherFavoris();
    updateFavorisButton(cityName);
  };
}

// Fonction d'affichage des favoris
function afficherFavoris() {
  const container = document.getElementById("listesFavoris");
  const favoris = favorisManager.getItems();

  container.innerHTML = favoris
    .map(
      (ville) => `
                <div class="ville-item">
                    <span class="ville-name" onclick="rechercherVille('${ville}')">${ville}</span>
                    <button class="btn-remove" 
                            onclick="favorisManager.removeItem('${ville}'); afficherFavoris();"
                            aria-label="Supprimer ${ville} des favoris">
                        <i>×</i>
                    </button>
                </div>
            `
    )
    .join("");
}

// Fonction d'affichage de l'historique
function afficherHistorique() {
  const container = document.getElementById("listesHistorique");
  const historique = historiqueManager.getItems();

  container.innerHTML = historique
    .map(
      (ville) => `
        <div class="ville-item">
            <span class="ville-name" onclick="rechercherVille('${ville}')">${ville}</span>
        </div>
    `
    )
    .join("");
}

// Options de défilement réutilisables
const SCROLL_OPTIONS = { behavior: "smooth", block: "nearest" };

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  chargerModeSombre();
  elements.btnSearch.addEventListener("click", () => rechercherVille());
  elements.btnGeo.addEventListener("click", geolocaliser);
  elements.darkToggle.addEventListener("click", toggleModeSombre);
  elements.inputVille.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      rechercherVille();
    }
  });

  // Chargement initial (position par défaut)
  geolocaliser();
  afficherFavoris();
  afficherHistorique();
});

async function temps() {
  // Démarrer le chronomètre
  tempsDebut = performance.now();
  console.log("Début du chronométrage...");

  try {
    // Faire un appel API test
    const reponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=48.8566&lon=2.3522&units=${CONFIG.UNITES}&lang=${CONFIG.LANG}&appid=${CONFIG.API_KEY}`
    );

    // Calculer le temps de la requête
    const tempsFin = performance.now();
    const tempsRequete = tempsFin - tempsDebut;

    console.log(`Temps de la requête API: ${tempsRequete.toFixed(2)} ms`);

    // Ajouter au temps total
    tempsTotal += tempsRequete;

    return {
      tempsRequete,
      tempsTotal,
    };
  } catch (error) {
    console.error("Erreur lors de la mesure du temps:", error);
    return null;
  }
}

// Obtenir les données météo
async function obtenirMeteo(lat, lon, nomVille = "") {
  const debutOperation = performance.now();
  elements.loading.hidden = false;

  try {
    const reponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${CONFIG.UNITES}&lang=${CONFIG.LANG}&appid=${CONFIG.API_KEY}`
    );
    const donnees = await verifierReponse(reponse);

    // Calculer le temps total de l'opération
    const finOperation = performance.now();
    tempsTotal += finOperation - debutOperation;

    console.log(`Temps total cumulé: ${tempsTotal.toFixed(2)} ms`);

    // Stocker les données complètes pour l'affichage détaillé
    donneesMeteoCompletes = donnees;
    console.log("Données API complètes:", donneesMeteoCompletes);

    afficherMeteo(donnees, nomVille);
  } catch (err) {
    gererErreur(err);
  } finally {
    elements.loading.hidden = true;
  }
}

// Afficher la météo sur 5 jours
function afficherMeteo(donnees, nomVille) {
  elements.titreVille.textContent = donnees.city.name; // Utiliser le nom de la ville depuis l'API
  updateFavorisButton(donnees.city.name);
  historiqueManager.addItem(donnees.city.name);
  afficherHistorique();

  elements.cartesMeteo.innerHTML = "";

  const prevParJour = groupParJour(donnees.list);
  Object.entries(prevParJour)
    .slice(0, 5)
    .forEach(([date, valeurs]) => {
      // Température moyenne du jour
      const tempMoy = (
        valeurs.temp.reduce((a, b) => a + b) / valeurs.temp.length
      ).toFixed(1);

      // Choisir l'icône et description représentatives (milieu de journée)
      const iconIndex = Math.floor(valeurs.icones.length / 2);
      const icone = valeurs.icones[iconIndex] || valeurs.icones[0] || "01d";
      const description =
        valeurs.descriptions[iconIndex] || valeurs.descriptions[0] || "";

      // Températures min/max
      const tempMin = Math.min(...valeurs.temp).toFixed(1);
      const tempMax = Math.max(...valeurs.temp).toFixed(1);

      // Créer la carte météo
      const carte = document.createElement("div");
      carte.className = "carte-meteo";
      carte.dataset.date = date;
      carte.innerHTML = `
        <div class="text-center">
          <h5>${new Date(date).toLocaleDateString("fr-FR", {
            weekday: "long",
          })}</h5>
          <img src="https://openweathermap.org/img/wn/${icone}@2x.png" alt="Icône météo">
          <div class="mt-2">${tempMoy}°C</div>
          <small class="text-muted">${description}</small>
          <div class="mt-2">
            <span class="text-primary">${tempMin}°C</span> | 
            <span class="text-danger">${tempMax}°C</span>
          </div>
        </div>
      `;

      // Événement pour afficher les détails au clic
      carte.addEventListener("click", function () {
        const dateCliquee = this.dataset.date;
        afficherDetailsMeteo(dateCliquee);
      });

      elements.cartesMeteo.appendChild(carte);
    });

  // Ajouter le scroll automatique après l'affichage des cartes
  setTimeout(() => {
    elements.cartesMeteo.scrollIntoView(SCROLL_OPTIONS);
  }, 100);
}

// Grouper les prévisions par jour
const groupParJour = (data) =>
  data.reduce((acc, item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!acc[date]) acc[date] = { temp: [], icones: [], descriptions: [] };
    acc[date].temp.push(item.main.temp);
    acc[date].icones.push(item.weather[0].icon);
    acc[date].descriptions.push(item.weather[0].description);
    return acc;
  }, {});

// Afficher les détails météo d'une journée
function afficherDetailsMeteo(date) {
  if (!donneesMeteoCompletes) {
    gererErreur(new Error("Données météo non disponibles"));
    return;
  }

  // Supprimer les détails existants
  const detailExistant = document.getElementById("detailMeteo");
  if (detailExistant) {
    detailExistant.remove();
  }

  // Créer le conteneur pour les détails
  const detailMeteo = document.createElement("div");
  detailMeteo.id = "detailMeteo";
  detailMeteo.className = "mt-4 p-3 border rounded";

  // Vérifier la largeur de l'écran
  const isMobile = window.innerWidth < 800;

  // Trouver la carte cliquée
  const carteCliquee = Array.from(elements.cartesMeteo.children).find(
    (carte) => carte.dataset.date === date
  );

  if (isMobile && carteCliquee) {
    // Sur mobile, insérer les détails juste après la carte cliquée
    carteCliquee.after(detailMeteo);
  } else {
    // Sur desktop, ajouter les détails après toutes les cartes
    elements.cartesMeteo.after(detailMeteo);
  }

  try {
    // Filtrer les prévisions pour cette date
    const previsionsJour = donneesMeteoCompletes.list.filter((item) =>
      item.dt_txt.includes(date)
    );

    // Afficher les données brutes dans la console
    console.log("Données brutes pour " + date + ":", previsionsJour);

    // Créer l'affichage détaillé
    let detailHTML = `
      <h4 class="mb-3">Détails météo pour ${new Date(date).toLocaleDateString(
        "fr-FR",
        { weekday: "long", day: "numeric", month: "long" }
      )}</h4>
      <div class="row">
    `;

    // Ajouter les prévisions par tranches horaires
    previsionsJour.forEach((prev) => {
      const heure = prev.dt_txt.split(" ")[1].substring(0, 5);
      const temp = prev.main.temp.toFixed(1);
      const icon = prev.weather[0].icon;
      const desc = prev.weather[0].description;
      const humidite = prev.main.humidity;
      const vent = prev.wind.speed;

      detailHTML += `
        <div class="col-md-4 mb-3">
          <div class="card ${
            document.body.classList.contains("sombre")
              ? "bg-dark text-light"
              : ""
          }">
            <div class="card-body text-center">
              <h5>${heure}</h5>
              <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Icône météo">
              <p class="mb-1">${temp}°C - ${desc}</p>
              <p class="mb-1">Humidité: ${humidite}%</p>
              <p class="mb-1">Vent: ${vent} m/s</p>
            </div>
          </div>
        </div>
      `;
    });

    detailHTML += `
      </div>
      <button class="btn btn-sm btn-outline-secondary mt-3" onclick="document.getElementById('detailMeteo').remove()">Fermer</button>
    `;

    // Mettre à jour le contenu
    detailMeteo.innerHTML = detailHTML;
  } catch (err) {
    detailMeteo.innerHTML = `
      <div class="alert alert-danger">
        Erreur lors du chargement des détails: ${err.message}
        <button class="btn-close float-end" onclick="document.getElementById('detailMeteo').remove()"></button>
      </div>
    `;
  }
}

// Vérifier la réponse de l'API
async function verifierReponse(reponse) {
  if (!reponse.ok)
    throw new Error((await reponse.json()).message || "Erreur API");
  return reponse.json();
}

// Gestion des erreurs
function gererErreur(err) {
  const messages = {
    "Failed to fetch": "Problème de connexion internet",
    "City not found": "Ville introuvable",
    "Invalid API key": "Problème de configuration",
  };

  elements.erreur.innerHTML = `
    <div class="alert alert-danger">
      ${messages[err.message] || err.message}
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    </div>
  `;
  elements.erreur.hidden = false;
}

// Gérer le mode sombre
function chargerModeSombre() {
  // Check if user has already set a preference
  const savedPreference = localStorage.getItem("modeSombre");

  if (savedPreference === null) {
    // If no preference saved, check system preference
    const prefereModeSombre = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.body.classList.toggle("sombre", prefereModeSombre);
    localStorage.setItem("modeSombre", prefereModeSombre);
  } else {
    // Use saved preference
    document.body.classList.toggle("sombre", savedPreference === "true");
  }
}

function toggleModeSombre() {
  document.body.classList.toggle("sombre");
  localStorage.setItem(
    "modeSombre",
    document.body.classList.contains("sombre")
  );
}

// Géolocalisation de l'utilisateur
function geolocaliser() {
  if (!navigator.geolocation)
    return gererErreur(new Error("Géolocalisation non supportée"));

  navigator.geolocation.getCurrentPosition(
    (pos) => obtenirMeteo(pos.coords.latitude, pos.coords.longitude),
    (err) => gererErreur(new Error("Accès à la position refusé"))
  );
}

// Exemple d'utilisation
async function rechercherVille(villeParam) {
  try {
    // Utiliser soit le paramètre passé, soit la valeur de l'input
    const ville = villeParam || elements.inputVille.value.trim();

    // Vérifier si une ville est spécifiée
    if (!ville) {
      throw new Error("Veuillez entrer le nom d'une ville");
    }

    elements.erreur.hidden = true;
    elements.loading.hidden = false;

    const coords = await obtenirCoordonnees(ville);
    await obtenirMeteo(coords.lat, coords.lon, coords.name);
  } catch (error) {
    gererErreur(error);
  } finally {
    elements.loading.hidden = true;
    // Vider l'input seulement si on a utilisé sa valeur
    if (!villeParam) {
      elements.inputVille.value = "";
    }
  }
}

// Obtenir les coordonnées d'une ville
async function obtenirCoordonnees(ville) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        ville
      )}&limit=1&appid=${CONFIG.API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.length) {
      throw new Error("Ville introuvable");
    }

    return {
      lat: data[0].lat,
      lon: data[0].lon,
      name: data[0].name, // Nom normalisé de la ville
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des coordonnées:", error);
    throw error;
  }
}

// Qualité de l'air
async function obtenirQualiteAir(lat, lon) {
  const reponse = await fetch(
    `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`
  );
  return await verifierReponse(reponse);
}

// Alertes météo
async function obtenirAlertes(lat, lon) {
  const reponse = await fetch(
    `http://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${CONFIG.API_KEY}`
  );
  return await verifierReponse(reponse);
}
