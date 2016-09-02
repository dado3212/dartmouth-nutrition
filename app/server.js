import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import NutritionHandler from './nutrition';

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', (req, res) => {
  const a = new NutritionHandler();
  a.getLocations().then(locations => {
    console.log(locations);
  });
  a.connect('DDS').then(id => {
    console.log(id);
  });
  res.send('Test');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
