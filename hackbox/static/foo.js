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

    var folderHistory = new Array();

    var mix = {red: 255, green: 244, blue: 74};

    var pushFolderHistory = function(data) {
//        console.log("push1", JSON.stringify(folderHistory), folderHistory.length);
        if (folderHistory.length == 4) {
            folderHistory.shift();
        }
//        console.log("push2", JSON.stringify(folderHistory), folderHistory.length);
        folderHistory.push(data);
//        console.log("push3", JSON.stringify(folderHistory), folderHistory.length);
    }

    var popFolderHistory = function(index) {
//        console.log("Pop1", JSON.stringify(folderHistory)[2], folderHistory.length, index);
        for (var i = folderHistory.length - 1; i > index; i--) {
            folderHistory.pop();
//            console.log("Pop1b", folderHistory, folderHistory.length, index);
        }
//        console.log("Pop2", folderHistory, folderHistory.length, index);

        if (folderHistory.length == 0) {
//            console.log("Pop2a", folderHistory, folderHistory.length, index);
            redrawAll(root);
        } else {
//            console.log("Pop2b", folderHistory, folderHistory.length, index);
            redrawAll(folderHistory.pop());
        }
//        console.log("Pop3", folderHistory, folderHistory.length, index);
    }

    var drawFolderHistory = function(x0, y0, prevFolder) {
        var startAngle = -70;

//        console.log("draw1", folderHistory, folderHistory.length);
        for (var i = 0; i < folderHistory.length; i++) {
//            console.log("draw2", folderHistory, folderHistory.length);
            var x = x0 + 270 * Math.cos(startAngle);
            var y = y0 + 270 * Math.sin(startAngle);
            paper.setStart();
            drawPrettyCircle(x, y, folderHistory[i], true);
            paper.circle(x, y, 40).attr({fill: "r(0.75, 0.25)#fff-#ccc", stroke: "rgb(188, 188, 188)"});
            var st = paper.setFinish();
            st.attr({transform: "s0.4 0.4 " + x + " " + y, "stroke-width": 20});
            
            (function(id, _st) {
                _st.mouseover(function () {
                    _st.stop().animate({"stroke-opacity": 0.5}, 500, "elastic").attr("cursor", "pointer");
                    updateDetails(folderHistory[id]); })
                    .mouseout(function () {
                        _st.stop().animate({"stroke-opacity": 1}, 500, "elastic");
                        updateDetails(prevFolder); })
                    .click(function() {
//                        console.log("event fired", folderHistory);
                        popFolderHistory(id);
                    });
            })(i, st);

            startAngle += 35 / 180 * Math.PI;
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
            //var parent = 
            var circle = paper.path()
                .data("assoc", data.path)
                .attr(param)
                .attr("title", data.path.split('/').pop())
                .attr({arc: [start, end, radius, Math.random() * 255, Math.random() * 255, Math.random() * 255]})
                .data("folder", data);
            if (!isHistoryPrettyCircle) {
                circle.mouseover(function () {
                    this.stop().animate({"stroke-opacity": 0.5, "stroke-width": 45}, 500, "elastic").attr("cursor", "pointer");
                    $("h3[assoc='" + this.data("assoc") + "']").addClass("selected");
                    updateDetails(this.data("folder"));
                }).mouseout(function () {
                    this.stop().animate({"stroke-opacity": 1, "stroke-width": 40}, 500, "elastic"); 
                    $("h3[assoc='" + this.data("assoc") + "']").removeClass("selected");
                    updateDetails(parentData);
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
        if (concatName.length > 10)
            concatName = concatName.substr(0, 10) + "...";
        var folderShadow = paper.text(x, y + 1, concatName);
        folderShadow.attr({"font": "Open Sans", "font-size": "12px", "font-weight": "700", "fill": "rgb(255, 255, 255)", "text-shadow": "0px 1px 0px #fff"});
        var folderName = paper.text(x, y, concatName);
        folderName.attr({"font": "Open Sans", "font-size": "12px", "font-weight": "700", "fill": "rgb(155, 155, 155)", "text-shadow": "0px 1px 0px #fff"});
        folderShadow.show();
        folderName.show();
    }

    var drawPrettyButton = function(x, y, data) {
        var button = paper.circle(x, y, 60).attr({fill: "r(0.75, 0.25)#fff-#ccc", stroke: "rgb(188, 188, 188)"});
        button.click(function() {
            if (data.path == "/") {
                $("#menu").slideToggle(500);
                $("#sharelink").html("Not available for /");
            } else {
                $("#menu").slideToggle(500);
                shareStuff(data.path, function(result) { $("#sharelink").html(result.link.url); });
            }
        });
        button.mouseover(function () {
            button.stop().animate({transform: "s1.05 1.05 " + x + " " + y}, 500, "elastic").attr("cursor", "pointer");
        }).mouseout(function () {
            button.stop().animate({transform: ""}, 500, "elastic");
        });
    }

    var redrawAll = function(data) {
//        console.log(data);
        paper.clear();
        var x = 4 * $(window).width() / 7;
        var y = $(window).height() / 2;

        $("#menu").slideUp(500);
        drawPrettyCircle(x, y, data, false);
        drawPrettyButton(x, y, data);
        drawFolderName(x, y, data);
        drawFolderHistory(x, y, data);
        updateDetails(data);
    }

    var getFolderName = function(path) {
//        console.log("path: ", path);
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
        if (item.size != undefined) {
            $("#size").html(item.size);
        } else {
            $("#size").html("--");
        }
        
        if (item.modified != undefined) {
            var date = item.modified.split(' ');
            $("#modified").html(date[1] + " " + date[2] + " " + date[3]);
        } else {
            $("#modified").html("--/--/----");
        }

        var filename;

        if (item.path == "/") {
            filename = "Dropbox";
        } else {
            filename = item.path.split('/').pop()
        }
        $("#filename").html(filename);

        $("#path").html(item.path);
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
            //currentPosition = currentPosition > bottom + 50 ? bottom + 50 : currentPosition;
            $(this).stop().animate({ scrollTop: currentPosition }, 500, "linear");

        }
    });

    $.get('/get_folder_data', function(data) {
//        console.log(data);
        spinner.stop()
        root = data;

        display(data, $("#tree"));
        $( ".folder" ).accordion(
            { autoHeight: false,
              collapsible: true,
              active: false });
        $( "#tree" ).accordion(
            { disabled: true });

        redrawAll(data);
    });

    $.get('/get_account_info', function(user) {
        $("#userinfo").html("Welcome, <strong>" + user.display_name + "</strong>.<hr>You have <strong>" 
			    + Math.round(bytesToMB(user.quota_info.quota)) + " MB</strong> of data total.<br>You are using <strong>"
			    + Math.round((user.quota_info.normal + user.quota_info.shared)/user.quota_info.quota * 100) + "%</strong> of your space and have <strong>"
			    + Math.round(bytesToMB(user.quota_info.quota - (user.quota_info.normal + user.quota_info.shared))) + " MB</strong> remaining.");
    });


    $("#sidebar").mouseleave(function(e) {
        $(this).stop();
    });


    shareStuff = function(path, fn) {
        $.get('/share_folder', {'path': path }, function(data){ 
          fn(data);
        })
    }


});