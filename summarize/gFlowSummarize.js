var tmp = require('tmp');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var config = require('./config.json');

function summarize(article) {
    article = {
        "id":"7M89W8_",
        "title":"RBI still exchanging old notes, public rushes in",
        "summary":"The last day to submit demonetised Rs 500 and Rs 1,000 notes saw long queues of people at Reserve Bank of India \'s regional branch in Lucknow . \"I got to know from my friend that RBI is exchanging old currency without any paperwork and one only needs to present an original identity proof. I came with my voter ID card and got Rs 2,000 exchanged,\" said Manju Sinha, standing in queue outside RBI in Gomtinagar.",
        "picture":"https://imc.veooz.com/MM/91/MM89W91-large.jpg",
        "url":"http://timesofindia.indiatimes.com/city/lucknow/rbi-still-exchanging-old-notes-public-rushes-in/articleshow/56259094.cms",
        "lang":"en",
        "source":"The Times of India",
        "published":1483111756644,
        "body": "LUCKNOW: The last day to submit demonetised Rs 500 and Rs 1,000 notes saw long queues of people at Reserve Bank of India's regional branch in Lucknow. Banks, meanwhile, saw thin crowd in comparison to previous days.\n  \n  \n  RBI even allowed exchange of old notes up to Rs 2,000 on identity cards. People in queue said the exchange facility extended by RBI was not publicised in the media and they came to know about it through friends. Some labourers who had no bank account were also standing in queue. RBI will continue to exchange old notes till March 31.\n  \n  \n  \"I got to know from my friend that RBI is exchanging old currency without any paperwork and one only needs to present an original identity proof. I came with my voter ID card and got Rs 2,000 exchanged,\" said Manju Sinha, standing in queue outside RBI in Gomtinagar.\n  \n  \n  Mrityunjay Kumar, an executive, said, \"I stopped when I saw the queue and joined it when I came to know that RBI was exchanging notes.\"\n  \n  \n  Kumar wanted to exchange Rs 5,000 in old currency, but RBI officials changed only Rs 2,000 and told him to deposit the rest in his bank.\n  \n  \n  Meanwhile, depositing and withdrawing money in banks has become less time-consuming and easier. Only 10-15 depositors were seen in queues at any given point of time. Majority were those who either did not find time earlier to deposit money or accidentally found cash lying in the house. There were also some who chose the last date to avoid rush. At most banks TOI visited, depositors and officials said no written explanation was being sought form KYC-verified account holders.\n  \n  \n  \"It was on Thursday night that I realised I had a piggy bank which I had filled with Rs 500 and Rs 1,000 notes my mother gave me. Luckily, I could deposit it on the last date,\" said Neelam Gupta, a beautician, at the bank on BBAU campus.\n  \n  \n  \"My son was out of station and I was waiting for him to get old currency deposited on the last date,\" said Asha Singh, a homemaker, at a government bank in Telibagh.\n  \n  \n  Assistant general manager at SBI's main branch Ashok Kumar said the number of people who visited the bank to deposit old currency notes on Friday were less than those who flocked the bank previously.\n  \n  \n  \"No undertaking is being asked for by bank from verified account holders,\" said Kumar. He added that customers will have to give a reason to RBI in case they deposit old currency notes after December 30.\n  \n  \n  At Bank of Baroda in Indiranagar, there were only three customers who deposited between Rs 2,000 and Rs 4,000 in a span of half an hour from 4pm-4.30pm.\n  \n  \n  \"We hardly had customers depositing Rs 5,000 and above. We didn't seek any explanation from anyone depositing higher amounts also,\" said an official.\n  \n  \n  \"I came late to deposit because I was hospitalised and my husband was with me at the hospital,\" said Ranjana Rani, who had come to deposit her old notes on Friday at a government bank.\n  \n  \n  \"I have only four Rs 500 notes so I was relaxed and thought I would submit them on the last day. I came to deposit them and found no long queues,\" said Pratham Dixit, submitting old notes at a counter of a government bank in Kaiserbagh."
    };

    return new Promise(function(resolve, reject) {
        var articleXML = "<DOC>" +
            "\n<DATETIME>2017-1-1 0:0:0</DATETIME>" +
            "\n<TITLE>" + article.title + "</TITLE>" +
            "\n<TEXT>\n" + article.body + "\n</TEXT>" +
            "\n</DOC>\n";

        var tmpDir = tmp.dirSync();
        var originalPath = path.join(tmpDir.name, 'original');

        fs.mkdirSync(originalPath);
        fs.writeFileSync(path.join(originalPath, 'article.xml'), articleXML);

        var run = spawn(path.join(config.gFlowPath, 'run.sh'), [tmpDir.name, path.join(tmpDir.name, 'summary.txt')]);

        var summary = "";

        run.stdout.on('data', function (data) {
            summary += data.toString();
        });

        run.stderr.on('data', function (data) {
            console.log('stderr:', data.toString());
        });

        run.on('close', function (code) {
            console.log('Summarizer exited with code', code);
            if (code) {
                reject("EXIT_CODE_NOT_ZERO");
            } else {
                article.summary = summary.trim();
                resolve(article);
            }
            tmpDir.removeCallback();
        });
    });
}

module.exports = summarize;
