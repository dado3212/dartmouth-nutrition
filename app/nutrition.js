import rp from 'request-promise';

const main = {
  method: 'POST',
  uri: 'http://nutrition.dartmouth.edu:8088/cwp',
  body: {
    id: 1,
  },
  json: true,
  resolveWithFullResponse: true,
};

class Item {
  constructor(menuId, item, sid) {
    this.menuId = menuId;
    this.item = item;
    this.sid = sid;
  }

  title() {
    return this.item[0];
  }

  category() {
    return this.item[1][0];
  }

  getNutrition() {
    main.body.method = 'get_nutrient_label_items';
    main.body.params = [
      { sid: this.sid },
      JSON.stringify({
        remoteProcedure: 'get_nutrient_label_items',
        mm_id: this.menuId,
        recipe_id: this.item[1][3],
        mmr_rank: 1,
        rule: 'fda', // 'fda|raw' to get unrounded values (due to cwp settings)
        output: 'dictionary',
        options: 'facts',
        cache: true,
        recdata: null,
      }),
    ];

    return rp(main)
    .then(response => {
      const info = response.body.result;
      delete info.actual_nutrients; // remove duplicate information

      return info;
    })
    .catch(err => {
      return null;
    });
  }

  getSubIngredients() {
    main.body.method = 'get_recipe_sub_ingredients';

    main.body.params = [
      { sid: this.sid },
      JSON.stringify({
        remoteProcedure: 'get_recipe_sub_ingredients',
        recipeId: this.item[1][3],
      }),
    ];

    return rp(main)
    .then(response => {
      return response.body.result;
    })
    .catch(err => {
      return null;
    });
  }

  getAllergens() {
    main.body.method = 'get_recipe_allergen_list';

    main.body.params = [
      { sid: this.sid },
      JSON.stringify({
        remoteProcedure: 'get_recipe_allergen_list',
        recipeId: this.item[1][3],
      }),
    ];

    return rp(main)
    .then(response => {
      return response.body.result;
    })
    .catch(err => {
      return null;
    });
  }
}

class Menu {
  constructor(categories, items, id, sid) {
    this.categories = categories;
    this.items = items;
    this.id = id;
    this.sid = sid;
  }

  items() {
    return this.items;
  }

  categories() {
    return this.categories;
  }

  item(name) {
    const foundItem = this.items.filter(item => {
      return (item[0] === name);
    });

    if (foundItem) {
      return new Item(this.id, foundItem[0], this.sid);
    } else {
      return null;
    }
  }
}

/*
  NutritionHandler

  - get available locations
  - get current configuration
  - connect to a specific location
  - get menus
  - get food items
*/
class NutritionHandler {
  constructor() {
    this.sids = {};
    this.currentLocation = null;
  }

  /*
    Get Available sIDs
     - DDS: 53 Commons
     - CYC: Courtyard Cafe
     - NOVACK: Novack Cafe
     - COLLIS: Collis Cafe
  */
  getLocations() {
    main.body.method = 'get_available_sids';
    main.body.params = [
      null,
      {
        remoteProcedure: 'get_available_sids',
      },
    ];

    return rp(main)
    .then(response => {
      return response.body.result.result;
    })
    .catch(err => {
      return null;
    });
  }

  // Connects/switches to a SID token for the corresponding location
  connect(location) {
    if (location in this.sids) {
      this.currentLocation = location;
      return this.sids[location];
    } else {
      main.body.method = 'create_context';
      main.body.params = [location];

      return rp(main)
      .then(response => {
        this.sids[location] = response.body.result.sid;
        this.currentLocation = location;
        return this.sids[location];
      })
      .catch(err => {
        return null;
      });
    }
  }

  // Gets the current location
  get current() {
    return this.currentLocation;
  }

  /*
    Gets the CWP settings
    - rounding
    - allergen display
    - ingredient list
    - "start with waag"
    - report footer
    - show only on elocation
    - display
    - hide nutrients
  */
  getSettings() {
    if (this.currentLocation) {
      main.body.method = 'get_cwp_settings';
      main.body.params = [
        {
          sid: this.sids[this.currentLocation],
        },
        {
          remoteProcedure: 'get_cwp_settings',
        },
      ];

      return rp(main)
      .then(response => {
        return response.body.result;
      })
      .catch(err => {
        return null;
      });
    } else {
      return null;
    }
  }

  /*
    Gets the list of Menus (Menu section on website)

    Ex:
    [ 27, 1, 27, 'Today\'s Specials', 'Today\'s Specials' ]
  */
  getMenus() {
    if (this.currentLocation) {
      main.body.method = 'get_webmenu_list';
      main.body.params = [
        {
          sid: this.sids[this.currentLocation],
        },
        {
          remoteProcedure: 'get_webmenu_list',
        },
      ];

      return rp(main)
      .then(response => {
        return response.body.result.menus_list;
      })
      .catch(err => {
        return null;
      });
    } else {
      return null;
    }
  }

  /*
    Gets the list of meals (meals section on website)

    Ex:
    '1': [ 1, 1, 'Breakfast', 'Breakfast', 'BRK', 700, 1000 ]
    Name, again?, appreviation, cost/calories?
  */
  getMeals() {
    if (this.currentLocation) {
      main.body.method = 'get_webmenu_meals_list';
      main.body.params = [
        {
          sid: this.sids[this.currentLocation],
        },
        {
          remoteProcedure: 'get_webmenu_meals_list',
        },
      ];

      return rp(main)
      .then(response => {
        return response.body.result.meals_list;
      })
      .catch(err => {
        return null;
      });
    } else {
      return null;
    }
  }

  /*
    Gets a full menu

    Ex:
    [ [ 'Scrambled Eggs (L/O,GF) [e]',
      [ 'Breakfast Favorites', 0, 0, 752, 1 ] ],
    also includes lit of categories

    Takes:
    - date
    - the location (through the generated SID)
    - the menu_id from getMenuList
    - meal_id from getMenuMeals
  */
  chooseMenu(menu, meal, day = (new Date()).getDate(), month = ((new Date()).getMonth() + 1), year = (new Date()).getFullYear()) {
    main.body.method = 'get_recipes_for_menumealdate';
    main.body.params = [
      { sid: this.sids[this.currentLocation] },
      JSON.stringify({
        menu_id: menu,
        meal_id: meal,
        remoteProcedure: 'get_recipes_for_menumealdate',
        day,
        month,
        year,
        use_menu_query: true,
        order_by: 'pubgroup-alpha',
        cache: true,
      }),
    ];

    return rp(main)
    .then(response => {
      const categories = response.body.result.cat_list;
      const items = response.body.result.recipeitems_list;
      const id = response.body.result.mm_id;
      const sid = this.sids[this.currentLocation];

      return new Menu(categories, items, id, sid);
    })
    .catch(err => {
      return null;
    });
  }
}

export { NutritionHandler };
