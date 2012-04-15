$(document).ready(function() {
    var currentFolder;

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

        paper.customAttributes.arc = function (start, end, total, radius, R, G, B) {
            var startAngle = start / total * 2 * Math.PI;
            var endAngle = end / total * 2 * Math.PI;
            var path = [["M", x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle)],
                        ["A", radius, radius, 0, +((end - start) / total > 0.5), 1, x + radius * Math.cos(endAngle), y + radius * Math.sin(endAngle)]];
            return {path: path, stroke: "rgb(".concat(R, ',', G, ',', B, ')')};
        };

        return {draw: function(start, end) {
            var circle = paper.path()
                .attr(param)
                .attr({arc: [start, end, 1, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data)
                .click(function() {
                    drawPrettyCircle(x, y, data);
                    updateDetails(data);
                    console.log(data);
                });
            circle.show();
        }, animate: function(start, end, duration) {
            var circle = paper.path()
                .attr(param)
                .attr({arc: [start, end, 1, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data)
                .click(function() {
                    drawPrettyCircle(x, y, data);
                    updateDetails(data);

                    console.log(data);
                });
            circle.animate({arc: [start, end, 1, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255 ]}, 5000, ">");
        }};
    }

    var currentFolder;

    var drawPrettyCircle = function(x, y, data) {
        var start = 0;
        for (var i in data.children) {
            var folderArc = makeFolderArc(x, y, 42, 80, data.children[i]);
            var end = start + data.children[i].bytes / data.bytes;
            folderArc.draw(start, end);
            start = end;
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
              animated: false,
              active: false });
        currentFolder = data;
        updateDetails(data);
    });

    var currentFolder = "";
    var folderName = paper.text(3*$(window).width()/5, $(window).height()/2, currentFolder);
    folderName.attr({"font": "Open Sans", "font-size": "12px", "font-weight": "700"});

    folderName.show();

    bytesToMB = function(bytes) {
        return bytes * (9.53674316 * Math.pow(10, -7));
    }

    updateDetails = function(item) {
        //var attrs = $("")
        var paths = item.path.split('/');
        if (item.path == "/") {
            currentFolder = "/";
        } else {
            currentFolder = paths.pop();
        }
        folderName.attr("text", currentFolder);

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
            parent.append(innerdiv); 
        } else {
            elem.addClass("file");   
            parent.append(innerdiv); 
        }
    }

    $("#sidebar").mouseleave(function(e) {
        $(this).stop();
    });


});