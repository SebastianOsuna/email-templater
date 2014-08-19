#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var program = require('commander');

program
    .version(JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')).version)
    .usage('<command>')
    .option('-p, --port [port]', 'Port number to listen to (defaults to 3000)', parseInt)
    .option('-t, --templates-directory [directory]', 'Templates directory location (defaults to ./templates)' )
    .parse(process.argv);

var email_templater = require('../lib/email-templater');

var action = program.args.join(' ');
var port = program.port || 3000;

console.log( 'Initializing server. Listening on port '+port+' ...');
email_templater(program.templatesDirectory || './templates').listen(port);