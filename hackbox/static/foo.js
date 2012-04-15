$(document).ready(function() {
    currentPosition = 0;
    $("#sidebar").mousemove(function(e){
        var h = $(this).height();
        var bottom = $("#height").height();
        var offset = $(this).offset();
        var position = (e.pageY-offset.top)/h;
        
        if(position<0.05) {
            currentPosition -= 5;
            currentPosition = currentPosition < 0 ? 0 : currentPosition;
            $(this).stop().animate({ scrollTop: currentPosition }, 500);
        }
        if(position>0.95) {
            currentPosition += 5;
            currentPosition = currentPosition > bottom ? bottom : currentPosition;
            $(this).stop().animate({ scrollTop: currentPosition }, 500);
        }
    });
    
    $('#sidebar').mouseleave(function(e) {
        $(this).stop();
    });

});​