# 🌦️ Météo App

 # LE LIEN DU SITE https://abduuulleee.github.io/meteo/

Application web interactive pour consulter la météo et les prévisions sur 5 jours, avec gestion des favoris, historique de recherche, affichage détaillé et mode sombre.

## Fonctionnalités principales

- Recherche météo par ville (OpenWeatherMap)
- Géolocalisation automatique
- Prévisions sur 5 jours avec détails horaires
- Affichage de la qualité de l'air et des alertes météo
- Gestion des villes favorites (ajout, suppression)
- Historique des dernières recherches
- Mode sombre/mode clair
- Interface responsive (Bootstrap)

## Installation

1. Clone le dépôt :
   git clone https://github.com/Abduuulleee/meteo.git
   cd meteo

2. Ouvre `index.html` dans ton navigateur.

3. Renseigne ta clé API OpenWeatherMap dans le fichier `scripts/script.js` (variable `CONFIG.API_KEY`).

## Structure du projet
```
meteo/
├── index.html
├── scripts/
│ └── script.js
├── styles/
│ └── styles.css
├── images/
│ └── meteo.png
```


## Utilisation

- Saisis le nom d'une ville ou utilise la géolocalisation.
- Clique sur une carte pour voir les détails horaires.
- Ajoute une ville en favori pour l'accès rapide.
- Bascule en mode sombre avec le bouton dédié.

## Dépendances

- [OpenWeatherMap API](https://openweathermap.org/)
- Bootstrap 5 (CDN)

## Auteur

abdu.oqb
