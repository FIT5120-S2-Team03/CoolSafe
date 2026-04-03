# CoolSafe 🌡️

**Helping Melbourne's Elderly Stay Safe During Heatwaves**

CoolSafe is a real-time heat safety web application designed for elderly Melbourne residents living alone. It combines live temperature data, heat vulnerability mapping, and location-based cool space guidance to answer three critical questions in as few taps as possible:

- **How dangerous is it right now?** Real-time heat risk dashboard with plain-language action advice
- **Where can I go to cool down?** Nearest cool spaces map with tree-shade walking routes
- **Am I taking the right precautions?** Personalised heat safety score based on location, conditions, and medications

> FIT5120 Industry Experience Studio — S1 2026 | Team TP03 | SDG 11: Sustainable Cities and Communities

---


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Leaflet.js |
| Backend | Python Flask, APScheduler |
| Database | PostgreSQL |
| Deployment | Netlify (frontend), Render (backend + DB) |
| Geospatial | Shapely, Tree Canopies 2021 dataset |

---

## Open Data Sources

| Dataset | Source | Used For |
|---|---|---|
| Weather & Air Quality | [Open-Meteo API](https://open-meteo.com) | Heat risk dashboard, hourly forecast, AQI |
| Cool Spaces & Fountains | [City of Melbourne Open Data](https://data.melbourne.vic.gov.au) | Cool spaces map |
| Heat Vulnerability Index | [Data VIC — Metropolitan Melbourne HVI 2018](https://discover.data.vic.gov.au) | Suburb risk layer |
| Urban Tree Canopy | [City of Melbourne Open Data](https://data.melbourne.vic.gov.au) | Coolest route calculation |

---


## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- PostgreSQL (for Iteration 2+)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Team Members

| Name | Discipline | Student ID | Email |
|---|---|---|---|
| Jianyao Zhou | Master of Data Science | 34465944 | jzho0167@student.monash.edu |
| Yongxian Fu | Master of Data Science | 35394471 | yfuu0065@student.monash.edu |
| Yuanchi Wei | Master of Business Information Systems | 34812377 | ywei0081@student.monash.edu |
| Pengbo Wang | Master of Cybersecurity | 33665931 | pwan0093@student.monash.edu |
| Peijia Xiao | Master of Information Technology | 34333711 | pxia0010@student.monash.edu |
| Shiying Zhu | Master of Information Technology | 35017120 | szhu0067@student.monash.edu |

---

## Acknowledgements

- [City of Melbourne](https://www.melbourne.vic.gov.au) — Cool Places program and open datasets
- [Open-Meteo](https://open-meteo.com) — Free weather and air quality API
- [Data VIC](https://discover.data.vic.gov.au) — Metropolitan Melbourne Heat Vulnerability Index

---

## Disclaimer

This application provides general heat safety information only. In an emergency, call **000**. Always follow official health advice during extreme heat events.

---

*FIT5120 Industry Experience Studio | Monash University | S1 2026*
