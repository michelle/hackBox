$(document).ready(function() {

    currentPosition = 0;
    $("#sidebar").mousemove(function(e) {
        var h = $(this).height();
        var bottom = $("#height").height();

        var offset = $(this).offset();
        var position = (e.pageY - offset.top) / h;

        if (position < 0.03) {
            currentPosition -= 20;
            currentPosition = currentPosition < 0 ? 0 : currentPosition;

            $(this).stop().animate({ scrollTop: currentPosition }, 500, "linear");

        }

        if (position > 0.97) {
            currentPosition += 20;
            currentPosition = currentPosition > bottom ? bottom : currentPosition;
            $(this).stop().animate({ scrollTop: currentPosition }, 500, "linear");

        }
    });


    $("#sidebar").mouseleave(function(e) {
        $(this).stop();
    });


    var paper = Raphael("holder", $(window).width(), $(window).height());

    var makeFolderArc = function(x, y, width, radius, data) {
        var param = {"stroke-width": width};

        paper.customAttributes.arc = function (start, end, radius, R, G, B) {
            var startAngle = start * 2 * Math.PI;
            var endAngle = end * 2 * Math.PI;
            var path = [["M", x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle)],
                        ["A", radius, radius, 0, +((end - start) > 0.5), 1, x + radius * Math.cos(endAngle), y + radius * Math.sin(endAngle)]];
            return {path: path, stroke: "rgb(".concat(R, ',', G, ',', B, ')')};
        };

        return {draw: function(start, end) {
            var circle = paper.path()
                .attr(param)
                .attr("title", data.path.split('/').pop())
                .attr({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data)
                .click(function() {
                    drawPrettyCircle(x, y, data);
                });
            circle.show();
        }, animate: function(start, end, duration) {
            var circle = paper.path()
                .attr(param)
                .attr("title", data.path.split('/').pop())
                .attr({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data)
                .click(function() {
                    drawPrettyCircle(x, y, data);
                });
            circle.animate({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255 ]}, 1000, "backOut");

        }};
    }

    var drawPrettyCircle = function(x, y, data) {
        paper.clear();
        drawPrettyLayer(x, y, data, 0, 1, 0);
        var folderName = paper.text(3*$(window).width()/5, $(window).height()/2, currentFolderStr);
        folderName.attr({"font": "Open Sans", "font-size": "12px", "font-weight": "700"});

        folderName.show();
        updateDetails(data);
    }

    var drawPrettyLayer = function(x, y, data, parentStart, parentEnd, depth) {
        console.log(depth);

        if (depth == 3) {
            return;
        }

        var start = parentStart;

        for (var i in data.children) {
            if (data.children[i].is_dir) {
                var folderArc = makeFolderArc(x, y, 42, 80 + depth * 40, data.children[i]);
                var end = start + data.children[i].bytes / data.bytes * (parentEnd - parentStart);
                if (depth == 0 || end - start > 0.01) {
                    folderArc.draw(start, end);
                    drawPrettyLayer(x, y, data.children[i], start, end, depth + 1);
                    start = end;
                }
            }
        }
        
    }

    $.get('/get_folder_data', function(data) {
        console.log(data);

        for (var i in data.children) {
            display(data.children[i], $("#tree"));
        }

        drawPrettyCircle(3*$(window).width()/5, $(window).height()/2, data);

        $( "#tree, .folder" ).accordion(
            { autoHeight: false,
              collapsible: true,
              active: false });

        currentFolder = data;
        var folderName = paper.text(3*$(window).width()/5, $(window).height()/2, currentFolderStr);
        folderName.attr({"font": "Open Sans", "font-size": "12px", "font-weight": "700"});

        folderName.show();
        updateDetails(data);
    });

    var currentFolderStr = "";

    bytesToMB = function(bytes) {
        return bytes * (9.53674316 * Math.pow(10, -7));
    }

    updateDetails = function(item) {
        //var attrs = $("")
        var paths = item.path.split('/');
        if (item.path == "/") {
            currentFolderStr = "/";
        } else {
            currentFolderStr = paths.pop();
        }
        folderName.attr("text", currentFolderStr);

        $("#size").html(Math.round(bytesToMB(item.bytes)));
        if (item.modified != undefined) {
            var date = item.modified.split(' ');
            $("#modified").html(date[1] + " " + date[2] + " " + date[3]);
        }
    }

    display = function(item, parent) {
        var name = item.path.split('/').pop();
        var elem = $("<h3>" + name + "</h3>");

        parent.append(elem);
        var innerdiv = $("<div></div>").addClass("folder");

        if (item.is_dir) {
            elem.addClass("directory");

            for (var i in item.children) {
                display(item.children[i], innerdiv);
            }
        } else {
            elem.addClass("file");      
        }
        parent.append(innerdiv); 
        elem.click(function() {
            drawPrettyCircle(3*$(window).width()/5, $(window).height()/2, item);
        });
    }

    $("#sidebar").mouseleave(function(e) {
        $(this).stop();
    });
});