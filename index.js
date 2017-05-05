var config = require("./config.json");
var util = require('util');
var express = require('express');
var app = express();
var mysql = require('mysql');
var builder = require('xmlbuilder');
var multer = require('multer');
var upload = multer();
var xml2js = require('xml2js');

var parser = new xml2js.Parser();

app.use('/images', express.static('images'));

//Pull MySQL configuration from the config.json file
var mysql_config = {
    host: config.database.host,
    user: config.database.username,
    port: config.database.port,
    password: config.database.password,
    database: config.database.database,
    dateStrings: 'date'
};

//Setup server, listen on default port
var server = app.listen(config.webserver.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('listening on http://%s:%s', host, port);

});
//Setup parsing for the multipart/form-data submission to POST
app.use(upload.array());

//POST option to /pin/, this inputs the XML data in the same format that
//the get returns, and updates the database with the new information.
app.post('/pins/', function (req, res) {
    var didFail = true;
    parser.parseString(req.body['testData'], function (err, result) {
        didFail = false;
        //For each pin in the PinCollection set, query the database for an update
        var packid = 1;
        try {
            packid = result.PinCollection['$'].PackID;
        } catch (e) {}
        result.PinCollection.Pins[0].Pin.forEach(function (e) {
            d = e['$'];
            var data = [d.id, d.year, d.x, d.y, d.title, d.desc, d.tags, packid];
            var connection = mysql.createConnection(mysql_config);
            var query = connection.query('replace into Pins (PinID, EventDate, Latitude, Longitude, PinTitle, PinDesc, Tags, EventPackID) values (?, ?, ?, ?, ?, ?, ?, ?)', data, function (err, result) {
                if (err) {
                    console.err(err);
                    didFalse = true;
                }
                connection.end();
            });
        });
    });
    if (didFail) {
        res.send(503, "Error");
    } else {
        res.send("Good");
    }
});
app.get('/pins/:packid', function (req, res) {
    try {
        sendPins(req, res, req.params.packid);
    } catch (e) {
        res.send(503, "Error");
    }
});
app.get('/pins/', function (req, res) {
    try {
        sendPins(req, res, 1);
    } catch (e) {
        res.send(503, "Error");
    }
});

function sendPins(req, res, packid) {
    var connection = mysql.createConnection(mysql_config);
    connection.connect(function (err) {
        if (err) {
            console.log(err);
            res.send(503, "Error");
        } else {
            var sql = 'select * from Pins where EventPackID = ?';
            connection.query(sql, [ packid ], function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //Begin building the XML in the format Unity requires, building dynamically from the
                //SQL data that was returned, the date format is defined in the mysql config above.
                var xml = builder.begin().ele('PinCollection', { PackID: packid }).ele('Pins');
                for (var i = 0; i < rows.length; i++) {
                    var tags = rows[i]['Tags'];
                    if (!tags) {
                        tags = "";
                    }
                    var item = xml.ele('Pin', {
                        'id': rows[i]['PinID'],
                        'year': rows[i]['EventDate'],
                        'x': rows[i]['Latitude'],
                        'y': rows[i]['Longitude'],
                        'title': rows[i]['PinTitle'],
                        'desc': rows[i]['PinDesc'],
                        'tags': tags
                    });
                }
                //End the XML and send it with formatting so it can be easily read.
                xml.end({ pretty: true });

                //Set the HTTP header to text/xml so Unity reads it as the correct type
                res.set('Content-Type', 'text/xml');
                res.send(xml.doc().end());
                connection.end();
            });
        }
    });
}