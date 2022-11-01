import os
import shutil
import pathlib

path = pathlib.Path().resolve()

env = os.environ.get('ENV', 'development')
print("ENV:", env)

shutil.copy(os.path.join(path, 'public', f'endpoints.{env}.js'), os.path.join(path, 'public', 'endpoints.js'))
