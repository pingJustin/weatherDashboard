import { Router } from 'express';
import historyService from '../../service/historyService.js';
import weatherService from '../../service/weatherService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { cityName } = req.body;

    if (!cityName) {
      return res.status(400).json({
        success: false,
        error: 'City name is required'
      });
      return;
    }

    // Get weather data
    const weatherData = await weatherService.getWeatherForCity(cityName);

    // Save to search history
    await historyService.addCity(cityName);
    return res.status(200).json(weatherData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weather data'
    });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const searchHistory = await historyService.getCities();
    return res.status(200).json(searchHistory);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch search history'
    });
  }
});

router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'City ID is required'
      });
    }

    await historyService.removeCity(id);
    return res.status(200).json({
      success: true,
      message: 'City removed from search history'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove city from history'
    });
  }
});

export default router;
