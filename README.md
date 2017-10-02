# Dartmouth Nutrition

This was a rough outline of a reverse engineered NodeJS API for http://nutrition.dartmouth.edu:8088/, Dartmouth's nutrition website.  Currently it allows you to:

- Get a list of locations
- Get a list of menus (i.e. Ma Thayer's, etc)
- Get a list of times (i.e. Breakfast, Lunch, etc)
- Get all of the items for a combination of menu and time (i.e. Ma Thayer's for Lunch)
- For each item, get
  - Sub ingredients
  - Nutrition information
  - Allergen information
  
You can see the rough outline of making these calls below.

```javascript
const handler = new NutritionHandler();

const locations = await handler.getLocations();
await handler.connect(locations[0]);

const menus = await handler.getMenus();
const times = await handler.getTimes();
const menu = await handler.chooseMenu(menus[0].menu_id, getTimes[1].meal_id);

const item = menu.items[0];
const subIngredients = await item.getSubIngredients();
const nutrition = await item.getNutritionFacts();
const allergens = await item.getAllergens();
```

Unfortunately, my personal use case for this project vanished, so I didn't have a lot of need for it anymore.  I've cleaned it up and put it here on my GitHub, however, if anyone wants to use it.

Working as of Oct 2017
