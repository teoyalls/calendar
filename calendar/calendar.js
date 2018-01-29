/**
 * 日历时间选择插件说明V1.10（初步测试版）
 * 作者：魏晓鑫
 * 开发时间：2018年1月19日
 * 修改时间：2018年1月29日
 * 插件简介：本插件是提供了四种常见状态下（只选择年月日、只选择年月、选择年月日+时分秒、只选择时分秒四种情况）的日历时间选择插件，该插件开发了一些配置参数和相关的回调函数。
 * 版本说明：修改了一些发现的bug和新增了快速选择时、分、秒的表格模块。
 */
;(function($, window, document){
    $.fn.Calendar = function(options) {
        var opts = $.extend({}, {
            skin: '',           // 日历的皮肤class
            calenWidth: '',     // 日历对象的宽（默认为调用元素的宽度）
            calenHeight: '',    // 日历对象的高（默认为自动）
            defaultTime: '',    // 默认时间传入年月日或者年月日+时分或者是年月日+时分秒
            type: 1,            // 日历类型，默认值为1（1为选择年月日日历类型，2为选择年月日历类型，3为选择年月日时分秒类型，4为只选择时分秒类型）；
            beforeCreatFn: $.noop,      // 日历未创建时的回调函数，可在函数中用return false来阻止创建日历等接下来的操作；
            afterCreatFn: $.noop,       // 日历初始创建挂载时的回调函数。提供1个参数，该日历元素；
            changeTimeFn: $.noop        // 日历选择了时间，并按了确定或者今日按钮的回调函数，提供一个参数，当前选择的时间。
        }, options);

        // 日历对象
        function Kalendar(opts) {
            this.opts = opts;
            this.w = this.opts.calenW;
            this.h = this.opts.calenH;
            this.$wrap = $('<div class="zr-calendar-wrap" style="display: none">');
            this.$mode = $('<div class="zr-calendar-mode">');
            this.$dayMode = $('<div class="zr-calendar-day-mode">');
            this.$yearMode = $('<div class="zr-calendar-year-mode">');
            this.$monthMode = $('<div class="zr-calendar-month-mode">');
            this.$timeMode = $('<div class="zr-calendar-time-mode">');
            this.$footer = $('<div class="zr-calender-footer">');
            this.initTime = {};
            this.nowTime = {};
            this.todayTime = {};
            var dater = new Date(),
                id = 0,
                temp = null;
            
            // 获取某天是星期几
            var getWeek = function(dater) {
                return new Date(dater).getDay();
            }

            /**
             * 这里保存三种时间：
             * todayTime（今天的时间）；
             * initTime（初始时间）；
             * nowTime（当前选择的时间）。
             */
            this.getTodayTime();

            if(this.opts.defaultTime) {
                dater = options.defaultTime.split(' ');
                if(dater.length > 1) {
                    temp = dater[1].split(':');
                    this.initTime.h = parseInt(temp[0] - 0) > 9 ? parseInt(temp[0] - 0) : '0' + parseInt(temp[0] - 0);
                    this.initTime.m = parseInt(temp[1] - 0) > 9 ? parseInt(temp[1] - 0) : '0' + parseInt(temp[1] - 0);
                    if(temp[2]) {
                        this.initTime.s = parseInt(temp[2] - 0) > 9 ? parseInt(temp[2] - 0) : '0' + parseInt(temp[2] - 0);
                    }else {
                        this.initTime.s = '00';
                    }
                }else {
                    this.initTime.h = '00';
                    this.initTime.m = '00';
                    this.initTime.s = '00';
                }
                temp = dater[0].split('/');
                this.initTime.year = temp[0] - 0;
                this.initTime.month = temp[1] - 1;
                this.initTime.day = temp[2] - 0;
                this.initTime.week = getWeek(this.opts.defaultTime);
            }else {
                this.initTime = JSON.parse(JSON.stringify(this.todayTime));
            }

            this.nowTime = JSON.parse(JSON.stringify(this.initTime));

            // 组合渲染日历公共框架结构
            this.$mode.append(this.$dayMode).append(this.$yearMode).append(this.$monthMode).append(this.$timeMode);
            this.$footer.html('<button class="confirm-btn">确定</button><button class="today-btn">今天</button><button class="cancel-btn">取消</button>');
            this.$wrap.append(this.$mode).append(this.$footer);
            id = $('body').find('.zr-calendar-wrap[data-key="zr-calend"]').length + 1000;
            this.$wrap.attr('data-key', 'zr-calend').attr('data-id', id);
            $('body').append(this.$wrap.css({
                top: this.opts.topW + this.opts.h,
                left: this.opts.leftW,
                width: this.w,
                height: this.h,
                zIndex: id
            }));
        }

        // 获得今天此刻的日期时间
        Kalendar.prototype.getTodayTime = function() {
            var _this = this,
                dater = new Date();
            _this.todayTime.year = dater.getFullYear();
            _this.todayTime.month = dater.getMonth();
            _this.todayTime.day = dater.getDate();
            _this.todayTime.week = dater.getDay();
            _this.todayTime.h = dater.getHours() > 9 ? dater.getHours() : '0' + dater.getHours();
            _this.todayTime.m = dater.getMinutes() > 9 ? dater.getMinutes() : '0' + dater.getMinutes();
            _this.todayTime.s = dater.getSeconds() > 9 ? dater.getSeconds() : '0' + dater.getSeconds();
        }

        // 创建日期日历
        Kalendar.prototype.creatDayTable = function () {
            var _this = this,
                $header = $('<div class="zr-calendar-header">'),
                $cont = $('<div class="zr-calendar-cont">'),
                $table = $('<table class="zr-calendar-table">');
            function getFirstDayWeek(time) {
                return new Date(time).getDay();
            }

            function isLeapYear(year) {
                return ( year % 4 == 0 ) && ( year % 100 != 0 || year % 400 == 0 ) ? 29 : 28;
            }

            function drawContTable() {
                var tr = '',
                    td = '',
                    weekCn = ['日', '一', '二', '三', '四', '五', '六'],
                    dayNum = [31, isLeapYear(_this.nowTime.year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
                    now = 0,
                    firstDayWeek = getFirstDayWeek(_this.nowTime.year + '/' + (_this.nowTime.month + 1) + '/' + '1');

                for(var k = 0; k < 7; k++) {
                    td += '<td>' + weekCn[k] + '</td>';
                }
    
                tr += '<tr>' + td + '</tr>';
    
                for(var i = 0; i < 6; i++) {
                    td = '';
                    for(var j = 0; j < 7; j++) {
                        now = i * 7 + j + 1 - firstDayWeek;
                        if( now <= 0 ) {
                            if(_this.nowTime.month == 0) {
                                td += '<td class="empty"><span class="txt">' + ( 31 + now ) + '</span></td>';
                            }else {
                                td += '<td class="empty"><span class="txt">' + ( dayNum[_this.nowTime.month-1] + now ) + '</span></td>';
                            }
                        }else if( now > dayNum[_this.nowTime.month] ) {
                            td += '<td class="empty"><span class="txt">' + ( now - dayNum[_this.nowTime.month] ) + '</span></td>';
                        }else if( now == _this.nowTime.day ) {
                            td += '<td class="dayer cur"><span class="txt">' + now + '</span></td>';
                        }else {
                            td += '<td class="dayer"><span class="txt">' + now + '</span></td>';
                        }
                    }
                    tr += '<tr>'+ td +'</tr>';
                }
                $table.html(tr);
            }

            function drawHeader() {
                var $yearPrevBtn = $('<button class="year-prev-btn">'),
                    $yearNextBtn = $('<button class="year-next-btn">'),
                    $monthPrevBtn = $('<button class="month-prev-btn">'),
                    $monthNextBtn = $('<button class="month-next-btn">'),
                    $headerCont = $('<div class="header-cont">');
                $headerCont.html('<span class="year-text">' + _this.nowTime.year + '年</span>' + '<span class="month-text">' + ( _this.nowTime.month - 0 + 1 ) + '月<span>');
                $header.html('').append($yearPrevBtn).append($monthPrevBtn).append($headerCont).append($monthNextBtn).append($yearNextBtn).show();
            }
            drawHeader();
            drawContTable();
            _this.$yearMode.html('');
            _this.$monthMode.html('');
            _this.$dayMode.html('').append($header).append($cont.append($table));
        }

        // 创建月份日历
        Kalendar.prototype.creatMonthTable = function () {
            var _this = this,
                $yearHeader = $('<div class="year-header">'),
                $wrap = $('<ul class="month-mode-list">'),
                headHtml = '<button class="year-prev"></button><p class="t">' + _this.nowTime.year + '年</p><button class="year-next"></button>';
                li = '';
            for(var i = 0; i < 12; i++) {
                if( i == _this.nowTime.month ) {
                    li += '<li class="cur"><span>' + ( i + 1 ) + '月</span></li>';
                }else {
                    li += '<li><span>' + ( i + 1 ) + '月</span></li>';
                }
            }
            $wrap.html(li);
            $yearHeader.html(headHtml);
            _this.$yearMode.html('');
            _this.$dayMode.html('');
            // _this.$timeMode.html('');
            _this.$monthMode.html('').append($yearHeader).append($wrap);
        }

        // 创建年份日历
        Kalendar.prototype.creatYearTable = function(year) {
            var _this = this;
            var year = parseInt(year),
                $yearHeader = $('<div class="year-header">'),
                $wrap = $('<ul class="year-mode-list">'),
                headHtml = '<button class="year-prev"></button><p class="t">' + ( year - 10 ) + '年~' + ( year + 9 ) + '年</p><button class="year-next"></button>',
                li = '';
            
            for(var i = 0; i < 20; i++) {
                if(( year - 10 + i ) == _this.nowTime.year) {
                    li += '<li class="cur"><span>' + ( year - 10 + i ) + '</span></li>';
                }else {
                    li += '<li><span>' + ( year - 10 + i ) + '</span></li>';
                }
            }
            $wrap.html(li);
            $yearHeader.html(headHtml);
            _this.$dayMode.html('');
            _this.$monthMode.html('');
            // _this.$timeMode.html('');
            _this.$yearMode.html('').append($yearHeader).append($wrap);
        }

        // 创建时间日历
        Kalendar.prototype.creatTimeTable = function() {
            var _this = this,
                $mode = $('<div class="zr-calendar-date-info">'),
                $wrap = $('<div class="zr-calendar-time-wrap">'),
                h = _this.nowTime.h,
                m = _this.nowTime.m,
                s = _this.nowTime.s,
                ohtml = '<div class="time-list hour-wrap">'
                        + '<button class="hour-next">&nbsp;</button>'
                        + '<p class="hour-t">' + h + '</p>'
                        + '<button class="hour-prev">&nbsp;</button>'
                    + '</div>'
                    +'<div class="time-list minute-wrap">'
                        + '<button class="minute-next">&nbsp;</button>'
                        + '<p class="minute-t">' + m + '</p>'
                        + '<button class="minute-prev">&nbsp;</button>'
                    + '</div>'
                    +'<div class="time-list sec-wrap">'
                        + '<button class="sec-next">&nbsp;</button>'
                        + '<p class="sec-t">' + s + '</p>'
                        + '<button class="sec-prev">&nbsp;</button>'
                    + '</div>',
                infoHtml = '<p class="c-day-info">'
                        + '<span class="t t-d">' + _this.nowTime.day + '</span>'
                        + '<span class="n">日</span>'
                    + '</p>'
                    + '<p class="c-year-info">'
                        + '<span class="t t-y">' + _this.nowTime.year + '</span>'
                        + '<span class="n">年</span>'
                        + '<span class="t t-m">' + ( _this.nowTime.month + 1 ) + '</span>'
                        + '<span class="n">月</span>'
                    + '</p>';
            $mode.html(infoHtml);
            $wrap.html(ohtml);
            _this.$timeMode.html('').append($mode).append($wrap);
        }

        // 创建时/分/秒数进行快速选择
        Kalendar.prototype.creatTimeNumTable = function(type) {
            var _this = this,
                n = 0,
                m = 0,
                tr = '',
                td = '',
                $wrap = $('<div class="zr-calendar-time-num">'),
                $head = $('<div class="zr-calendar-num-txt">'),
                $table = $('<table class="time-num-table">');

            switch (type)
            {
            case 0:
                n = 24;
                m = parseInt(_this.nowTime.h);
                $head.text('选择小时');
                $table.addClass('time-num-houer');
                break;
            case 1:
                n = 60;
                m = parseInt(_this.nowTime.m);
                $head.text('选择分钟');
                $table.addClass('time-num-minute');
                break;
            default:
                n = 60;
                m = parseInt(_this.nowTime.s);
                $head.text('选择秒数');
                $table.addClass('time-num-sec');
            }

            for(var j = 0; j < Math.ceil(n / 8); j++) {
                tr = '<tr>';
                td = '';
                for(var i = 0; i < 8; i++) {
                    num = j * 8 + i;
                    num = num > 9 ? num : '0' + num;
                    if( num == m ) {
                        td += '<td class="cur"><span> ' + num + ' </span></td>';
                    }else if (type != 0 && num >= 60) {
                        td += '<td></td>';
                    }else {
                        td += '<td><span> ' + num + ' </span></td>';
                    }
                }
                tr += td + '</tr>';
                $table.append($(tr));
            }
            $wrap.append($head).append($table);
            _this.$timeMode.html('').append($wrap);
        }

        // 根据日历类型初始化创建
        Kalendar.prototype.toInit = function(type) {
            var _this = this,
                tempDate = {};
            tempDate.y = _this.nowTime.year;
            tempDate.m = _this.nowTime.month;
            tempDate.d = _this.nowTime.day;

            // 日期日历默认选择操作
            function dayModeBtnHandle() {
                var $temp = null;
                // 上一年
                _this.$dayMode.off('click.a').on('click.a', '.year-prev-btn', function(){
                    _this.nowTime.year--;
                    _this.creatDayTable();
                    $temp = null;
                    listenToDate();
                });

                // 下一年
                _this.$dayMode.off('click.b').on('click.b', '.year-next-btn', function(){
                    _this.nowTime.year++;
                    _this.creatDayTable();
                    $temp = null;
                    listenToDate();
                });

                // 上个月
                _this.$dayMode.off('click.c').on('click.c', '.month-prev-btn', function(){
                    _this.nowTime.month--;
                    if(_this.nowTime.month < 0) {
                        _this.nowTime.month = 11;
                        _this.nowTime.year--;
                    }
                    _this.creatDayTable();
                    $temp = null;
                    listenToDate();
                });

                // 下个月
                _this.$dayMode.off('click.d').on('click.d', '.month-next-btn', function(){
                    _this.nowTime.month++;
                    if(_this.nowTime.month > 11) {
                        _this.nowTime.month = 0;
                        _this.nowTime.year++;
                    }
                    _this.creatDayTable();
                    $temp = null;
                    listenToDate();
                });

                // 选择年份
                _this.$dayMode.off('click.e').on('click.e', '.header-cont .year-text', function(){
                    _this.creatYearTable(_this.nowTime.year);
                    $temp = null;
                });

                // 选择月份
                _this.$dayMode.off('click.f').on('click.f', '.header-cont .month-text', function(){
                    _this.creatMonthTable();
                    $temp = null;
                });

                // 选择某一天
                _this.$dayMode.off('click.g').on('click.g', '.zr-calendar-table .dayer .txt', function(){
                    var $td = $(this).parent();
                    if(!$temp) $temp =  _this.$dayMode.find('.zr-calendar-table .dayer.cur');
                    $temp.removeClass('cur');
                    $temp = $td;
                    $temp.addClass('cur');
                    _this.nowTime.day = $temp.text();
                    listenToDate();
                });
                // 选中某个月
                _this.$monthMode.off('click.h').on('click.h', '.month-mode-list>li>span', function(){
                    _this.creatDayTable();
                    $temp = null;
                    listenToDate();
                });
            }

            // 年份模块默认选择操作
            function yearModeBtnHandle(year) {
                //上一批次年份
                _this.$yearMode.off('click.i').on('click.i', '.year-header .year-prev', function(){
                    year = year - 20;
                    _this.creatYearTable(year);
                });
                //下一批次年份
                _this.$yearMode.off('click.j').on('click.j', '.year-header .year-next', function(){
                    year = year - 0 + 20;
                    _this.creatYearTable(year);
                });
                // 选择具体年份
                _this.$yearMode.off('click.k').on('click.k', '.year-mode-list>li>span', function(){
                    year = $(this).text();
                    _this.nowTime.year = year;
                    _this.creatMonthTable();
                    listenToDate();
                });
            }

            // 月份模块默认选择操作
            function monthModeBtnHandle() {
                var $t = null;
                var $temp = null;
                // 上一年
                _this.$monthMode.off('click.l').on('click.l', '.year-header .year-prev', function(){
                    _this.nowTime.year--;
                    $t = _this.$monthMode.find('.year-header .t');
                    $t.text(_this.nowTime.year + '年');
                    listenToDate();
                });
                // 下一年
                _this.$monthMode.off('click.m').on('click.m', '.year-header .year-next', function(){
                    _this.nowTime.year++;
                    $t = _this.$monthMode.find('.year-header .t');
                    $t.text(_this.nowTime.year + '年');
                    listenToDate();
                });
                // 选择年份段落
                _this.$monthMode.off('click.n').on('click.n', '.year-header .t', function(){
                    _this.creatYearTable(_this.nowTime.year);
                    $temp = null;
                });
                // 选中某个月
                _this.$monthMode.off('click.o').on('click.o', '.month-mode-list>li>span', function(){
                    var $li = $(this).parent();
                    if(!$temp) $temp = _this.$monthMode.find('.month-mode-list li.cur');
                    $temp.removeClass('cur');
                    $temp = $li;
                    $temp.addClass('cur');
                    _this.nowTime.month = parseInt($temp.text()) - 1;
                });
            }

            // 时间模块默认选择操作
            function timeModeBtnHandle() {
                var $h = _this.$timeMode.find('.hour-wrap .hour-t'),
                    $m = _this.$timeMode.find('.minute-wrap .minute-t'),
                    $s = _this.$timeMode.find('.sec-wrap .sec-t');
                _this.$timeMode.off('click.p').on('click.p', '.hour-wrap .hour-prev', function(){
                    _this.nowTime.h--;
                    if( _this.nowTime.h < 0) {
                        _this.nowTime.h = 23;
                    }
                    _this.nowTime.h = _this.nowTime.h > 9 ? _this.nowTime.h : '0' + _this.nowTime.h;
                    $h.text(_this.nowTime.h);
                });
                _this.$timeMode.off('click.q').on('click.q', '.hour-wrap .hour-next', function(){
                    _this.nowTime.h =  _this.nowTime.h - 0 + 1;
                    if( _this.nowTime.h > 23) {
                        _this.nowTime.h = 0;
                    }
                    _this.nowTime.h = _this.nowTime.h > 9 ? _this.nowTime.h : '0' + _this.nowTime.h;
                    $h.text(_this.nowTime.h);
                });
                _this.$timeMode.off('click.r').on('click.r', '.minute-wrap .minute-prev', function(){
                    _this.nowTime.m--;
                    if( _this.nowTime.m < 0) {
                        _this.nowTime.m = 59;
                    }
                    _this.nowTime.m = _this.nowTime.m > 9 ? _this.nowTime.m : '0' + _this.nowTime.m;
                    $m.text(_this.nowTime.m);
                });
                _this.$timeMode.off('click.s').on('click.s', '.minute-wrap .minute-next', function(){
                    _this.nowTime.m =  _this.nowTime.m - 0 + 1;
                    if( _this.nowTime.m > 59) {
                        _this.nowTime.m = 0;
                    }
                    _this.nowTime.m = _this.nowTime.m > 9 ? _this.nowTime.m : '0' + _this.nowTime.m;
                    $m.text(_this.nowTime.m);
                });
                _this.$timeMode.off('click.t').on('click.t', '.sec-wrap .sec-prev', function(){
                    _this.nowTime.s--;
                    if( _this.nowTime.s < 0) {
                        _this.nowTime.s = 59;
                    }
                    _this.nowTime.s = _this.nowTime.s > 9 ? _this.nowTime.s : '0' + _this.nowTime.s;
                    $s.text(_this.nowTime.s);
                });
                _this.$timeMode.off('click.u').on('click.u', '.sec-wrap .sec-next', function(){
                    _this.nowTime.s =  _this.nowTime.s - 0 + 1;
                    if( _this.nowTime.s > 59) {
                        _this.nowTime.s = 0;
                    }
                    _this.nowTime.s = _this.nowTime.s > 9 ? _this.nowTime.s : '0' + _this.nowTime.s;
                    $s.text(_this.nowTime.s);
                });
                // 创建快捷选择小时数
                _this.$timeMode.off('click.v').on('click.v', '.zr-calendar-time-wrap .hour-t', function(){
                    _this.creatTimeNumTable(0);
                });
                // 创建快捷选择分钟数
                _this.$timeMode.off('click.w').on('click.w', '.zr-calendar-time-wrap .minute-t', function(){
                    _this.creatTimeNumTable(1);
                });
                // 创建快捷选择秒数
                _this.$timeMode.off('click.x').on('click.x', '.zr-calendar-time-wrap .sec-t', function(){
                    _this.creatTimeNumTable(2);
                });
                // 快速选择小时数
                _this.$timeMode.off('click.y').on('click.y', '.zr-calendar-time-num .time-num-houer td', function(){
                    _this.nowTime.h = $(this).text();
                    _this.creatTimeTable();
                    timeModeBtnHandle();
                });
                // 快速选择分钟数
                _this.$timeMode.off('click.z').on('click.z', '.zr-calendar-time-num .time-num-minute td', function(){
                    _this.nowTime.m = $(this).text();
                    _this.creatTimeTable();
                    timeModeBtnHandle();
                });
                // 快速选择秒数
                _this.$timeMode.off('click.aa').on('click.aa', '.zr-calendar-time-num .time-num-sec td', function(){
                    _this.nowTime.s = $(this).text();
                    _this.creatTimeTable();
                    timeModeBtnHandle();
                });
            }

            // 监听时间日历变化，更改时间信息
            function listenToDate() {
                if(type === 3) {
                    if(_this.nowTime.year != tempDate.y) {
                        _this.$timeMode.find('.c-year-info .t-y').text(_this.nowTime.year);
                        tempDate.y = _this.nowTime.year;
                    }
                    if(_this.nowTime.month != tempDate.m) {
                        _this.$timeMode.find('.c-year-info .t-m').text(_this.nowTime.month - 0 + 1);
                        tempDate.m = _this.nowTime.month;
                    }
                    if(_this.nowTime.day != tempDate.d) {
                        _this.$timeMode.find('.c-day-info .t-d').text(_this.nowTime.day);
                        tempDate.d = _this.nowTime.day;
                    }
                }
            }

            _this.getTodayTime();

            switch(type)
            {
            case 1:
                _this.creatDayTable(); 
                yearModeBtnHandle(_this.nowTime.year);
                monthModeBtnHandle();
                dayModeBtnHandle();
                break;
            case 2:
                _this.creatMonthTable();
                yearModeBtnHandle(_this.nowTime.year);
                monthModeBtnHandle();
                break;
            case 3:
                _this.creatDayTable();
                _this.creatTimeTable(); 
                yearModeBtnHandle(_this.nowTime.year);
                monthModeBtnHandle();
                dayModeBtnHandle();
                timeModeBtnHandle();
                break;
            default:
                _this.$timeMode.addClass('only-time-wrap');
                _this.creatTimeTable();
                timeModeBtnHandle();
            }
            _this.$wrap.show();
            _this.h = _this.$wrap.outerHeight();
        }

        // 更新日历插件的位置
        Kalendar.prototype.seat = function(obj) {
            
            var $obj = $(obj),
                _this = this,
                objW = _this.opts.w,
                objH = _this.opts.h,
                w = 0,
                h = 0,
                l = 0,
                t = 0,
                dw = 0,
                dh = 0,
                timePosition = 0;
            w = _this.w;
            h = _this.h;
            objW = $obj.outerWidth();
            objH = $obj.outerHeight();
            l = $obj.offset().left - $(document).scrollLeft();
            t = $obj.offset().top - $(document).scrollTop();
            dw = $(window).width() - l;
            dh = $(window).height() - t - _this.opts.h;
            timePosition = dw - l;
                
            if( l != _this.opts.leftW ) {
                _this.$wrap.css({
                    left: l
                });
                _this.opts.leftW = l;
            }
            if( t != _this.opts.topW) {
                if( dh < h ) {
                    _this.$wrap.css({
                        top: 'auto',
                        bottom: t
                    });
                }else {
                    _this.$wrap.css({
                        bottom: 'auto',
                        top: t + objH
                    });
                }
                _this.opts.topW = t;
            }
            if( dh < h ) {
                _this.$wrap.css({
                    top: 'auto',
                    bottom: dh + objH
                });
            }else {
                _this.$wrap.css({
                    bottom: 'auto',
                    top: t + objH
                });
            }

            if( timePosition < 205 ) {
                _this.$timeMode.css({
                    left: 'auto',
                    right: '100%'
                });
            }
        }

        //输出时间
        Kalendar.prototype.getCalenTime = function(type) {
            var _this = this,
                time = null;

            function getTimeFormat(t) {
                return t = parseInt(t) > 9 ? parseInt(t) : '0' + parseInt(t);
            }

            _this.nowTime.year = getTimeFormat(_this.nowTime.year);
            _this.nowTime.day = getTimeFormat(_this.nowTime.day);
            _this.nowTime.h = getTimeFormat(_this.nowTime.h);
            _this.nowTime.m = getTimeFormat(_this.nowTime.m);
            _this.nowTime.s = getTimeFormat(_this.nowTime.s);

            switch(type)
            {
            case 1:
                
                time = _this.nowTime.year + '/' + ( getTimeFormat( _this.nowTime.month + 1 ) ) + '/' + _this.nowTime.day;
                break;
            case 2:
                time = _this.nowTime.year + '/' + ( getTimeFormat( _this.nowTime.month + 1 ) );
                break;
            case 3:
                time = _this.nowTime.year + '/' + ( getTimeFormat( _this.nowTime.month + 1 ) ) + '/' + _this.nowTime.day + ' ' + _this.nowTime.h + ':' + _this.nowTime.m + ':' + _this.nowTime.s;
                break;
            default:
                time =  _this.nowTime.h + ':' + _this.nowTime.m + ':' + _this.nowTime.s;
            }
            return time;
        }

        // 确定选择日期的操作
        Kalendar.prototype.confirmBtnHandle = function(type, callBack) {
            var _this = this,
                time = null;
            _this.$footer.on('click', '.confirm-btn', function(){
                time = _this.getCalenTime(type);
                callBack && callBack(time);
                _this.$wrap.hide();
                _this.initTime = JSON.parse(JSON.stringify(_this.nowTime));
            });
        }

        // 选择今日操作
        Kalendar.prototype.todayBtnHandle = function(type, callBack){
            var _this = this,
                time = null;
            _this.$footer.on('click', '.today-btn', function(){
                _this.nowTime = JSON.parse(JSON.stringify(_this.todayTime));
                time = _this.getCalenTime(type);
                callBack && callBack(time);
                _this.$wrap.hide();
            });   
        }

        // 取消操作
        Kalendar.prototype.cancelBtnHandle = function(type, callBack) {
            var _this = this,
            time = null;
            _this.$footer.on('click', '.cancel-btn', function(){
                _this.nowTime = JSON.parse(JSON.stringify(_this.initTime));
                time = _this.getCalenTime(type);
                callBack && callBack(time);
                _this.$wrap.hide();
            });
        }

        return this.each(function(){
            var $this = $(this),
                base = {},
                kalend = null,
                creat = false;

            base.defaultTime = opts.defaultTime;
            base.leftW = $this.offset().left - $(document).scrollLeft();
            base.topW = $this.offset().top - $(document).scrollTop();
            base.w = $this.outerWidth();
            base.h = $this.outerHeight();
            base.calenW = opts.calenWidth ? parseFloat(opts.calenWidth) : $this.outerWidth();
            base.calenH = opts.calenHeight ? parseFloat(opts.calenHeight) : 'auto';

            opts.beforeCreatFn && ( walk = opts.beforeCreatFn());

            walk = ( walk === undefined ) ? true : walk;

            if(walk) {

                kalend = new Kalendar(base);
                
                opts.skin && kalend.$wrap.append(opts.skin);

                opts.afterCreatFn && opts.afterCreatFn(kalend.$wrap);

                $this.on('click', function(){

                    if(creat) {
                        
                        kalend.$wrap.hide();

                        creat = false;

                    }else {

                        kalend.toInit(opts.type);

                        kalend.seat($this);
                        
                        creat = true;

                    }  

                });

                kalend.confirmBtnHandle(opts.type, function(time){
                    opts.changeTimeFn && opts.changeTimeFn(time);
                    creat = false;
                });

                kalend.todayBtnHandle(opts.type, function(time){
                    opts.changeTimeFn && opts.changeTimeFn(time);
                    creat = false;
                });

                kalend.cancelBtnHandle(opts.type, function(time){
                    creat = false;
                });

                // 更改滚动
                $(window).on('resize', function(){
                    if(creat) {
                        kalend.seat($this);
                    }
                });

                $(window).on('scroll', function() {
                    if(creat) {
                        kalend.seat($this);
                    }
                });
                
            } else {
                return false;
            }
        });
    }
}(jQuery, window, document));