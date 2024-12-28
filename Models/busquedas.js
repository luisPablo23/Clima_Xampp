const fs = require('fs');
const axios = require('axios');

class Busquedas {
    historial = [];
    dbPath = './db/database.json';

    constructor() {
        this.leerDB();
    }

    get historialCapitalizado() {
        return this.historial.map(lugar => 
            lugar.split(' ')
                .map(p => p[0].toUpperCase() + p.substring(1))
                .join(' ')
        );
    }

    get paramsMapbox() {
        return {
            'access_token': process.env.MAPBOX_KEY,
            'limit': 5,
            'language': 'es'
        };
    }

    get paramsWeather() {
        return {
            appid: process.env.OPENWEATHER_KEY,
            units: 'metric',
            lang: 'es'
        };
    }

    async ciudad(lugar = '') {
        try {
            const instance = axios.create({
                baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
                params: this.paramsMapbox
            });

            const resp = await instance.get();
            return resp.data.features.map(lugar => ({
                id: lugar.id,
                nombre: lugar.place_name,
                lng: lugar.center[0],
                lat: lugar.center[1],
            }));
        } catch (error) {
            console.error('Error en la búsqueda de la ciudad:', error.message);
            return [];
        }
    }

    async climaLugar(lat, lon) {
        try {
            const instance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: { ...this.paramsWeather, lat, lon }
            });

            const resp = await instance.get();
            const { weather, main } = resp.data;

            return {
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            };
        } catch (error) {
            console.error('Error al obtener el clima:', error.message);
            return {};
        }
    }

    agregarHistorial(lugar = '') {
        if (this.historial.includes(lugar.toLocaleLowerCase())) {
            return;
        }

        this.historial = [lugar.toLocaleLowerCase(), ...this.historial.slice(0, 4)];

        this.guardarDB();
    }

    guardarDB() {
        const payload = { historial: this.historial };

        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(payload));
        } catch (error) {
            console.error('Error al guardar en la base de datos:', error.message);
        }
    }

    leerDB() {
        if (!fs.existsSync(this.dbPath)) return;

        try {
            const info = fs.readFileSync(this.dbPath, { encoding: 'utf-8' });
            const data = JSON.parse(info);
            this.historial = data.historial;
        } catch (error) {
            console.error('Error al leer la base de datos:', error.message);
        }
    }
}

module.exports = Busquedas;
