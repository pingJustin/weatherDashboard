import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

// Define Coordinates interface
interface Coordinates {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

// Define Weather class
class Weather {
  constructor(
    public cityName: string,
    public country: string,
    public temperature: number,
    public feelsLike: number,
    public humidity: number,
    public windSpeed: number,
    public description: string,
    public icon: string,
    public date?: Date
  ) {}
}

class WeatherService {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private cityName: string = '';

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    this.apiKey = process.env.API_KEY || '';
  }

  private async fetchLocationData(query: string) {
    const geocodeURL = this.buildGeocodeQuery();
    const response = await axios.get(`${geocodeURL}?q=${query}&limit=1&appid=${this.apiKey}`);
    return response.data[0];
  }

  private destructureLocationData(locationData: any): Coordinates {
    const { lat, lon, name, country } = locationData;
    return { lat, lon, name, country };
  }

  private buildGeocodeQuery(): string {
    return `http://api.openweathermap.org/geo/1.0/direct`;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;
  }

  private async fetchAndDestructureLocationData(city: string): Promise<Coordinates> {
    const locationData = await this.fetchLocationData(city);
    return this.destructureLocationData(locationData);
  }

  private async fetchWeatherData(coordinates: Coordinates) {
    const weatherURL = this.buildWeatherQuery(coordinates);
    const response = await axios.get(weatherURL);
    return response.data;
  }

  private parseCurrentWeather(response: any, coordinates: Coordinates): Weather {
    return new Weather(
      coordinates.name,
      coordinates.country,
      response.main.temp,
      response.main.feels_like,
      response.main.humidity,
      response.wind.speed,
      response.weather[0].description,
      response.weather[0].icon,
      new Date()
    );
  }

  private buildForecastArray(currentWeather: Weather, weatherData: any[]): Weather[] {
    const forecast = weatherData.map(data => 
      new Weather(
        currentWeather.cityName,
        currentWeather.country,
        data.main.temp,
        data.main.feels_like,
        data.main.humidity,
        data.wind.speed,
        data.weather[0].description,
        data.weather[0].icon,
        new Date(data.dt * 1000)
      )
    );
    return [currentWeather, ...forecast];
  }

  async getWeatherForCity(city: string): Promise<Weather[]> {
    try {
      this.cityName = city;
      const coordinates = await this.fetchAndDestructureLocationData(this.cityName);
      const weatherData = await this.fetchWeatherData(coordinates);
      const currentWeather = this.parseCurrentWeather(weatherData, coordinates);

      // Get 5-day forecast
      const forecastURL = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;
      const forecastResponse = await axios.get(forecastURL);
      
      // Filter forecast data for one reading per day
      const dailyForecasts = forecastResponse.data.list.filter((item:any, index: number) => {
        return index % 8 === 0});

      return this.buildForecastArray(currentWeather, dailyForecasts);
    } catch (error) {
      throw new Error(`Failed to fetch weather data for ${city}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default new WeatherService();