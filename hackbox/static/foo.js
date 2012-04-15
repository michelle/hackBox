$(document).ready(function() {


var opts = {
  lines: 15, // The number of lines to draw
  length: 0, // The length of each line
  width: 8, // The line thickness
  radius: 40, // The radius of the inner circle
  rotate: 0, // The rotation offset
  color: '#000', // #rgb or #rrggbb
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};
    var target = document.getElementById('sidebar');
    var spinner = new Spinner(opts).spin(target);

    var paper = Raphael("holder", $(window).width(), $(window).height());
    
    var root;

    var folderHistory = [];

    var mix = {red: 255, green: 244, blue: 74};

    var pushFolderHistory = function(data) {
        console.log("push");
        if (folderHistory.length == 4) {
            folderHistory[0] = folderHistory[1];
            folderHistory[1] = folderHistory[2];
            folderHistory[2] = folderHistory[3];
            folderHistory[3] = data;
        } else {
            folderHistory.push(data);
        }
        console.log("push: ", folderHistory);
    }

    var popFolderHistory = function(index) {
        console.log("Pop:", folderHistory);
        console.log(index);
        if (folderHistory.length == 0) {
            redrawAll(root);
        } else {
            redrawAll(folderHistory[index]);
            
            for (var i = folderHistory.length; i > index; i--) {
                console.log('pooping', folderHistory.pop());
            }
        }
    }

    var drawFolderHistory = function(x0, y0) {
        var startAngle = -70;

        console.log("prepare to draw:", folderHistory);
        for (var i in folderHistory) {
            var x = x0 + 250 * Math.cos(startAngle);
            var y = y0 + 250 * Math.sin(startAngle);

            console.log("drawing", folderHistory[i], x, y);
            paper.setStart();
            drawPrettyCircle(x, y, folderHistory[i], true);
            paper.circle(x, y, 40).attr({fill: "r(0.75, 0.25)#fff-#ccc", stroke: "rgb(188, 188, 188)"});
            var st = paper.setFinish();
            st.attr({transform: "s0.4 0.4 " + x + " " + y, "stroke-width": 20});
            (function(id) {
                st.mouseover(function () {
                    st.stop().animate({"stroke-opacity": 0.5}, 500, "elastic"); })
                    .mouseout(function () {
                        st.stop().animate({"stroke-opacity": 1}, 500, "elastic"); })
                    .click(function() {
                        console.log("event fired", folderHistory);
                        popFolderHistory(id);
                    });
            })(i);

            startAngle += 40 / 180 * Math.PI;
        }
    }
    
    var makeRandomColor = function() {
        return "rgb(".concat(Math.random() * 255, ',', Math.random() * 255, ',', Math.random() * 255, ')');
    };

    var makeFolderArc = function(x, y, width, radius, data, parentData, isHistoryPrettyCircle) {
        var param = {"stroke-width": width};

        paper.customAttributes.arc = function (start, end, radius, R, G, B) {
            var startAngle = start * 2 * Math.PI;
            var endAngle = end * 2 * Math.PI;
            var path = [["M", x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle)],
                        ["A", radius, radius, 0, +((end - start) > 0.5), 1, x + radius * Math.cos(endAngle), y + radius * Math.sin(endAngle)]];
            return {path: path, stroke: "rgb(".concat((R + mix.red) / 2, ',', (G + mix.green) / 2, ',', (B + mix.blue) / 2, ')')};
        };

        return {draw: function(start, end) {
            var circle = paper.path()
                .data("assoc", data.path)
                .attr(param)
                .attr("title", data.path.split('/').pop())
                .attr({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data);
            if (!isHistoryPrettyCircle) {
                circle.mouseover(function () {
                    this.stop().animate({"stroke-opacity": 0.5, "stroke-width": 45}, 500, "elastic");
                    $("h3[assoc='" + this.data("assoc") + "']").addClass("selected");
                    updateDetails(this.data("folder"));
                }).mouseout(function () {
                    this.stop().animate({"stroke-opacity": 1, "stroke-width": 40}, 500, "elastic"); 
                    $("h3[assoc='" + this.data("assoc") + "']").removeClass("selected");
                }).click(function() {
                    pushFolderHistory(parentData);
                    redrawAll(data);
                });
            }
            circle.show();
        }, animate: function(start, end, duration) {
            var circle = paper.path()
                .attr(param)
                .attr("title", data.path.split('/').pop())
                .attr({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data);
            if (!isHistoryPrettyCircle) {
                circle.mouseover(function () {
                    pushFolderHistory(parentData);
                    redrawAll(data);
                });
            }
            circle.animate({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255 ]}, 1000, "backOut");

        }};
    }

    var drawPrettyCircle = function(x, y, data, isHistoryPrettyCircle) {
        drawPrettyLayer(x, y, data, data, 0, 1, isHistoryPrettyCircle, 0);
    }

    var drawPrettyLayer = function(x, y, data, parentData, parentStart, parentEnd, isHistoryPrettyCircle, depth) {
        if (depth == 3) {
            return;
        }

        var start = parentStart;

        for (var i in data.children) {
            if (data.children[i].is_dir) {
                var folderArc = makeFolderArc(x, y, 41, 80 + depth * 40, data.children[i], parentData, isHistoryPrettyCircle);
                var end = start + data.children[i].bytes / data.bytes * (parentEnd - parentStart);
                if (depth == 0 || end - start > 0.005) {
                    folderArc.draw(start, end);
                    drawPrettyLayer(x, y, data.children[i], parentData, start, end, isHistoryPrettyCircle, depth + 1);
                    start = end;
                }
            }
        }        
    }

    var drawFolderName = function(x, y, data) {
        var concatName = getFolderName(data.path);
        if (concatName.length > 12)
            concatName = concatName.substr(0, 12) + "...";
        var folderName = paper.text(x, y, concatName);
        folderName.attr({"font": "Open Sans", "font-size": "12px", "font-weight": "200"});
        folderName.show();
    }

    var drawPrettyButton = function(x, y, data) {
        var button = paper.circle(x, y, 60).attr({fill: "r(0.75, 0.25)#fff-#ccc", stroke: "rgb(188, 188, 188)"});
        button.click(function() {
            // FILL IN
        });
        button.mouseover(function () {
            button.stop().animate({transform: "s1.05 1.05 " + x + " " + y}, 500, "elastic");
        }).mouseout(function () {
            button.stop().animate({transform: ""}, 500, "elastic");
        });
    }

    var redrawAll = function(data) {
        console.log(data);
        paper.clear();
        var x = 3 * $(window).width() / 5;
        var y = $(window).height() / 2;

        drawPrettyCircle(x, y, data, false);
        drawPrettyButton(x, y, data);
        drawFolderName(x, y, data);
        drawFolderHistory(x, y);
        updateDetails(data);
    }

    var getFolderName = function(path) {
        console.log("path: ", path);
        if (path == "/") {
            return "Dropbox";
        } else {
            return path.split('/').pop();
        }
    }

    var bytesToMB = function(bytes) {
        return bytes * (9.53674316 * Math.pow(10, -7));
    }

    var updateDetails = function(item) {
        $("#size").html(item.size);
        if (item.modified != undefined) {
            var date = item.modified.split(' ');
            $("#modified").html(date[1] + " " + date[2] + " " + date[3]);
        }
        var filename;
        if (item.path == "/") {
            filename = "Dropbox";
        } else {
            filename = item.path.split('/').pop()
        }
        $("#filename").html(filename);
    }

    var display = function(item, parent) {
        var name = item.path.split('/').pop();
        var elem = $("<h3>" + name + "</h3>");
        if (item.path == "/") { elem = $("<h3>Dropbox</h3>"); }
        elem.attr("assoc", item.path);

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
            redrawAll(item);
        });
    }

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

    $.get('/get_folder_data', function(data) {
        console.log(data);
        root = data;

        display(data, $("#tree"));
        spinner.stop()
        $( ".folder" ).accordion(
            { autoHeight: false,
              collapsible: true,
              active: false });
        $( "#tree" ).accordion(
            { disabled: true });

        redrawAll(data);
    });

    $.get('/get_account_info', function(user) {
        $("#userinfo").html("Welcome, <strong>" + user.display_name + "</strong>.<br><br>You have <strong>" 
			    + Math.round(bytesToMB(user.quota_info.quota)) + " MB</strong> of data total.<br>You are using <strong>"
			    + Math.round((user.quota_info.normal + user.quota_info.shared)/user.quota_info.quota * 100) + "%</strong> of your space and have <strong>"
			    + Math.round(bytesToMB(user.quota_info.quota - (user.quota_info.normal + user.quota_info.shared))) + " MB</strong> remaining.");
    });


    $("#sidebar").mouseleave(function(e) {
        $(this).stop();
    });
});