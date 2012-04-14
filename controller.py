from bottle import get, post, view, redirect, static_file, request

@get('/')
@view('index')
def index():
    return {}

