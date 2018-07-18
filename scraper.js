const cheerio = require("cheerio");
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");

const site = "http://shirts4mike.com/";
const url = "http://shirts4mike.com/shirts.php";

/*getContent function replacing NPM request module dependency to lessen dependency bloat
  credit: Provided by Tomas Dvorak, https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies */
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

//create data folder if it does not exist
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

//Begin scraping http://shirts4mike.com/shirts.php, load html through cheerio
getContent(url)
  .then(function(html) {
    var shirts = [];
    var $ = cheerio.load(html);
    //push all shirt urls on page into shirts array
    $('.products li a').each(function(i, elem){
      shirts.push(site + elem.attribs.href);
    });
    //format and creation of csv file
    var date = new Date();
    var dateFormat = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
    const stream = fs.createWriteStream("./data/" + dateFormat + ".csv");
    const json2csvParser = new Json2csvParser({fields});
    stream.write('"Title","Price","ImageURL","URL","Time"');
    //loop through each url in shirts array
    for (let i=0; i < shirts.length; i++) {
      //scrape each shirt url page, load html through cheerio
      getContent(shirts[i])
        .then(function(html) {
          var $ = cheerio.load(html);

          //store desired values
          var titleShirt = $('.shirt-picture span img').attr('alt');
          var priceShirt = $('.price').text();
          var imageUrlShirt = $('.shirt-picture span img').attr('src');
          var urlShirt = shirts[i];
          var date = new Date();
          let shirtValues = [
            {
              "Title": titleShirt,
              "Price": priceShirt,
              "ImageURL": imageUrlShirt,
              "URL": urlShirt,
              "Time": date
            }
          ];
          //append desired values into csv file
          let csv = json2csvParser.parse(shirtValues);
          //remove duplication of headers within loop
          let noheaderCSV = csv.replace(/"title","Price","ImageURL","URL","Time"/i, '');
          //write data to csv file
          stream.write(noheaderCSV);

          //test logs
          //console.log(noheaderCSV);
          //console.log(html);
          //console.log('titleShirt: ' + titleShirt);
          //console.log('priceShirt: ' +priceShirt);
          //console.log('imageUrlShirt: '+imageUrlShirt);
          //console.log('urlShirt: '+urlShirt);
          //console.log(shirtValues);
        }
      ).catch((err) => console.error('There was an error: ' + err));};
  }).catch((err) => console.error('There was an error: ' + err));
