
module.exports = function ( templates_directory ) {
    var templater = require( "./templater" )( templates_directory ),
        mailer = require( "./mailer" )( templates_directory ),
        exports = {};
    for( var exp in templater ) {
        exports[ exp ] = templater[ exp ];
    }
    for( var exp in mailer ) {
        exports[ exp ] = mailer[ exp ];
    }
    return exports;
};