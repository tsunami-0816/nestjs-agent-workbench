import sys, os
# 把 qa-automation 根目录加到 sys.path，让 common/api 能被 import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
