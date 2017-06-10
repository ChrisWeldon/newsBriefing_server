
module.exports = function(s, t)
{
    // degenerate cases
    if (s == t) return 0;
    if (s.length == 0) return t.length;
    if (t.length == 0) return s.length;

    var v0 = [];
    var v1 = [];

    // create two work vectors of integer distances
    for(var i =0; i<t.length + 1; i++){
      v0.push(0);
      v1.push(0);
    }

    // initialize v0 (the previous row of distances)
    // this row is A[0][i]: edit distance for an empty s
    // the distance is just the number of characters to delete from t
    for (var i = 0; i < v0.length; i++)
        v0[i] = i;

    for (var i = 0; i < s.length; i++)
    {
        // calculate v1 (current row distances) from the previous row v0

        // first element of v1 is A[i+1][0]
        //   edit distance is delete (i+1) chars from s to match empty t
        v1[0] = i + 1;

        // use formula to fill in the rest of the row
        for (var j = 0; j < t.length; j++)
        {
            var cost;

            if(s[i] == t[j]){
              cost = 0;
            }else{
              cost = 1;
            }

            v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);

        }

        // copy v1 (current row) to v0 (previous row) for next iteration
        for (var j = 0; j < v0.length; j++)
            v0[j] = v1[j];
    }
    return v1[t.length];
}
