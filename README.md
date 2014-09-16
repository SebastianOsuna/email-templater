email templater
===

## As web server

To run: 
`node bin/email-templater` or `email-templater`.

Parameters: 
```
-h, --help: Help
-v, --version: Version
-p, --port [port]: Port number to listen to (default is 3000)
-t, --templates-directory [directory]: Filesystem template directory (default is './templates')
```

**Templates:**

Templates must be defining using [Mustache](https://github.com/janl/mustache.js).

`GET /templates`: lists available templates. That is, it lists the different filenames of HTML and TXT files from the
templates directory.

`GET /templates/:name(.:format)?`: Looks for a template with the given name. If no format is specified, it looks for 
both, HTML and TXT templates with the given name; if found it returns a JSON object with both templates. If a format is
specified, it will just return the given template in the given format.

`GET /templates/:name/render(.:format)?`: Renders the given template with the request parameters (query params). If no 
format is specified, it returns a JSON object with all the templates available formats rendered.

`POST /templates/:name`: Creates a new template. The server requires the `content-type` header to be 
 `application/json`. The template text must be submitted via a JSON object in the request body containing the content 
 for every format. If a template with the given name already exists, an error is thrown.
 
 **Request body example:**
 
 ```
 { 
   "html" : { "template": "<strong>Hello {{ name }}.</strong>" },
   "txt" : { "template" : "Hello {{name}}."  }   
 }
 ```
 or
 ```
 { 
   "txt" : "{{ name }}: \r\n\r\nThis is another way to submit templates.", 
   "html" : "<h1>{{ name }}</h1><p>This is another way to submit templates.</p>" 
 }
 ```

`PUT /templates/:name`: Edits an existing template. Works exactly as the creation, except if the template doesn't exists 
or one of the formats being edited doesn't exists, an error is thrown.

`DELETE /templates/:name.:format`: Deletes the template with the given format. An error is thrown if the templates doesn't 
exists in the given format.

**Mailer:**

`POST /mail/:template_name`: Mails a compiled version of the given template. The mail will contain all the available formats 
 for the template, that is HTML and/or plain text (depending on availability). If the given file doesn't exist, `404 Not 
  Found` header is returned. The request body must have the `Content-Type: application/json` header. All fields in the 
  following request body example are required:
  
```
 { 
   "to": "customer@domain.com", // can also be an array of recipients
   "subject": "Hello!",
   "data": {                 // this values are used to render the template,
     "foo1": "bar1",         // it is your responsibility to provide the right
     "foo2": "bar2",         // values for the mail to be send as you expect
     ...
   }
 }
```

## Known issues:
 - **Error: SELF_SIGNED_CERT_IN_CHAIN**. See:
     - http://stackoverflow.com/questions/9626990/receiving-error-error-ssl-error-self-signed-cert-in-chain-while-using-npm
     - https://github.com/andris9/Nodemailer/issues/310
     - http://blog.npmjs.org/post/78085451721/npms-self-signed-certificate-is-no-more
     - Other possible causes:
         - If using your own SMTP server, check the certificate is setup correctly.
         - Avast! AV in Windows will block the certificates.

## Future work

- Accept future authorization/authentication module/layer. (use apikeys?)
- Support attachments and embedded images
- NPM publish
