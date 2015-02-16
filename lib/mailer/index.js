var mailer = require( "nodemailer"),
    config = require( "../../config/mail" );

module.exports = function ( directory ) {
    var _dir = directory,
        templater = require( "../templater" )( _dir );
    if( !config ) {
        throw "No configuration file found.";
    }

    // setup mailer transporter
    var transporter = mailer.createTransport( config.mailer );


    /**
     * Sends mails with the contents of the given template rendered with the given data.
     * @param to {Array|string} Recipients
     * @param from Sender
     * @param subject Mail subject
     * @param template Mail template's name
     * @param data Template's data. This is used to render the template with mustache.
     * @param cb Callback function. This function is called each time an error occurs. Can be called up to the number
     *           of recipients given.
     */
    var sendMail = function ( to, from, subject, template, data, cb ) {

        templater.renderTemplate( template, undefined, data, function ( content ) {
            var options = {
                from: from,
                to: '',
                subject: subject,
                text: content.txt,
                html: content.html
            };

            if( !(options.from || options.from != '') ) {
              cb('Invalid sender');
              return;
            }
            if( !(options.subject || options.subject != '') ) {
              cb('Invalid subject');
              return;
            }

            if ( !(to instanceof Array) ) {
                to = [ to ];
            }
            to.forEach( function ( recipient ) {
                options.to = recipient;
                if( !(options.to || options.to != '') ) {
                  cb( 'Invalid recipient' );
                  return;
                }
                transporter.sendMail( options, cb );
            } );
        }, cb );
    };

    return {
        sendMail: sendMail
    }
};
