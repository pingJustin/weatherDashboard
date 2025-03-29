import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define City class
class City {
  constructor(
    public id: string,
    public name: string,
    public timestamp: Date = new Date()
  ) {}
}

class HistoryService {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, '../../data/searchHistory.json');
  }

  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const cities = JSON.parse(data);
      return cities.map((city: any) => ({
        ...city,
        timestamp: new Date(city.timestamp)
      }));
    } catch (error) {
      // If file doesn't exist or is empty, return empty array
      return [];
    }
  }

  private async write(cities: City[]): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2));
  }

  async getCities(): Promise<City[]> {
    const cities = await this.read();
    // Sort by most recent first
    return cities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async addCity(cityName: string): Promise<City> {
    const cities = await this.read();
    
    // Check if city already exists
    const existingCity = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (existingCity) {
      // Update timestamp and move to top of list
      existingCity.timestamp = new Date();
      await this.write(cities);
      return existingCity;
    }

    // Create new city
    const newCity = new City(
      crypto.randomUUID(),
      cityName
    );

    // Add to beginning of array
    cities.unshift(newCity);

    // Keep only last 5 searches
    const updatedCities = cities.slice(0, 5);
    await this.write(updatedCities);

    return newCity;
  }

  async removeCity(id: string): Promise<void> {
    const cities = await this.read();
    const updatedCities = cities.filter(city => city.id !== id);
    await this.write(updatedCities);
  }
}

export default new HistoryService();