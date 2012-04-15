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

    var r = Raphael("holder", 600, 600),
    R = 200,
    init = true,
    param = {stroke: "#fff", "stroke-width": 30},
    hash = document.location.hash,
    marksAttr = {fill: hash || "#444", stroke: "none"}

    // Custom Attribute
    r.customAttributes.arc = function (value, total, R) {
        console.log("aa");
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

    var sec = r.path().attr(param).attr({arc: [0, 60, R]});
    R -= 40;

    function updateVal(value, total, R, hand, id) {
        var color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)");
        if (init) {
            hand.animate({arc: [value, total, R]}, 900, ">");
        } else {
            if (!value || value == total) {
                value = total;
                hand.animate({arc: [value, total, R]}, 750, "bounce", function () {
                    hand.attr({arc: [0, total, R]});
                });
            } else {
                hand.animate({arc: [value, total, R]}, 750, "elastic");
            }
        }
    }

    (function () {
        updateVal(26, 60, 200, sec, 2);
        setTimeout(arguments.callee, 1000);
        init = false;
    })();
});