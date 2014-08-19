var express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    path = require('path'),
    mustache = require('mustache');

module.exports = function ( templates_directory ) {
    // define express server
    var server = express();
    // middleware
    server.use( bodyParser.json() );
//    server.use( bodyParser.urlencoded({extended: false}) );
//    server.use( bodyParser.multipart() );

    // define server actions

    // List all available templates
    server.get( '/templates', function(req,res) {
        list_templates( templates_directory, function (data) {
            res.status(200).json(data);
        }, function (err) {
            res.status(500).json(err);
        } );
    } )
    // Get template with given name and format
    .get( '/templates/:name.:format(html|txt)', function (req,res) {
        get_template(
            // template name
            req.params.name,
            // directory
            templates_directory,
            // all formats
            [ req.params.format ],
            // success callback
            function (data){ res.status(200).send(data[req.params.format]); },
            // error callback
            function (err) { if (err) { res.status(500).json(err); }
                             else { res.status(404).send(); }
            }
        );
    } )
    // Get template with given name.
    .get( '/templates/:name', function (req,res) {
        get_template(
            // template name
            req.params.name,
            // directory
            templates_directory,
            // all formats
            undefined,
            // success callback
            function (data){ res.status(200).json(data); },
            // error callback
            function (err) { if (err) { res.status(500).json(err); }
                             else { res.status(404).send(); }
            }
        );
    } )
    // Get rendered template with the given params
    .get( '/templates/:name/render', function (req,res) {
        render_template(
            req.params.name,
            templates_directory,
            undefined,
            req.query,
            function (data) { res.status(200).json(data); },
            function (err) { if (err) { res.status(500).json(err); }
                             else { res.status(404).send(); }
            }
        );
    } )
    // Get rendered template with the given params in the given format
    .get( '/templates/:name/render.:format(txt|html)', function (req,res) {
        render_template(
            req.params.name,
            templates_directory,
            [req.params.format],
            req.query,
            function (data) { res.status(200).send(data[req.params.format]); },
            function (err) { if (err) { res.status(500).json(err); }
                             else { res.status(404).send(); }
            }
        )
    } )
    // Create new template
    .post( '/templates/:name', function (req, res) {
        if( req.headers['content-type'] !== 'application/json' ) {
            res.status(400).send();
        } else {
            create_template(
                req.params.name,
                templates_directory,
                req.body,
                function () { res.status(204).send(); },
                function (err) {
                    if (err) { res.status(500).json(err); }
                    else { res.status(409).send(); }
                }
            );
        }

    } );

    // process params
//    if( arguments.length == 0 ) {
//        templates_directory = './templates';
//    }

    // Clean path
    templates_directory = path.normalize( templates_directory );
    templates_directory = path.resolve( templates_directory );
    if( !fs.existsSync( templates_directory ) ) {
        console.log( '"' + templates_directory + '"' + " doesn't exists in the file system. ");
        console.log( "Attempting to create templates directory..." );
        // Create directory
        fs.mkdir( templates_directory, function ( err ) {
            if( err ) throw err;
        } );
    }

    return server;
};
/**
 * List the available templates in the given directory.
 * @param directory Template's directory
 * @param success_cb Success callback
 * @param error_cb Error callback
 */
function list_templates (directory, success_cb, error_cb) {
    fs.readdir( directory, function (err, files) {  // select all files from directory
        if( !err ) success_cb( files
                .filter( function (entry) { return template_format_filter(entry.substring(entry.lastIndexOf('.')+1)); } )
                .map( function (entry) { return entry.substring(0, entry.lastIndexOf('.')); }) // select only file names
                .filter( function (x,i,me) { return me.indexOf(x) === i } )                    // select distinct names
            );
        else error_cb( err );
    } );
}

/**
 * Returns the absolute file path if the template exists; undefined otherwise.
 * @param template_name Template's name
 * @param directory Template's directory
 * @param format Template's format (txt or html)
 * @returns {string|undefined} template file path
 */
function template_exists ( template_name, directory, format ) {
    var template_path  = directory + "/" + template_name;
    if( format ) template_path += "." + format;
    return fs.existsSync( template_path ) ? template_path : undefined;
}

/**
 * Finds the given template in the specified formats. If no formats are specified, all allowed formats are fetched.
 * @param template_name Template's name
 * @param directory Template's directory
 * @param format Formats
 * @param success_cb Success callback
 * @param error_cb Error callback
 */
function get_template ( template_name, directory, format, success_cb, error_cb ) {
    if (!format) { format = ['txt', 'html']; }
    else if (format instanceof Array) { format = format.filter(template_format_filter); }
    else { format = [ format ]; get_template( template_name, directory, format, success_cb, error_cb); return; }

    var c = format.length, r = {};
    if (c > 0) {
        format.forEach(function (ext) {
            var template = template_exists(template_name, directory, ext);
            if (template) {
                fs.readFile(template, function (err, data) {
                    if (!err) {
                        c--;
                        r[ext] = data.toString();
                        if (c == 0) {
                            success_cb(r);
                        }
                    } else {
                        error_cb(err);
                    }
                });
            } else {
                error_cb( undefined );
            }
        });
    } else {
        error_cb( undefined );
    }
}

/**
 *
 * @param name
 * @param templates_directory
 * @param body
 * @param success_cb
 * @param error_cb
 */
function create_template (name, templates_directory, body, success_cb, error_cb) {
    var exts = Object.keys( body ).filter( template_format_filter ), c = exts.length, e = 0;
    if (c > 0) {
        exts.forEach( function (ext) {
            var template = body[ext].template || body[ext];
            if (template_exists( name, templates_directory, ext )) {
                c--; e++;
                if (c == 0 && e > 0) { error_cb(); }
            } else {
                fs.writeFile( templates_directory + '/' + name + '.' + ext, template, function (err) {
                    if (!err) c--;
                    else error_cb( err );

                    if (c == 0) success_cb();
                } );
            }
        } );
        success_cb();
    } else {
        error_cb();
    }
}

/**
 * Renders the given template in the specified formats with the given parameters. If no formats are specified, all
 * allowed formats are fetched.
 * @param template_name Template's name
 * @param directory Template's directory
 * @param format Formats
 * @param params Parameters
 * @param success_cb Success callback
 * @param error_cb Error callback
 */
function render_template (template_name, directory, format, params, success_cb, error_cb) {
    if (!format) { format = ['txt', 'html']; }
    else if (format instanceof Array) { format = format.filter(template_format_filter) }
    else { format = [ format ]; render_template( template_name, directory, format, params, success_cb, error_cb); return; }

    var c = format.length, r = {};
    if (c > 0) {
        format.forEach(function (ext) {
            var template_file = template_exists( template_name, directory, ext );
            if (template_file) {
                fs.readFile(template_file, function (err, data) {
                    if (!err) {
                        c--;
                        // render plain text template
                        r[ext] = mustache.render( data.toString(), params );
                        if (c == 0) { success_cb( r ); }
                    } else {
                        error_cb( err );
                    }
                });
            } else {
                error_cb( undefined );
            }
        });
    } else {
        error_cb( undefined );
    }
}

/**
 * Filter function for the allowed formats/extensions.
 * @param ext Queried format/extension
 * @returns {boolean} Whether the given value is an allowed format/extension.
 */
function template_format_filter (ext) {
    return ext == 'txt' || ext == 'html';
}