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
app.get('/', (req, res) => {
  const handler = new NutritionHandler();

  // Get all available locations
  handler.getLocations().then(locations => {
    // Connect to the first location
    handler.connect(locations[0][0]).then(id => {
      // Get a list of menus
      handler.getMenus().then(menus => {
        // Get a list of meals
        handler.getMeals().then(meals => {
          // Connect to a specific menu (for the current date)
          handler.chooseMenu(menus[0][0], meals['1'][0]).then(menu => {
            const item = menu.item(menu.items[0][0]);
            console.log(item.title());
            item.getSubIngredients().then(ing => {
              console.log(ing);
            });
          });
        });
      });
    });
  });
  res.send('Test');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
