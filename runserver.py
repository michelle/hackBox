#!/usr/bin/env python

from hackbox import app
import os
                      
if __name__ == '__main__':
    if app.debug:
        app.run(debug=True, use_debugger=True)
    else:
        port = int(os.environ.get("PORT", 5000))
        app.run(host='0.0.0.0', port=port)
