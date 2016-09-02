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

class NutritionHandler {
  constructor() {
    this.dds = null;
  }

  get area() {
    return this.calcArea();
  }

  calcArea() {
    return 3;
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

  /*
    Generates an SID token for future requests in the given location
  */
  connect(location) {
    main.body.method = 'create_context';
    main.body.params = [location];

    return rp(main)
    .then(response => {
      return response.body.result.sid;
    })
    .catch(err => {
      return null;
    });
  }
}

export default NutritionHandler;

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
export const settings = (req, res) => {
  main.body.method = 'get_cwp_settings';
  main.body.params = [
    {
      sid: 'DDS.4ef6cc52093e2da095f926af6a241154',
    },
    {
      remoteProcedure: 'get_cwp_settings',
    },
  ];

  rp(main)
  .then(response => {
    res.send('Success!');
    console.log(response.body.result);
  })
  .catch(err => {
    res.send('Error');
  });
};

/*
  Gets the list of Menus (Menu section on website)

  Ex:
  [ 27, 1, 27, 'Today\'s Specials', 'Today\'s Specials' ]
*/
export const getMenuList = (req, res) => {
  main.body.method = 'get_webmenu_list';
  main.body.params = [
    {
      sid: 'DDS.4ef6cc52093e2da095f926af6a241154',
    },
    {
      remoteProcedure: 'get_webmenu_list',
    },
  ];

  rp(main)
  .then(response => {
    res.send('Success!');
    console.log(response.body.result.menus_list);
  })
  .catch(err => {
    res.send('Error');
  });
};

/*
  Gets the list of meals (meals section on website)

  Ex:
  '1': [ 1, 1, 'Breakfast', 'Breakfast', 'BRK', 700, 1000 ]
  Name, again?, appreviation, cost/calories?
*/
export const getMenuMeals = (req, res) => {
  main.body.method = 'get_webmenu_meals_list';
  main.body.params = [
    {
      sid: 'DDS.4ef6cc52093e2da095f926af6a241154',
    },
    {
      remoteProcedure: 'get_webmenu_meals_list',
    },
  ];

  rp(main)
  .then(response => {
    res.send('Success!');
    console.log(response.body.result.meals_list);
  })
  .catch(err => {
    res.send('Error');
  });
};

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
export const getMenu = (req, res) => {
  main.body.method = 'get_recipes_for_menumealdate';

  main.body.params = [
    { sid: 'DDS.4ef6cc52093e2da095f926af6a241154' },
    JSON.stringify({
      menu_id: '27',
      meal_id: '1',
      remoteProcedure: 'get_recipes_for_menumealdate',
      day: 2,
      month: 9,
      year: 2016,
      use_menu_query: true,
      order_by: 'pubgroup-alpha',
      cache: true,
    }),
  ];

  rp(main)
  .then(response => {
    console.log(response.body.result.cat_list); // list of categories
    console.log(response.body.result.recipeitems_list); // list of food items
    console.log(response.body.result.mm_id); // id for specific nutrition request
    res.send('Success!');
  })
  .catch(err => {
    console.log(err);
    res.send('Error');
  });
};

export const getNutritionItems = (req, res) => {
  main.body.method = 'get_nutrient_label_items';

  main.body.params = [
    { sid: 'DDS.4ef6cc52093e2da095f926af6a241154' },
    JSON.stringify({
      remoteProcedure: 'get_nutrient_label_items',
      mm_id: 27939,
      recipe_id: 752,
      mmr_rank: 1,
      rule: 'fda', // 'fda|raw' to get unrounded values (due to cwp settings)
      output: 'dictionary',
      options: 'facts',
      cache: true,
      recdata: null,
    }),
  ];

  rp(main)
  .then(response => {
    const info = response.body.result;
    delete info.actual_nutrients; // remove duplicate information

    console.log(JSON.stringify(info, null, 5));
    console.log(response.body.result.title);
    res.send('Success!');
  })
  .catch(err => {
    console.log(err);
    res.send('Error');
  });
};

export const getSubIngredients = (req, res) => {
  main.body.method = 'get_recipe_sub_ingredients';

  main.body.params = [
    { sid: 'DDS.4ef6cc52093e2da095f926af6a241154' },
    JSON.stringify({
      remoteProcedure: 'get_recipe_sub_ingredients',
      recipeId: 752,
    }),
  ];

  rp(main)
  .then(response => {
    console.log(response.body.result);
    res.send('Success!');
  })
  .catch(err => {
    console.log(err);
    res.send('Error');
  });
};

export const getAllergens = (req, res) => {
  main.body.method = 'get_recipe_allergen_list';

  main.body.params = [
    { sid: 'DDS.4ef6cc52093e2da095f926af6a241154' },
    JSON.stringify({
      remoteProcedure: 'get_recipe_allergen_list',
      recipeId: 752,
    }),
  ];

  rp(main)
  .then(response => {
    console.log(response.body.result);
    res.send('Success!');
  })
  .catch(err => {
    console.log(err);
    res.send('Error');
  });
};

export const test = getAllergens;
