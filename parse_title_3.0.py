import sys, json, numpy as np
from sklearn.externals import joblib
import sklearn
import _pickle as pkl
import pandas as pd

model = pkl.load(open("Clf.clf", "rb"))
#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main():
    data = []

    d = pd.read_json(sys.stdin.readlines()[0])
    print(model.predict(d))
    sys.stdout.flush()
if __name__ == '__main__':
    main()
