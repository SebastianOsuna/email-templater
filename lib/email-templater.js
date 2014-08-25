
module.exports = function ( templates_directory ) {
    var templater = require( "./templater" )( templates_directory );
    var exports = {}
    for( var exp in templater ) {
        exports[ exp ] = templater[ exp ];
    }
    return exports;
};