$(function(){
    var $module = $('.module');
    var iGetInnerText = function (testStr) {
        var resultStr = testStr;
        // var resultStr = testStr.replace(/\ +/, ""); //去掉空格
        resultStr = testStr.replace(/[ ]/, "");    //去掉空格
        // resultStr = testStr.replace(/[\r\n]/g, ""); //去掉回车换行
        // console.log(resultStr);
        return resultStr;
    }

    $module.each(function(){
        var $this = $(this);
        var html = $this.find('.module-view').html();
        var $pre = $('<pre class="module-code"></pre>');
        var $codeShow = $('<div class="module-show">');
        var $codeWrap = $('<div class="code-wrap">');
        var $btn = $('<button class="module-show-code">');
        var $p = $('<p>结构代码</p>');
        html = iGetInnerText(html).replace(/\</g,"&lt;");
        $pre.html(html);
        $codeShow.append($p).append($btn);
        $codeWrap.append($pre);
        $this.append($codeShow).append($codeWrap);
        $pre.snippet("html", { 
            style: 'darkblue',
            collapse: false,
            menu: false,
            startCollapsed: false,
        });
    });
});