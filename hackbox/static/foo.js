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

    var paper = Raphael("holder", 600, 600),
    param = {stroke: "#fff", "stroke-width": 30};

    // Custom Attribute
    paper.customAttributes.arc = function (value, total, R) {
        var alpha = 360 / total * value,
        a = (90 - alpha) * Math.PI / 180,
        x = 300 + R * Math.cos(a),
        y = 300 - R * Math.sin(a),
        color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)"),
        path;
        if (total == value) {
            path = [["M", 300, 300 - R], ["A", R, R, 0, 1, 1, 299.99, 300 - R]];
        } else {
            path = [["M", 300, 300 - R], ["A", R, R, 0, +(alpha > 180), 1, x, y]];
        }
        return {path: path, stroke: color};
    };

    var sec = paper.path().attr(param).attr({arc: [0, 60, 200]});

    (function () {
        sec.animate({arc: [26, 60, 200]}, 900, ">");
    })();
});