var cheerio = require("cheerio");

var site = "http://shirts4mike.com/";
var url = "http://shirts4mike.com/shirts.php";


const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    })
};

//Begin scraping http://shirts4mike.com/shirts.php
getContent(url)
  .then(function(html) {
    var shirts = [];
    var $ = cheerio.load(html);
    $('.products li a').each(function(i, elem){
      shirts.push(site + elem.attribs.href);
    });
    for (let i=0; i < shirts.length; i++) {
      getContent(shirts[i])
        .then(function(html) {
          var $ = cheerio.load(html);
          var titleShirt = $('.shirt-picture span img').attr('alt');
          var priceShirt = $('.price').text();
          var imageUrlShirt = $('.shirt-picture span img').attr('src');
          var urlShirt = shirts[i];

          //console.log(html);
          console.log('titleShirt: ' + titleShirt);
          console.log('priceShirt: ' +priceShirt);
          console.log('imageUrlShirt: '+imageUrlShirt);
          console.log('urlShirt: '+urlShirt);
        }
      )};
  }).catch((err) => console.error(err));
