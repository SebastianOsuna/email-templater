#!/usr/bin/env node

/**
 * Express Web server wrapper.
 */


var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    express = require('express'),
    bodyParser = require('body-parser');

program
    .version(JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')).version)
    .usage('<command>')
    .option('-p, --port [port]', 'Port number to listen to (defaults to 3000)', parseInt)
    .option('-t, --templates-directory [directory]', 'Templates directory location (defaults to ./templates)')
    .parse(process.argv);

// Clean path
var templates_directory = program.templatesDirectory || "./templates";
templates_directory = path.normalize(templates_directory);
templates_directory = path.resolve(templates_directory);
if (!fs.existsSync(templates_directory)) {
    console.log('"' + templates_directory + '"' + " doesn't exists in the file system. ");
    console.log("Attempting to create templates directory...");
    // Create directory
    fs.mkdir(templates_directory, function (err) {
        if (err) throw err;
    });
}

var email_templater = require("../lib/email-templater")(templates_directory),
    port = program.port || 3000,
    server = express();

server.use(bodyParser.json());

//List all available templates
server.get('/templates', function (req, res) {
    email_templater.listTemplates( function (data) {
        res.status(200).json(data);
    }, function (err) {
        res.status(500).json(err);
    } );
})
    // Get template with given name and format
    .get('/templates/:name.:format(html|txt)', function (req, res) {
        email_templater.getTemplate( req.params.name, [ req.params.format ], function ( data ) {
            res.status( 200 ).send( data[ req.params.format ] );
        }, function ( err ) {
            if ( err ) {
                res.status( 500 ).json( err );
            } else {
                res.status( 404 ).send();
            }
        } );
    } )
    // Get template with given name.
    .get('/templates/:name', function (req, res) {
        email_templater.getTemplate( req.params.name, undefined, function ( data ) {
            res.status( 200 ).send( data );
        }, function ( err ) {
            if ( err ) {
                res.status( 500 ).json( err );
            } else {
                res.status( 404 ).send();
            }
        } );
    })
    // Get rendered template with the given params
    .get('/templates/:name/render', function (req, res) {
        email_templater.renderTemplate( req.params.name, undefined, req.query, function ( data ) {
                res.status( 200 ).json( data );
            }, function ( err ) {
                if ( err ) {
                    res.status( 500 ).json( err );
                } else {
                    res.status( 404 ).send();
                }
            }
        );
    })
    // Get rendered template with the given params in the given format
    .get('/templates/:name/render.:format(txt|html)', function (req, res) {
        email_templater.renderTemplate( req.params.name, [ req.params.format ], req.query, function ( data ) {
                res.status( 200 ).json( data );
            }, function ( err ) {
                if ( err ) {
                    res.status( 500 ).json( err );
                } else {
                    res.status( 404 ).send();
                }
            }
        );
    })
    // Create new template
    .post('/templates/:name', function (req, res) {
        if ( req.headers[ 'content-type' ] !== 'application/json' ) {
            res.status( 400 ).send();
        } else {
            email_templater.createTemplate( req.params.name, req.body, function () {
                    res.status( 204 ).send();
                }, function ( err ) {
                    if ( err ) {
                        res.status( 500 ).json( err );
                    } else {
                        res.status( 409 ).send();
                    }
                }
            );
        }
    } )
    // Edits a template
    .put('/templates/:name', function (req, res) {
        if (req.headers['content-type'] !== 'application/json') {
            res.status(400).send();
        } else {
            email_templater.editTemplate( req.params.name, req.body, function () {
                    res.status( 204 ).send();
                }, function ( err ) {
                    if ( err ) {
                        res.status( 500 ).json( err );
                    } else {
                        res.status( 400 ).send();
                    }
                }
            );
        }
    })
    // Deletes a template
    .delete('/templates/:name.:format(txt|html)', function (req, res) {
        email_templater.deleteTemplate( req.params.name, req.params.format, function () {
                res.status( 204 ).send();
            }, function ( err ) {
                if ( err ) {
                    res.status( 500 ).json( err );
                } else {
                    res.status( 404 ).send();
                }
            }
        );
    });

console.log('Initializing server. Listening on port ' + port + ' ...');
server.listen(port);