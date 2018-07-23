const cheerio = require("cheerio");
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");
const site = "http://shirts4mike.com/";
const url = "http://shirts4mike.com/shirts.php";


/*getContent function replacing NPM request module dependency to lessen dependency bloat
  Credit: Functionality provided by Tomas Dvorak, https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies */
const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed to load page, status code: ' + response.statusCode));
        //log error to console and log file
        if (err) {
          let error = 'There was an error: "' + err.code + " (" + err.syscall + ")" + '" while trying to connect to ' + err.hostname;
          const errorFile = fs.createWriteStream("scraper-error.log");
          errorFile.write('[' + new Date() + ']' + ' <' + error + '>');
          console.log(error);
        }
      }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });

    // handle connection errors of the request
    request.on('error', (err) => {
      reject(err)
    })
  })
};

//start message
console.log('Executing scraper.js');

//create data folder if it does not exist
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
  console.log('./data subdirectory successfully created.')
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
    function formatDate() {
    var date = new Date(),
        month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}
    var csvFileName = "./data/" + formatDate() + ".csv";
    const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
    const stream = fs.createWriteStream(csvFileName);
    const json2csvParser = new Json2csvParser({fields});
    stream.write('"Title","Price","ImageURL","URL","Time"');
    console.log("csv filepath: " + csvFileName + " successfully created.");
    //loop through each url in shirts array
    for (let i=0; i < shirts.length; i++) {
      console.log('.');
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
          let shirtValues = [{
            "Title": titleShirt,
            "Price": priceShirt,
            "ImageURL": imageUrlShirt,
            "URL": urlShirt,
            "Time": date
          }];
          //append desired values into csv file
          let csv = json2csvParser.parse(shirtValues);
          //remove duplication of headers within loop
          let noheaderCSV = csv.replace(/"title","Price","ImageURL","URL","Time"/i, '');
          //write data to csv file
          stream.write(noheaderCSV);
          //completion message once loop fully iterates
          if (i==shirts.length-1) {console.log('Successfully appended all data to csv file.')}
        }).catch((err) => {
          //log error to console and log file
          if (err) {
            let error = 'There was an error: "' + err.code + " (" + err.syscall + ")" + '" while trying to connect to ' + err.hostname;
            const errorFile = fs.createWriteStream("scraper-error.log");
            errorFile.write('[' + new Date() + ']' + ' <' + error + '>');
            console.log(error);
          }
      });
    }
  }).catch((err) => {
    //log error to console and log file
    if (err) {
      let error = 'There was an error: "' + err.code + " (" + err.syscall + ")" + '" while trying to connect to ' + err.hostname;
      const errorFile = fs.createWriteStream("scraper-error.log");
      errorFile.write('[' + new Date() + ']' + ' <' + error + '>');
      console.log(error);
    }
});
