// 虽然做完了挑战难度，但是却是用了很笨的方法。这样帖子的顺序被打乱了。
// 把它加入了待办，以后技术精进了再修改
var eventproxy = require('eventproxy');
var superagent = require('superagent');
var cheerio = require('cheerio');
// url 模块是 Node.js 标准库里面的
// http://nodejs.org/api/url.html
var url = require('url');

var cnodeUrl = 'https://cnodejs.org/';

superagent.get(cnodeUrl)
  .end(function (err, res) {
    if (err) {
      return console.error(err);
    }
    var topicUrls = [];
    var $ = cheerio.load(res.text);
    // 获取首页所有的链接
    $('#topic_list .topic_title').each(function (idx, element) {
      var $element = $(element);
      // $element.attr('href') 本来的样子是 /topic/542acd7d5d28233425538b04
      // 我们用 url.resolve 来自动推断出完整的 url , 变成
      // http://codejs.org/topic/542acd7d5d28233425538b04 的形式
      // 具体请看 http://nodejs.org/api/url.html$url_url_resolve_from_to 的示例
      var href = url.resolve(cnodeUrl, $element.attr('href'));
      topicUrls.push(href);
    });

    // 得到 topicUrls 之后

    // 得到一个 eventproxy 的实例
    var ep = new eventproxy();

    // 命令 ep 重复监听 topicUrls.length 次(在这里也就是40次) `topic_html` 事件再行动
    ep.after('topic_html', topicUrls.length, function (topics) {
      // topics 是个数组，包含了 40 次 eq.emit('topic_html', pair) 中的那 40 个 pair

      // 开始行动
      topics.map(function (topicPair) {
        // 接下来都是 jquery 的用法
        var topicUrl = topicPair[0];
        var topicHtml = topicPair[1];
        var $ = cheerio.load(topicHtml);

        var title = $('.topic_full_title').text().trim();
        var comment1 = $('.reply_content').eq(0).text().trim();
        var author1 = $('.reply_author').eq(0).text().trim();

        // 如果有人回复，我们需要它的 score
        var userScore;
        if ($('.reply_author').eq(0).attr('href') != undefined) {
          // 获取reply用户的主页链接 userHomeUrl
          var userHomeUrl = url.resolve(cnodeUrl, $('.reply_author').eq(0).attr('href'));

          // 拿取 userHomeUrl 的 Html
          superagent.get(userHomeUrl)
            .end(function (err, res){
              // if (err) {
              //   return console.error(err);
              // }
              var $ = cheerio.load(res.text);
              userScore = $('.unstyled').children('.big').text().trim();

              topics = {
                title: title,
                href: topicUrl,
                comment1: comment1,
                author1: author1,
                score1: userScore,
              };
              console.log(topics);
            });
        } else {

          topics = {
            title: title,
            href: topicUrl,
            comment1: comment1,
            author1: author1,
            score1: userScore,
          };
          console.log(topics);
        }
      });
    });

    topicUrls.forEach(function (topicUrl) {
      superagent.get(topicUrl)
        .end(function (err, res) {
          // console.log('fetch ' + topicUrl + ' successful');
          ep.emit('topic_html', [topicUrl, res.text]);
        });
    });
  });
