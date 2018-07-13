var request = require('request');
var cheerio = require('cheerio');

var url = "http://shirts4mike.com/shirts.php";

request(url, function (error, response, body) {
  var shirts = [];
  var $ = cheerio.load(body);
  $('.products li a').each(function(i, elem){
    shirts.push(elem.attribs.split[2]);
  });
  console.log(shirts);


});
