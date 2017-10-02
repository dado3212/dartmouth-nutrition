import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { NutritionHandler } from './nutrition';

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', async (req, res) => {
  const handler = new NutritionHandler();

  const locations = await handler.getLocations();
  await handler.connect(locations[0]);

  const menus = await handler.getMenus();
  const meals = await handler.getMeals();
  const menu = await handler.chooseMenu(menus[0].menu_id, meals[1].meal_id);

  const item = menu.items[0];
  const subIngredients = await item.getSubIngredients();
  const nutrition = await item.getNutritionFacts();
  res.send('Test');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 1010;
app.listen(port);

console.log(`listening on: ${port}`);
