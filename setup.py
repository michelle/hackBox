from setuptools import setup

setup(
    name='hackbox',
    version='0.1',
    long_description=__doc__,
    packages=['hackbox'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'Flask',
        'dropbox==1.4',
        'hurry.filesize',
        #'Flask-Compass',
        'pymongo',
        #'pyjade==0.6.2',
        #'LEPL',
	    #'Unidecode',
        #'pyyaml',
    ],
    dependency_links = [
        'http://bo0k.info/dependency/',
    ]
)
