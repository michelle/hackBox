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


    var makePrettyCircle = function(x, y, width, radius) {
        var param = {"stroke-width": width};

        paper.customAttributes.arc = function (start, end, total, radius, R, G, B) {
            var startAngle = start / total * 2 * Math.PI;
            var endAngle = end / total * 2 * Math.PI;
            var path = [["M", x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle)],
                        ["A", radius, radius, 0, +((end - start) / total > 0.5), 1, x + radius * Math.cos(endAngle), y + radius * Math.sin(endAngle)]];
            return {path: path, stroke: "rgb(".concat(R, ',', G, ',', B, ')')};
        };

        return {draw: function(start, end) {
            var circle = paper.path().attr(param).attr({arc: [start, end, 100, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]});;
            circle.show();
        }, animate: function(start, end, duration) {
            var circle = paper.path().attr(param).attr({arc: [start, end, 100, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]});;
            circle.animate({arc: [start, end, 100, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255 ]}, 5000, ">");
        }};
    }

    var prettyCircle1 = makePrettyCircle(300, 300, 42, 80);
    prettyCircle1.draw(15, 30);
    prettyCircle1.draw(30, 60);
    prettyCircle1.draw(60, 90);
    prettyCircle1.draw(90, 15);

});