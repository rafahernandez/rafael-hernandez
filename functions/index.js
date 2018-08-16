const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const express = require('express');
const engines = require('consolidate');
const bodyParser = require('body-parser');
var validUrl = require('valid-url');
const shortener = require("./shortener");

const firebaseApp = firebase.initializeApp(
    functions.config().firebase
);

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true })

function getFacts(){
const ref = firebaseApp.database().ref('facts');
return ref.once('value').then(snap => snap.val());
}
const app = express();
app.engine('hbs',engines.handlebars);
app.set('views', './views');
app.set('view engine','hbs');

let jsonParser = bodyParser.json();
let urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/', (request, response) => {
    response.json({ msg: "Rafael's Node API playground" });
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
app.post('/api/shorturl', urlencodedParser, (request, response) => {
    if (!request.body.url){
        return response.status(400).send({ error: "url is required" });
    }
    if (!validUrl.isWebUri(request.body.url)){
        return response.status(400).send({ error: "url is not valid" });
    }
    const base_path = "https://rafael-hernandez.firebaseapp.com/api/shorturl/";
    const counterRef = db.collection('counters').doc('shortener');
    let counter = 0;
    let getDoc = counterRef.get()
        .then(doc => {
            if (!doc.exists) {
                let setDoc = db.collection('counters').doc('shortener').set({ counter: 1 });
                counter = 1;
            } else {
                counter = doc.data().counter+1;
                let setDoc = counterRef.update({ counter: counter });
            }
            let coded = shortener.encode(counter);
            let data = {
                url: request.body.url,
                created_at: Date.now(),
            };
            console.log('Document data:', counter);
            let newUrl = db.collection('shortener').doc(String(counter)).set(data);
            
            return response.json({
                "short_url": base_path+coded
            });
        })
        .catch(err => {
            console.log('Firestore error', err);
            return response.status(400).send({ error: "Firestore error", "msg": err });
        });
});
app.get('/api/shorturl/:short_url', urlencodedParser, (request, response) => {
    let short_url = request.params.short_url;
    let decoded = String(shortener.decode(short_url));

    var urlRef = db.collection('shortener').doc(decoded);

    var getDoc = urlRef.get()
        .then(doc => {
            if (!doc.exists) {
                return response.status(404).send({ error: "short_url not found" });
            } else {
                response.status(301).redirect(doc.data().url);

                // return response.json({
                //     "data": doc.data()
                // });
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            return response.status(400).send({ error: "Error getting url", "msg": err });
        });
});
exports.app = functions.https.onRequest(app);
