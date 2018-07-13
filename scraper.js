var Crawler = require("crawler");
var cheerio = require('cheerio');
var fs = require('fs');

var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            console.log($("title").text());
        }
        done();
    }
});

// Queue URLs with custom callbacks & parameters
c.queue([{
    uri: 'http://shirts4mike.com/shirts.php?id=101',
    jQuery: true,

    // The global callback won't be called
    callback: function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            console.log('Grabbed', res.body.length, 'bytes');
            const html = res.body;
            console.log(html);
            fs.writeFile('html.html',
              html, function success(){
                console.log('file write success');
              });
              
        }
        done();
    }
}]);

// Queue some HTML code directly without grabbing (mostly for tests)
c.queue([{
    html: '<p>This is a <strong>test</strong></p>'
}]);
