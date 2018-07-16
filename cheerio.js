var request = require('request');
var cheerio = require('cheerio');

var url = "http://shirts4mike.com/shirts.php";
var site = "http://shirts4mike.com/";

request(url, function (error, response, body) {
  var shirts = [];
  var $ = cheerio.load(body);

  $('.products li a').each(function(i, elem){
    shirts.push(site + elem.attribs.href);
  });
  for (i=0; i < shirts.length; i++) {
    request(shirts[i], function (error, response, body) {

      console.log(body);
    });
  }
});
