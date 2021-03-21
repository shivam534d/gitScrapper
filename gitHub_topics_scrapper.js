let fs = require('fs');
let request = require('request');
let cheerio = require('cheerio');
let url = 'https://github.com/topics/';
let topicDir;
request(url, function (error, response, html) {
  if (error) {
    console.log(error);
  } else {
    top3Repos(html);
  }
});

// Top 3 Topics > Top 8 Repos > issues >json - [{name,link}]
// Create Folder
function createDir(topic) {
  let path = 'C:\\Users\\Shiva\\OneDrive\\Desktop';
  let jsonPath = path + '\\Top_3_Repos' + topic + '\\Issues' + '\\json';
  let pdfPath = path + '\\Top_3_Repos' + topic + '\\Issues' + '\\pdf';
  if (!fs.existsSync(jsonPath)) {
    fs.mkdirSync(jsonPath);
    fs.mkdirSync(pdfPath);
  }
}

function top3Repos(html) {
  let selTool = cheerio.load(html);
  let linkArr = selTool(
    '.topic-box a.no-underline.d-flex.flex-column.flex-justify-center'
  );

  let threeRepos = [];
  for (let i = 0; i < linkArr.length; i++) {
    let link = selTool(linkArr[i]).attr('href');
    let fullLink = 'https://github.com' + link;
    topicDir = '\\' + link.slice(8);
    threeRepos.push(fullLink);
    // createDir(topicDir);
  }
  sub8Repos(threeRepos, 0);
}
// Recursive Function
function sub8Repos(fullLinkArr, n) {
  if (n == fullLinkArr.length) {
    return;
  } else {
    request(fullLinkArr[n], function (err, resp, html) {
      if (err) {
        console.log(err);
      } else {
        reposLink(fullLinkArr[n]);
        sub8Repos(fullLinkArr, n + 1);
      }
    });
  }
}

function reposLink(link) {
  request(link, function (error, response, html) {
    if (error) {
      console.log(error);
    } else {
      extractHtml(html);
    }
  });
  function extractHtml(html) {
    let sub8ReposLinkArr = [];
    let sub8ReposIssuesArr = [];
    let selTool = cheerio.load(html);
    let linkArr = selTool(
      '.col-md-8.col-lg-9 .border.rounded.color-shadow-small.color-bg-secondary.my-4'
    );
    for (let i = 0; i <= 7; i++) {
      let h1 = selTool(linkArr[i]).find(
        '.px-3 .f3.color-text-secondary.text-normal.lh-condensed a'
      );
      let url = selTool(h1[1]).attr('href');
      let fullLink = 'https://github.com' + url;
      let issueLink = 'https://github.com' + url + '/issues';
      sub8ReposLinkArr.push(fullLink);
      sub8ReposIssuesArr.push(issueLink);
    }
    // console.log(sub8ReposIssuesArr);
    issuesFn(sub8ReposIssuesArr, 0);
  }
}

// Recursive Function
function issuesFn(sub8ReposIssuesArr, n) {
  if (n == sub8ReposIssuesArr.length) {
    return;
  } else {
    request(sub8ReposIssuesArr[n], function (err, resp, html) {
      if (err) {
        console.log(err);
      } else {
        // console.log(sub8ReposIssuesArr[n]);
        issuesExtract(sub8ReposIssuesArr[n]);
        issuesFn(sub8ReposIssuesArr, n + 1);
      }
    });
  }
}

function issuesExtract(link) {
  request(link, function (error, response, html) {
    if (error) {
      console.log(error);
    } else {
      extractHtml(html);
    }
  });
  function extractHtml(html) {
    let selTool = cheerio.load(html);
    let issueRowArr = selTool(
      '.Box.mt-3.Box--responsive.hx_Box--firstRowRounded0 div.js-issue-row'
    );
    for (let i = 0; i < issueRowArr.length; i++) {
      let issueRowId = selTool(issueRowArr[i]).attr('id');
      let issueID = issueRowId.split('_').pop();
      let issueLink = link + '/' + issueID;
      let issueLinkTagSelector = 'a#' + issueRowId + '_link';
      let issueName = selTool(issueRowArr[i]).find(issueLinkTagSelector).text();

      // Now We Have IssueName and IssueLink
      console.log(`${issueName}
        ---->    ${issueLink}`);
      // Writing Json
      let issuesJson = fs.readFileSync('issues.json');
      let json = JSON.parse(issuesJson);
      json.push({
        issueName: issueName,
        issueLink: issueLink,
      });
      fs.writeFileSync('issues.json', JSON.stringify(json));
    }
  }
}
