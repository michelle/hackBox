import bottle, controller
from config import server_options

if __name__ == '__main__':
    bottle.debug(True)
    bottle.run(**server_options)
