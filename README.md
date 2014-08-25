# email templater

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

## Future work

- Finish the mailing services.
- Rewrite to enabled usage as independent module or through an express wrapper.
- Rewrite into templating module, emailing module, and index.js wrapping both module's services.
- Rewrite express wrapper to accept future authorization/authentication module/layer. (use apikeys?)
