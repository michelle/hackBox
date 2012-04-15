import re
from hackbox.db import db

def strip_public_header(path):
    return re.sub(re.compile("^/public/", re.I), "", path)

def get_owner_name(file_):
    user = db.users.find_one({'uid': file_['owner_id']})
    return user['display_name']

def get_public_file_url(file_):
    owner_id = file_['owner_id']
    lc_path = strip_public_header(file_['lc_path'])
    return "https://dl.dropbox.com/u/%s/%s" % (str(owner_id), lc_path)
