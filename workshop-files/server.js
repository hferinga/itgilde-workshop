// A simple web server that generates dynamic content based on responses from Redis 
// 
var fs = require('fs'); 
var redisHost  = process.env.REDIS_HOST || 'redis_primary'; 
var redisPort  = process.env.REDIS_PORT || 6379; 

var http = require("http"), server, 
    redis_client = require("redis").createClient(redisPort, redisHost); 

var logFile = fs.createWriteStream('/var/log/nodeapp/nodeapp.log', {flags: 'a'}); 
var port = process.env.HTTP_PORT || 3000; 

server = http.createServer(function (request, response) { 
    response.writeHead(200, { 
        "Content-Type": "text/plain" 
    }); 
    
    var redis_info, total_requests; 

    
    redis_client.info(function (err, reply) { 
        redis_info = reply; // stash response in outer scope 
    }); 
    redis_client.incr("requests", function (err, reply) { 
        total_requests = reply; // stash response in outer scope 
    }); 
    redis_client.hincrby("ip", request.connection.remoteAddress, 1); 
    redis_client.hgetall("ip", function (err, reply) { 
        // This is the last reply, so all of the previous replies must have completed already 
        response.write("This page was generated after talking to redis.\n\n" + 
            "Redis info:\n" + redis_info + "\n" + 
            "Total requests: " + total_requests + "\n\n" + 
            "IP count: \n"); 
        logFile.write("Total Requests: " + total_requests + "\n"); 
        Object.keys(reply).forEach(function (ip) { 
            response.write("    " + ip + ": " + reply[ip] + "\n"); 
        }); 
        response.end(); 
    }); 
}).listen(port);

