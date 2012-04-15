$(document).ready(function() {
    currentPosition = 0;
    $("#sidebar").mousemove(function(e) {
        var h = $(this).height();
        var bottom = $("#height").height();

        var offset = $(this).offset();
        var position = (e.pageY - offset.top) / h;

        if (position < 0.03) {
            currentPosition -= 10;
            currentPosition = currentPosition < 0 ? 0 : currentPosition;

            $(this).stop().animate({ scrollTop: currentPosition }, 500, "linear");

        }

        if (position > 0.97) {
            currentPosition += 10;
            currentPosition = currentPosition > bottom ? bottom : currentPosition;
            $(this).stop().animate({ scrollTop: currentPosition }, 500, "linear");

        }
    });

    $("#sidebar").mouseleave(function(e) {
        $(this).stop();
    });

    var paper = Raphael("holder", 600, 600);

    paper.customAttributes.arc = function (value, total, radius, R, G, B) {
        var alpha = value / total * 360;
        var a = (90 - alpha) * Math.PI / 180;
        var x = 300 + radius * Math.cos(a);
        var y = 300 - radius * Math.sin(a);
        var path = [["M", 300, 300 - radius], ["A", radius, radius, 0, +(alpha > 180), 1, x, y]];

        return {path: path, stroke: "rgb(".concat(R, ',', G, ',', B, ')')};
    };

    var makePrettyCircle = function(x, y, width, radius) {
        var param = {"stroke-width": width};
        var circle = paper.path().attr(param).attr({arc: [0, 100, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]});;
        return {draw: function(start, percent) {
            circle.animate({arc: [99.99999, 100, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255 ]}, 500, ">");
        }};
    }

    var prettyCircle = makePrettyCircle(300, 300, 42, 80);
    prettyCircle.draw(0, 50);
});