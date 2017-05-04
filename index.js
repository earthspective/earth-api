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


var mysql_config = {
    host: config.database.host,
    user: config.database.username,
    port: config.database.port,
    password: config.database.password,
    database: config.database.database,
    dateStrings: 'date'
};

app.get('/', function (req, res) {
    res.send('Hello World');
});

var server = app.listen(config.webserver.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('listening on http://%s:%s', host, port);

});
app.use(upload.array()); // for parsing multipart/form-data

app.post('/pins/', function (req, res) {
    //res.send("hello world");
    var didFail = true;
    parser.parseString(req.body['testData'], function (err, result) {
        didFail = false;
        result.PinCollection.Pins[0].Pin.forEach(function (e) {
            //console.log(e['$'].id);
            d = e['$'];
            var data = [d.id, d.year, d.x, d.y, d.title, d.desc, d.tags];
            var connection = mysql.createConnection(mysql_config);
            var query = connection.query('replace into Pins (PinID, EventDate, Latitude, Longitude, PinTitle, PinDesc, Tags) values (?, ?, ?, ?, ?, ?, ?)', data, function (err, result) {
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
app.get('/pins/', function (req, res) {
    try {
        var connection = mysql.createConnection(mysql_config);
        connection.connect(function (err) {
            if (err) {
                console.log(err);
                res.send(503, "Error");
            } else {
                //var sql = 'select * from Pins P inner join Pins_Tags P_T on P_T.PinID = P.PinID inner join Tags T on T.TagID = P_T.TagID order by P.PinID asc';
                var sql = 'select * from Pins';
                connection.query(sql, function (err, rows, fields) {
                    if (err) {
                        console.log(err);
                    }
                    var xml = builder.begin().ele('PinCollection', { PackID: 1 }).ele('Pins');
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
                        /*do  {
                            item.ele('tag', rows[i]['TagName']);
                            i += 1;
                        } while (i < rows.length && rows[i]['PinID'] == rows[i-1]['PinID']);*/
                    }
                    xml.end({ pretty: true });

                    res.set('Content-Type', 'text/xml');
                    res.send(xml.doc().end());
                    connection.end();
                });
                //connection.end();
            }
        });
    } catch (e) {
        res.send(503, "Error");
    }
});