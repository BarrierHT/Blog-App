const express = require('express');
require('dotenv').config();


const app = express();

app.set('port', process.env.PORT || 8080);

app.use(express.json());
app.use(express.urlencoded({extended:false}));




app.listen(app.get('port'));
