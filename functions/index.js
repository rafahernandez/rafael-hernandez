const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const express = require('express');
const engines = require('consolidate');

const firebaseApp = firebase.initializeApp(
    functions.config().firebase
);

function getFacts(){
const ref = firebaseApp.database().ref('facts');
return ref.once('value').then(snap => snap.val());
}
const app = express();
app.engine('hbs',engines.handlebars);
app.set('views', './views');
app.set('view engine','hbs');

app.get('/', (request, response) => {
    response.set('Cache-control', 'public, max-age=300, s-maxage=600');
    getFacts().then(facts => {
        response.render('index', {facts});
    });
});
app.get('/facts.json', (request, response) => {
    response.set('Cache-control', 'public, max-age=300, s-maxage=600');
    getFacts().then(facts => {
        response.json(facts);
    });
});
app.get('/api/timestamp/:input_date?', (request, response) => {
    let input_date = request.params.input_date;
    let d = new Date();
    if(input_date){
        if(!isNaN(input_date)){
            input_date = parseInt(input_date);
        }
        d = new Date(input_date);
    }
    response.json({"unix":d.getTime(),"utc" : d.toUTCString()});
});
app.get('/api/whoami', (request, response) => {
    const ip = request.headers['fastly-client-ip']  || request.headers['x-forwarded-for']
        || request.connection.remoteAddress || "Not found";
    const language = request.headers["accept-language"];
    const agent = request.get('User-Agent');
    response.json({
        "ipaddress": ip,
        "language" : language,
        "software" : agent
    });
});
exports.app = functions.https.onRequest(app);
