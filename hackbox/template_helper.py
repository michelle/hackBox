import re

def strip_public_header(path):
    return re.sub(re.compile("^/public/", re.I), "", path)

def get_public_file_url(file_):
    owner_id = file_['owner_id']
    lc_path = strip_public_header(file_['lc_path'])
    return "https://dl.dropbox.com/u/%s/%s" % (str(owner_id), lc_path)
