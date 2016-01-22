var Crawler = require("crawler");
var mysql = require("mysql");
var url = require('url');

var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

var catogoryArray = [];
var applistArray = [];
var counter = 0; 

/*You can remove this to skip database connection*/
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'itunesAppDatabase'
});
 
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});



//This sub crawler will get details of app 
var appInfoCrawler = new Crawler({
    maxConnections : 20,
    jQuery: true,
    jQueryUrl:'jquery-1.12.0.min.js',
    callback : function (error, result, $) {

        console.log(result.body);
        try{

                var title = $("#title").find("h1").html();
                var appBy = $("#title").find("h2").html();
                var desc = $("p[itemprop=description]").html();
                var cat = $(".genre").find("a").find("span").html();
                var rating = ""; 
                $(".customer-ratings").find(".rating").each(function(index, a) {
                    rating = $(a).attr("aria-label");
                    
                });

                if(rating == "")
                    rating = "0";
                
                console.log(counter++);

                //Comment this line if you dont want to store result in database  
                connection.query("INSERT INTO appInfo (title, developer, description, cat, rating) VALUES ('"+title+"','"+appBy+"','"+desc+"','"+cat+"','"+rating+"');", function(err, rows, fields) {
                    if (err) 
                        throw err;
                 });

        }catch(ex){console.log(ex)}
    }    
});


//This sub crawler will get list of all apps available to each itunes store catogory 
//and feed to appDetail crawler to get deatils about each app information
var applistCrawler = new Crawler({
    maxConnections : 10,
    callback : function (error, result, $) {
        applistArray = []; 
        var testUrls = $("#selectedcontent").find("a").each(function(index, a) {
            var toQueueUrl = $(a).attr('href');
            
            applistArray.push(""+toQueueUrl+"");
        
        });

         appInfoCrawler.queue(applistArray);
    }    
});

//This sub crawler will get list of all catogaries available to itunes store 
//and feed to applist crawler to get list of apps in each catogory

var catagoryCrwaler = new Crawler({
    maxConnections : 10,
    callback : function (error, result, $) {
        var testUrls = $("#genre-nav").find("a").each(function(index, a) {
            var toQueueUrl = $(a).attr('href');
            for (i = 0; i < alphabet.length; i++) { 
                  catogoryArray.push(""+toQueueUrl+"&letter="+alphabet[i]+"");
            }
        });

         applistCrawler.queue(catogoryArray);
    }    
});

//Give head start to crawler
catagoryCrwaler.queue('http://itunes.apple.com/us/genre/ios-books/id6018?mt=8');


