/**
 * Module dependencies
 */
var mustache = require( "mustache"),
    fs = require( "fs" );

module.exports = function(directory){
    var _dir = directory;
    _dir = path.normalize(_dir);
    _dir = path.resolve(_dir);
    if ( !fs.existsSync( _dir ) ) {
        throw '"' + _dir + '"' + " doesn't exists in the file system. ";
    }

    /**
     * Checks if a template with the given name exists.
     * @param template_name Template's name
     * @param format Template's format (txt or html)
     * @param _then If template exists callback. Template file's path is given as argument.
     * @param [_else] If template doesn't exists callback. No arguments. [optional]
     */
     var templateExists = function ( template_name, format, _then, _else ) {
        var template_path = _dir + "/" + template_name + "." + format;
        fs.exists( template_path, function ( exists ) {
            if ( exists ) {
                _then( template_path );
            } else if ( _else ) {
                _else();
            }
        } );
    };

    /**
     * List the available templates in the given directory.
     * @param success_cb Success callback. List of available templates given as argument.
     * @param error_cb Error callback. Error given as argument.
     */
    var listTemplates = function ( success_cb, error_cb ) {
        fs.readdir( _dir, function ( err, files ) {  // select all files from directory
            if( !err ) {
                success_cb( files
                    .filter( function ( entry ) {
                        return template_format_filter( entry.substring( entry.lastIndexOf( "." ) + 1 ) );
                    } ).map( function ( entry ) {
                        return entry.substring( 0, entry.lastIndexOf( "." ) );   // select only file names
                    } ).filter( function ( x, i, me ) {
                        return me.indexOf( x ) === i;                            // select distinct names
                    } )
                );
            } else {
                error_cb( err );
            }
        } );
    };

    /**
     * Finds the given template in the specified formats. If no formats are specified, all allowed formats are fetched.
     * @param template_name Template's name
     * @param format Formats
     * @param success_cb Success callback
     * @param error_cb Error callback
     */
    var getTemplate = function ( template_name, format, success_cb, error_cb ) {
        // prepare input
        if ( !format ) {
            format = [ "txt", "html" ];
        } else if ( format instanceof Array ) {
            format = format.filter( template_format_filter );
        } else {
            getTemplate( template_name, [ format ], success_cb, error_cb );
            return;
        }
        // check existence
        var c = format.length, r = {};
        if (c > 0) {
            format.forEach( function ( ext ) {
                templateExists( template_name, ext, function ( template ) { // if template exists
                    fs.readFile( template, function ( err, data ) {
                        if ( !err ) {
                            c--;
                            r[ ext ] = data.toString();
                            if ( c == 0 ) {
                                success_cb( r );
                            }
                        } else {
                            error_cb( err );
                        }
                    });
                }, error_cb );

            } );
        } else {
            error_cb();
        }
    };

    /**
     * Creates a new template for each format given.
     * @param name Template's name
     * @param body Template's body. JSON object containing definitions for some or all formats.
     * @param success_cb Success callback
     * @param error_cb Error callback
     */
    var createTemplate = function ( name, body, success_cb, error_cb ) {
        var exts = Object.keys( body ).filter( template_format_filter ),
            c = exts.length,
            e = 0;
        if ( c > 0 ) {
            exts.forEach( function ( ext ) {
                var template = body[ ext ].template || body[ ext ];
                templateExists( name, ext, function () { // if template already exists
                    c--;
                    e++;
                    if ( c == 0 && e > 0 ) {
                        error_cb();
                    }
                }, function () { // if template doesn't exists already
                    // create file
                    fs.writeFile( _dir + "/" + name + "." + ext, template, function ( err ) {
                        if ( !err ) {
                            c--;
                        } else {
                            error_cb( err );
                        }
                        // Check if done
                        if ( c == 0 ) {
                            success_cb();
                        }
                    } );
                } );
            } );
        } else {
            error_cb();
        }
    };

    /**
     * Edits an existing template in each of the given formats.
     * @param name Template's name
     * @param body Template's body. JSON object containing definitions for some or all formats.
     * @param success_cb Success callback
     * @param error_cb Error callback
     */
    var editTemplate = function ( name, body, success_cb, error_cb ) {
        var exts = Object.keys( body ).filter( template_format_filter ),
            c = exts.length,
            e = 0;
        if (c > 0) {
            exts.forEach( function ( ext ) {
                var template = body[ ext ].template || body[ ext ];
                templateExists( name, ext, function () {
                    // overwrite file
                    fs.writeFile( _dir + "/" + name + "." + ext, template, function ( err ) {
                        if ( !err ) {
                            c--;
                        } else {
                            error_cb( err );
                        }
                        // check if done
                        if ( c == 0 ) {
                            success_cb();
                        }
                    } );
                }, function () {
                    c--;
                    e++;
                    if ( c == 0 && e > 0 ) {
                        error_cb();
                    }
                } );
            } );
        } else {
            error_cb();
        }
    };

    /**
     * Deletes the given template with the given format.
     * @param name Template's name
     * @param format Template's format
     * @param success_cb Success callback
     * @param error_cb Error callback
     */
    var deleteTemplate = function ( name, format, success_cb, error_cb ) {
        templateExists( name, format, function ( path ) {
            fs.unlink( path, function ( err ) {
                if ( err ) {
                    error_cb( err );
                } else {
                    success_cb();
                }
            } );
        }, error_cb );
    };

    /**
     * Renders the given template in the specified formats with the given parameters. If no formats are specified, all
     * allowed formats are fetched.
     * @param template_name Template's name
     * @param format Formats
     * @param params Parameters
     * @param success_cb Success callback
     * @param error_cb Error callback
     */
    var renderTemplate = function ( template_name, format, params, success_cb, error_cb ) {
        if ( !format ) {
            format = [ "txt", "html" ];
        } else if ( format instanceof Array ) {
            format = format.filter( template_format_filter );
        } else {
            renderTemplate( template_name, [ format ], params, success_cb, error_cb );
            return;
        }

        var c = format.length, r = {};
        if ( c > 0 ) {
            format.forEach( function ( ext ) {
                templateExists( template_name, ext, function ( path ) {
                    fs.readFile( path, function ( err, data ) {
                        if (!err) {
                            c--;
                            // render template using mustache
                            r[ ext ] = mustache.render( data.toString(), params );
                            if ( c == 0 ) {
                                success_cb( r );
                            }
                        } else {
                            error_cb( err );
                        }
                    });
                }, error_cb );
            });
        } else {
            error_cb();
        }
    };


    /**
     * Filter function for the allowed formats/extensions.
     * @param ext Queried format/extension
     * @returns {boolean} Whether the given value is an allowed format/extension.
     */
    function template_format_filter (ext) {
        return ext == 'txt' || ext == 'html';
    }

    // Module exports
    return {
        templateExists: templateExists,
        listTemplates: listTemplates,
        getTemplate: getTemplate,
        createTemplate: createTemplate,
        editTemplate: editTemplate,
        deleteTemplate: deleteTemplate,
        renderTemplate: renderTemplate
    };

};